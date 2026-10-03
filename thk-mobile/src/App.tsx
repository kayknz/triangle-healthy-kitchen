import { lazy, Suspense, useState, useCallback, useEffect } from 'react';
import type { PluginListenerHandle } from '@capacitor/core';
import type { URLOpenListenerEvent } from '@capacitor/app';
import { Calendar, Users, Gift, User as UserIcon, ExternalLink } from 'lucide-react';
import Home from '@/pages/Home';
import Navbar from '@/components/Navbar';
import SecuringProtocol from '@/components/SecuringProtocol';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { SplashScreen } from '@capacitor/splash-screen';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/lib/supabase';
import { AuthProvider, useAuth } from '@/lib/auth';
import { LanguageProvider, useLanguage } from '@/lib/LanguageContext';

const BookingFlow = lazy(() => import('@/components/BookingFlow'));
const ProviderAuth = lazy(() => import('@/components/ProviderAuth'));
const RiderDashboard = lazy(() => import('@/components/RiderDashboard'));
const SubscriptionFlow = lazy(() => import('@/components/SubscriptionFlow'));
const SubscriberAuth = lazy(() => import('@/components/SubscriberAuth'));
const SubscriberDashboard = lazy(() => import('@/pages/SubscriberDashboard'));
const CommunityPage = lazy(() => import('@/pages/CommunityPage'));
const RewardsPage = lazy(() => import('@/pages/RewardsPage'));
const LegalPage = lazy(() => import('@/components/LegalPage'));
const OnboardingFlow = lazy(() => import('@/components/OnboardingFlow'));
const MyRhythm = lazy(() => import('@/components/MyRhythm'));

type Route = 'home' | 'provider-auth' | 'operations-web' | 'rider-dashboard' | 'subscriber-auth' | 'subscriber-dashboard' | 'today' | 'community' | 'rewards' | 'privacy' | 'terms';

const OPERATIONS_WEB_URL = import.meta.env.VITE_OPERATIONS_WEB_URL || 'https://trianglehealthykitchen.vercel.app';
const getSignedInRoute = (role: string | null | undefined, hasPersonal = false): Route =>
  role === 'driver' || role === 'rider' ? 'rider-dashboard'
    : ['ceo', 'admin', 'kitchen', 'transport', 'owner'].includes(role || '') ? 'operations-web'
      : hasPersonal ? 'subscriber-dashboard' : 'home';

