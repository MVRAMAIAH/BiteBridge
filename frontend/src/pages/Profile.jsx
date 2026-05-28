import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { User, MapPin, Globe, Inbox, Send, CheckCircle2, XCircle, Phone, Home, Star, AlertCircle, Sparkles } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile, refreshProfile } = useAuth();
  const { t, locale, setLocale } = useLanguage();

  // Profile Edit states
  const [name, setName] = useState(user?.name || '');
  const [cityName, setCityName] = useState(user?.location?.cityName || '');
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber || '');
  const [address, setAddress] = useState(user?.address || '');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Tab State: 'incoming' (Sales), 'outgoing' (Purchases), 'completed' (Transaction History)
  const [activeTab, setActiveTab] = useState('incoming');

  // Logs states
  const [incomingReqs, setIncomingReqs] = useState([]);
  const [outgoingReqs, setOutgoingReqs] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(true);

  // Rating Modal states
  const [ratingModalPost, setRatingModalPost] = useState(null); // The food post we are currently rating
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratedPosts, setRatedPosts] = useState({}); // e.g. { foodPostId: true }
  const [ratingType, setRatingType] = useState('cook'); // 'cook' or 'buyer'
  const [ratingTargetUser, setRatingTargetUser] = useState(null); // Target requester/buyer user being rated

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

  // Check if a post is already rated by the user
  const checkRatingStatus = async (postId) => {
    try {
      const res = await api.food.getMyRating(postId);
      if (res.success && res.rated) {
        setRatedPosts(prev => ({ ...prev, [postId]: true }));
      }
    } catch (err) {
      console.error('Error checking rating status', err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Fetch rating status for accepted outgoing requests (completed purchases)
  useEffect(() => {
    outgoingReqs.forEach(req => {
      if (req.status === 'accepted' && req.foodPostId?._id) {
        checkRatingStatus(req.foodPostId._id);
      }
    });
  }, [outgoingReqs]);

  // Fetch rating status for accepted incoming requests (completed shares)
  useEffect(() => {
    incomingReqs.forEach(req => {
      if (req.status === 'accepted' && req.foodPostId?._id) {
        checkRatingStatus(req.foodPostId._id);
      }
    });
  }, [incomingReqs]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setSuccess(false);

    try {
      const res = await updateProfile({
        name,
        languagePreference: locale,
        mobileNumber,
        address,
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
        alert(`Request marked as ${status} successfully!`);
        fetchRequests();
      }
    } catch (err) {
      alert(err.message || 'Failed to update request');
    }
  };

  const handleRateSubmit = async (e) => {
    e.preventDefault();
    if (!ratingModalPost) return;

    setSubmittingRating(true);
    try {
      const res = await api.food.rate(ratingModalPost._id, ratingValue, ratingComment);
      if (res.success) {
        alert('Thank you for rating!');
        setRatedPosts(prev => ({ ...prev, [ratingModalPost._id]: true }));
        setRatingModalPost(null);
        setRatingValue(5);
        setRatingComment('');
        fetchRequests();
        refreshProfile();
      }
    } catch (err) {
      alert(err.message || 'Failed to submit rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Rating Modal */}
      {ratingModalPost && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-900 flex flex-col gap-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">
                  {ratingType === 'cook' ? 'Rate Cook & Food Post' : 'Rate Exchange Partner / Buyer'}
                </h3>
                <p className="text-xs text-slate-500 font-semibold capitalize mt-1">
                  {ratingType === 'cook' 
                    ? `How was the "${ratingModalPost.title}"?` 
                    : `How was your exchange experience with "${ratingTargetUser?.name || 'Neighbor'}"?`}
                </p>
              </div>
              <button
                onClick={() => setRatingModalPost(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRateSubmit} className="flex flex-col gap-4">
              {/* Star Rating Select */}
              <div className="flex flex-col items-center py-2">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingValue(star)}
                      className="transition-transform active:scale-90 hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= ratingValue
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200 dark:text-slate-800'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-500 mt-2">
                  {ratingType === 'cook'
                    ? (ratingValue === 5 ? 'Excellent Curry!' : ratingValue === 4 ? 'Tasty Food' : ratingValue === 3 ? 'Good Sharing' : ratingValue === 2 ? 'Fair' : 'Needs Improvement')
                    : (ratingValue === 5 ? 'Perfect Exchange Partner!' : ratingValue === 4 ? 'Very Friendly & On Time' : ratingValue === 3 ? 'Good Exchange' : ratingValue === 2 ? 'Fair' : 'Needs Improvement')
                  }
                </span>
              </div>

              {/* Comment text */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                  Add a comment
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder={ratingType === 'cook' ? "Share your culinary experience with this homemade dish..." : "Share feedback on exchange timing, communication, or friendliness..."}
                  rows={3}
                  className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-spice-500 text-slate-700 dark:text-white font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={submittingRating}
                className="w-full bg-spice-500 hover:bg-spice-600 text-white font-extrabold py-3 rounded-2xl transition-colors shadow-md shadow-spice-500/10"
              >
                {submittingRating ? 'Submitting Rating...' : 'Submit Rating'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Profile card & form */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* User Profile display card */}
          <div className="glass-panel p-6 rounded-3xl glow-card border border-slate-100 dark:border-slate-850 flex flex-col items-center text-center">
            <img
              src={user?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
              className="w-24 h-24 rounded-full object-cover border-4 border-spice-400 mb-3 shadow-md"
              alt="Profile"
            />
            <h2 className="font-extrabold text-xl text-slate-800 dark:text-white capitalize flex items-center gap-1.5 justify-center">
              <span>{user?.name}</span>
              {user?.averageRating > 0 && <Sparkles className="w-4 h-4 text-amber-500" />}
            </h2>
            <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold">{user?.email}</p>

            {/* Ratings Aggregate Badge */}
            {user?.averageRating > 0 ? (
              <div className="mt-3 flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-full text-amber-600 dark:text-amber-500 font-bold text-xs border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{user.averageRating} / 5</span>
                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold">
                  ({user.totalRatings} reviews)
                </span>
              </div>
            ) : (
              <span className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                No ratings received yet
              </span>
            )}
          </div>

          {/* Profile settings Form */}
          <div className="glass-panel p-6 rounded-3xl glow-card border border-slate-100 dark:border-slate-850">
            <h3 className="font-extrabold text-md text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-850 pb-2">
              Update Profile details
            </h3>

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
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Mobile Number</span>
                </label>
                <input
                  required
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5" />
                  <span>Exact Address</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Flat No, Building Name..."
                  className="w-full p-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>City / Locality</span>
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
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Language Preference</span>
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

        {/* Right column: Logs and history */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('incoming')}
              className={`py-3 px-6 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'incoming'
                  ? 'border-spice-500 text-spice-500'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Share Offers (Sales)</span>
            </button>
            <button
              onClick={() => setActiveTab('outgoing')}
              className={`py-3 px-6 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'outgoing'
                  ? 'border-spice-500 text-spice-500'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Your Requests (Purchases)</span>
            </button>
          </div>

          {/* Incoming Share Requests (Sales Log) */}
          {activeTab === 'incoming' && (
            <div className="glass-panel p-6 rounded-3xl glow-card border border-slate-100 dark:border-slate-850 animate-fade-in">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                <Inbox className="w-5 h-5 text-spice-500" />
                <span>Offers Requested by Roommates</span>
              </h3>

              {loadingReqs ? (
                <p className="text-sm text-slate-450 italic py-4">Fetching logs...</p>
              ) : incomingReqs.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-8">
                  No share requests received yet. Share some curry to get requests!
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {incomingReqs.map((req) => (
                    <div key={req._id} className="p-4 rounded-2xl border border-slate-150 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
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
                          {req.foodPostId?.title || 'Shared Post'}
                        </h4>
                        <div className="text-xs text-slate-500 mt-1 font-semibold flex flex-col gap-0.5">
                          <p>From: {req.requesterId?.name} ({req.requesterId?.location?.cityName})</p>
                          {req.requesterId?.mobileNumber && <p className="text-slate-450">📞 {req.requesterId.mobileNumber}</p>}
                        </div>

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

                      {req.status === 'accepted' && req.foodPostId && (
                        <div className="flex items-center">
                          {ratedPosts[req.foodPostId._id] ? (
                            <div className="flex items-center gap-1 text-emerald-500 font-extrabold text-xs bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/15 animate-pulse">
                              <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                              <span>Buyer Rated!</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setRatingType('buyer');
                                setRatingTargetUser(req.requesterId);
                                setRatingModalPost(req.foodPostId);
                              }}
                              className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1 active:scale-95 transition-all shadow-md shadow-amber-500/10"
                            >
                              <Star className="w-3.5 h-3.5 fill-white text-white" />
                              <span>Rate Buyer</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Outgoing Requests (Purchases Log & rating trigger) */}
          {activeTab === 'outgoing' && (
            <div className="glass-panel p-6 rounded-3xl glow-card border border-slate-100 dark:border-slate-850 animate-fade-in">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                <Send className="w-5 h-5 text-spice-500" />
                <span>Your Purchases (Requested Dishes)</span>
              </h3>

              {loadingReqs ? (
                <p className="text-sm text-slate-450 italic py-4">Fetching logs...</p>
              ) : outgoingReqs.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-8">
                  You have not requested any curry dishes yet.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {outgoingReqs.map((req) => (
                    <div key={req._id} className="p-4 rounded-2xl border border-slate-150 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            req.status === 'pending'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                              : req.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450'
                          }`}>
                            {req.status === 'accepted' ? 'Completed' : req.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-white capitalize">
                          {req.foodPostId?.title || 'Shared Curry dish'}
                        </h4>
                        <div className="text-xs text-slate-505 mt-1 font-semibold flex flex-col gap-0.5">
                          <p>Shared by: {req.foodPostId?.createdBy?.name || 'Community Cook'}</p>
                          {req.status === 'accepted' && req.foodPostId?.createdBy?.mobileNumber && (
                            <p className="text-slate-450">📞 {req.foodPostId.createdBy.mobileNumber}</p>
                          )}
                        </div>
                      </div>

                      {/* Ratings Submission Trigger */}
                      {req.status === 'accepted' && req.foodPostId && (
                        <div className="flex items-center">
                          {ratedPosts[req.foodPostId._id] ? (
                            <div className="flex items-center gap-1 text-emerald-500 font-extrabold text-xs bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/15">
                              <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                              <span>Rated!</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setRatingType('cook');
                                setRatingModalPost(req.foodPostId);
                              }}
                              className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1 active:scale-95 transition-all shadow-md shadow-amber-500/10"
                            >
                              <Star className="w-3.5 h-3.5 fill-white text-white" />
                              <span>Rate Food</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Profile;
