import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { Users, Shield, Copy, UserPlus, UserCheck, ArrowLeft, MessageSquare, Send, Calendar } from 'lucide-react';

const RoomDetails = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { socket } = useSocket();
  const navigate = useNavigate();

  // Basic States
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Tab State: 'chat' (chatroom) or 'members' (roommates list)
  const [activeTab, setActiveTab] = useState('chat');

  // Group Chat States
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  const messagesEndRef = useRef(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  const fetchChatMessages = async () => {
    setLoadingChat(true);
    try {
      const res = await api.messages.getRoomMessages(roomId);
      if (res.success) {
        setChatMessages(res.messages);
      }
    } catch (err) {
      console.error('Error fetching group chat logs:', err);
    } finally {
      setLoadingChat(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  useEffect(() => {
    fetchDetails();
    fetchChatMessages();
  }, [roomId]);

  // Handle Socket Group Chat events
  useEffect(() => {
    if (socket && roomId) {
      // Subscribe to this room's channel
      socket.emit('join_room', roomId);

      // Listen for incoming messages
      socket.on('room_message', (newMsg) => {
        setChatMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(scrollToBottom, 50);
      });

      return () => {
        socket.emit('leave_room', roomId);
        socket.off('room_message');
      };
    }
  }, [socket, roomId]);

  // Scroll on message updates
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    try {
      const res = await api.messages.send({
        roomId,
        text: newMessageText
      });
      if (res.success) {
        setNewMessageText('');
        // Socket event room_message will auto-append the message locally!
      }
    } catch (err) {
      alert(err.message || 'Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-spice-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Fetching room details...</p>
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
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-880 rounded-2xl flex flex-col items-center justify-center w-full md:w-auto">
          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-extrabold uppercase tracking-widest mb-1.5">
            Room Entry Code
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Chatroom / Members */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-3 px-6 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'chat'
                  ? 'border-spice-500 text-spice-500'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Group Chatroom</span>
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-3 px-6 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'members'
                  ? 'border-spice-500 text-spice-500'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Roommates ({members.length})</span>
            </button>
          </div>

          {/* Group Chatroom Panel */}
          {activeTab === 'chat' && (
            <div className="glass-panel rounded-3xl border border-slate-100 dark:border-slate-850 flex flex-col h-[520px] overflow-hidden bg-slate-50/20 dark:bg-slate-950/20 animate-fade-in shadow-md">
              {/* Message Scroller */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-3">
                {loadingChat ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">Loading messages...</p>
                ) : chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 dark:text-slate-500 p-6 gap-2">
                    <span className="text-3xl">💬</span>
                    <h4 className="font-extrabold text-sm">No discussion started yet</h4>
                    <p className="text-xs max-w-xs leading-relaxed">
                      Say hi to your roommates! Discuss dinners, curries, or general PG guidelines.
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isSelf = msg.senderId?._id === user?.id || msg.senderId === user?.id;
                    return (
                      <div
                        key={msg._id}
                        className={`flex items-start gap-2.5 max-w-[85%] ${isSelf ? 'self-end flex-row-reverse' : 'self-start'}`}
                      >
                        <img
                          src={msg.senderId?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                          className="w-8 h-8 rounded-full object-cover shadow-sm border border-slate-100"
                          alt=""
                        />
                        <div>
                          {!isSelf && (
                            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 block mb-0.5 ml-1">
                              {msg.senderId?.name}
                            </span>
                          )}
                          <div
                            className={`p-3 rounded-2xl text-sm leading-relaxed ${
                              isSelf
                                ? 'bg-spice-500 text-white rounded-tr-none shadow-md shadow-spice-500/10'
                                : 'bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-700 dark:text-white rounded-tl-none shadow-sm'
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className={`text-[9px] text-slate-400 font-semibold mt-1 block px-1 ${isSelf ? 'text-right' : 'text-left'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Send Form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-950 flex gap-2">
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="Type a message to roommates..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-white font-medium"
                />
                <button
                  type="submit"
                  className="bg-spice-500 hover:bg-spice-600 text-white p-2.5 rounded-xl transition-colors shadow-md active:scale-95 flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Roommates Tab */}
          {activeTab === 'members' && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-100 dark:border-slate-850 animate-fade-in">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-450" />
                <span>Room Members ({members.length})</span>
              </h3>

              <div className="flex flex-col gap-3">
                {members.map((m) => (
                  <div key={m._id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <img
                        src={m.userId?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                        className="w-10 h-10 rounded-full object-cover border border-slate-205"
                        alt=""
                      />
                      <div>
                        <p className="font-bold text-sm text-slate-800 dark:text-white">{m.userId?.name}</p>
                        <p className="text-xs text-slate-455">{m.userId?.email}</p>
                      </div>
                    </div>
                    {m.userId?._id === room?.adminId?._id && (
                      <span className="bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" />
                        <span>Admin</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Pending Join Requests */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 rounded-3xl glow-card border border-slate-100 dark:border-slate-850">
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-slate-400" />
              <span>Pending Requests ({requests.length})</span>
            </h3>

            {!isAdmin ? (
              <p className="text-xs text-slate-450 dark:text-slate-500 italic">
                Only the Room Administrator can view and manage pending room joining requests.
              </p>
            ) : requests.length === 0 ? (
              <p className="text-xs text-slate-400 leading-relaxed font-semibold italic text-center py-6">
                No active pending requests.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {requests.map((reqItem) => (
                  <div key={reqItem._id} className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-fade-in">
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={reqItem.userId?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
                        className="w-10 h-10 rounded-full object-cover"
                        alt=""
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
                        className="flex-1 bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/20 text-slate-600 hover:text-red-500 font-bold py-1.5 rounded-xl text-[10px] sm:text-xs transition-all"
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
