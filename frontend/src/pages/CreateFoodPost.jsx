import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Tag, ShoppingBag, MapPin, Calendar, Clock } from 'lucide-react';

const CreateFoodPost = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quantity: '',
    price: 0,
    availabilityHours: 4,
    cityName: user?.location?.cityName || ''
  });
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords([position.coords.longitude, position.coords.latitude]);
        },
        (err) => {
          console.warn('Geolocation capture for post creation failed, using profile location instead.');
        }
      );
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const readyTill = new Date();
    readyTill.setHours(readyTill.getHours() + Number(formData.availabilityHours));

    try {
      const res = await api.food.create({
        title: formData.title,
        description: formData.description,
        quantity: formData.quantity,
        price: Number(formData.price),
        availabilityTime: readyTill,
        location: {
          coordinates: coords || user?.location?.coordinates || [78.4867, 17.3850],
          cityName: formData.cityName || 'Nearby'
        }
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1200);
      }
    } catch (err) {
      alert(err.message || 'Failed to create food post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl glow-card border border-slate-100 dark:border-slate-850">
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
          <PlusCircle className="w-6 h-6 text-spice-500" />
          <span>{t('createPost')}</span>
        </h2>

        {success ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 p-6 rounded-2xl text-center font-bold">
            🍛 Curry Shared Successfully! Redirecting to feed...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Room Indicator Banner */}
            {user?.roomId && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-4 rounded-2xl text-xs sm:text-sm text-amber-800 dark:text-amber-400 font-semibold">
                ⚠️ <strong>Room identity enabled:</strong> You are a member of an approved room. This post will appear labeled as <strong>"Posted by Room"</strong> to others to preserve privacy!
              </div>
            )}

            <div>
              <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-200">
                Curry / Food Name
              </label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Spicy Chicken Curry, Dal Tadka, Homemade Paneer Masala"
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-slate-250 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-200">
                Description / Ingredients
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what's in the dish. List any spice levels or allergy warnings so others can decide safely."
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-slate-250 text-sm font-medium"
                rows="4"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-slate-400" />
                  <span>Quantity / Portions</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="e.g. 2 servings, 1 medium container"
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-slate-250 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-slate-400" />
                  <span>Cost Share (₹)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0 for free sharing"
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-slate-250 text-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Available For (Hours)</span>
                </label>
                <select
                  value={formData.availabilityHours}
                  onChange={(e) => setFormData({ ...formData, availabilityHours: e.target.value })}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-slate-250 text-sm font-medium cursor-pointer"
                >
                  <option value="2">2 Hours</option>
                  <option value="4">4 Hours</option>
                  <option value="8">8 Hours</option>
                  <option value="12">12 Hours</option>
                  <option value="24">24 Hours</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>City / Neighborhood</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.cityName}
                  onChange={(e) => setFormData({ ...formData, cityName: e.target.value })}
                  placeholder="e.g. Ameerpet, Hyderabad"
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-slate-250 text-sm font-medium"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-spice-500 hover:bg-spice-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl shadow-md shadow-spice-500/20 active:scale-98 transition-all"
              >
                {loading ? 'Creating...' : 'Share Food Post'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateFoodPost;
