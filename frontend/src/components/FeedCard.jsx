import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Calendar, User, Users, MapPin, Tag, ShoppingBag, Send, MessageSquare } from 'lucide-react';
import DirectChatModal from './DirectChatModal';

const FeedCard = ({ post, onRequested }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [requestMsg, setRequestMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const isOwnPost = post.createdBy?._id === user?.id || post.createdBy === user?.id;

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.requests.create({
        foodPostId: post._id,
        message: requestMsg
      });
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          setShowRequestForm(false);
          setSuccess(false);
          setRequestMsg('');
          if (onRequested) onRequested();
        }, 1500);
      }
    } catch (err) {
      alert(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="glass-panel rounded-2xl p-5 glow-card border border-slate-100 dark:border-slate-800 transition-transform hover:-translate-y-1">
      {/* Top Details */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="inline-block bg-spice-100 dark:bg-spice-950/30 text-spice-700 dark:text-spice-400 font-extrabold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider mb-2">
            {post.price > 0 ? `₹${post.price}` : t('free')}
          </span>
          <h3 className="font-extrabold text-lg sm:text-xl text-slate-800 dark:text-white capitalize">{post.title}</h3>
        </div>

        {/* Room identity logic */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
            {post.roomId ? (
              <>
                <Users className="w-3.5 h-3.5" />
                <span>{post.roomId.name}</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5" />
                <span>{post.createdBy?.name || 'Community Peer'}</span>
              </>
            )}
          </div>

          {!isOwnPost && post.createdBy && (
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-spice-500 hover:text-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-sm border border-slate-200 dark:border-slate-800"
              title="Chat with Cook"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>
          )}
        </div>
      </div>

      <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 leading-relaxed line-clamp-3">
        {post.description}
      </p>

      {/* Grid Specs */}
      <div className="grid grid-cols-2 gap-3 mb-5 border-t border-slate-100 dark:border-slate-800 pt-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <ShoppingBag className="w-4 h-4 text-spice-400" />
          <span>{t('quantity')}: <strong className="text-slate-700 dark:text-slate-200">{post.quantity}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <Calendar className="w-4 h-4 text-spice-400" />
          <span>{t('availability')}: <strong className="text-slate-700 dark:text-slate-200">{getRelativeTime(post.availabilityTime)}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium col-span-2">
          <MapPin className="w-4 h-4 text-spice-400" />
          <span className="truncate">{t('location')}: <strong className="text-slate-700 dark:text-slate-200">{post.location?.cityName || 'Nearby'}</strong></span>
        </div>
      </div>

      {/* Action Button */}
      {!isOwnPost && post.status === 'available' && (
        <div>
          {post.hasRequested ? (
            <div className="w-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-605 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 font-bold py-2.5 rounded-xl text-center text-sm select-none">
              ✓ Requested (Waiting for Cook)
            </div>
          ) : !showRequestForm ? (
            <button
              onClick={() => setShowRequestForm(true)}
              className="w-full bg-spice-500 hover:bg-spice-600 active:scale-95 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-spice-500/10 flex items-center justify-center gap-1.5"
            >
              <span>{t('requestFood')}</span>
            </button>
          ) : (
            <form onSubmit={handleRequestSubmit} className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              {success ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 p-3 rounded-xl text-center text-sm font-bold">
                  ✓ Request sent successfully!
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <textarea
                    required
                    value={requestMsg}
                    onChange={(e) => setRequestMsg(e.target.value)}
                    placeholder="Enter short greeting message (e.g. 'Hey, I live in block A, would love to pick this up!')"
                    className="w-full text-sm p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-slate-200"
                    rows="2"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-spice-500 hover:bg-spice-600 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{loading ? 'Sending...' : 'Send'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRequestForm(false)}
                      className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-4 py-2 rounded-xl text-xs"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      )}

      {isOwnPost && (
        <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 p-2.5 rounded-xl text-center text-xs font-semibold">
          Your active share listing
        </div>
      )}

      {/* Direct Chat Overlay */}
      <DirectChatModal
        peer={post.createdBy}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </div>
  );
};

export default FeedCard;
