import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { User, MapPin, Globe, Inbox, Send, CheckCircle2, XCircle } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { t, locale, setLocale } = useLanguage();

  const [name, setName] = useState(user?.name || '');
  const [cityName, setCityName] = useState(user?.location?.cityName || '');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [incomingReqs, setIncomingReqs] = useState([]);
  const [outgoingReqs, setOutgoingReqs] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(true);

  const fetchRequests = async () => {
    setLoadingReqs(true);
    try {
      const inc = await api.requests.getRequests('incoming');
      const out = await api.requests.getRequests('outgoing');
      if (inc.success) setIncomingReqs(inc.requests);
      if (out.success) setOutgoingReqs(out.requests);
    } catch (err) {
      console.error('Error fetching logs', err);
    } finally {
      setLoadingReqs(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setSuccess(false);

    try {
      const res = await updateProfile({
        name,
        languagePreference: locale,
        location: {
          coordinates: user?.location?.coordinates || [78.4867, 17.3850],
          cityName
        }
      });
      if (res.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err) {
      alert(err.message || 'Profile update failed');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleManageRequest = async (id, status) => {
    try {
      const res = await api.requests.updateStatus(id, status);
      if (res.success) {
        alert(`Request ${status} successfully!`);
        fetchRequests();
      }
    } catch (err) {
      alert(err.message || 'Failed to update request');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Profile Info Form */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 rounded-3xl glow-card border border-slate-100 dark:border-slate-850">
            <div className="flex flex-col items-center text-center mb-6">
              <img
                src={user?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                className="w-24 h-24 rounded-full object-cover border-4 border-spice-400 mb-3 shadow-md"
                alt="Profile"
              />
              <h2 className="font-extrabold text-xl text-slate-800 dark:text-white capitalize">{user?.name}</h2>
              <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold">{user?.email}</p>
            </div>

            <form onSubmit={handleProfileUpdate} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Display Name</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>City Location</span>
                </label>
                <input
                  required
                  type="text"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Language Setting</span>
                </label>
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-white font-medium cursor-pointer"
                >
                  <option value="en">English</option>
                  <option value="te">తెలుగు (Telugu)</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                </select>
              </div>

              {success && (
                <div className="text-emerald-500 text-xs font-bold text-center py-1">
                  ✓ Profile updated successfully!
                </div>
              )}

              <button
                type="submit"
                disabled={updateLoading}
                className="w-full bg-spice-500 hover:bg-spice-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-md shadow-spice-500/10"
              >
                {updateLoading ? 'Saving...' : 'Update Settings'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Request Logs Panel */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Incoming Requests */}
          <div className="glass-panel p-6 rounded-3xl glow-card border border-slate-100 dark:border-slate-850">
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <Inbox className="w-5 h-5 text-spice-500" />
              <span>Incoming Share Requests</span>
            </h3>

            {loadingReqs ? (
              <p className="text-sm text-slate-450 italic py-4">Fetching logs...</p>
            ) : incomingReqs.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">
                No request offers received yet. People will request when you list curry dishes!
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {incomingReqs.map((req) => (
                  <div key={req._id} className="p-4 rounded-2xl border border-slate-150 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-2 ${
                        req.status === 'pending'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                          : req.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450'
                      }`}>
                        {req.status}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white capitalize">
                        {req.foodPostId?.title || 'Shared Post'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">
                        From: {req.requesterId?.name} ({req.requesterId?.location?.cityName || 'Hyderabad'})
                      </p>
                      {req.message && (
                        <p className="text-xs text-slate-600 dark:text-slate-350 italic mt-2 bg-white dark:bg-slate-950 p-2.5 border border-slate-100 dark:border-slate-800/40 rounded-xl leading-relaxed">
                          "{req.message}"
                        </p>
                      )}
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleManageRequest(req._id, 'accepted')}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 active:scale-95 transition-all shadow-md shadow-emerald-500/10"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleManageRequest(req._id, 'rejected')}
                          className="bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/20 text-slate-600 hover:text-rose-500 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Requests */}
          <div className="glass-panel p-6 rounded-3xl glow-card border border-slate-100 dark:border-slate-850">
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <Send className="w-5 h-5 text-spice-500" />
              <span>Your Requests to Others</span>
            </h3>

            {loadingReqs ? (
              <p className="text-sm text-slate-450 italic py-4">Fetching logs...</p>
            ) : outgoingReqs.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">
                You have not requested food from anyone else yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {outgoingReqs.map((req) => (
                  <div key={req._id} className="p-4 rounded-2xl border border-slate-150 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        req.status === 'pending'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                          : req.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450'
                      }`}>
                        {req.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white capitalize">
                      {req.foodPostId?.title || 'Shared Curry dish'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">
                      Shared by: {req.foodPostId?.createdBy?.name || 'Community Peer'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
