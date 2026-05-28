import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Soup, Heart, Shield, HelpCircle } from 'lucide-react';

const Landing = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleMockGoogleLogin = async (email, name, img) => {
    setLoading(true);
    // Simulating a real Google OAuth credential response block
    const mockProfile = {
      name,
      email,
      profileImage: img,
      location: {
        type: 'Point',
        coordinates: [78.4867, 17.3850], // Hyderabad default
        cityName: 'Hyderabad, Telangana'
      }
    };

    const res = await login(mockProfile);
    if (res.success) {
      navigate('/dashboard');
    } else {
      alert('Login failed: ' + res.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden bg-slate-50 dark:bg-[#0b0c10]">
      {/* Decorative Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-spice-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto text-center z-10">
        <div className="flex justify-center mb-6">
          <div className="bg-spice-100 dark:bg-spice-950/30 p-4 rounded-3xl border border-spice-200 dark:border-spice-800 animate-spin-slow">
            <Soup className="w-16 h-16 text-spice-500" />
          </div>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4 text-slate-800 dark:text-white leading-tight">
          🍛 {t('welcome')}
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-350 max-w-2xl mx-auto mb-8 font-medium leading-relaxed">
          {t('subWelcome')}
        </p>
        {/* Beautiful Dynamic Registration / Login Panel */}
        <div className="glass-panel max-w-sm mx-auto p-6 sm:p-8 rounded-3xl glow-card mb-12 border border-slate-100 dark:border-slate-850">
          <h2 className="font-extrabold text-xl mb-2 text-slate-800 dark:text-white">
            Welcome to BiteBridge
          </h2>
          <p className="text-xs text-slate-450 dark:text-slate-500 mb-6 font-medium">
            Connect with roommates and share homemade meals.
          </p>

          <button
            onClick={() => handleMockGoogleLogin('venket@bitebridge.com', 'Venket Ramaiah', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120')}
            disabled={loading}
            className="w-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-800 hover:border-spice-500 dark:hover:border-spice-500 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
          >
            {/* Google G logo svg */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-.14 3.01-1.04 4.01l3.12 2.42c1.83-1.69 2.97-4.18 2.97-8.26z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.12-2.42c-.87.58-1.99.93-3.14.93-2.92 0-5.4-1.97-6.28-4.63H4.18v2.5C6.18 21.9 10.3 24 12 24z"/>
              <path fill="#FBBC05" d="M5.72 14.97c-.22-.67-.35-1.39-.35-2.12s.13-1.45.35-2.12v-2.5H1.68c-.76 1.52-1.18 3.22-1.18 5s.42 3.48 1.18 5l4.04-3.26z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.97 1.19 15.24 0 12 0 10.3 0 6.18 2.1 4.18 5.75L5.72 9c.88-2.66 3.36-4.63 6.28-4.63z"/>
            </svg>
            <span>{loading ? 'Authenticating...' : 'Sign In with Google'}</span>
          </button>
        </div>
        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="glass-panel p-6 rounded-2xl glow-card text-center border border-slate-100 dark:border-slate-850">
            <div className="flex justify-center mb-3">
              <Heart className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white">No Fixed Roles</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Cook and share your leftovers today. Request curries or meals from others tomorrow. We are all equals.
            </p>
          </div>
          <div className="glass-panel p-6 rounded-2xl glow-card text-center border border-slate-100 dark:border-slate-850">
            <div className="flex justify-center mb-3">
              <Shield className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white">PG & Hostel Rooms</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Create unique roommate groups to share homemade food secure within your apartment complexes or hostels.
            </p>
          </div>
          <div className="glass-panel p-6 rounded-2xl glow-card text-center border border-slate-100 dark:border-slate-850">
            <div className="flex justify-center mb-3">
              <HelpCircle className="w-8 h-8 text-spice-500" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white">Affordable Sharing</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Curries shared are priced to fit the micro budgets of students and local community living.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
