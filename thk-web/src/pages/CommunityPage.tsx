import React, { useState, useEffect } from 'react';
import { Users, MapPin, TrendingUp, MessageSquare, Heart, Award, ChevronRight, Loader2, Share2, MessageCircle, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../lib/LanguageContext';

const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const { t, isRtl } = useLanguage();
  const [subscriber, setSubscriber] = useState<any>(null);
  const [regions, setRegions] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [{ data: sub }, { data: regionList }] = await Promise.all([
        supabase.from('subscribers').select('*, regional_communities(*)').eq('user_id', user.id).maybeSingle(),
        supabase.from('regional_communities').select('*')
      ]);

      setSubscriber(sub);
      setRegions(regionList || []);

      if (sub?.preferred_region_id) {
        const { data: feed } = await supabase
          .from('community_posts')
          .select('*, community_reactions(reaction_type)')
          .eq('region_id', sub.preferred_region_id)
          .order('created_at', { ascending: false })
          .limit(20);
        setPosts(feed || []);
      }
    } catch (e) {
      console.error('Community fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const joinGroup = async (groupId: string) => {
    if (!subscriber) return;
    setJoining(groupId);
    const { error } = await supabase
      .from('subscribers')
      .update({ preferred_region_id: groupId })
      .eq('id', subscriber.id);

    if (!error) await fetchData();
    setJoining(null);
  };

  const leaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    setJoining('leaving');
    await supabase.from('subscribers').update({ preferred_region_id: null }).eq('id', subscriber.id);
    await fetchData();
    setJoining(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F3EB] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const userGroup = subscriber?.regional_communities;

  return (
    <div className={`min-h-screen bg-[#F5F3EB] py-32 sm:py-40 px-4 sm:px-6 md:px-12 ${isRtl ? 'text-right' : 'text-left'}`}>
      <div className="max-w-7xl mx-auto space-y-24">
        {/* Header */}
        <header>
          <div className="badge mb-8 bg-primary/5 border-primary/10 text-primary py-2 px-6">
            <Users className="w-3.5 h-3.5 fill-primary" />
            <span className="font-black tracking-[0.4em] text-[10px] uppercase">Community</span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-serif italic text-primary leading-[0.9] tracking-tighter uppercase drop-shadow-xl">
            The<br />
            <span className="text-gold selection:bg-gold selection:text-primary">Tribe.</span>
          </h1>
          <p className="text-primary/60 text-xl font-bold italic mt-10 max-w-xl leading-relaxed">
            Healthy eating is better with friends. Join your local Doha tribe to share your progress.
          </p>
        </header>

        {!subscriber?.preferred_region_id ? (
          <section className="space-y-12">
            <div className="glass-card p-12 bg-white/60 border-gold/20 shadow-2xl relative overflow-hidden">
               <div className="relative z-10 space-y-6">
                  <h3 className="text-2xl font-serif italic text-primary">Join a local group.</h3>
                  <p className="text-primary/60 text-sm max-w-lg leading-relaxed font-medium">Join a local tribe to share encouragement and team progress. Your exact location is never shown.</p>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -mr-32 -mt-32" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regions.map((group) => (
                <button
                  key={group.id}
                  onClick={() => joinGroup(group.id)}
                  disabled={joining !== null}
                  className="glass-card p-10 text-left group hover:scale-[1.02] transition-all relative overflow-hidden bg-white/40"
                >
                   <div className="relative z-10 flex flex-col h-full justify-between gap-12">
                      <div className="flex justify-between items-start">
                        <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center group-hover:bg-gold group-hover:text-primary transition-colors shadow-xl">
                          <MapPin className="w-6 h-6" />
                        </div>
                        <span className="text-[9px] font-black text-primary/30 uppercase tracking-widest">Region</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-serif italic text-primary mb-3">{group.name}</h3>
                        <p className="text-primary/50 text-xs italic leading-relaxed line-clamp-2 mb-8">{group.description || 'Join your local Triangle group to share your journey.'}</p>
                        <div className="flex items-center gap-2 text-[10px] font-black text-gold uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                          {joining === group.id ? 'JOINING...' : 'Join Tribe'} <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                   </div>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <div className="space-y-24 animate-reveal">
            {/* Team Pulse Hero */}
            <section>
              <div className="glass-card bg-primary p-12 sm:p-20 text-white relative overflow-hidden shadow-4xl border-none rounded-[4rem]">
                <div className="absolute inset-0 bg-food-atmosphere opacity-5 grayscale pointer-events-none" />
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-16 items-end">
                   <div className="space-y-12">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                          <div className="flex items-center gap-4 mb-6">
                             <div className="badge bg-gold text-primary py-2 px-5 border-none">
                               <TrendingUp className="w-3 h-3" />
                               <span className="font-black text-[9px] tracking-widest">Group Goal</span>
                             </div>
                             <span className="text-gold text-[10px] font-black uppercase tracking-[0.5em]">{userGroup?.name} Tribe</span>
                          </div>
                          <h2 className="text-5xl sm:text-7xl font-serif italic tracking-tighter leading-none">{userGroup?.name} Tribe</h2>
                        </div>
                        <button onClick={leaveGroup} className="btn-secondary !bg-white/10 !text-white border-white/10 hover:!bg-red-500/20 hover:!text-white hover:!border-red-500/40 !py-4 !px-8">
                           <LogOut className="w-4 h-4 mr-2 inline-block" /> LEAVE GROUP
                        </button>
                      </div>

                      <div className="space-y-8">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.4em] text-gold">
                          <span>Group Progress</span>
                          <span>{userGroup?.weekly_team_target_pct}% Participation</span>
                        </div>
                        <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden p-1 shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '68%' }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            className="bg-gold h-full rounded-full shadow-[0_0_20px_rgba(197,160,89,0.5)]"
                          />
                        </div>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] italic leading-relaxed">
                          Your tribe unlocks shared rewards when enough members complete their daily goals.
                        </p>
                      </div>
                   </div>

                   <div className="flex -space-x-6">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-16 h-16 rounded-[2rem] border-[6px] border-primary bg-primary/20 backdrop-blur-md flex items-center justify-center overflow-hidden shadow-2xl">
                           <img src={`https://i.pravatar.cc/150?u=${i + 40}`} alt="member" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                        </div>
                      ))}
                      <div className="w-16 h-16 rounded-[2rem] border-[6px] border-primary bg-gold text-primary flex items-center justify-center text-xs font-black shadow-2xl">
                        +124
                      </div>
                   </div>
                </div>
              </div>
            </section>

            {/* Pulse Feed */}
            <section className="space-y-12">
               <div className="flex items-center justify-between border-b border-primary/5 pb-10">
                  <div className="space-y-2">
                    <p className="text-gold text-[10px] font-black uppercase tracking-[0.5em]">Tribe Feed</p>
                    <h2 className="text-4xl font-serif italic text-primary">Latest Posts</h2>
                  </div>
                  <button className="btn-secondary flex items-center gap-4 group">
                    <Share2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    Share Update
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {posts.length > 0 ? posts.map((post) => (
                    <div key={post.id} className="glass-card p-10 flex flex-col justify-between gap-12 group hover:translate-y-[-10px] transition-all bg-white/40">
                       <div className="space-y-8">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-primary text-ivory flex items-center justify-center shadow-xl">
                                   <MessageSquare className="w-6 h-6" />
                                </div>
                                <div>
                                   <p className="font-black text-primary text-sm uppercase italic tracking-tighter">Member Post</p>
                                   <p className="text-primary/30 text-[9px] font-black uppercase tracking-widest mt-1">
                                      {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </p>
                                </div>
                             </div>
                             <div className="badge bg-gold/10 border-gold/20 text-gold py-1.5 px-4">
                                <Award className="w-3 h-3" />
                                <span className="text-[8px] font-black uppercase tracking-widest ml-1">Achievement</span>
                             </div>
                          </div>
                          <p className="text-primary/70 text-lg italic leading-relaxed font-medium">"{post.content}"</p>
                       </div>

                       <div className="flex items-center justify-between pt-8 border-t border-primary/5">
                          <div className="flex gap-4">
                             {['❤️', '🔥', '👏'].map(emoji => (
                               <button key={emoji} className="w-10 h-10 rounded-full bg-primary/5 hover:bg-gold/20 transition-all flex items-center justify-center text-sm shadow-inner active:scale-90">{emoji}</button>
                             ))}
                          </div>
                          <button className="w-10 h-10 rounded-full flex items-center justify-center text-primary/20 hover:text-primary transition-colors">
                             <MessageCircle className="w-6 h-6" />
                          </button>
                       </div>
                    </div>
                  )) : (
                    <div className="col-span-full py-32 text-center glass-card border-dashed bg-transparent opacity-30">
                       <p className="font-black uppercase tracking-[0.5em] text-[10px] text-primary">No posts yet in {userGroup?.name}.</p>
                    </div>
                  )}
               </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
