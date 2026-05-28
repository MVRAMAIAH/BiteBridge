import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, MapPin, Tag } from 'lucide-react';

const CreateRoom = () => {
  const { t } = useLanguage();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cityName: user?.location?.cityName || ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.rooms.create({
        name: formData.name,
        description: formData.description,
        location: {
          coordinates: user?.location?.coordinates || [78.4867, 17.3850],
          cityName: formData.cityName || 'Hyderabad'
        }
      });
      if (res.success) {
        setSuccess(true);
        refreshProfile();
        setTimeout(() => {
          navigate('/rooms');
        }, 1200);
      }
    } catch (err) {
      alert(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl glow-card border border-slate-100 dark:border-slate-850">
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
          <Users className="w-6 h-6 text-spice-500" />
          <span>{t('createRoom')}</span>
        </h2>

        {success ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 p-6 rounded-2xl text-center font-bold">
            ✓ Room Created Successfully! Redirecting...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-200">
                Room Group Name
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Block A Girls PG, Ameerpet Boys Hostel Room 12"
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-slate-250 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-200">
                Description / Guidelines
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="List room sharing guidelines. e.g. 'We share dinners, curries, and spices in Hostel Block C.'"
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-slate-250 text-sm font-medium"
                rows="4"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>Location Area</span>
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

            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-spice-500 hover:bg-spice-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl shadow-md shadow-spice-500/20 active:scale-98 transition-all"
              >
                {loading ? 'Creating...' : 'Create Sharing Room'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/rooms')}
                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-bold px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-750 hover:bg-slate-200 transition-colors"
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

export default CreateRoom;
