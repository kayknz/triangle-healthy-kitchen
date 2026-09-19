import React, { useState, useEffect } from 'react';
import { Award, Gift, Zap, History, ChevronRight, Star, ShieldCheck, ArrowUpRight, Loader2, Sparkles, ShoppingBag, CheckCircle2, Info, Clock, Calendar, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
        const { data: sub } = await supabase.from('subscribers').select('id, user_id, email, full_name, phone, package_id, package_name, status, building_number, street, area, zone_number, maid_number, latitude, longitude, delivery_notes, breakfast_window, lunch_window, dinner_window, subscription_start, current_period_end, is_owner, is_paused, paused_until, allergies, dislikes, activity_level, referral_code, weight_kg, height_cm, fitness_goal, points, referral_count, taste_profile, preferred_region_id, membership_type, reward_tier, points_balance, current_streak, longest_streak, onboarding_completed, gender').eq('user_id', user.id).maybeSingle();
        setSubscriber(sub);

        if (sub) {
          const currentPoints = sub.points_balance || 0;
          const userTier = TIERS.slice().reverse().find(t => currentPoints >= t.minPoints) || TIERS[0];
          setActiveTier(userTier.name);
        }

        const [{ data: rewardsList }, { data: ledgerData }] = await Promise.all([
          supabase.from('rewards').select('*').order('points_cost', { ascending: true }),
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
      const { error: ledgerError } = await supabase.from('points_ledger').insert({
        subscriber_id: subscriber.id,
        amount: reward.points_cost,
        type: 'spend',
        description: `Redeemed: ${reward.name}`
      });

      if (ledgerError) throw ledgerError;

      const { error: subError } = await supabase
        .from('subscribers')
        .update({ points_balance: subscriber.points_balance - reward.points_cost })
        .eq('id', subscriber.id);

      if (subError) throw subError;

      setSubscriber(prev => ({
        ...prev,
        points_balance: prev.points_balance - reward.points_cost
      }));

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
        message="Securing Protocol"
        subtitle="Verifying authenticated reward ledger status..."
      />
    );
  }

  const currentPoints = subscriber?.points_balance || 0;
  const currentTier = TIERS.slice().reverse().find(t => currentPoints >= t.minPoints) || TIERS[0];
  const nextTier = TIERS.find(t => t.minPoints > currentPoints);
  const progressToNext = nextTier ? ((currentPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100 : 100;

  const cycleEndDate = new Date();
  cycleEndDate.setDate(cycleEndDate.getDate() + 28);
  const daysRemaining = 28; // Mocked for UI

  return (
    <div className={`flex flex-col gap-16 pb-32 animate-reveal bg-[#F5F3EB] min-h-screen ${isRtl ? 'text-right' : 'text-left'}`}>
      {redeeming && (
        <SecuringProtocol
          message="Securing Asset Redemption"
          subtitle="Authenticating digital asset transaction on the platform ledger..."
        />
      )}
      {/* Header & Balance */}
      <div className="px-6 pt-16 md:px-12 flex flex-col md:flex-row md:items-end justify-between gap-12">
        <div className="max-w-2xl">
           <div className="flex items-center gap-3 mb-8">
              <div className="badge border-[#C5A059]/30 bg-[#C5A059]/5 text-[#C5A059] px-4 py-2">
                <Sparkles className="w-3.5 h-3.5 fill-[#C5A059]" />
                <span className="text-[11px] font-black uppercase tracking-[0.25em] ml-2">{t('loyalty_protocol') || 'Loyalty Protocol'}</span>
              </div>
              <div className="badge border-[#0a3030]/10 bg-[#0a3030]/5 text-[#0a3030]/60 px-4 py-2">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] ml-2">Cycle: 28D Remaining</span>
              </div>
           </div>
           <h1 className="text-6xl md:text-8xl font-serif text-[#0a3030] leading-[0.9] tracking-tighter italic mb-6" style={{ fontFamily: "'DM Serif Display', serif" }}>
             Rewards.
           </h1>
           <p className="text-[#0a3030]/60 text-lg font-medium italic leading-relaxed max-w-lg">
             Your commitment to nutritional excellence translates into tangible luxury. Track your progress, redeem your status.
           </p>
        </div>
        <div className="flex flex-col items-end">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-[#0a3030]/5 border border-[#0a3030]/5 flex items-center gap-8 min-w-[300px]">
             <div className="flex-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0a3030]/40 block mb-1">Monthly Balance</span>
                <span className="text-5xl font-serif text-[#C5A059] leading-none block" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {currentPoints.toLocaleString()}
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#0a3030]/20 mt-2 block italic">Verified Assets</span>
             </div>
             <div className="w-20 h-20 bg-[#0a3030] rounded-[2rem] flex items-center justify-center shadow-xl rotate-3 group-hover:rotate-0 transition-transform">
                <Zap className="w-8 h-8 text-[#C5A059] fill-[#C5A059] animate-pulse" />
             </div>
          </div>
        </div>
      </div>

      {/* Tier Status Hero */}
      <div className="px-6 md:px-12">
        <div className="bg-[#0a3030] rounded-[4rem] p-12 md:p-20 text-white shadow-3xl relative overflow-hidden group">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
             <div>
                <div className="flex items-center gap-3 mb-8">
                   <ShieldCheck className="w-5 h-5 text-[#C5A059]" />
                   <span className="text-[11px] font-black uppercase tracking-[0.5em] text-[#C5A059]">Active Tier Protocol</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-serif italic mb-8" style={{ fontFamily: "'DM Serif Display', serif" }}>{currentTier.name}</h2>

                <div className="space-y-8">
                   <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.3em] text-[#C5A059]">
                     <span>{nextTier ? `Path to ${nextTier.name}` : 'Apex Achieved'}</span>
                     <span>{currentPoints.toLocaleString()} / {nextTier ? nextTier.minPoints.toLocaleString() : 'MAX'} PTS</span>
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
                        {nextTier ? `${(nextTier.minPoints - currentPoints).toLocaleString()} points to unlock your next reward tier.` : "You have reached the Perform tier. Maximum benefits unlocked."}
                      </p>
                   </div>
                </div>
             </div>

             <div className="bg-white/5 backdrop-blur-xl rounded-[3rem] p-10 border border-white/10 space-y-8">
                <div>
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A059] mb-4">Tier Philosophy</h3>
                   <p className="text-2xl font-serif italic text-white/90" style={{ fontFamily: "'DM Serif Display', serif" }}>"{currentTier.philosophy}"</p>
                </div>
                <div className="pt-8 border-t border-white/5">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-4 flex items-center gap-2">
                      <Info className="w-3 h-3" /> Fair Reward Logic
                   </h4>
                   <p className="text-xs text-white/60 leading-relaxed italic">
                      Tiers are calculated dynamically every 28-day cycle. Your status reflects your consistent engagement with the Triangle Rhythm, ensuring rewards are earned through genuine nourishment, not just consumption.
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
      <div className="px-6 md:px-12 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#0a3030]/10 pb-10">
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#0a3030]/40 mb-3 italic">Curated Excellence</h3>
            <h2 className="text-5xl font-serif text-[#0a3030] italic" style={{ fontFamily: "'DM Serif Display', serif" }}>Redemption Catalog.</h2>
          </div>
          <div className="flex gap-4 bg-white/80 backdrop-blur-xl p-2 rounded-[2rem] border border-[#0a3030]/5 shadow-xl">
            {TIERS.map(tier => (
              <button
                key={tier.name}
                onClick={() => setActiveTier(tier.name)}
                className={`text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-[1.5rem] transition-all duration-500 ${
                  activeTier === tier.name
                    ? 'bg-[#0a3030] text-white shadow-2xl scale-105'
                    : 'text-[#0a3030]/40 hover:text-[#0a3030] hover:bg-[#0a3030]/5'
                }`}
              >
                {tier.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {rewards.filter(r => r.tier === activeTier || (!r.tier && activeTier === 'Reset')).map((item) => {
            const isLocked = currentTier.minPoints < (TIERS.find(t => t.name === item.tier)?.minPoints || 0);
            const canAfford = currentPoints >= item.points_cost;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-white rounded-[3.5rem] border border-[#0a3030]/5 overflow-hidden shadow-sm hover:shadow-4xl transition-all duration-700"
              >
                <div className="h-72 overflow-hidden relative">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute top-8 left-8 bg-white/95 backdrop-blur-md px-6 py-3 rounded-[1.5rem] shadow-2xl border border-white/20">
                    <span className="text-[11px] font-black text-[#0a3030] uppercase tracking-[0.2em]">{item.points_cost.toLocaleString()} <span className="text-[#C5A059]">PTS</span></span>
                  </div>
                  {isLocked && (
                    <div className="absolute inset-0 bg-[#0a3030]/60 backdrop-blur-sm flex items-center justify-center">
                       <div className="bg-white/10 border border-white/20 px-6 py-3 rounded-full backdrop-blur-xl">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Unlock at {item.tier} Tier</span>
                       </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a3030]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>
                <div className="p-10">
                  <div className="mb-10">
                    <div className="flex justify-between items-start mb-4">
                       <h4 className="font-serif text-3xl text-[#0a3030] italic leading-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>{item.name}</h4>
                       <Star className={`w-5 h-5 ${isLocked ? 'text-[#0a3030]/10' : 'text-[#C5A059] fill-[#C5A059]'}`} />
                    </div>
                    <p className="text-[11px] font-black text-[#C5A059] uppercase tracking-[0.3em] mb-4">{item.tier || 'Elite'} Protocol</p>
                    <p className="text-sm text-[#0a3030]/50 italic leading-relaxed line-clamp-3">{item.description || 'Access Elite benefits curated for your wellness journey.'}</p>
                  </div>
                  <button
                    disabled={isLocked || !canAfford || redeeming}
                    onClick={() => redeemReward(item)}
                    className={`w-full py-6 rounded-[2rem] border-2 transition-all duration-500 font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 ${
                      !isLocked && canAfford
                        ? 'border-[#0a3030] text-[#0a3030] hover:bg-[#0a3030] hover:text-white shadow-2xl hover:shadow-[#0a3030]/20'
                        : 'border-[#0a3030]/5 text-[#0a3030]/20 cursor-not-allowed bg-[#0a3030]/[0.02]'
                    }`}
                  >
                    {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                    {isLocked ? 'Locked' : canAfford ? 'Redeem Asset' : 'Insufficient Points'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Points Ledger */}
      <div className="px-6 md:px-12 space-y-12">
        <div className="flex justify-between items-end border-b border-[#0a3030]/10 pb-10">
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#0a3030]/40 mb-3 italic">Immutable History</h3>
            <h2 className="text-5xl font-serif text-[#0a3030] italic" style={{ fontFamily: "'DM Serif Display', serif" }}>Asset Ledger.</h2>
          </div>
          <div className="w-16 h-16 bg-[#0a3030]/5 rounded-[1.5rem] flex items-center justify-center text-[#0a3030]/20">
             <History className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-white rounded-[4rem] border border-[#0a3030]/5 divide-y divide-[#0a3030]/5 overflow-hidden shadow-2xl shadow-[#0a3030]/5">
          {ledger.length > 0 ? ledger.map((entry) => (
            <div key={entry.id} className="p-10 flex justify-between items-center group hover:bg-[#FDFCF7] transition-all duration-500">
              <div className="flex items-center gap-8">
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-sm ${
                  entry.type === 'earn'
                    ? 'bg-[#0a3030] text-[#C5A059] group-hover:scale-110'
                    : 'bg-[#C5A059] text-[#0a3030] group-hover:scale-110'
                }`}>
                   {entry.type === 'earn' ? <ArrowUpRight className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-base font-black text-[#0a3030] uppercase tracking-tighter mb-1">{entry.description}</p>
                  <div className="flex items-center gap-3">
                     <Calendar className="w-3 h-3 text-[#0a3030]/20" />
                     <p className="text-[10px] text-[#0a3030]/40 uppercase tracking-[0.2em] font-bold">
                       {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                     </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                 <div className={`font-serif text-4xl italic ${entry.type === 'earn' ? 'text-[#0a3030]' : 'text-[#C5A059]'}`} style={{ fontFamily: "'DM Serif Display', serif" }}>
                   {entry.type === 'earn' ? '+' : '-'}{entry.amount.toLocaleString()}
                 </div>
                 <span className="text-[9px] font-black uppercase tracking-widest text-[#0a3030]/20">Protocol Points</span>
              </div>
            </div>
          )) : (
            <div className="py-32 text-center">
               <History className="w-12 h-12 text-[#0a3030]/5 mx-auto mb-6" />
               <p className="italic text-[#0a3030]/30 font-black uppercase tracking-[0.4em] text-[11px]">
                  No ledger activity detected.
               </p>
            </div>
          )}
          <div className="p-10 bg-[#0a3030] text-center group cursor-pointer overflow-hidden relative">
            <button className="text-[11px] font-black text-white uppercase tracking-[0.5em] flex items-center justify-center gap-4 w-full relative z-10">
              Synchronize Full History <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </button>
            <div className="absolute inset-0 bg-[#C5A059] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <EditorialPanel
        isOpen={!!successReward}
        onClose={() => setSuccessReward(null)}
        title="Redemption Confirmed"
        badge="Asset Secured"
      >
        <div className="p-12 text-center space-y-10">
           <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 bg-[#C5A059]/20 rounded-full animate-ping" />
              <div className="relative bg-[#0a3030] w-full h-full rounded-full flex items-center justify-center shadow-2xl">
                 <CheckCircle2 className="w-16 h-16 text-[#C5A059]" />
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="text-4xl font-serif italic text-[#0a3030]" style={{ fontFamily: "'DM Serif Display', serif" }}>
                {successReward?.name}
              </h3>
              <p className="text-[#0a3030]/60 italic max-w-sm mx-auto">
                Your reward has been successfully processed and added to your profile assets.
              </p>
           </div>

           <div className="bg-[#FDFCF7] border border-[#0a3030]/5 rounded-[2rem] p-8 flex justify-between items-center max-w-sm mx-auto">
              <div className="text-left">
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#0a3030]/40 block mb-1">Asset Value</span>
                 <span className="text-2xl font-serif text-[#C5A059] italic" style={{ fontFamily: "'DM Serif Display', serif" }}>{successReward?.points_cost.toLocaleString()} PTS</span>
              </div>
              <div className="h-10 w-[1px] bg-[#0a3030]/10" />
              <div className="text-right">
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#0a3030]/40 block mb-1">Status</span>
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Verified</span>
              </div>
           </div>

           <button
             onClick={() => setSuccessReward(null)}
             className="w-full bg-[#0a3030] text-white py-6 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-[#0a3030]/90 transition-all"
           >
             Continue Journey
           </button>
        </div>
      </EditorialPanel>
    </div>
  );
};

export default RewardsPage;
