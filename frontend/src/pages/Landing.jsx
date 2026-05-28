import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Soup, Heart, Shield, HelpCircle, MapPin, Search } from 'lucide-react';
import { signInWithGoogle } from '../services/firebase';
import { api } from '../services/api';

const Landing = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalFoodCount: 0, foodPosts: [] });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPosts = useMemo(() => {
    if (!searchTerm.trim()) return stats.foodPosts;
    const q = searchTerm.toLowerCase();
    return stats.foodPosts.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.createdBy?.name?.toLowerCase().includes(q) ||
      p.location?.cityName?.toLowerCase().includes(q)
    );
  }, [searchTerm, stats.foodPosts]);

  const handleFirebaseGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      const userObj = result.user;
      const idToken = await userObj.getIdToken();

      const res = await login({
        firebaseToken: idToken,
        location: {
          type: 'Point',
          coordinates: [78.4867, 17.3850], // Hyderabad default
          cityName: 'Hyderabad, Telangana'
        }
      });

      if (res.success) {
        navigate('/dashboard');
      } else {
        alert('Login failed: ' + res.message);
      }
    } catch (err) {
      console.error('Firebase Auth error:', err);
      // Suppress alert if user closed the login popup
      if (err.code !== 'auth/popup-closed-by-user') {
        alert('Google Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.food.getPublicStats();
        if (res.success) {
          setStats({
            totalFoodCount: res.totalFoodCount,
            foodPosts: res.foodPosts
          });
        }
      } catch (err) {
        console.error('Error fetching public stats:', err);
      }
    };
    fetchStats();
  }, []);

  // Initialize Landing Page Preview Map
  useEffect(() => {
    if (!window.L) return;
    try {
      const L = window.L;
      const map = L.map('landing-preview-map', {
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false,
        doubleClickZoom: false,
        boxZoom: false,
        touchZoom: false
      }).setView([17.3850, 78.4867], 13); // Default Hyderabad

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      // Glowing active zone circle
      L.circle([17.3850, 78.4867], {
        radius: 1200,
        color: '#f97316', // spice orange
        fillColor: '#f97316',
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '3, 6'
      }).addTo(map);

      const markerIcon = L.divIcon({
        className: 'landing-spot-marker',
        html: `
          <div class="flex items-center justify-center w-8 h-8 bg-spice-500 rounded-full border-2 border-white shadow-lg animate-bounce">
            <span class="text-xs">🍛</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      L.marker([17.3850, 78.4867], { icon: markerIcon }).addTo(map);
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden bg-slate-50 dark:bg-[#0b0c10]">
      {/* Decorative Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-spice-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto text-center z-10 w-full">
        <div className="flex justify-center mb-4">
          <div className="bg-spice-100 dark:bg-spice-950/30 p-4 rounded-3xl border border-spice-200 dark:border-spice-800 animate-spin-slow">
            <Soup className="w-16 h-16 text-spice-500" />
          </div>
        </div>

        {/* Counter Badge */}
        {stats.totalFoodCount > 0 && (
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs px-3.5 py-1.5 rounded-full border border-emerald-500/15 mb-6 animate-pulse select-none">
            <span>🔥 {stats.totalFoodCount} Total Dishes Shared!</span>
          </div>
        )}

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4 text-slate-800 dark:text-white leading-tight">
          🍛 {t('welcome')}
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-350 max-w-2xl mx-auto mb-8 font-medium leading-relaxed">
          {t('subWelcome')}
        </p>

        {/* Beautiful Dynamic Registration / Login Panel */}
        <div className="glass-panel max-w-sm mx-auto p-6 sm:p-8 rounded-3xl glow-card mb-12 border border-slate-100 dark:border-slate-850">
          <h2 className="font-extrabold text-xl mb-2 text-slate-800 dark:text-white">
            Welcome to BiteBridge
          </h2>
          <p className="text-xs text-slate-450 dark:text-slate-500 mb-6 font-medium">
            Connect with roommates and share homemade meals.
          </p>

          <button
            onClick={handleFirebaseGoogleLogin}
            disabled={loading}
            className="w-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-880 hover:border-spice-500 dark:hover:border-spice-500 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
          >
            {/* Google G logo svg */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-.14 3.01-1.04 4.01l3.12 2.42c1.83-1.69 2.97-4.18 2.97-8.26z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.12-2.42c-.87.58-1.99.93-3.14.93-2.92 0-5.4-1.97-6.28-4.63H4.18v2.5C6.18 21.9 10.3 24 12 24z"/>
              <path fill="#FBBC05" d="M5.72 14.97c-.22-.67-.35-1.39-.35-2.12s.13-1.45.35-2.12v-2.5H1.68c-.76 1.52-1.18 3.22-1.18 5s.42 3.48 1.18 5l4.04-3.26z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.97 1.19 15.24 0 12 0 10.3 0 6.18 2.1 4.18 5.75L5.72 9c.88-2.66 3.36-4.63 6.28-4.63z"/>
            </svg>
            <span>{loading ? 'Authenticating...' : 'Sign In with Google'}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-2xl mx-auto mb-8 relative z-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search dishes, cooks, or locations..."
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium text-slate-700 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-spice-500 focus:ring-2 focus:ring-spice-500/20 transition-all shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Search Results Grid */}
        {searchTerm.trim() && (
          <div className="w-full max-w-3xl mx-auto mb-10 animate-fade-in z-10 relative">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-4 text-center">
              🔍 {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''} for "{searchTerm}"
            </h3>
            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPosts.map((post) => (
                  <div
                    key={post._id}
                    className="glass-panel p-4 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 bg-spice-100 dark:bg-spice-950/20 text-xl rounded-xl flex items-center justify-center shrink-0">
                      🍛
                    </div>
                    <div className="text-left truncate">
                      <p className="font-extrabold text-sm text-slate-800 dark:text-white capitalize truncate">
                        {post.title}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        By {post.createdBy?.name || 'Local Cook'} • {post.price > 0 ? `₹${post.price}` : 'FREE'}
                      </p>
                      <span className="inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 mt-1 uppercase">
                        {post.quantity} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic text-center py-6">No dishes match your search.</p>
            )}
          </div>
        )}

        {/* Dynamic Proximity Map Preview */}
        <div className="glass-panel p-4 rounded-3xl border border-slate-100 dark:border-slate-850 w-full max-w-2xl mx-auto mb-10 text-center shadow-md animate-fade-in relative z-10">
          <div className="flex justify-between items-center mb-3 px-2">
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-spice-500 animate-pulse" />
              <span>Active Curry Circles (Hyderabad Area)</span>
            </h3>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-orange-100 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400">
              Curry Map Zone
            </span>
          </div>

          <div
            id="landing-preview-map"
            className="w-full h-[220px] rounded-2xl overflow-hidden shadow-inner border border-slate-100/50 dark:border-slate-900 pointer-events-none"
          />
        </div>

        {/* Infinite Scrolling Movie Marquee */}
        {filteredPosts.length > 0 && !searchTerm.trim() && (
          <div className="w-full max-w-3xl mx-auto overflow-hidden relative py-6 border-t border-slate-100 dark:border-slate-850 mb-10 select-none">
            <div className="flex justify-center mb-3">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                🍛 Live Fresh Curry Feed
              </span>
            </div>
            
            <div className="relative w-full overflow-hidden flex">
              {/* Soft gradient fade overlays on edges */}
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-slate-50 dark:from-[#0b0c10] to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-50 dark:from-[#0b0c10] to-transparent z-10 pointer-events-none" />
              
              <div className="animate-marquee flex gap-4">
                {/* Render Duplicated lists for infinite loop */}
                {[...filteredPosts, ...filteredPosts].map((post, idx) => (
                  <div
                    key={post._id + '-' + idx}
                    className="glass-panel p-4 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center gap-3 w-64 shrink-0 shadow-sm"
                  >
                    <div className="w-12 h-12 bg-spice-100 dark:bg-spice-950/20 text-xl rounded-xl flex items-center justify-center shrink-0">
                      🍛
                    </div>
                    <div className="text-left truncate">
                      <p className="font-extrabold text-sm text-slate-800 dark:text-white capitalize truncate">
                        {post.title}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        By {post.createdBy?.name || 'Local Cook'} • {post.price > 0 ? `₹${post.price}` : 'FREE'}
                      </p>
                      <span className="inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 mt-1 uppercase">
                        {post.quantity} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="glass-panel p-6 rounded-2xl glow-card text-center border border-slate-100 dark:border-slate-850">
            <div className="flex justify-center mb-3">
              <Heart className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white">No Fixed Roles</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Cook and share your leftovers today. Request curries or meals from others tomorrow. We are all equals.
            </p>
          </div>
          <div className="glass-panel p-6 rounded-2xl glow-card text-center border border-slate-100 dark:border-slate-850">
            <div className="flex justify-center mb-3">
              <Shield className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white">PG & Hostel Rooms</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Create unique roommate groups to share homemade food secure within your apartment complexes or hostels.
            </p>
          </div>
          <div className="glass-panel p-6 rounded-2xl glow-card text-center border border-slate-100 dark:border-slate-850">
            <div className="flex justify-center mb-3">
              <HelpCircle className="w-8 h-8 text-spice-500" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white">Affordable Sharing</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Curries shared are priced to fit the micro budgets of students and local community living.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
