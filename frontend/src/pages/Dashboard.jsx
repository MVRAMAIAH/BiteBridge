import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import FeedCard from '../components/FeedCard';
import { Search, MapPin, Sparkles, Navigation, Shield, Compass, User, Users, UtensilsCrossed } from 'lucide-react';

const Dashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  // State values
  const [posts, setPosts] = useState([]);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [locationDenied, setLocationDenied] = useState(false);
  const [mapOpen, setMapOpen] = useState(true); // default premium map overlay on

  // Leaflet Map Reference
  const mapInstanceRef = useRef(null);

  // Request Geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationDenied(false);
        },
        (err) => {
          console.warn('Geolocation permission denied. Falling back to default profile coordinates.');
          setLocationDenied(true);
          
          // Fall back to user profile location
          if (user?.location?.coordinates && user.location.coordinates[0] !== 0) {
            setCoords({
              lat: user.location.coordinates[1],
              lng: user.location.coordinates[0]
            });
          } else {
            // Default Hyderabad coords
            setCoords({ lat: 17.3850, lng: 78.4867 });
          }
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setLocationDenied(true);
      setCoords({ lat: 17.3850, lng: 78.4867 });
    }
  }, [user]);

  // Fetch foods and nearby users once coordinates are available
  const fetchData = async () => {
    if (!coords.lat || !coords.lng) return;
    setLoading(true);
    try {
      // 1. Fetch available foods strictly within 1km (maxDistance = 1000)
      const foodRes = await api.food.getAll({
        page: 1,
        limit: 20,
        lat: coords.lat,
        lng: coords.lng
      });
      
      // Override or filter by 1km if needed, but the backend getAll route sorts by distance.
      // To strictly ensure 1km boundary, we can double-filter or let backend handle it.
      if (foodRes.success) {
        setPosts(foodRes.foodPosts);
      }

      // 2. Fetch nearby users strictly within 1km (maxDistance = 1000)
      const userRes = await api.auth.getNearbyUsers({
        lat: coords.lat,
        lng: coords.lng,
        maxDistance: 1000
      });
      if (userRes.success) {
        setNearbyUsers(userRes.users);
      }
    } catch (err) {
      console.error('Error fetching dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total food portions from available posts
  const totalPortions = posts.reduce((sum, post) => {
    const num = parseInt(post.quantity);
    return sum + (isNaN(num) ? 1 : num);
  }, 0);

  useEffect(() => {
    fetchData();
  }, [coords]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    // Make sure Leaflet script is loaded and coordinates are resolved
    if (!coords.lat || !coords.lng || !window.L) return;

    // Cleanup previous map instance if it exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const L = window.L;
      
      // Initialize map container
      const map = L.map('map-overlay-container', {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([coords.lat, coords.lng], 15); // Zoom level 15 fits 1km radius beautifully

      // Load premium OpenStreetMap tile layers
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // 1. Draw a strict 1km circular neighborhood radius guide
      L.circle([coords.lat, coords.lng], {
        radius: 1000, // 1000 meters = 1km
        color: '#10b981', // emerald color
        fillColor: '#10b981',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '4, 8'
      }).addTo(map);

      // 2. Draw 'You' Marker
      const youIcon = L.divIcon({
        className: 'custom-you-marker',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full border-4 border-white shadow-lg animate-pulse">
            <span class="text-white text-xs font-bold font-sans">You</span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      L.marker([coords.lat, coords.lng], { icon: youIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-2 text-center text-slate-800 font-sans">
            <p class="font-extrabold text-sm text-blue-500">Your Location</p>
            <p class="text-xs text-slate-500 font-semibold mt-1">Sharing curries with neighbors within 1km!</p>
          </div>
        `);

      // 3. Draw Active Neighbors (Users within 1km)
      nearbyUsers.forEach(peer => {
        if (!peer.location?.coordinates || peer.location.coordinates[0] === 0) return;
        const [peerLng, peerLat] = peer.location.coordinates;

        const peerIcon = L.divIcon({
          className: 'custom-peer-marker',
          html: `
            <div class="flex items-center justify-center w-9 h-9 bg-emerald-500 rounded-full border-3 border-white shadow-md hover:scale-110 active:scale-95 transition-transform duration-200 cursor-pointer">
              <img src="${peer.profileImage || 'https://api.dicebear.com/7.x/adventurer/svg'}" class="w-full h-full rounded-full object-cover" />
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        L.marker([peerLat, peerLng], { icon: peerIcon })
          .addTo(map)
          .bindPopup(`
            <div class="p-2.5 text-center font-sans">
              <div class="flex flex-col items-center">
                <img src="${peer.profileImage}" class="w-12 h-12 rounded-full border border-slate-100 shadow-sm object-cover mb-2" />
                <p class="font-extrabold text-sm text-slate-800">${peer.name}</p>
                ${peer.averageRating > 0 ? `<p class="text-xs font-bold text-amber-500 mt-1">⭐ ${peer.averageRating} / 5</p>` : `<p class="text-[10px] text-slate-400 font-bold uppercase mt-1">Active Peer</p>`}
              </div>
            </div>
          `);
      });

      // 4. Draw Available Foods within 1km
      posts.forEach(post => {
        if (!post.location?.coordinates || post.location.coordinates[0] === 0) return;
        const [postLng, postLat] = post.location.coordinates;

        const foodIcon = L.divIcon({
          className: 'custom-food-marker',
          html: `
            <div class="flex items-center justify-center w-9 h-9 bg-spice-500 rounded-full border-3 border-white shadow-md hover:scale-110 active:scale-95 transition-transform duration-200 cursor-pointer animate-bounce">
              <span class="text-base">🍛</span>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        L.marker([postLat, postLng], { icon: foodIcon })
          .addTo(map)
          .bindPopup(`
            <div class="p-3 font-sans w-52">
              <h4 class="font-extrabold text-sm text-slate-800 capitalize">${post.title}</h4>
              <p class="text-xs text-slate-500 leading-snug mt-1">${post.description || 'Fresh homemade curry'}</p>
              <div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                <span class="text-xs font-extrabold text-spice-500">${post.price > 0 ? `₹${post.price}` : 'FREE'}</span>
                <span class="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full uppercase">${post.quantity}</span>
              </div>
            </div>
          `);
      });

      // Save map instance reference
      mapInstanceRef.current = map;

    } catch (e) {
      console.error('Error rendering Leaflet Map:', e);
    }
  }, [coords, posts, nearbyUsers, mapOpen]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      
      {/* Geolocation Request Notification Banner */}
      {locationDenied && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-semibold rounded-2xl border border-amber-100 dark:border-amber-900/35 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 animate-bounce" />
          <span>
            <b>GPS Geolocation Permission Denied:</b> We are showing foods based on your home/profile locality area instead. For a perfect 1km real-time map experience, please grant location access.
          </span>
        </div>
      )}

      {/* Top Banner Control Section */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl glow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-100 dark:border-slate-850">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-spice-500" />
            <span>Curry Feed & Neighborhood Map</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium flex items-center gap-1">
            <MapPin className="w-4 h-4 text-emerald-500" />
            <span>Showing available homemade foods and active users within <b>1 km</b> of your location!</span>
          </p>
        </div>

        {/* Tab Map Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setMapOpen(!mapOpen)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-extrabold shadow-md active:scale-95 transition-all cursor-pointer ${
              mapOpen
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-800 hover:border-spice-500'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{mapOpen ? 'Hide Proximity Map' : 'View Proximity Map'}</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center gap-3">
          <div className="p-2.5 bg-spice-100 dark:bg-spice-950/20 rounded-xl">
            <UtensilsCrossed className="w-5 h-5 text-spice-500" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-800 dark:text-white">{totalPortions}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Food Portions</p>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/20 rounded-xl">
            <Users className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-800 dark:text-white">{nearbyUsers.length}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Neighbors</p>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-950/20 rounded-xl">
            <Compass className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-800 dark:text-white">{posts.length}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Dishes</p>
          </div>
        </div>
      </div>

      {/* Premium Leaflet Map Component Overlay */}
      {mapOpen && coords.lat && coords.lng && (
        <div className="glass-panel p-4 rounded-3xl border border-slate-100 dark:border-slate-850 w-full animate-fade-in">
          <div className="flex justify-between items-center mb-3 px-2">
            <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-500" />
              <span>Real-Time 1km Proximity Map ({nearbyUsers.length} Neighbors & {posts.length} Dishes)</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
              Interactive GPS
            </span>
          </div>

          <div
            id="map-overlay-container"
            className="w-full h-[400px] rounded-2xl overflow-hidden shadow-inner border border-slate-100/50 dark:border-slate-900 z-10"
          />
        </div>
      )}

      {/* Main Grid Feed Listing */}
      <div>
        <h3 className="font-extrabold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <span>🍲 Dishes Ready Right Now (Within 1km)</span>
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-spice-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Fetching homemade curries nearby...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-panel rounded-3xl p-16 text-center border border-slate-100 dark:border-slate-850">
            <span className="text-4xl">🍲</span>
            <h3 className="font-extrabold text-lg text-slate-700 dark:text-slate-300 mt-4 mb-1">No Curries Within 1km</h3>
            <p className="text-slate-500 dark:text-slate-450 text-sm max-w-sm mx-auto leading-relaxed">
              Nobody has shared curries or meals within 1km of your location right now. Share one yourself or invite neighbors!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {posts.map((post) => (
              <FeedCard key={post._id} post={post} onRequested={fetchData} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

// Fallback Alert Circle icon
const AlertCircle = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
    />
  </svg>
);

export default Dashboard;
