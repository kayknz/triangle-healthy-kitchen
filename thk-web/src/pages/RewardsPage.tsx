import React, { useState, useEffect } from 'react';
import { Award, Gift, Zap, History, ChevronRight, Star, ShieldCheck, ArrowUpRight, Loader2, Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../lib/LanguageContext';

const TIERS = [
  { name: 'Reset', minPoints: 0, color: '#8AA694' },
  { name: 'Balance', minPoints: 1000, color: '#C5A059' },
  { name: 'Perform', minPoints: 2500, color: '#123F38' },
];

const RewardsPage: React.FC = () => {
  const { user } = useAuth();
  const { t, isRtl } = useLanguage();
  const [subscriber, setSubscriber] = useState<any>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTier, setActiveTier] = useState('Balance');
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    try {
      const { data: sub } = await supabase.from('subscribers').select('*').eq('user_id', user.id).maybeSingle();
      setSubscriber(sub);

      const [{ data: rewardsList }, { data: ledgerData }] = await Promise.all([
        supabase.from('rewards').select('*').eq('is_active', true).order('point_cost', { ascending: true }),
        supabase.from('points_ledger').select('*').eq('subscriber_id', sub?.id).order('created_at', { ascending: false }).limit(20)
      ]);

      setRewards(rewardsList || []);
      setLedger(ledgerData || []);

      if (sub?.reward_tier) setActiveTier(sub.reward_tier.charAt(0).toUpperCase() + sub.reward_tier.slice(1));
    } catch (e) {
      console.error('Rewards fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const redeem = async (reward: any) => {
    if (!subscriber || subscriber.points_balance < reward.point_cost) return;
    if (!confirm(`Redeem ${reward.name} for ${reward.point_cost} points?`)) return;

    setRedeeming(reward.id);
    try {
       const { error } = await supabase.from('reward_redemptions').insert({
          subscriber_id: subscriber.id,
          reward_id: reward.id,
          status: 'pending'
       });

       if (error) throw error;

       await fetchData();
       alert("Success! Check your email for reward details.");
    } catch (e: any) {
       alert("Error: " + e.message);
    } finally {
       setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F3EB] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  const currentPoints = subscriber?.points_balance || 0;
  const currentTierData = TIERS.slice().reverse().find(t => currentPoints >= t.minPoints) || TIERS[0];
  const nextTier = TIERS.find(t => t.minPoints > currentPoints);
  const progressToNext = nextTier ? (currentPoints / nextTier.minPoints) * 100 : 100;

  return (
    <div className={`min-h-screen bg-[#F5F3EB] py-32 sm:py-40 px-4 sm:px-6 md:px-12 ${isRtl ? 'text-right' : 'text-left'}`}>
      <div className="max-w-7xl mx-auto space-y-24">
        {/* Header & Balance */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div>
             <div className="badge mb-8 bg-gold/10 border-gold/20 text-gold py-2 px-6">
                <Sparkles className="w-3.5 h-3.5 fill-gold" />
                <span className="font-black tracking-[0.4em] text-[10px] uppercase">Loyalty Rewards</span>
             </div>
             <h1 className="text-5xl sm:text-6xl md:text-8xl font-serif italic text-primary leading-[0.9] tracking-tighter uppercase drop-shadow-xl">
               Your<br />
               <span className="text-gold selection:bg-gold selection:text-primary">Points.</span>
             </h1>
          </div>

          <div className="glass-card p-10 bg-primary text-white border-none shadow-4xl relative overflow-hidden min-w-[320px] rounded-[3rem]">
             <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl -mr-16 -mt-16" />
             <div className="relative z-10 flex flex-col gap-8">
                <div className="flex justify-between items-start">
                   <p className="text-gold text-[10px] font-black uppercase tracking-[0.4em]">Balance</p>
                   <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner">
                      <Zap className="w-6 h-6 text-gold fill-gold" />
                   </div>
                </div>
                <h4 className="text-6xl font-black italic tracking-tighter leading-none">{currentPoints.toLocaleString()}</h4>
                <div className="flex items-center gap-2 text-gold/40 text-[9px] font-black uppercase tracking-widest">
                   <ShieldCheck className="w-3.5 h-3.5" /> Secure & Verified
                </div>
             </div>
          </div>
        </header>

        {/* Tier Status Pulse */}
        <section>
          <div className="glass-card bg-white/40 p-12 sm:p-20 relative overflow-hidden shadow-4xl border-white/60 rounded-[4rem]">
            <div className="absolute inset-0 bg-food-atmosphere opacity-5 grayscale pointer-events-none" />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_0.6fr] gap-20 items-center">
               <div className="space-y-12">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                       <Award className="w-5 h-5 text-gold" />
                       <span className="text-gold text-[11px] font-black uppercase tracking-[0.5em]">Membership Level</span>
                    </div>
                    <h2 className="text-5xl sm:text-7xl font-serif italic text-primary tracking-tighter leading-none">{currentTierData.name} Plan</h2>
                  </div>

                  <div className="space-y-8">
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.4em] text-primary">
                      <span>{nextTier ? `Progress to ${nextTier.name}` : 'Pinnacle Status Achieved'}</span>
                      <span className="opacity-40">{currentPoints.toLocaleString()} / {nextTier ? nextTier.minPoints.toLocaleString() : 'MAX'} PTS</span>
                    </div>
                    <div className="w-full bg-primary/5 h-4 rounded-full overflow-hidden p-1 shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progressToNext, 100)}%` }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="bg-primary h-full rounded-full shadow-[0_0_20px_rgba(18,63,56,0.2)]"
                      />
                    </div>
                    {nextTier && (
                      <p className="text-primary/40 text-[10px] font-black uppercase tracking-[0.3em] italic">
                         {nextTier.minPoints - currentPoints} points until your next level unlock.
                      </p>
                    )}
                  </div>
               </div>

               <div className="hidden lg:flex flex-col gap-4">
                  {TIERS.map(t => (
                    <div key={t.name} className={`p-8 rounded-[2rem] border-2 transition-all duration-700 ${currentTierData.name === t.name ? 'border-primary bg-primary text-white shadow-2xl scale-105' : 'border-primary/5 bg-white/20 opacity-30 grayscale'}`}>
                       <p className="text-[9px] font-black uppercase tracking-[0.5em] mb-2">{t.name === 'Perform' ? 'PERFORMANCE' : 'STANDARD'}</p>
                       <h5 className="text-2xl font-black italic tracking-tighter uppercase">{t.name}</h5>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </section>

        {/* Catalog */}
        <section className="space-y-12">
           <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-primary/5 pb-10 gap-8">
              <div className="space-y-2">
                <p className="text-gold text-[10px] font-black uppercase tracking-[0.5em]">Redeem Points</p>
                <h2 className="text-4xl font-serif italic text-primary uppercase">Reward Catalog</h2>
              </div>
              <div className="flex bg-white/40 backdrop-blur-xl rounded-2xl p-1.5 border border-primary/5 shadow-xl overflow-x-auto no-scrollbar">
                 {TIERS.map(tier => (
                   <button
                     key={tier.name}
                     onClick={() => setActiveTier(tier.name)}
                     className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                       activeTier === tier.name ? 'bg-primary text-white shadow-xl' : 'text-primary/40 hover:text-primary'
                     }`}
                   >
                     {tier.name}
                   </button>
                 ))}
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {rewards.filter(r => r.tier.toLowerCase() === activeTier.toLowerCase() || !r.tier).map((item) => (
                <div key={item.id} className="glass-card bg-white/40 border-primary/5 overflow-hidden shadow-xl hover:translate-y-[-10px] transition-all duration-700 group flex flex-col h-full rounded-[3.5rem]">
                   <div className="aspect-[4/3] overflow-hidden relative">
                      <img src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={item.name} />
                      <div className="absolute top-8 left-8 bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-2xl shadow-2xl">
                         <span className="font-black text-[11px] text-primary uppercase tracking-[0.2em]">{item.point_cost.toLocaleString()} PTS</span>
                      </div>
                   </div>
                   <div className="p-10 flex flex-col flex-1 justify-between gap-12">
                      <div>
                         <h3 className="text-3xl font-serif italic text-primary mb-4 uppercase">{item.name}</h3>
                         <p className="text-primary/50 text-xs italic leading-relaxed line-clamp-3 font-medium">{item.description}</p>
                      </div>
                      <button
                        onClick={() => redeem(item)}
                        disabled={currentPoints < item.point_cost || redeeming === item.id}
                        className={`w-full py-6 rounded-2xl border-2 font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all ${
                           currentPoints >= item.point_cost
                           ? 'border-primary text-primary hover:bg-primary hover:text-white shadow-4xl active:scale-95'
                           : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                        }`}
                      >
                         {redeeming === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                         {currentPoints >= item.point_cost ? 'Claim Reward' : 'Insufficient Points'}
                      </button>
                   </div>
                </div>
              ))}
              {rewards.filter(r => r.tier.toLowerCase() === activeTier.toLowerCase()).length === 0 && (
                 <div className="col-span-full py-32 text-center glass-card border-dashed bg-transparent opacity-20">
                    <p className="font-black uppercase tracking-[0.5em] text-[10px] text-primary">No rewards available in the {activeTier} tier.</p>
                 </div>
              )}
           </div>
        </section>

        {/* Points Ledger */}
        <section className="space-y-12 pb-20">
           <div className="flex items-center justify-between border-b border-primary/5 pb-10">
              <div className="space-y-2">
                <p className="text-gold text-[10px] font-black uppercase tracking-[0.5em]">History</p>
                <h2 className="text-4xl font-serif italic text-primary uppercase">Points History</h2>
              </div>
              <History className="w-8 h-8 text-primary/10" />
           </div>

           <div className="glass-card bg-white/40 border-primary/5 rounded-[3.5rem] divide-y divide-primary/5 shadow-2xl overflow-hidden">
              {ledger.length > 0 ? ledger.map(entry => (
                <div key={entry.id} className="p-10 flex items-center justify-between group hover:bg-primary/[0.02] transition-colors">
                   <div className="flex items-center gap-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border ${
                        entry.points_delta > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-400'
                      }`}>
                         {entry.points_delta > 0 ? <ArrowUpRight className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
                      </div>
                      <div>
                         <p className="text-lg font-black text-primary uppercase italic tracking-tighter leading-none">{entry.event_type.replace('_', ' ')}</p>
                         <p className="text-[10px] text-primary/30 font-black uppercase tracking-widest mt-2">
                            {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                         </p>
                      </div>
                   </div>
                   <span className={`text-4xl font-serif italic ${entry.points_delta > 0 ? 'text-emerald-600' : 'text-red-400'}`}>
                      {entry.points_delta > 0 ? '+' : ''}{entry.points_delta.toLocaleString()}
                   </span>
                </div>
              )) : (
                <div className="p-32 text-center opacity-30 italic text-primary font-black uppercase tracking-widest text-[10px]">
                   No points history found.
                </div>
              )}
           </div>
        </section>
      </div>
    </div>
  );
};

export default RewardsPage;
