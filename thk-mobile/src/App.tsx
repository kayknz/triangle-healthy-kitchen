import { useState, useCallback, useEffect } from 'react';
import { Calendar, Users, Gift, User as UserIcon } from 'lucide-react';
import Home from '@/pages/Home';
import Navbar from '@/components/Navbar';
import BookingFlow from '@/components/BookingFlow';
import ProviderAuth from '@/components/ProviderAuth';
import ProviderDashboard from '@/components/ProviderDashboard';
import RiderDashboard from '@/components/RiderDashboard';
import SubscriptionFlow from '@/components/SubscriptionFlow';
import SubscriberAuth from '@/components/SubscriberAuth';
import SubscriberDashboard from '@/pages/SubscriberDashboard';
import CommunityPage from '@/pages/CommunityPage';
import RewardsPage from '@/pages/RewardsPage';
import LegalPage from '@/components/LegalPage';
import OnboardingFlow from '@/components/OnboardingFlow';
import MyRhythm from '@/components/MyRhythm';
import SplashScreenComponent from '@/components/SplashScreen';
import SecuringProtocol from '@/components/SecuringProtocol';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/lib/supabase';
import { AuthProvider, useAuth } from '@/lib/auth';
import { LanguageProvider, useLanguage } from '@/lib/LanguageContext';

type Route = 'home' | 'provider-auth' | 'provider-dashboard' | 'rider-dashboard' | 'subscriber-auth' | 'subscriber-dashboard' | 'today' | 'community' | 'rewards' | 'privacy' | 'terms';

