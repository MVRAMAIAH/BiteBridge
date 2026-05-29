import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Soup, Trash2, CheckCircle2, Star, Sparkles, Inbox, PlusCircle, Calendar, MessageSquare, AlertCircle, Award, Clock } from 'lucide-react';

const SharedFood = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null); // stores active deleting foodPostId

  const fetchMyShares = async () => {
    setLoading(true);
    try {
      const res = await api.food.getMyShares();
      if (res.success) {
        setShares(res.foodPosts);
      }
    } catch (err) {
      console.error('Error fetching shared food', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyShares();
  }, []);

  const handleDeleteShare = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shared dish? Active requesters will be notified with an apology message.')) {
      return;
    }
    setDeleteLoading(id);
    try {
      const res = await api.food.delete(id);
      if (res.success) {
        alert('Shared dish successfully removed and requesters notified.');
        fetchMyShares();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete dish');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Group shares into Active (available / reserved), Past (completed), and Expired
  const activeShares = shares.filter(s => s.status === 'available' || s.status === 'reserved');
  const pastShares = shares.filter(s => s.status === 'completed');
  const expiredShares = shares.filter(s => s.status === 'expired');

  // Compute rating metrics
  const totalReceivedRatings = shares.reduce((acc, curr) => acc + curr.ratings.length, 0);
  const averageSharesRating = totalReceivedRatings > 0 
    ? (shares.reduce((sum, curr) => sum + curr.ratings.reduce((s, r) => s + r.rating, 0), 0) / totalReceivedRatings).toFixed(1)
    : 'N/A';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
      
      {/* Top Banner Control Section */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl glow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-slate-100 dark:border-slate-850">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
            <Soup className="w-7 h-7 text-spice-500 animate-bounce" />
            <span>Shared Food & Culinary Kitchen</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium">
            Manage your homemade sharing listings, track active handovers, and read reviews left by neighbors!
          </p>
        </div>

        <Link
          to="/create-post"
          className="flex items-center gap-2 bg-spice-500 hover:bg-spice-600 text-white font-extrabold px-5 py-3 rounded-2xl text-sm transition-all shadow-md shadow-spice-500/10 hover:shadow-spice-500/25 active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Share a New Curry</span>
        </Link>
      </div>

      {/* Stats Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center gap-4">
          <div className="p-3 bg-spice-100 dark:bg-spice-950/20 rounded-xl">
            <Soup className="w-6 h-6 text-spice-500" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{activeShares.length}</p>
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Active Dishes</p>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/20 rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{pastShares.length}</p>
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Dishes Served</p>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center gap-4">
          <div className="p-3 bg-rose-100 dark:bg-rose-950/20 rounded-xl">
            <Clock className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{expiredShares.length}</p>
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Expired</p>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-950/20 rounded-xl">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{averageSharesRating} / 5</p>
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Rating ({totalReceivedRatings} Reviews)</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-spice-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading your kitchen listings...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Active Shares (Sales) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-100 dark:border-slate-850 flex flex-col gap-5">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
                <Inbox className="w-5 h-5 text-indigo-500" />
                <span>Active Listings & In-Progress Handovers</span>
              </h3>

              {activeShares.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center gap-3">
                  <span className="text-3xl">🍲</span>
                  <p className="text-xs text-slate-450 italic font-semibold">No active curries shared currently.</p>
                  <Link to="/create-post" className="text-xs text-spice-500 hover:underline font-extrabold">Share one now ➔</Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {activeShares.map((dish) => (
                    <div key={dish._id} className="p-5 rounded-2xl border border-slate-150 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 flex flex-col gap-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              dish.status === 'available'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-205/10'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-205/10'
                            }`}>
                              {dish.status}
                            </span>
                            <span className="text-[10px] text-slate-450 font-semibold flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{new Date(dish.createdAt).toLocaleDateString()}</span>
                            </span>
                          </div>
                          <h4 className="font-extrabold text-md text-slate-850 dark:text-white capitalize">{dish.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{dish.description || 'Homemade delicious curry shared with neighbors.'}</p>
                          <div className="flex gap-4 mt-3 text-[11px] font-bold text-slate-450 border-t border-slate-100 dark:border-slate-900/40 pt-2.5">
                            <span>Quantity: <strong className="text-slate-700 dark:text-slate-350 capitalize">{dish.quantity}</strong></span>
                            <span>Cost Share: <strong className="text-slate-700 dark:text-slate-350">{dish.price > 0 ? `₹${dish.price}` : 'FREE'}</strong></span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteShare(dish._id)}
                          disabled={deleteLoading === dish._id}
                          className="p-2.5 bg-rose-50 hover:bg-rose-500 hover:text-white dark:bg-rose-950/20 text-rose-500 dark:hover:bg-rose-600 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                          title="Delete Listings & Notify Requesters"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Shared Food Log */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-100 dark:border-slate-850 flex flex-col gap-5">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Past Served Logs (Completed Exchanges)</span>
              </h3>

              {pastShares.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-8">No completed curry shares yet.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {pastShares.map((dish) => (
                    <div key={dish._id} className="p-4 rounded-2xl border border-slate-150 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-extrabold text-sm text-slate-850 dark:text-white capitalize">{dish.title}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Served: {new Date(dish.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">{dish.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expired Dishes Section */}
            {expiredShares.length > 0 && (
              <div className="glass-panel p-6 rounded-3xl border border-slate-100 dark:border-slate-850 flex flex-col gap-5">
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
                  <Clock className="w-5 h-5 text-rose-500" />
                  <span>Expired Listings</span>
                  <span className="ml-auto text-[10px] font-bold bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 px-2.5 py-0.5 rounded-full">
                    {expiredShares.length} expired
                  </span>
                </h3>

                <div className="flex flex-col gap-4">
                  {expiredShares.map((dish) => (
                    <div key={dish._id} className="p-4 rounded-2xl border border-rose-150 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-950/5 flex flex-col gap-3 opacity-75">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/30">
                            Expired
                          </span>
                          <h4 className="font-extrabold text-sm text-slate-600 dark:text-slate-400 capitalize line-through">{dish.title}</h4>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(dish.availabilityTime).toLocaleString()}</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">{dish.description || 'No description provided.'}</p>
                      <div className="flex gap-4 text-[11px] font-bold text-slate-400 border-t border-rose-100 dark:border-rose-900/20 pt-2">
                        <span>Qty: <strong className="text-slate-500 capitalize">{dish.quantity}</strong></span>
                        <span>Price: <strong className="text-slate-500">{dish.price > 0 ? `₹${dish.price}` : 'FREE'}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Feedback & Ratings Dynamics */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="glass-panel p-6 rounded-3xl glow-card border border-slate-100 dark:border-slate-850 flex flex-col gap-5">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Culinary Feedback & Reviews</span>
              </h3>

              {totalReceivedRatings === 0 ? (
                <div className="text-center py-16 flex flex-col items-center gap-3">
                  <Star className="w-8 h-8 text-slate-200 dark:text-slate-850 fill-none" />
                  <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">No reviews received yet</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Once neighbors receive your active dishes, they will submit reviews and star ratings which appear here.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4.5">
                  {shares
                    .filter(post => post.ratings && post.ratings.length > 0)
                    .map(post => (
                      <div key={post._id} className="flex flex-col gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-900/60 last:border-b-0">
                        {/* Dish title reference */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100/50 dark:border-slate-850 flex items-center justify-between">
                          <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-300 capitalize truncate">{post.title}</span>
                          <span className="text-[9px] bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
                            ⭐ {post.ratings.reduce((sum, r) => sum + r.rating, 0) / post.ratings.length} / 5
                          </span>
                        </div>

                        {/* Rater reviews loop */}
                        {post.ratings.map((rate) => (
                          <div key={rate._id} className="p-3 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col gap-2 shadow-sm">
                            <div className="flex items-center gap-2">
                              <img
                                src={rate.raterId?.profileImage || 'https://api.dicebear.com/7.x/adventurer/svg'}
                                className="w-8 h-8 rounded-full border border-slate-100 dark:border-slate-800 object-cover"
                                alt="Rater Profile"
                              />
                              <div className="flex flex-col">
                                <span className="text-xs font-extrabold text-slate-800 dark:text-white capitalize leading-tight">
                                  {rate.raterId?.name || 'Anonymous Neighbor'}
                                </span>
                                <div className="flex gap-0.5 mt-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 ${star <= rate.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-205 dark:text-slate-800'}`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <span className="ml-auto text-[9px] text-slate-400 font-semibold">
                                {new Date(rate.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            {rate.comment && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-350 italic font-semibold leading-relaxed bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-xl">
                                "{rate.comment}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default SharedFood;
