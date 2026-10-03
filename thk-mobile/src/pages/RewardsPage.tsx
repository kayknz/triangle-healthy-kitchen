import React, { useState, useEffect } from 'react';
import { Zap, History, Star, ShieldCheck, ArrowUpRight, Loader2, Sparkles, ShoppingBag, CheckCircle2, Info, Clock, Calendar, ArrowRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/LanguageContext';
import EditorialPanel from '@/components/EditorialPanel';
import SecuringProtocol from '@/components/SecuringProtocol';

const TIERS = [
  {
    name: 'Reset',
    minPoints: 0,
    color: '#8AA694',
    description: 'The foundation of your wellness journey. Access to essential nutritional guides and community events.',
    philosophy: 'Stability through simplicity.'
  },
  {
    name: 'Balance',
    minPoints: 1000,
    color: '#C5A059',
    description: 'Harmony in rhythm. Unlocks Elite recipe archives and monthly wellness workshops.',
    philosophy: 'Sustainable growth through consistency.'
  },
  {
    name: 'Perform',
    minPoints: 2500,
    color: '#0a3030',
    description: 'The pinnacle of Triangle excellence. Exclusive access to private chef consultations and master performance coaching.',
    philosophy: 'Peak optimization of body and mind.'
  },
];

const RewardsPage: React.FC = () => {
  const { user } = useAuth();
  const { t, isRtl } = useLanguage();
  const [subscriber, setSubscriber] = useState<any>(null);
  const [dailyProgress, setDailyProgress] = useState({ steps: 0, goal: 10000 });
  const [rewards, setRewards] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTier, setActiveTier] = useState('Reset');
  const [redeeming, setRedeeming] = useState(false);
  const [successReward, setSuccessReward] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const { data: sub } = await supabase.from('subscribers').select('*').eq('user_id', user.id).maybeSingle();
        setSubscriber(sub);
      if (sub?.id) {
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Qatar', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
        const [{ data: activity }, { data: goal }] = await Promise.all([
          supabase.from('daily_activity_summaries').select('total_value').eq('subscriber_id', sub.id).eq('local_date', today).maybeSingle(),
          supabase.from('user_daily_goals').select('target_value').eq('subscriber_id', sub.id).eq('target_date', today).maybeSingle(),
        ]);
        setDailyProgress({ steps: activity?.total_value || 0, goal: goal?.target_value || 10000 });
      }

        if (sub) {
          const currentPoints = sub.points_balance || 0;
          const userTier = TIERS.slice().reverse().find(t => currentPoints >= t.minPoints) || TIERS[0];
          setActiveTier(userTier.name);
        }

        const [{ data: rewardsList }, { data: ledgerData }] = await Promise.all([
          supabase.from('rewards').select('*').order('point_cost', { ascending: true }),
          supabase.from('points_ledger').select('*').eq('subscriber_id', sub?.id).order('created_at', { ascending: false }).limit(20)
        ]);

        setRewards(rewardsList || []);
        setLedger(ledgerData || []);
      } catch (e) {
        console.error('Rewards fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const redeemReward = async (reward: any) => {
    if (!subscriber || subscriber.points_balance < reward.points_cost) return;

    setRedeeming(true);
    try {
      const { error: redemptionError } = await supabase.rpc('redeem_reward', { p_reward_id: reward.id });
      if (redemptionError) throw redemptionError;

      setSubscriber((prev: any) => prev ? ({
        ...prev,
        points_balance: (prev?.points_balance ?? 0) - reward.points_cost
      }) : prev);

      setSuccessReward(reward);

      const { data: newLedger } = await supabase
        .from('points_ledger')
        .select('*')
        .eq('subscriber_id', subscriber.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setLedger(newLedger || []);

    } catch (e) {
      console.error('Redemption error:', e);
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <SecuringProtocol
        message={isRtl ? 'جارٍ تأمين الحساب' : 'Securing Protocol'}
        subtitle={isRtl ? 'جارٍ التحقق من سجل المكافآت.' : 'Verifying authenticated reward ledger status...'}
      />
    );
  }

  const currentPoints = subscriber?.points_balance || 0;
  const currentTier = TIERS.slice().reverse().find(t => currentPoints >= t.minPoints) || TIERS[0];
  const nextTier = TIERS.find(t => t.minPoints > currentPoints);
  const progressToNext = nextTier ? ((currentPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100 : 100;

  const cycleEndDate = new Date();
  cycleEndDate.setDate(cycleEndDate.getDate() + 24);
  const daysRemaining = 24;
  const tierName = (name: string) => isRtl ? ({ Reset: 'البداية', Balance: 'التوازن', Perform: 'الأداء', Elite: 'النخبة' } as Record<string, string>)[name] || name : name;
  const tierPhilosophy = (name: string) => isRtl ? ({ Reset: 'الثبات يبدأ بالبساطة.', Balance: 'النمو المستدام يأتي مع الاستمرارية.', Perform: 'تحقيق أفضل توازن للجسم والعقل.' } as Record<string, string>)[name] || '' : currentTier.philosophy;

  return (
    <div className={`flex min-w-0 flex-col gap-10 pb-20 animate-reveal bg-[#F5F3EB] min-h-screen sm:gap-16 sm:pb-32 ${isRtl ? 'text-right' : 'text-left'}`}>
      {redeeming && (
        <SecuringProtocol
          message={isRtl ? 'جارٍ تأمين استبدال المكافأة' : 'Securing Asset Redemption'}
          subtitle={isRtl ? 'جارٍ التحقق من عملية المكافأة في سجل المنصة…' : 'Authenticating digital asset transaction on the platform ledger...'}
        />
      )}
      {/* Header & Balance */}
      <div className="flex min-w-0 flex-col justify-between gap-8 px-4 pt-8 sm:gap-12 sm:px-6 sm:pt-12 md:flex-row md:items-end md:px-12 md:pt-16">
        <div className="max-w-2xl">
           <div className="mb-6 flex flex-wrap items-center gap-2 sm:mb-8 sm:gap-3">
              <div className="badge border-[#C5A059]/30 bg-[#C5A059]/5 text-[#C5A059] px-4 py-2">
                <Sparkles className="w-3.5 h-3.5 fill-[#C5A059]" />
                <span className="text-[11px] font-black uppercase tracking-[0.25em] ml-2">{t('loyalty_protocol') || 'Loyalty Protocol'}</span>
              </div>
              <div className="badge border-[#0a3030]/10 bg-[#0a3030]/5 text-[#0a3030]/60 px-4 py-2">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] ml-2">{isRtl ? `متبقي ${daysRemaining} يوماً من الدورة` : `Cycle: ${daysRemaining}D Remaining`}</span>
              </div>
           </div>
           <h1 className="mb-4 text-5xl leading-[0.95] tracking-tighter text-[#0a3030] italic sm:mb-6 sm:text-6xl md:text-8xl" style={{ fontFamily: "'DM Serif Display', serif" }}>
             {isRtl ? 'المكافآت' : 'Rewards.'}
           </h1>
           <p className="text-[#0a3030]/60 text-lg font-medium italic leading-relaxed max-w-lg">
             {isRtl ? 'حوّل التزامك بالتغذية الصحية إلى مكافآت. تابع تقدمك واستبدل نقاطك.' : 'Your commitment to nutritional excellence translates into tangible luxury. Track your progress, redeem your status.'}
           </p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex w-full min-w-0 items-center gap-4 rounded-3xl border border-[#0a3030]/5 bg-white p-5 shadow-xl shadow-[#0a3030]/5 sm:w-auto sm:gap-8 sm:rounded-[2.5rem] sm:p-8">
             <div className="flex-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0a3030]/40 block mb-1">{isRtl ? 'رصيد الشهر' : 'Monthly Balance'}</span>
                <span className="text-5xl font-serif text-[#C5A059] leading-none block" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {currentPoints.toLocaleString()}
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#0a3030]/20 mt-2 block italic">{isRtl ? 'نقاط مؤكدة' : 'Verified Assets'}</span>
             </div>
             <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0a3030] shadow-xl sm:h-20 sm:w-20 sm:rounded-[2rem] rotate-3 group-hover:rotate-0 transition-transform">
                <Zap className="w-8 h-8 text-[#C5A059] fill-[#C5A059] animate-pulse" />
             </div>
          </div>
        </div>
      </div>

        <section className="grid gap-4 px-4 sm:grid-cols-2 sm:px-0" aria-label="Activity goals">
          <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><Activity className="h-5 w-5 text-gold"/><h2 className="font-bold text-primary">{isRtl ? 'هدف نشاط اليوم' : 'Today’s activity goal'}</h2></div><p className="mt-4 text-3xl font-black text-primary">{dailyProgress.steps.toLocaleString()} <span className="text-sm font-semibold text-primary/50">/ {dailyProgress.goal.toLocaleString()} {isRtl ? 'خطوة' : 'steps'}</span></p><div className="mt-3 h-2 overflow-hidden rounded-full bg-primary/10"><div className="h-full rounded-full bg-gold" style={{ width: `${Math.min((dailyProgress.steps / dailyProgress.goal) * 100, 100)}%` }}/></div></div>
          <div className="rounded-3xl border border-primary/10 bg-primary p-6 text-white shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-gold">{isRtl ? 'رصيد مكافآتك' : 'Your reward balance'}</p><p className="mt-3 text-3xl font-black">{(subscriber?.points_balance || 0).toLocaleString()} {isRtl ? 'نقطة' : 'points'}</p><p className="mt-2 text-sm text-white/65">{isRtl ? 'تجد أهداف نشاطك وإنجازاتك ومكافآتك هنا.' : 'Your activity goals, milestones, and rewards are together here.'}</p></div>
        </section>

      {/* Tier Status Hero */}
      <div className="px-6 md:px-12">
        <div className="group relative overflow-hidden rounded-3xl bg-[#0a3030] p-5 text-white shadow-3xl sm:rounded-[3rem] sm:p-8 md:rounded-[4rem] md:p-20">
          <div className="relative z-10 grid grid-cols-1 items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
             <div>
                <div className="flex items-center gap-3 mb-8">
                   <ShieldCheck className="w-5 h-5 text-[#C5A059]" />
                   <span className="text-[11px] font-black uppercase tracking-[0.5em] text-[#C5A059]">{isRtl ? 'مستوى المكافآت الحالي' : 'Active Tier Protocol'}</span>
                </div>
                <h2 className="mb-6 text-4xl italic sm:mb-8 sm:text-5xl md:text-7xl" style={{ fontFamily: "'DM Serif Display', serif" }}>{tierName(currentTier.name)}</h2>

                <div className="space-y-8">
                   <div className="flex flex-wrap justify-between gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-[#C5A059] sm:text-[11px] sm:tracking-[0.3em]">
                     <span>{nextTier ? (isRtl ? `الخطوة التالية: ${tierName(nextTier.name)}` : `Path to ${nextTier.name}`) : (isRtl ? 'وصلت إلى أعلى مستوى' : 'Apex Achieved')}</span>
                     <span>{currentPoints.toLocaleString()} / {nextTier ? nextTier.minPoints.toLocaleString() : 'MAX'} {isRtl ? 'نقطة' : 'PTS'}</span>
                   </div>
                   <div className="w-full bg-white/5 h-6 rounded-full overflow-hidden p-1.5 border border-white/10">
                     <motion.div
                       initial={{ width: 0 }}
                       animate={{ width: `${Math.min(progressToNext, 100)}%` }}
                       className="bg-gradient-to-r from-[#C5A059] via-[#E5C079] to-[#C5A059] h-full rounded-full shadow-[0_0_25px_rgba(197,160,89,0.5)]"
                     />
                   </div>
                   <div className="flex items-center gap-4 text-white/40">
                      <div className="w-2 h-2 rounded-full bg-[#C5A059] animate-ping" />
                      <p className="text-xs italic font-medium">
                        {nextTier ? (isRtl ? `اجمع ${(nextTier.minPoints - currentPoints).toLocaleString()} نقطة لفتح مستوى المكافآت التالي.` : `${(nextTier.minPoints - currentPoints).toLocaleString()} points to unlock your next reward tier.`) : (isRtl ? 'وصلت إلى مستوى الأداء وفتحت جميع المزايا.' : 'You have reached the Perform tier. Maximum benefits unlocked.')}
                      </p>
                   </div>
                </div>
             </div>

             <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:space-y-8 sm:rounded-[3rem] sm:p-10">
                <div>
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A059] mb-4">{isRtl ? 'كيف تعمل المستويات' : 'Tier Philosophy'}</h3>
                   <p className="text-xl italic text-white/90 sm:text-2xl" style={{ fontFamily: "'DM Serif Display', serif" }}>"{tierPhilosophy(currentTier.name)}"</p>
                </div>
                <div className="pt-8 border-t border-white/5">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-4 flex items-center gap-2">
                      <Info className="w-3 h-3" /> {isRtl ? 'آلية عادلة للمكافآت' : 'Fair Reward Logic'}
                   </h4>
                   <p className="text-xs text-white/60 leading-relaxed italic">
                      {isRtl ? 'يُحتسب المستوى في كل دورة من ٢٨ يوماً. ويعكس مستواك التزامك المستمر، لتُكتسب المكافآت من عادات صحية حقيقية.' : 'Tiers are calculated dynamically every 28-day cycle. Your status reflects your consistent engagement with the Triangle Rhythm, ensuring rewards are earned through genuine nourishment, not just consumption.'}
                   </p>
                </div>
             </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#C5A059]/10 rounded-full blur-[120px] group-hover:bg-[#C5A059]/20 transition-colors duration-1000" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[80px]" />
        </div>
      </div>

      {/* Reward Catalog */}
      <div className="space-y-8 px-4 sm:space-y-12 sm:px-6 md:px-12">
        <div className="flex flex-col justify-between gap-6 border-b border-[#0a3030]/10 pb-6 sm:gap-8 sm:pb-10 md:flex-row md:items-end">
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#0a3030]/40 mb-3 italic">{isRtl ? 'مكافآت مختارة' : 'Curated Excellence'}</h3>
            <h2 className="text-4xl italic text-[#0a3030] sm:text-5xl" style={{ fontFamily: "'DM Serif Display', serif" }}>{isRtl ? 'كتالوج المكافآت' : 'Redemption Catalog.'}</h2>
          </div>
          <div className="flex flex-wrap gap-1 rounded-2xl border border-[#0a3030]/5 bg-white/80 p-1.5 shadow-xl backdrop-blur-xl sm:gap-4 sm:rounded-[2rem] sm:p-2">
            {TIERS.map(tier => (
              <button
                key={tier.name}
                onClick={() => setActiveTier(tier.name)}
                className={`rounded-xl px-3 py-2.5 text-[9px] font-black uppercase tracking-wide transition-all duration-500 sm:rounded-[1.5rem] sm:px-8 sm:py-4 sm:text-[10px] sm:tracking-widest ${
                  activeTier === tier.name
                    ? 'bg-[#0a3030] text-white shadow-2xl scale-105'
                    : 'text-[#0a3030]/40 hover:text-[#0a3030] hover:bg-[#0a3030]/5'
                }`}
              >
                {tierName(tier.name)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-10">
          {rewards.filter(r => r.tier === activeTier || (!r.tier && activeTier === 'Reset')).map((item) => {
            const isLocked = currentTier.minPoints < (TIERS.find(t => t.name === item.tier)?.minPoints || 0);
            const canAfford = currentPoints >= item.points_cost;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group overflow-hidden rounded-3xl border border-[#0a3030]/5 bg-white shadow-sm transition-all duration-700 hover:shadow-4xl sm:rounded-[3.5rem]"
              >
                <div className="h-72 overflow-hidden relative">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute left-4 top-4 rounded-xl border border-white/20 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-md sm:left-8 sm:top-8 sm:rounded-[1.5rem] sm:px-6 sm:py-3">
                    <span className="text-[11px] font-black text-[#0a3030] uppercase tracking-[0.2em]">{item.points_cost.toLocaleString()} <span className="text-[#C5A059]">{isRtl ? 'نقطة' : 'PTS'}</span></span>
                  </div>
                  {isLocked && (
                    <div className="absolute inset-0 bg-[#0a3030]/60 backdrop-blur-sm flex items-center justify-center">
                       <div className="bg-white/10 border border-white/20 px-6 py-3 rounded-full backdrop-blur-xl">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">{isRtl ? `تُفتح عند مستوى ${tierName(item.tier)}` : `Unlock at ${item.tier} Tier`}</span>
                       </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a3030]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>
                <div className="p-5 sm:p-8 lg:p-10">
                  <div className="mb-6 sm:mb-10">
                    <div className="flex justify-between items-start mb-4">
                       <h4 className="min-w-0 break-words font-serif text-2xl text-[#0a3030] italic leading-tight sm:text-3xl" style={{ fontFamily: "'DM Serif Display', serif" }}>{isRtl ? (item.name_ar || item.name) : item.name}</h4>
                       <Star className={`w-5 h-5 ${isLocked ? 'text-[#0a3030]/10' : 'text-[#C5A059] fill-[#C5A059]'}`} />
                    </div>
                    <p className="text-[11px] font-black text-[#C5A059] uppercase tracking-[0.3em] mb-4">{isRtl ? `مستوى ${tierName(item.tier || 'Elite')}` : `${item.tier || 'Elite'} Protocol`}</p>
                    <p className="text-sm text-[#0a3030]/50 italic leading-relaxed line-clamp-3">{isRtl ? (item.description_ar || item.description || 'استفد من المزايا المختارة لرحلتك الصحية.') : (item.description || 'Access Elite benefits curated for your wellness journey.')}</p>
                  </div>
                  <button
                    disabled={isLocked || !canAfford || redeeming}
                    onClick={() => redeemReward(item)}
                    className={`flex w-full items-center justify-center gap-2 rounded-2xl border-2 py-4 text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-500 sm:gap-3 sm:rounded-[2rem] sm:py-6 sm:text-[11px] sm:tracking-[0.4em] ${
                      !isLocked && canAfford
                        ? 'border-[#0a3030] text-[#0a3030] hover:bg-[#0a3030] hover:text-white shadow-2xl hover:shadow-[#0a3030]/20'
                        : 'border-[#0a3030]/5 text-[#0a3030]/20 cursor-not-allowed bg-[#0a3030]/[0.02]'
                    }`}
                  >
                    {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                    {isLocked ? (isRtl ? 'مقفلة' : 'Locked') : canAfford ? (isRtl ? 'استبدال المكافأة' : 'Redeem Asset') : (isRtl ? 'النقاط غير كافية' : 'Insufficient Points')}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Points Ledger */}
      <div className="space-y-8 px-4 sm:space-y-12 sm:px-6 md:px-12">
        <div className="flex justify-between items-end border-b border-[#0a3030]/10 pb-10">
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#0a3030]/40 mb-3 italic">{isRtl ? 'سجل النقاط' : 'Immutable History'}</h3>
            <h2 className="text-4xl italic text-[#0a3030] sm:text-5xl" style={{ fontFamily: "'DM Serif Display', serif" }}>{isRtl ? 'سجل المكافآت' : 'Asset Ledger.'}</h2>
          </div>
          <div className="w-16 h-16 bg-[#0a3030]/5 rounded-[1.5rem] flex items-center justify-center text-[#0a3030]/20">
             <History className="w-8 h-8" />
          </div>
        </div>

        <div className="divide-y divide-[#0a3030]/5 overflow-hidden rounded-3xl border border-[#0a3030]/5 bg-white shadow-xl shadow-[#0a3030]/5 sm:rounded-[3rem] md:rounded-[4rem]">
          {ledger.length > 0 ? ledger.map((entry) => (
            <div key={entry.id} className="group flex items-center justify-between gap-3 p-4 transition-all duration-500 hover:bg-[#FDFCF7] sm:gap-6 sm:p-8 md:p-10">
              <div className="flex min-w-0 items-center gap-3 sm:gap-6 md:gap-8">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all duration-500 sm:h-16 sm:w-16 sm:rounded-[1.5rem] ${
                  entry.points_delta > 0
                    ? 'bg-[#0a3030] text-[#C5A059] group-hover:scale-110'
                    : 'bg-[#C5A059] text-[#0a3030] group-hover:scale-110'
                }`}>
                   {entry.points_delta > 0 ? <ArrowUpRight className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
                </div>
                <div className="min-w-0">
                  <p className="mb-1 break-words text-sm font-black uppercase tracking-tighter text-[#0a3030] sm:text-base">{entry.event_type.replace(/_/g, ' ')}</p>
                  <div className="flex items-center gap-3">
                     <Calendar className="w-3 h-3 text-[#0a3030]/20" />
                     <p className="text-[10px] text-[#0a3030]/40 uppercase tracking-[0.2em] font-bold">
                       {new Date(entry.created_at).toLocaleDateString(isRtl ? 'ar-QA' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                     </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                 <div className={`font-serif text-2xl italic sm:text-4xl ${entry.points_delta > 0 ? 'text-[#0a3030]' : 'text-[#C5A059]'}`} style={{ fontFamily: "'DM Serif Display', serif" }}>
                   {entry.points_delta > 0 ? '+' : ''}{entry.points_delta.toLocaleString()}
                 </div>
                 <span className="text-[9px] font-black uppercase tracking-widest text-[#0a3030]/20">{isRtl ? 'نقاط المكافآت' : 'Protocol Points'}</span>
              </div>
            </div>
          )) : (
            <div className="py-32 text-center">
               <History className="w-12 h-12 text-[#0a3030]/5 mx-auto mb-6" />
               <p className="italic text-[#0a3030]/30 font-black uppercase tracking-[0.4em] text-[11px]">
                  {isRtl ? 'لا توجد حركة نقاط حتى الآن.' : 'No ledger activity detected.'}
               </p>
            </div>
          )}
          <div className="group relative cursor-pointer overflow-hidden bg-[#0a3030] p-5 text-center sm:p-8 md:p-10">
            <button className="text-[11px] font-black text-white uppercase tracking-[0.5em] flex items-center justify-center gap-4 w-full relative z-10">
              {isRtl ? 'تحديث السجل بالكامل' : 'Synchronize Full History'} <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </button>
            <div className="absolute inset-0 bg-[#C5A059] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <EditorialPanel
        isOpen={!!successReward}
        onClose={() => setSuccessReward(null)}
        title={isRtl ? 'تم تأكيد استبدال المكافأة' : 'Redemption Confirmed'}
        badge={isRtl ? 'تم تأمين المكافأة' : 'Asset Secured'}
      >
        <div className="space-y-7 p-5 text-center sm:space-y-10 sm:p-10 md:p-12">
           <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 bg-[#C5A059]/20 rounded-full animate-ping" />
              <div className="relative bg-[#0a3030] w-full h-full rounded-full flex items-center justify-center shadow-2xl">
                 <CheckCircle2 className="w-16 h-16 text-[#C5A059]" />
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="text-4xl font-serif italic text-[#0a3030]" style={{ fontFamily: "'DM Serif Display', serif" }}>
                {isRtl ? (successReward?.name_ar || successReward?.name) : successReward?.name}
              </h3>
              <p className="text-[#0a3030]/60 italic max-w-sm mx-auto">
                {isRtl ? 'تم تنفيذ استبدال مكافأتك وإضافتها إلى ملفك.' : 'Your reward has been successfully processed and added to your profile assets.'}
              </p>
           </div>

           <div className="bg-[#FDFCF7] border border-[#0a3030]/5 rounded-[2rem] p-8 flex justify-between items-center max-w-sm mx-auto">
              <div className="text-left">
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#0a3030]/40 block mb-1">{isRtl ? 'قيمة المكافأة' : 'Asset Value'}</span>
                 <span className="text-2xl font-serif text-[#C5A059] italic" style={{ fontFamily: "'DM Serif Display', serif" }}>{successReward?.points_cost.toLocaleString()} {isRtl ? 'نقطة' : 'PTS'}</span>
              </div>
              <div className="h-10 w-[1px] bg-[#0a3030]/10" />
              <div className="text-right">
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#0a3030]/40 block mb-1">{isRtl ? 'الحالة' : 'Status'}</span>
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">{isRtl ? 'تم التأكيد' : 'Verified'}</span>
              </div>
           </div>

           <button
             onClick={() => setSuccessReward(null)}
             className="w-full bg-[#0a3030] text-white py-6 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-[#0a3030]/90 transition-all"
           >
             {isRtl ? 'متابعة الرحلة' : 'Continue Journey'}
           </button>
        </div>
      </EditorialPanel>
    </div>
  );
};

export default RewardsPage;
