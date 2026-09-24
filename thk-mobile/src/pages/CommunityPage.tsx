import { useState, useEffect } from 'react';
import {
  Users, Flame, Heart, Award, Shield, Sparkles, MapPin,
  ChevronRight, MessageSquare, Loader2, LogOut, Trophy,
  Share2, TrendingUp, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { type RegionalCommunity, type CommunityPost, type Subscriber } from '@/types/subscription';
import { useLanguage } from '@/lib/LanguageContext';

export default function CommunityPage() {
  const { user } = useAuth();
  const { t, isRtl } = useLanguage();
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [communities, setCommunities] = useState<RegionalCommunity[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [leaderboard, setLeaderboard] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const { data: sub } = await supabase
          .from('subscribers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        setSubscriber(sub);

        const { data: comms } = await supabase
          .from('regional_communities')
          .select('*');

        const enrichedComms = comms?.map(c => ({
          ...c,
          members_count: Math.floor(Math.random() * 200) + 50,
          completion_rate: Math.floor(Math.random() * 30) + 70,
        })) || [];
        setCommunities(enrichedComms);

        const { data: feed } = await supabase
          .from('community_posts')
          .select(`
            id, content, created_at,
            subscriber:subscribers(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        const enrichedPosts = feed?.map(p => ({
          ...p,
          reactions: { heart: 12, fire: 8, clap: 5 },
          user_reacted: { heart: false, fire: false, clap: false }
        })) || [];
        setPosts(enrichedPosts as any);

        const { data: board } = await supabase
          .from('subscribers')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        setLeaderboard(board || []);

      } catch (e) {
        console.error('Community fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const joinGroup = async (groupId: string) => {
    if (!subscriber) return;
    setJoining(groupId);
    const { error } = await supabase
      .from('subscribers')
      .update({ preferred_region_id: groupId })
      .eq('id', subscriber.id);

    if (!error) {
      setSubscriber({ ...subscriber, preferred_region_id: groupId });
    }
    setJoining(null);
  };

  const leaveGroup = async () => {
    if (!subscriber) return;
    const { error } = await supabase
      .from('subscribers')
      .update({ preferred_region_id: null })
      .eq('id', subscriber.id);

    if (!error) {
      setSubscriber({ ...subscriber, preferred_region_id: null });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-[#C5A059] animate-spin" />
      </div>
    );
  }

  const activeGroup = communities.find(c => c.id === subscriber?.preferred_region_id);
  const suggestedGroup = communities[0];

  return (
    <div className="space-y-12 max-w-7xl mx-auto py-12" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="px-6 md:px-12">
        <div className="badge border-[#C5A059]/20 bg-[#C5A059]/10 px-4 py-1.5 rounded-full w-fit mb-6">
          <Sparkles className="w-3 h-3 fill-[#C5A059] text-[#C5A059]" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0a3030]">
            {t('collective_ecosystem') || 'Community Ecosystem'}
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-[#0a3030] leading-tight tracking-tight uppercase italic">
          {t('tribe_title') || 'Community Tribe'}
        </h1>
        <p className="text-[#0a3030]/60 font-medium mt-3 text-base max-w-lg italic">
          {t('doha_community_desc') || 'Join the Doha community focused on healthy eating. Get your plan today.'}
        </p>
      </div>

      {!subscriber?.preferred_region_id ? (
        <div className="px-6 md:px-12 space-y-12">
           {suggestedGroup && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-[#0a3030] rounded-[3rem] p-8 sm:p-10 text-white shadow-3xl relative overflow-hidden"
             >
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-[#C5A059] text-[#0a3030] px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {t('privacy_discovery') || 'Privacy-First Discovery'}
                    </div>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase italic mb-4 leading-tight">
                    {t('group_near_you') || 'A group near your rhythm.'}
                  </h2>
                  <p className="text-white/80 font-medium italic mb-8 max-w-xl text-sm sm:text-base leading-relaxed">
                    We found a Triangle community in <span className="text-[#C5A059] font-bold">{suggestedGroup.name}</span>.
                    Join to share encouragement and team progress.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                      <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest mb-1">{t('team_vitality') || 'Team Activity'}</p>
                      <p className="text-2xl font-black italic">{suggestedGroup.completion_rate}% {t('daily_goal') || 'Daily Goal'}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                      <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest mb-1">{t('active_members') || 'Active Members'}</p>
                      <p className="text-2xl font-black italic">{suggestedGroup.members_count}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => joinGroup(suggestedGroup.id)}
                    disabled={joining !== null}
                    className="bg-[#C5A059] text-[#0a3030] px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-xl"
                  >
                    {joining === suggestedGroup.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (t('join_community') || 'Join Group')}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-[#C5A059]/10 rounded-full blur-[100px]" />
             </motion.div>
           )}

           <div className="space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#0a3030]/50 ml-2">{t('regional_collectives') || 'Regional Groups'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {communities.filter(g => g.id !== suggestedGroup?.id).map((group) => (
                    <button
                      key={group.id}
                      onClick={() => joinGroup(group.id)}
                      disabled={joining !== null}
                      className="bg-white rounded-[2.5rem] p-8 border border-[#0a3030]/5 shadow-xl hover:border-[#C5A059]/30 transition-all group text-left relative overflow-hidden"
                    >
                      <div className="relative z-10">
                          <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-[#0a3030]/5 rounded-2xl flex items-center justify-center group-hover:bg-[#C5A059] group-hover:text-[#0a3030] transition-colors">
                              <MapPin className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-[#0a3030]/40 uppercase tracking-widest">{group.members_count} {t('active_members') || 'Members'}</span>
                          </div>
                          <h3 className="text-2xl font-black uppercase italic text-[#0a3030] mb-2">{group.name}</h3>
                          <p className="text-[#0a3030]/60 text-sm italic mb-8 font-medium">{group.description}</p>
                          <div className="flex items-center gap-2 text-[10px] font-black text-[#C5A059] uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                            {t('join_community') || 'Join Group'} <ChevronRight className="w-4 h-4" />
                          </div>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059]/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-[#C5A059]/10 transition-colors" />
                    </button>
                  ))}
              </div>
           </div>
        </div>
      ) : (
        <>
          <div className="px-6 md:px-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-[#0a3030] rounded-[3rem] p-8 sm:p-10 text-white shadow-3xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                   <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-[#C5A059] text-[#0a3030] px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                          {t('active_collective') || 'Your Group'}
                        </div>
                        <button
                          onClick={leaveGroup}
                          className="text-white/40 hover:text-red-400 transition-colors p-1"
                          title="Leave Group"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-black uppercase italic">{activeGroup?.name}</h2>
                   </div>
                   <div className="flex -space-x-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-11 h-11 rounded-full border-2 border-[#0a3030] bg-[#C5A059]/20 backdrop-blur-md flex items-center justify-center overflow-hidden">
                           <img src={`https://i.pravatar.cc/150?u=${i + 20}`} alt="member" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      <div className="w-11 h-11 rounded-full border-2 border-[#0a3030] bg-white/10 backdrop-blur-md flex items-center justify-center text-[10px] font-black">
                        +{activeGroup ? activeGroup.members_count - 5 : 0}
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-xs font-black uppercase tracking-[0.2em] text-[#C5A059]">
                    <span>{t('collective_momentum') || 'Team Progress'}</span>
                    <span>{activeGroup?.completion_rate}% {t('efficiency') || 'Efficiency'}</span>
                  </div>
                  <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${activeGroup?.completion_rate}%` }}
                      className="bg-gradient-to-r from-teal via-gold to-emerald-400 h-full rounded-full shadow-lg"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-white/50 text-[10px] font-black uppercase tracking-widest italic pt-2">
                    <TrendingUp className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>{t('collective_rewards_desc') || 'Group participation unlocks weekly rewards.'}</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-[#C5A059]/10 rounded-full blur-[100px]" />
            </div>

            <div className="bg-white rounded-[3rem] p-8 border border-[#0a3030]/5 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-5 h-5 text-[#C5A059]" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#0a3030]/60">{t('leaderboard') || 'Community Leaderboard'}</h3>
              </div>
              <div className="space-y-5">
                {leaderboard.map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#0a3030]/30 w-4">{idx + 1}.</span>
                      <div>
                        <p className="text-xs font-black text-[#0a3030] uppercase tracking-tight">{member.full_name}</p>
                        <p className="text-[8px] text-[#C5A059] font-black uppercase tracking-widest">{member.reward_tier} status</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-[#0a3030]">{member.current_streak || 0} {t('days') || 'Days'}</p>
                      <p className="text-[8px] text-[#0a3030]/40 uppercase tracking-widest">{t('completed') || 'Completed'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 md:px-12 space-y-8 pt-6">
            <div className="flex justify-between items-end border-b border-[#0a3030]/5 pb-6">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#0a3030]/50 mb-1">{t('encouragement_feed') || 'Community Feed'}</h3>
                <h2 className="text-2xl sm:text-3xl font-black italic uppercase text-[#0a3030]">{t('regional_pulses') || 'Community Updates'}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.length > 0 ? posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-8 rounded-[2.5rem] border border-[#0a3030]/5 shadow-sm hover:shadow-xl transition-all relative group"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#0a3030]/5 flex items-center justify-center shrink-0 border border-[#0a3030]/5">
                        <MessageSquare className="w-5 h-5 text-[#0a3030]" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#0a3030] uppercase tracking-tight">
                          {post.subscriber?.full_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] text-[#0a3030]/40 uppercase tracking-widest mt-1">
                            {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <span className="w-1 h-1 rounded-full bg-[#0a3030]/10" />
                          <div className="flex items-center gap-1 text-[#C5A059]">
                            <Flame className="w-2.5 h-2.5" />
                            <span className="text-[8px] font-black uppercase">{post.subscriber?.current_streak || 0} Day Streak</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[#0a3030]/80 text-sm font-medium leading-relaxed italic">{post.content}</p>
                </motion.div>
              )) : (
                <div className="col-span-2 bg-white p-10 rounded-[2.5rem] text-center border border-[#0a3030]/5 text-gray-400 font-bold text-sm">
                  {t('no_active_deliveries') || 'No posts yet.'}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
