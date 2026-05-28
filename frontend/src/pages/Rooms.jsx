import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { Users, Plus, ArrowRight, Eye, UserCheck, Key, Star, Search } from 'lucide-react';

const Rooms = () => {
  const { t } = useLanguage();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (room.description && room.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (room.location?.cityName && room.location.cityName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (room.adminId?.name && room.adminId.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await api.rooms.getAll();
      if (res.success) {
        setRooms(res.rooms);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    setJoinLoading(true);
    setMessage('');
    try {
      const res = await api.rooms.join(joinCode);
      if (res.success) {
        setMessage('✓ Join request sent successfully! Waiting for room admin approval.');
        setJoinCode('');
        refreshProfile();
      }
    } catch (err) {
      setMessage(`❌ ${err.message || 'Failed to request joining'}`);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!window.confirm('Are you sure you want to leave your active room?')) return;
    try {
      const res = await api.rooms.leave();
      if (res.success) {
        alert('Left room successfully');
        refreshProfile();
        fetchRooms();
      }
    } catch (err) {
      alert(err.message || 'Error leaving room');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Room Membership status */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 rounded-3xl glow-card border border-slate-100 dark:border-slate-850">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <Users className="w-5.5 h-5.5 text-spice-500" />
              <span>Your Active Room Status</span>
            </h2>

            {user?.roomId ? (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase mb-1">Approved Member of</p>
                  <p className="font-extrabold text-lg text-slate-800 dark:text-white mb-2">
                    {typeof user.roomId === 'object' ? user.roomId.name : 'Joined Room Group'}
                  </p>
                  {typeof user.roomId === 'object' && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {user.roomId.description || 'No description provided.'}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    to={`/rooms/${typeof user.roomId === 'object' ? user.roomId._id : user.roomId}`}
                    className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2.5 rounded-xl text-center text-xs flex items-center justify-center gap-1 transition-colors border border-slate-200 dark:border-slate-750"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Room Panel</span>
                  </Link>
                  <button
                    onClick={handleLeaveRoom}
                    className="w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/15 font-bold py-2.5 rounded-xl text-xs transition-colors"
                  >
                    Leave Room
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {t('noRoomsMessage')}
                </p>

                {/* Form to join room */}
                <form onSubmit={handleJoinByCode} className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" />
                    <span>Join Room by Code</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      required
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      placeholder={t('roomIdPlaceholder')}
                      className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 uppercase text-slate-800 dark:text-white font-bold"
                    />
                    <button
                      type="submit"
                      disabled={joinLoading}
                      className="bg-spice-500 hover:bg-spice-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-spice-500/10 transition-colors"
                    >
                      {joinLoading ? 'Joining...' : 'Request'}
                    </button>
                  </div>
                  {message && (
                    <p className={`text-xs mt-3 font-semibold ${message.startsWith('✓') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {message}
                    </p>
                  )}
                </form>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2 text-center">
                  <p className="text-xs text-slate-400 font-medium mb-3">Or create your own living group room</p>
                  <Link
                    to="/create-room"
                    className="inline-flex items-center gap-1 bg-spice-50 dark:bg-spice-950/20 hover:bg-spice-100 dark:hover:bg-spice-900/30 text-spice-600 dark:text-spice-400 border border-spice-200 dark:border-spice-800/40 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('createRoom')}</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Rooms catalog */}
        <div className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Active Curry Circles</h2>
            
            {/* Search Input Box */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search rooms, admins, or cities..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 focus:ring-2 focus:ring-spice-500/20 text-slate-700 dark:text-white font-medium transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-spice-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Loading rooms...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-850 animate-fade-in">
              <Users className="w-16 h-16 text-slate-350 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="font-extrabold text-lg text-slate-700 dark:text-slate-300 mb-1">No Matching Groups</h3>
              <p className="text-xs sm:text-sm text-slate-400">
                No rooms match your search query. Try searching for a different PG name, hostel, or locality!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredRooms.map((room) => (
                <div
                  key={room._id}
                  onClick={() => navigate(`/rooms/${room._id}`)}
                  className="glass-panel p-5 rounded-2xl glow-card border border-slate-100 dark:border-slate-850 flex flex-col justify-between cursor-pointer hover:border-spice-500/50 dark:hover:border-spice-500/30 hover:shadow-lg transition-all group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white capitalize group-hover:text-spice-500 transition-colors">{room.name}</h3>
                      {room.rating > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/15 select-none shrink-0" title="Room Rating (average of roommates)">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {room.rating}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-3">Admin: {room.adminId?.name || 'Local Host'}</p>
                    <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm line-clamp-3 leading-relaxed mb-4">
                      {room.description || 'Community room created for sharing fresh, local curries.'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 mt-2 text-xs">
                    <span className="text-slate-400 font-medium">{room.location?.cityName || 'Hyderabad'}</span>
                    {user?.roomId === room._id || (user?.roomId && user?.roomId?._id === room._id) ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Joined</span>
                      </span>
                    ) : (
                      <span className="text-spice-500 font-semibold flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                        <span>View Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rooms;
