import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Users, Shield, Copy, UserPlus, UserCheck, ArrowLeft, Trash2 } from 'lucide-react';

const RoomDetails = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.rooms.getDetails(roomId);
      if (res.success) {
        setRoom(res.room);
        setMembers(res.members);
        setRequests(res.requests);
      }
    } catch (err) {
      alert('Error fetching room details: ' + err.message);
      navigate('/rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [roomId]);

  const handleCopyCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRequest = async (memberId, status) => {
    try {
      const res = await api.rooms.manageRequest(memberId, status);
      if (res.success) {
        alert(`Request ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
        fetchDetails();
      }
    } catch (err) {
      alert(err.message || 'Error processing request');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-spice-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Fetching room detail configurations...</p>
      </div>
    );
  }

  const isAdmin = room?.adminId?._id === user?.id || room?.adminId === user?.id;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/rooms')}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Rooms list</span>
      </button>

      {/* Hero card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl glow-card border border-slate-100 dark:border-slate-850 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block bg-spice-100 dark:bg-spice-950/30 text-spice-700 dark:text-spice-400 font-extrabold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">
              {room?.location?.cityName || 'Hostel Group'}
            </span>
            {isAdmin && (
              <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-extrabold text-xs px-2.5 py-1 rounded-full border border-amber-200/40">
                <Shield className="w-3 h-3" />
                <span>You are Admin</span>
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white capitalize mb-1">{room?.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {room?.description || 'Active sharing group room.'}
          </p>
        </div>

        {/* Copyable Join Code */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center w-full md:w-auto">
          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-extrabold uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <span>Room Entry Code</span>
          </p>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-950 px-4 py-2 border border-slate-100 dark:border-slate-800 rounded-xl">
            <span className="font-mono font-extrabold text-base tracking-wider text-slate-800 dark:text-white">{room?.code}</span>
            <button
              onClick={handleCopyCode}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              title="Copy Code"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          {copied && (
            <span className="text-[10px] text-emerald-500 font-bold mt-1.5 animate-pulse">✓ Copied!</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Approved Members List */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-3xl glow-card border border-slate-100 dark:border-slate-850">
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              <span>{t('roomMembers')} ({members.length})</span>
            </h3>

            <div className="flex flex-col gap-3">
              {members.map((m) => (
                <div key={m._id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <img
                      src={m.userId?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                      className="w-10 h-10 rounded-full object-cover border border-slate-205"
                      alt={m.userId?.name}
                    />
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-white">{m.userId?.name}</p>
                      <p className="text-xs text-slate-450 truncate max-w-xs">{m.userId?.email}</p>
                    </div>
                  </div>
                  {m.userId?._id === room?.adminId?._id && (
                    <span className="bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                      <Shield className="w-2.5 h-2.5" />
                      <span>{t('admin')}</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Join Requests (Visible to Room Admin Only) */}
        <div className="md:col-span-1">
          <div className="glass-panel p-6 rounded-3xl glow-card border border-slate-100 dark:border-slate-850">
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-slate-400" />
              <span>{t('joinRequests')} ({requests.length})</span>
            </h3>

            {!isAdmin ? (
              <p className="text-xs text-slate-450 dark:text-slate-500 italic">
                Only the Room Administrator can view and manage pending room joining requests.
              </p>
            ) : requests.length === 0 ? (
              <p className="text-xs text-slate-400 leading-relaxed font-semibold italic text-center py-6">
                No active pending requests at this time.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {requests.map((reqItem) => (
                  <div key={reqItem._id} className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3.5 mb-3">
                      <img
                        src={reqItem.userId?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                        className="w-10 h-10 rounded-full object-cover"
                        alt={reqItem.userId?.name}
                      />
                      <div>
                        <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">{reqItem.userId?.name}</p>
                        <p className="text-[10px] text-slate-400">{reqItem.userId?.email}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRequest(reqItem._id, 'approved')}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold py-1.5 rounded-xl text-[10px] sm:text-xs transition-all flex items-center justify-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleRequest(reqItem._id, 'rejected')}
                        className="flex-1 bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/20 text-slate-600 hover:text-red-500 dark:text-slate-450 dark:hover:text-red-400 font-bold py-1.5 rounded-xl text-[10px] sm:text-xs transition-all"
                      >
                        Reject
                      </button>
                    </div>
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

export default RoomDetails;
