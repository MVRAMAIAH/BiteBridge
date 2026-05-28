import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import { MessageSquare, Send, X, Star } from 'lucide-react';

const DirectChatModal = ({ peer, isOpen, onClose }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchDMLogs = async () => {
    if (!peer?._id && !peer?.id) return;
    const peerId = peer.id || peer._id;
    setLoading(true);
    try {
      const res = await api.messages.getDirectMessages(peerId);
      if (res.success) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.error('Error fetching DM logs:', err);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  useEffect(() => {
    if (isOpen && peer) {
      fetchDMLogs();
    }
  }, [isOpen, peer]);

  // Socket listener for real-time direct messaging
  useEffect(() => {
    if (socket && peer && isOpen) {
      const peerId = peer.id || peer._id;
      
      socket.on('direct_message', (newMsg) => {
        // Confirm message belongs to this active direct chat thread
        const isParticipant =
          (newMsg.senderId?._id === peerId && newMsg.receiverId === user?.id) ||
          (newMsg.senderId?._id === user?.id && newMsg.receiverId === peerId) ||
          (newMsg.senderId === peerId && newMsg.receiverId === user?.id) ||
          (newMsg.senderId === user?.id && newMsg.receiverId === peerId);

        if (isParticipant) {
          setMessages(prev => {
            if (prev.some(m => m._id === newMsg._id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(scrollToBottom, 50);
        }
      });

      return () => {
        socket.off('direct_message');
      };
    }
  }, [socket, peer, isOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const peerId = peer.id || peer._id;

    try {
      const res = await api.messages.send({
        receiverId: peerId,
        text: inputText
      });
      if (res.success) {
        setInputText('');
        // Socket listener will automatically push the message locally!
      }
    } catch (err) {
      alert(err.message || 'Failed to send message.');
    }
  };

  if (!isOpen || !peer) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-950 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-900 flex flex-col h-[500px] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-150 dark:border-slate-850 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-3">
            <img
              src={peer.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
              className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-150"
              alt=""
            />
            <div>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-white capitalize">{peer.name}</h4>
              {peer.averageRating > 0 ? (
                <span className="text-[10px] font-extrabold text-amber-500 flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-500" />
                  <span>{peer.averageRating} / 5</span>
                </span>
              ) : (
                <span className="text-[9px] text-slate-400 font-bold uppercase">Active Neighbor</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Chat List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 bg-slate-50/30 dark:bg-slate-950/10">
          {loading ? (
            <p className="text-xs text-slate-400 italic text-center py-4">Loading messages...</p>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6 gap-1.5">
              <span className="text-2xl">💬</span>
              <h5 className="font-extrabold text-xs text-slate-700 dark:text-slate-350">Start Direct Chat</h5>
              <p className="text-[10px] max-w-[200px] leading-relaxed">
                Coordinate pickup location, dish contents, or timing securely!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isSelf = msg.senderId?._id === user?.id || msg.senderId === user?.id;
              return (
                <div
                  key={msg._id}
                  className={`flex flex-col max-w-[80%] ${isSelf ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <div
                    className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isSelf
                        ? 'bg-spice-500 text-white rounded-tr-none shadow-md shadow-spice-500/10'
                        : 'bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-700 dark:text-white rounded-tl-none shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold mt-1 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Send input */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-950 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-white font-medium"
          />
          <button
            type="submit"
            className="bg-spice-500 hover:bg-spice-600 text-white p-2.5 rounded-xl transition-colors shadow-md active:scale-95 flex items-center justify-center cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};

export default DirectChatModal;
