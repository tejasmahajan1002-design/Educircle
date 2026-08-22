import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import Explore from './pages/Explore';
import StudyMaterials from './pages/StudyMaterials';
import AddResource from './pages/AddResource';
import MyResources from './pages/MyResources';
import MyBorrowings from './pages/MyBorrowings';
import Requests from './pages/Requests';
import Messages from './pages/Messages';
import LostAndFound from './pages/LostAndFound';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import ResourceDetails from './pages/ResourceDetails';
import AdminDashboard from './pages/AdminDashboard';

// Route guards
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Layout Orchestrator
const AppLayout = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isAuthPage = ['/login', '/register', '/'].includes(location.pathname);

  if (isAuthPage && !user) {
    // Plain header navigation layout for landing/login pages
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    );
  }

  // Dashboard sidebar layout for logged in users
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar />
      <Sidebar />
      <div className="pt-16 lg:pl-64">
        <main className="p-6 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
          <Routes>
            {/* Fallback routing */}
            <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Home />} />
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/register" element={<Navigate to="/dashboard" replace />} />

            {/* Protected Student Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
            <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
            <Route path="/study-materials" element={<ProtectedRoute><StudyMaterials /></ProtectedRoute>} />
            <Route path="/share-resource" element={<ProtectedRoute><AddResource /></ProtectedRoute>} />
            <Route path="/my-listings" element={<ProtectedRoute><MyResources /></ProtectedRoute>} />
            <Route path="/my-borrowings" element={<ProtectedRoute><MyBorrowings /></ProtectedRoute>} />
            <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/lost-found" element={<ProtectedRoute><LostAndFound /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/resources/:id" element={<ProtectedRoute><ResourceDetails /></ProtectedRoute>} />

            {/* Protected Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>
  );
}

export default App;
