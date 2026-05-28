import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';

// Lazy loading mock simulation / imports
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import CreateFoodPost from './pages/CreateFoodPost';
import Rooms from './pages/Rooms';
import CreateRoom from './pages/CreateRoom';
import RoomDetails from './pages/RoomDetails';
import NotificationsPage from './pages/NotificationsPage';
import Profile from './pages/Profile';

// Route protector for secure pages
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-spice-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Authenticating BiteBridge Session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 dark:bg-[#0b0c10]">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/create-post" element={
            <ProtectedRoute>
              <CreateFoodPost />
            </ProtectedRoute>
          } />
          
          <Route path="/rooms" element={
            <ProtectedRoute>
              <Rooms />
            </ProtectedRoute>
          } />
          
          <Route path="/create-room" element={
            <ProtectedRoute>
              <CreateRoom />
            </ProtectedRoute>
          } />
          
          <Route path="/rooms/:roomId" element={
            <ProtectedRoute>
              <RoomDetails />
            </ProtectedRoute>
          } />
          
          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      {/* Footer */}
      <footer className="py-6 text-center border-t border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 text-slate-405 dark:text-slate-500 text-xs font-semibold">
        <p>© 2026 BiteBridge. Peer-to-Peer homemade curry sharing with trust.</p>
      </footer>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <LanguageProvider>
            <ThemeProvider>
              <AppRoutes />
            </ThemeProvider>
          </LanguageProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