function AppContent() {
  const { session, loading: authLoading, user, userRole, hasPersonal } = useAuth();
  const { t, isRtl } = useLanguage();
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
        setOnboardingComplete(false);
      }, 3000);

      try {
        const { data, error } = await supabase
          .from('subscribers')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setOnboardingComplete(data?.onboarding_completed ?? false);
      } catch (e) {
        console.error('Onboarding check failed:', e);
        setOnboardingComplete(false);
      } finally {
        clearTimeout(timeout);
      }
    };
    if (!authLoading) checkOnboarding();
  }, [user, authLoading, hasPersonal]);

  useEffect(() => {
    const initApp = async () => {
      if (!authLoading && onboardingComplete !== null) {
        try {
          await SplashScreen.hide();
        } catch {
          // The plugin may be unavailable during a web preview.
        }
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

    const handleDeepLink = (event: URLOpenListenerEvent) => {
      let url: URL;
      try {
        url = new URL(event.url);
      } catch (error) {
        console.warn('Ignoring invalid app link:', error);
        return;
      }
      const path = url.pathname + url.hash;
      if (path.includes('dashboard') || path.includes('provider')) {
        setRoute(getSignedInRoute(userRole));
      } else if (path.includes('my-plan') || path.includes('account')) {
        setRoute('subscriber-dashboard');
      } else if (path.includes('today')) {
        setRoute('today');
      }
    };

    if (!Capacitor.isNativePlatform()) return;

    let disposed = false;
    let deepLinkListener: PluginListenerHandle | undefined;
    let backListener: PluginListenerHandle | undefined;
    void import('@capacitor/app').then(async ({ App: NativeApp }) => {
      const urlHandle = await NativeApp.addListener('appUrlOpen', handleDeepLink);
      const backHandle = await NativeApp.addListener('backButton', handleBackButton);
      if (disposed) {
        await Promise.all([urlHandle.remove(), backHandle.remove()]);
        return;
      }
      deepLinkListener = urlHandle;
      backListener = backHandle;
    }).catch((error: unknown) => {
      console.warn('Native app listeners are unavailable:', error);
    });

    return () => {
      disposed = true;
      void deepLinkListener?.remove();
      void backListener?.remove();
    };
  }, [userRole, bookingOpen, subscribeOpen, route]);

  useEffect(() => {
    const handleRouting = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;

      const target = hash || path;

      if (target === '#provider' || target === '#dashboard' || target === '/provider') {
        setRoute(session ? getSignedInRoute(userRole, hasPersonal) : 'provider-auth');
      } else if (target === '#subscribe') {
        setRoute(session ? getSignedInRoute(userRole, hasPersonal) : 'subscriber-auth');
        if (session && (userRole === 'subscriber' || userRole === 'customer') && !hasPersonal) setSubscribeOpen(true);
      } else if (target === '#my-plan' || target === '#account' || target === '/my-plan') {
        setRoute(session ? getSignedInRoute(userRole, hasPersonal) : 'subscriber-auth');
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
  }, [session, userRole, hasPersonal]);

  useEffect(() => {
    if (!session || !user || Capacitor.getPlatform() === 'web') return;
    // Android's Capacitor push plugin calls FirebaseMessaging directly. When
    // this build has no google-services.json, registering throws on native
    // and can terminate the app; keep the feature opt-in until Firebase is set up.
    if (
      Capacitor.getPlatform() === 'android' &&
      import.meta.env.VITE_FIREBASE_ANDROID_CONFIGURED !== 'true'
    ) return;
    let disposed = false;
    let registrationListener: PluginListenerHandle | undefined;
    let registrationErrorListener: PluginListenerHandle | undefined;
    const setupPush = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }
        if (permStatus.receive !== 'granted') return;
        const tokenListener = await PushNotifications.addListener('registration', async (token) => {
          await supabase
            .from('subscribers')
            .update({ push_token: token.value })
            .eq('user_id', user.id);
        });
        const errorListener = await PushNotifications.addListener('registrationError', (error) => {
          console.error('Push registration failed:', error);
        });
        if (disposed) {
          await Promise.all([tokenListener.remove(), errorListener.remove()]);
          return;
        }
        registrationListener = tokenListener;
        registrationErrorListener = errorListener;
        await PushNotifications.register();
      } catch (err) {
        console.warn('Push registration skipped or failed:', err);
      }
    };
    setupPush();
    return () => {
      disposed = true;
      void registrationListener?.remove();
      void registrationErrorListener?.remove();
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

  // Precise Role Route Guard
  useEffect(() => {
    if (!authLoading && session && route === 'home' && hasPersonal) {
      if (userRole === 'driver' || userRole === 'rider') {
        setRoute('rider-dashboard');
      } else if (['ceo', 'admin', 'kitchen', 'transport', 'owner'].includes(userRole || '')) {
        setRoute('operations-web');
      } else {
        setRoute('subscriber-dashboard');
      }
    }
  }, [authLoading, session, userRole, route, hasPersonal]);

  if (authLoading || onboardingComplete === null) {
    return <SecuringProtocol message="Securing Protocol" subtitle="Verifying authenticated access to the culinary rhythm ledger..." />;
  }

  // Onboarding ONLY for subscribers
  if (session && hasPersonal && !onboardingComplete && (userRole === 'subscriber' || userRole === 'customer')) {
    return <Suspense fallback={<SecuringProtocol message="Loading your account" subtitle="Preparing your personalized setup..." />}><OnboardingFlow onComplete={() => setOnboardingComplete(true)} /></Suspense>;
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
        onClick={() => {
          if (['ceo', 'admin', 'kitchen', 'transport', 'owner'].includes(userRole || '')) {
            setRoute('operations-web');
            window.location.hash = 'dashboard';
          } else {
            setRoute('subscriber-dashboard');
            window.location.hash = 'account';
          }
        }}
        className={`flex flex-col items-center gap-1 transition-all ${route === 'subscriber-dashboard' || route === 'operations-web' ? 'text-[#C5A059] scale-105 font-bold' : 'text-[#F5F3EB]/50 hover:text-[#F5F3EB]'}`}
      >
        <UserIcon className="w-5 h-5" />
        <span className="text-[9px] uppercase tracking-widest" style={{ fontFamily: "'Manrope', sans-serif" }}>{t('Profile') || 'Profile'}</span>
      </button>
    </nav>
  );

  return (
    <Suspense fallback={<SecuringProtocol message="Loading Triangle" subtitle="Preparing your next step..." />}>
      {/* Modals always accessible */}
      {bookingOpen && <BookingFlow open={bookingOpen} onClose={() => setBookingOpen(false)} preselectedPackage={preselectedPackage} />}
      {subscribeOpen && <SubscriptionFlow open={subscribeOpen} onClose={() => setSubscribeOpen(false)} preselectedPackage={preselectedPackage} />}
      <SubscriberAuth
        isOpen={route === 'subscriber-auth'}
        onClose={() => { setRoute('home'); window.location.hash = ''; }}
        onSuccess={() => {
          setRoute(hasPersonal ? 'subscriber-dashboard' : 'home');
          window.location.hash = hasPersonal ? 'account' : '';
        }}
        onChoosePlan={() => { setPreselectedPackage(null); setSubscribeOpen(true); setRoute('home'); }}
      />
      <ProviderAuth
        isOpen={route === 'provider-auth'}
        onClose={() => { setRoute('home'); window.location.hash = ''; }}
        onSuccess={(role) => {
          setRoute(getSignedInRoute(role));
          window.location.hash = role === 'driver' || role === 'rider' ? '#rider' : '#dashboard';
        }}
      />

      {/* Primary Routes */}
      {route === 'home' && <Home onBookClick={openBooking} onSubscribeClick={openSubscribe} />}
      {route === 'subscriber-auth' && <Home onBookClick={openBooking} onSubscribeClick={openSubscribe} />}
      {route === 'provider-auth' && <Home onBookClick={openBooking} onSubscribeClick={openSubscribe} />}

      {route === 'operations-web' && (
        <main className="min-h-[70vh] bg-[#F5F3EB] px-6 py-16 flex items-center justify-center">
          <section className="w-full max-w-lg rounded-[2rem] border border-[#0a3030]/10 bg-white p-8 text-center shadow-xl">
            <ExternalLink className="mx-auto mb-5 h-9 w-9 text-[#C5A059]" />
            <h1 className="mb-3 text-xl font-black uppercase italic text-[#0a3030]">{isRtl ? 'تتم إدارة العمليات عبر موقع تراينغل' : 'Operations are managed on THK Web'}</h1>
            <p className="mb-7 text-sm leading-6 text-gray-500">{isRtl ? 'تتوفر أدوات الإدارة التنفيذية والإدارة والمطبخ والنقل عبر بوابة الويب. ويواصل السائقون استخدام هذا التطبيق.' : 'CEO, admin, kitchen, and transport tools are available in the web operations portal. Drivers continue using this app.'}</p>
            <button onClick={() => void Browser.open({ url: `${OPERATIONS_WEB_URL}/login` })} className="rounded-2xl bg-[#0a3030] px-7 py-4 text-xs font-black uppercase tracking-widest text-white">
              {isRtl ? 'فتح بوابة العمليات' : 'Open operations portal'}
            </button>
          </section>
        </main>
      )}
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
    </Suspense>
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
