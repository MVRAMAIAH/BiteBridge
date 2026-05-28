import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, Compass, ShieldAlert, ArrowRight, CheckCircle2, Group, Plus } from 'lucide-react';

const Onboarding = () => {
  const { user, updateProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    mobileNumber: '',
    address: '',
    cityName: '',
    coordinates: [78.4867, 17.3850], // Default Hyderabad
  });

  const [roomAction, setRoomAction] = useState('join'); // 'join' or 'create'
  const [roomCode, setRoomCode] = useState('');
  const [newRoomData, setNewRoomData] = useState({
    name: '',
    description: ''
  });

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setProfileData(prev => ({
            ...prev,
            coordinates: [position.coords.longitude, position.coords.latitude]
          }));
          alert('Location coordinates captured successfully!');
        },
        () => {
          alert('Could not auto-detect location. Default location will be kept.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (!profileData.name || !profileData.mobileNumber || !profileData.address || !profileData.cityName) {
      setErrorMsg('Please fill in all details.');
      setLoading(false);
      return;
    }

    try {
      const res = await updateProfile({
        name: profileData.name,
        mobileNumber: profileData.mobileNumber,
        address: profileData.address,
        location: {
          coordinates: profileData.coordinates,
          cityName: profileData.cityName
        }
      });

      if (res.success) {
        setStep(2);
      } else {
        setErrorMsg(res.message || 'Profile update failed.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (roomAction === 'join') {
        if (!roomCode) {
          setErrorMsg('Please enter a valid room code.');
          setLoading(false);
          return;
        }
        const res = await api.rooms.join(roomCode);
        if (res.success) {
          await refreshProfile();
          navigate('/dashboard');
        } else {
          setErrorMsg(res.message || 'Failed to join room.');
        }
      } else {
        if (!newRoomData.name) {
          setErrorMsg('Please provide a name for the sharing room.');
          setLoading(false);
          return;
        }
        const res = await api.rooms.create({
          name: newRoomData.name,
          description: newRoomData.description,
          cityName: profileData.cityName
        });
        if (res.success) {
          await refreshProfile();
          navigate('/dashboard');
        } else {
          setErrorMsg(res.message || 'Failed to create room.');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-50/50 dark:bg-[#0b0c10]/20">
      <div className="w-full max-w-2xl glass-panel p-6 sm:p-10 rounded-3xl glow-card border border-slate-100 dark:border-slate-850">
        
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-850">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">
              Complete Your BiteBridge Profile
            </h1>
            <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold mt-1">
              {step === 1 ? 'Step 1 of 2: Contact & Location details' : 'Step 2 of 2: Connect with roommates'}
            </p>
          </div>
          <div className="flex gap-1">
            <div className={`w-8 h-2.5 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-spice-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
            <div className={`w-8 h-2.5 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-spice-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-500 text-xs font-bold rounded-2xl flex items-center gap-2 border border-rose-100/50 dark:border-rose-950/40">
            <ShieldAlert className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1 Form */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="flex flex-col gap-5 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Display Name</span>
                </label>
                <input
                  required
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-white font-medium"
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
                  value={profileData.mobileNumber}
                  onChange={(e) => setProfileData({ ...profileData, mobileNumber: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Exact Local Address (Flat/Room Number, Building Name)</span>
              </label>
              <textarea
                required
                rows={3}
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                placeholder="e.g. Flat 302, Sai Residency, Block C, Street 4"
                className="w-full p-4 rounded-2xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-white font-medium leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  <span>City / Locality</span>
                </label>
                <input
                  required
                  type="text"
                  value={profileData.cityName}
                  onChange={(e) => setProfileData({ ...profileData, cityName: e.target.value })}
                  placeholder="e.g. Ameerpet, Hyderabad"
                  className="w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-white font-medium"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-2xl text-sm transition-colors border border-slate-200 dark:border-slate-750 flex items-center justify-center gap-2"
                >
                  <Compass className="w-4 h-4 text-spice-500 animate-pulse" />
                  <span>Detect Coordinates</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-spice-500 hover:bg-spice-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-colors shadow-md shadow-spice-500/10 flex items-center justify-center gap-2 group"
            >
              <span>{loading ? 'Saving details...' : 'Continue to Room Setup'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        )}

        {/* Step 2 Form */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="flex flex-col gap-6 animate-fade-in">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold text-center leading-relaxed">
              BiteBridge works via roommate & neighborhood sharing rooms. You can choose to join an existing group if your roommates have created one, or create a brand new room group.
            </p>

            {/* Selection tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-850">
              <button
                type="button"
                onClick={() => setRoomAction('join')}
                className={`py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
                  roomAction === 'join'
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-750 dark:hover:text-slate-350'
                }`}
              >
                <Group className="w-4 h-4" />
                <span>Join Group</span>
              </button>
              <button
                type="button"
                onClick={() => setRoomAction('create')}
                className={`py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
                  roomAction === 'create'
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-750 dark:hover:text-slate-350'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Create Group</span>
              </button>
            </div>

            {roomAction === 'join' ? (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                    Enter Group Code
                  </label>
                  <input
                    required={roomAction === 'join'}
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ROOM-XXXX"
                    className="w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-white font-extrabold tracking-widest text-center"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                    Group Name
                  </label>
                  <input
                    required={roomAction === 'create'}
                    type="text"
                    value={newRoomData.name}
                    onChange={(e) => setNewRoomData({ ...newRoomData, name: e.target.value })}
                    placeholder="e.g. PG Third Floor, Block A Hostel Rooms"
                    className="w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                    Description / Rules (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={newRoomData.description}
                    onChange={(e) => setNewRoomData({ ...newRoomData, description: e.target.value })}
                    placeholder="e.g. 'We share curry and lunches every weekend.'"
                    className="w-full p-4 rounded-2xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-spice-500 text-slate-700 dark:text-white font-medium leading-relaxed"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-colors shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{loading ? 'Processing...' : 'Complete Profile Setup'}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default Onboarding;
