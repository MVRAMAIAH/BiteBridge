import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import FeedCard from '../components/FeedCard';
import { Search, MapPin, Sparkles, Navigation } from 'lucide-react';

const Dashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [useGPS, setUseGPS] = useState(false);
  const [coords, setCoords] = useState({ lat: null, lng: null });

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.food.getAll({
        page,
        limit: 8,
        lat: useGPS ? coords.lat : null,
        lng: useGPS ? coords.lng : null
      });
      if (res.success) {
        setPosts(res.foodPosts);
        setTotalPages(res.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, useGPS, coords]);

  const handleGPSToggle = () => {
    if (!useGPS) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCoords({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            setUseGPS(true);
            setPage(1);
          },
          (err) => {
            alert('Could not retrieve GPS location. Falling back to default user coordinates.');
            if (user?.location?.coordinates) {
              setCoords({
                lat: user.location.coordinates[1],
                lng: user.location.coordinates[0]
              });
              setUseGPS(true);
              setPage(1);
            }
          }
        );
      } else {
        alert('Geolocation not supported by browser.');
      }
    } else {
      setUseGPS(false);
      setCoords({ lat: null, lng: null });
      setPage(1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl glow-card mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-100 dark:border-slate-850">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-spice-500" />
            <span>{t('exploreCurries')}</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium">
            {t('freshHomemade')}
          </p>
        </div>

        {/* GPS Distance Filter button */}
        <button
          onClick={handleGPSToggle}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold shadow-md transition-all active:scale-95 ${
            useGPS
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-800 hover:border-spice-500 dark:hover:border-spice-500'
          }`}
        >
          <Navigation className={`w-4 h-4 ${useGPS ? 'animate-pulse' : ''}`} />
          <span>{useGPS ? 'Geospatial Filter: On (Within 10km)' : 'Sort by Distance (GPS)'}</span>
        </button>
      </div>

      {/* Feed Listings */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-spice-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Fetching homemade curries nearby...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-850">
          <SoupIcon className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="font-extrabold text-lg text-slate-700 dark:text-slate-300 mb-1">No Curries Available</h3>
          <p className="text-slate-500 dark:text-slate-450 text-sm max-w-sm mx-auto">
            Nobody has shared curries or meals near you yet. Be the first to share one!
          </p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {posts.map((post) => (
              <FeedCard key={post._id} post={post} onRequested={fetchPosts} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-50 text-sm font-bold hover:border-spice-500 dark:hover:border-spice-500 text-slate-700 dark:text-slate-300"
              >
                Previous
              </button>
              <span className="text-sm font-bold text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-50 text-sm font-bold hover:border-spice-500 dark:hover:border-spice-500 text-slate-700 dark:text-slate-300"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Simple Fallback Soup Icon
const SoupIcon = (props) => (
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
      d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9y"
    />
  </svg>
);

export default Dashboard;
