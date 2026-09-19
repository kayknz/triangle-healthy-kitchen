import React, { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import MenuPage from './pages/MenuPage';
import PlansPage from './pages/PlansPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import RiderDashboard from './pages/RiderDashboard';
import SubscriberDashboard from './pages/SubscriberDashboard';
import CommunityPage from './pages/CommunityPage';
import RewardsPage from './pages/RewardsPage';
import SubscriptionFlow from './components/SubscriptionFlow';
import BookingFlow from './components/BookingFlow';
import AccessSelector from './components/AccessSelector';
import ScrollToTop from './components/ScrollToTop';
import OnboardingFlow from './components/OnboardingFlow';

function ProtectedRoute({ children, role, mode }: { children: React.ReactNode, role?: string, mode?: 'work' | 'personal' }) {
  const { user, userRole, loading, accessMode, onboardingComplete } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-teal border-t-gold rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  // Force onboarding for subscribers
  if (userRole === 'subscriber' && !onboardingComplete) {
    return <OnboardingFlow onComplete={() => window.location.reload()} />;
  }

  // MASTER CLEARANCE: Owners can access everything
  if (userRole === 'owner') return <>{children}</>;

  // Hardened Mode Guard for others
  if (mode && accessMode && accessMode !== mode) {
    if (accessMode === 'work') {
      if (userRole === 'rider') return <Navigate to="/rider" />;
      return <Navigate to="/account" />;
    }
    return <Navigate to="/account" />;
  }

  if (role && userRole !== role) return <Navigate to="/" />;

  return <>{children}</>;
}

function AppContent() {
  const { user, accessMode, hasDualAccess, onboardingComplete, userRole } = useAuth();
  const [showSubFlow, setShowSubFlow] = useState(false);
  const [showBookFlow, setShowBookFlow] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);

  const openSubFlow = (pkgId?: string) => {
    setSelectedPkg(pkgId || null);
    setShowSubFlow(true);
  };

  const openBookFlow = (pkgId?: string) => {
    setSelectedPkg(pkgId || null);
    setShowBookFlow(true);
  };

  return (
    <div className="min-h-screen bg-background text-primary selection:bg-teal/10 selection:text-teal flex flex-col overflow-x-hidden">
      {/* Show Onboarding for subscribers if not complete */}
      {user && userRole === 'subscriber' && !onboardingComplete && <OnboardingFlow onComplete={() => window.location.reload()} />}

      {/* Show Access Selector if user is logged in with dual access but no mode selected */}
      {user && hasDualAccess && !accessMode && <AccessSelector />}

      <ScrollToTop />
      <Navbar onBookClick={() => openBookFlow()} onSubscribeClick={() => openSubFlow()} />

      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              user && !hasDualAccess ? (
                <Navigate to="/account" replace />
              ) : (
                <Home onSubscribeClick={openSubFlow} onBookClick={openBookFlow} />
              )
            }
          />
          <Route path="/menu" element={<MenuPage onSubscribeClick={openSubFlow} />} />
          <Route path="/plans" element={<PlansPage onSubscribeClick={openSubFlow} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="owner" mode="work">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rider"
            element={
              <ProtectedRoute role="rider" mode="work">
                <RiderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute mode="personal">
                <SubscriberDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community"
            element={
              <ProtectedRoute mode="personal">
                <CommunityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rewards"
            element={
              <ProtectedRoute mode="personal">
                <RewardsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/my-plan" element={<Navigate to="/account" replace />} />
        </Routes>
      </main>

      <Footer />

      <SubscriptionFlow
        open={showSubFlow}
        onClose={() => setShowSubFlow(false)}
        preselectedPackage={selectedPkg}
      />
      <BookingFlow
        open={showBookFlow}
        onClose={() => setShowBookFlow(false)}
        preselectedPackage={selectedPkg}
      />
      {process.env.NODE_ENV === 'production' && <Analytics />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