function AppContent() {
  const { session, loading: authLoading, user, userRole } = useAuth();
  const { t } = useLanguage();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [preselectedPackage, setPreselectedPackage] = useState<string | null>(null);
  const [route, setRoute] = useState<Route>('home');

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) {
        setOnboardingComplete(false);
        return;
      }

      const timeout = setTimeout(() => {
        if (onboardingComplete === null) setOnboardingComplete(false);
      }, 3000);

      try {
        const { data, error } = await supabase
          .from('subscribers')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle();

        clearTimeout(timeout);
        if (error) throw error;
        setOnboardingComplete(data?.onboarding_completed ?? false);
      } catch (e) {
        console.error('Onboarding check failed:', e);
        setOnboardingComplete(false);
      }
    };
    if (!authLoading) checkOnboarding();
  }, [user, authLoading]);

  useEffect(() => {
    const initApp = async () => {
      if (!authLoading && onboardingComplete !== null) {
        try {
          await SplashScreen.hide();
        } catch (e) {}
      }
    };
    initApp();
  }, [authLoading, onboardingComplete]);

  useEffect(() => {
    const handleBackButton = async () => {
      if (bookingOpen) { setBookingOpen(false); return; }
      if (subscribeOpen) { setSubscribeOpen(false); return; }
      if (route === 'subscriber-auth' || route === 'provider-auth') {
        setRoute('home');
        window.location.hash = '';
        return;
      }

      if (route !== 'home') {
        setRoute('home');
        window.location.hash = '';
        return;
      }

      const { App } = await import('@capacitor/app');
      App.exitApp();
    };

    const handleDeepLink = (event: any) => {
      const url = new URL(event.url);
      const path = url.pathname + url.hash;
      if (path.includes('dashboard')) {
        setRoute(userRole === 'rider' ? 'rider-dashboard' : 'provider-dashboard');
      } else if (path.includes('my-plan') || path.includes('account')) {
        setRoute('subscriber-dashboard');
      } else if (path.includes('today')) {
        setRoute('today');
      }
    };

    let backListener: any;
    import('@capacitor/app').then(({ App }) => {
      App.addListener('appUrlOpen', handleDeepLink);
      backListener = App.addListener('backButton', handleBackButton);
    });

    return () => {
      import('@capacitor/app').then(({ App }) => {
        App.removeAllListeners();
      });
    };
  }, [userRole, bookingOpen, subscribeOpen, route]);

  useEffect(() => {
    const handleRouting = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;

      const target = hash || path;

      if (target === '#provider' || target === '#dashboard' || target === '/provider') {
        setRoute(session ? (userRole === 'rider' ? 'rider-dashboard' : 'provider-dashboard') : 'provider-auth');
      } else if (target === '#subscribe' || target === '#my-plan' || target === '#account' || target === '/my-plan') {
        setRoute(session ? 'subscriber-dashboard' : 'subscriber-auth');
      } else if (target === '#today' || target === '/today') {
        setRoute(session ? 'today' : 'subscriber-auth');
      } else if (target === '#community' || target === '/community') {
        setRoute(session ? 'community' : 'subscriber-auth');
      } else if (target === '#rewards' || target === '/rewards') {
        setRoute(session ? 'rewards' : 'subscriber-auth');
      } else if (target === '#privacy' || target === '/privacy') {
        setRoute('privacy');
      } else if (target === '#terms' || target === '/terms') {
        setRoute('terms');
      } else {
        setRoute('home');
      }
    };
    handleRouting();
    window.addEventListener('hashchange', handleRouting);
    window.addEventListener('popstate', handleRouting);
    return () => {
      window.removeEventListener('hashchange', handleRouting);
      window.removeEventListener('popstate', handleRouting);
    };
  }, [session, userRole]);

  useEffect(() => {
    if (!session || !user || Capacitor.getPlatform() === 'web') return;
    const setupPush = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }
        if (permStatus.receive !== 'granted') return;
        await PushNotifications.register();
        PushNotifications.addListener('registration', async (token) => {
          await supabase
            .from('subscribers')
            .update({ push_token: token.value })
            .eq('user_id', user.id);
        });
      } catch (err) {
        console.warn('Push registration skipped or failed:', err);
      }
    };
    setupPush();
    return () => {
      try {
        PushNotifications.removeAllListeners();
      } catch (e) {}
    };
  }, [session, user]);

  const openBooking = useCallback((pkgId?: string) => {
    setPreselectedPackage(pkgId ?? null);
    setBookingOpen(true);
  }, []);

  const openSubscribe = useCallback((pkgId?: string) => {
    setPreselectedPackage(pkgId ?? null);
    setSubscribeOpen(true);
  }, []);

  useEffect(() => {
    if (!authLoading && session && route === 'home') {
      if (userRole === 'rider') setRoute('rider-dashboard');
      else setRoute('subscriber-dashboard');
    }
  }, [authLoading, session, userRole, route]);

  if (authLoading || onboardingComplete === null) {
    return <SecuringProtocol message="Securing Protocol" subtitle="Verifying authenticated access to the culinary rhythm ledger..." />;
  }

  // Onboarding ONLY for subscribers
  if (session && !onboardingComplete && userRole === 'subscriber') {
    return <OnboardingFlow onComplete={() => setOnboardingComplete(true)} />;
  }

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#123F38] border-t border-[#F5F3EB]/10 px-6 py-4 pb-8 flex justify-between items-center z-[60] shadow-2xl">
      <button
        onClick={() => { setRoute('today'); window.location.hash = 'today'; }}
        className={`flex flex-col items-center gap-1 transition-all ${route === 'today' ? 'text-[#C5A059] scale-105 font-bold' : 'text-[#F5F3EB]/50 hover:text-[#F5F3EB]'}`}
      >
        <Calendar className="w-5 h-5" />
        <span className="text-[9px] uppercase tracking-widest" style={{ fontFamily: "'Manrope', sans-serif" }}>{t('Today') || 'My Rhythm'}</span>
      </button>
      <button
        onClick={() => { setRoute('community'); window.location.hash = 'community'; }}
        className={`flex flex-col items-center gap-1 transition-all ${route === 'community' ? 'text-[#C5A059] scale-105 font-bold' : 'text-[#F5F3EB]/50 hover:text-[#F5F3EB]'}`}
      >
        <Users className="w-5 h-5" />
        <span className="text-[9px] uppercase tracking-widest" style={{ fontFamily: "'Manrope', sans-serif" }}>{t('Community') || 'Community'}</span>
      </button>
      <button
        onClick={() => { setRoute('rewards'); window.location.hash = 'rewards'; }}
        className={`flex flex-col items-center gap-1 transition-all ${route === 'rewards' ? 'text-[#C5A059] scale-105 font-bold' : 'text-[#F5F3EB]/50 hover:text-[#F5F3EB]'}`}
      >
        <Gift className="w-5 h-5" />
        <span className="text-[9px] uppercase tracking-widest" style={{ fontFamily: "'Manrope', sans-serif" }}>{t('Rewards') || 'Rewards'}</span>
      </button>
      <button
        onClick={() => { setRoute('subscriber-dashboard'); window.location.hash = 'account'; }}
        className={`flex flex-col items-center gap-1 transition-all ${route === 'subscriber-dashboard' ? 'text-[#C5A059] scale-105 font-bold' : 'text-[#F5F3EB]/50 hover:text-[#F5F3EB]'}`}
      >
        <UserIcon className="w-5 h-5" />
        <span className="text-[9px] uppercase tracking-widest" style={{ fontFamily: "'Manrope', sans-serif" }}>{t('Profile') || 'Profile'}</span>
      </button>
    </nav>
  );


  return (
    <>
      {/* Modals always accessible */}
      <BookingFlow open={bookingOpen} onClose={() => setBookingOpen(false)} preselectedPackage={preselectedPackage} />
      <SubscriptionFlow open={subscribeOpen} onClose={() => setSubscribeOpen(false)} preselectedPackage={preselectedPackage} />
      <SubscriberAuth isOpen={route === 'subscriber-auth'} onClose={() => { setRoute('home'); window.location.hash = ''; }} onSuccess={() => { setRoute('home'); window.location.hash = ''; }} />
      <ProviderAuth
        isOpen={route === 'provider-auth'}
        onClose={() => { setRoute('home'); window.location.hash = ''; }}
        onSuccess={(role) => {
          setRoute(role === 'rider' ? 'rider-dashboard' : 'provider-dashboard');
          window.location.hash = role === 'rider' ? '#rider' : '#dashboard';
        }}
      />

      {/* Primary Routes */}
      {route === 'home' && <Home onBookClick={openBooking} onSubscribeClick={openSubscribe} />}
      {route === 'subscriber-auth' && <Home onBookClick={openBooking} onSubscribeClick={openSubscribe} />}
      {route === 'provider-auth' && <Home onBookClick={openBooking} onSubscribeClick={openSubscribe} />}

      {route === 'provider-dashboard' && <ProviderDashboard onExit={() => setRoute('home')} />}
      {route === 'rider-dashboard' && <RiderDashboard onExit={() => setRoute('home')} />}

      {route === 'today' && (
        <div className="bg-[#F5F3EB] min-h-screen pb-24 pt-20">
          <Navbar onBookClick={openBooking} onSubscribeClick={openSubscribe} />
          <MyRhythm />
          <BottomNav />
        </div>
      )}

      {route === 'community' && (
        <div className="bg-[#F5F3EB] min-h-screen pb-24 pt-20">
          <Navbar onBookClick={openBooking} onSubscribeClick={openSubscribe} />
          <CommunityPage />
          <BottomNav />
        </div>
      )}

      {route === 'rewards' && (
        <div className="bg-[#F5F3EB] min-h-screen pb-24 pt-20">
          <Navbar onBookClick={openBooking} onSubscribeClick={openSubscribe} />
          <RewardsPage />
          <BottomNav />
        </div>
      )}

      {route === 'subscriber-dashboard' && (
        <div className="bg-[#F5F3EB] min-h-screen pb-24 pt-20">
          <Navbar onBookClick={openBooking} onSubscribeClick={openSubscribe} />
          <SubscriberDashboard />
          {session && <BottomNav />}
        </div>
      )}

      {route === 'privacy' && <LegalPage type="privacy" onBack={() => setRoute('home')} />}
      {route === 'terms' && <LegalPage type="terms" onBack={() => setRoute('home')} />}
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
