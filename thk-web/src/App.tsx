import React, { Suspense, lazy, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, type UserRole } from './lib/auth';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
// Keep the public landing page lightweight on mobile. Authenticated workspaces,
// PDF/menu tooling, and checkout flows should only download when the user opens them.
const MenuPage = lazy(() => import('./pages/MenuPage'));
const PlansPage = lazy(() => import('./pages/PlansPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const OperationsWorkspace = lazy(() => import('./pages/OperationsWorkspace'));
const RiderDashboard = lazy(() => import('./pages/RiderDashboard'));
const SubscriberDashboard = lazy(() => import('./pages/SubscriberDashboard'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const RewardsPage = lazy(() => import('./pages/RewardsPage'));
const SubscriptionFlow = lazy(() => import('./components/SubscriptionFlow'));
const BookingFlow = lazy(() => import('./components/BookingFlow'));
import AccessSelector from './components/AccessSelector';
import ScrollToTop from './components/ScrollToTop';
import OnboardingFlow from './components/OnboardingFlow';
import PaymentCallbackPage from './pages/PaymentCallbackPage';
import LegalPage from './pages/LegalPage';

function ProtectedRoute({ children, role, mode }: { children: React.ReactNode, role?: UserRole | UserRole[], mode?: 'work' | 'personal' }) {
  const { user, userRole, loading, accessMode, onboardingComplete, hasPersonal } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-teal border-t-gold rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  // Unpaid customer signups must return to plan selection/checkout. A login in
  // Supabase Auth alone never unlocks the customer portal.
  if (userRole === 'subscriber' && !hasPersonal) return <Navigate to="/plans" replace />;

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
      if (userRole && ['owner', 'ceo', 'admin', 'kitchen', 'transport'].includes(userRole)) return <Navigate to="/dashboard" />;
      return <Navigate to="/account" />;
    }
    return <Navigate to="/account" />;
  }

  if (role && !(Array.isArray(role) ? role.includes(userRole as UserRole) : userRole === role)) return <Navigate to="/" />;

  return <>{children}</>;
}

function AppContent() {
  const { user, accessMode, hasDualAccess, onboardingComplete, userRole, hasPersonal } = useAuth();
  const [showSubFlow, setShowSubFlow] = useState(false);
  const [showBookFlow, setShowBookFlow] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);

  const routeFallback = <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-label="Loading page"><div className="w-8 h-8 border-4 border-teal border-t-gold rounded-full animate-spin" /></div>;

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
      {user && userRole === 'subscriber' && hasPersonal && !onboardingComplete && <OnboardingFlow onComplete={() => window.location.reload()} />}

      {/* Show Access Selector if user is logged in with dual access but no mode selected */}
      {user && hasDualAccess && !accessMode && <AccessSelector />}

      <ScrollToTop />
      <Navbar onBookClick={() => openBookFlow()} onSubscribeClick={() => openSubFlow()} />

      <main className="flex-1">
        <Suspense fallback={routeFallback}><Routes>
          <Route
            path="/"
            element={
              user && !hasDualAccess ? (
                <Navigate to={userRole && ['owner', 'ceo', 'admin', 'kitchen', 'transport'].includes(userRole) ? '/dashboard' : userRole === 'rider' ? '/rider' : '/account'} replace />
              ) : (
                <Home onSubscribeClick={openSubFlow} onBookClick={openBookFlow} />
              )
            }
          />
          <Route path="/menu" element={<MenuPage onSubscribeClick={openSubFlow} />} />
          <Route path="/plans" element={<PlansPage onSubscribeClick={openSubFlow} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/privacy" element={<LegalPage type="privacy" />} />
          <Route path="/terms" element={<LegalPage type="terms" />} />
          <Route path="/payment/callback" element={<PaymentCallbackPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role={['owner', 'ceo', 'admin', 'kitchen', 'transport']} mode="work">
                <OperationsWorkspace />
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
        </Routes></Suspense>
      </main>

      <Footer />

      {showSubFlow && <Suspense fallback={routeFallback}><SubscriptionFlow
        open={showSubFlow}
        onClose={() => setShowSubFlow(false)}
        preselectedPackage={selectedPkg}
      /></Suspense>}
      {showBookFlow && <Suspense fallback={routeFallback}><BookingFlow
        open={showBookFlow}
        onClose={() => setShowBookFlow(false)}
        preselectedPackage={selectedPkg}
      /></Suspense>}
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
