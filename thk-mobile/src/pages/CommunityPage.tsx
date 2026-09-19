import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, MapPin, TrendingUp, MessageSquare, Heart, Award,
  ChevronRight, Loader2, Share2, MessageCircle, Flame,
  Hand, MoreHorizontal, ShieldAlert, UserMinus, EyeOff,
  LogOut, CheckCircle2, Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/LanguageContext';

interface CommunityGroup {
  id: string;
  name: string;
  slug: string;
  description: string;
  members_count: number;
  completion_rate: number;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  subscriber: {
    full_name: string;
    current_streak: number;
  };
  reactions: {
    heart: number;
    fire: number;
    clap: number;
  };
  user_reacted?: {
    heart: boolean;
    fire: boolean;
    clap: boolean;
  };
}

const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const { t, isRtl } = useLanguage();
  const [subscriber, setSubscriber] = useState<any>(null);
  const [communities, setCommunities] = useState<CommunityGroup[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [showModeration, setShowModeration] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const { data: sub } = await supabase
          .from('subscribers')
          .select('id, user_id, email, full_name, phone, package_id, package_name, status, building_number, street, area, zone_number, maid_number, latitude, longitude, delivery_notes, breakfast_window, lunch_window, dinner_window, subscription_start, current_period_end, is_owner, is_paused, paused_until, allergies, dislikes, activity_level, referral_code, weight_kg, height_cm, fitness_goal, points, referral_count, taste_profile, preferred_region_id, membership_type, reward_tier, points_balance, current_streak, longest_streak, onboarding_completed, gender')
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
            subscriber:subscribers(full_name, current_streak)
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
          .select('id, user_id, email, full_name, phone, package_id, package_name, status, building_number, street, area, zone_number, maid_number, latitude, longitude, delivery_notes, breakfast_window, lunch_window, dinner_window, subscription_start, current_period_end, is_owner, is_paused, paused_until, allergies, dislikes, activity_level, referral_code, weight_kg, height_cm, fitness_goal, points, referral_count, taste_profile, preferred_region_id, membership_type, reward_tier, points_balance, current_streak, longest_streak, onboarding_completed, gender')
          .order('current_streak', { ascending: false })
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

  const toggleReaction = (postId: string, type: 'heart' | 'fire' | 'clap') => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const reacted = post.user_reacted?.[type];
        return {
          ...post,
          reactions: {
            ...post.reactions,
            [type]: reacted ? post.reactions[type] - 1 : post.reactions[type] + 1
          },
          user_reacted: {
            ...post.user_reacted,
            [type]: !reacted
          }
        };
      }
      return post;
    }));
  };

  const activeGroup = useMemo(() =>
    communities.find(g => g.id === subscriber?.preferred_region_id),
    [communities, subscriber]
  );

  const suggestedGroup = useMemo(() => {
    if (!subscriber?.area || subscriber.preferred_region_id) return null;
    return communities.find(c =>
      subscriber.area.toLowerCase().includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(subscriber.area.toLowerCase())
    ) || communities[0];
  }, [communities, subscriber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF7] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#0a3030] animate-spin" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-12 pb-32 animate-reveal bg-[#FDFCF7] min-h-screen ${isRtl ? 'text-right' : 'text-left'}`}>
      <div className="px-6 pt-12 md:px-12">
        <div className="badge border-[#0a3030]/10 bg-[#0a3030]/5 text-[#0a3030] mb-6">
           <Users className="w-3 h-3 fill-[#0a3030]" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em]">Collective Ecosystem</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-serif text-[#0a3030] leading-tight tracking-tighter italic" style={{ fontFamily: "'DM Serif Display', serif" }}>
          The Tribe.
        </h1>
        <p className="text-[#0a3030]/60 font-sans mt-4 text-lg max-w-lg italic">
          Forging wellness through collective accountability and regional momentum.
        </p>
      </div>

      {!subscriber?.preferred_region_id ? (
        <div className="px-6 md:px-12 space-y-12">
           {suggestedGroup && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-[#0a3030] rounded-[3rem] p-10 text-white shadow-3xl relative overflow-hidden"
             >
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-[#C5A059] text-[#0a3030] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Privacy-First Discovery
                    </div>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-serif italic mb-6 leading-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
                    A group near your rhythm.
                  </h2>
                  <p className="text-white/70 font-sans italic mb-8 max-w-xl text-lg">
                    We found a Triangle community in <span className="text-[#C5A059] font-bold">{suggestedGroup.name}</span>.
                    Join to share encouragement and team progress. Your exact location is never shown.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                      <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest mb-1">Team Vitality</p>
                      <p className="text-2xl font-serif">{suggestedGroup.completion_rate}% Daily Goal</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                      <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest mb-1">Active Members</p>
                      <p className="text-2xl font-serif">{suggestedGroup.members_count}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => joinGroup(suggestedGroup.id)}
                    disabled={joining !== null}
                    className="bg-[#C5A059] text-[#0a3030] px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    {joining === suggestedGroup.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enter Collective'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-[#C5A059]/10 rounded-full blur-[100px]" />
             </motion.div>
           )}

           <div className="space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#0a3030]/40 ml-2">Regional Collectives</h3>
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
                            <span className="text-[10px] font-black text-[#0a3030]/30 uppercase tracking-widest">{group.members_count} Members</span>
                          </div>
                          <h3 className="text-2xl font-serif text-[#0a3030] mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>{group.name}</h3>
                          <p className="text-[#0a3030]/50 text-sm italic mb-8">{group.description}</p>
                          <div className="flex items-center gap-2 text-[10px] font-black text-[#C5A059] uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                            Join Tribe <ChevronRight className="w-4 h-4" />
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
            <div className="lg:col-span-2 bg-[#0a3030] rounded-[3rem] p-10 text-white shadow-3xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                   <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-[#C5A059] text-[#0a3030] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                          Active Collective
                        </div>
                        <button
                          onClick={leaveGroup}
                          className="text-white/30 hover:text-red-400 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      </div>
                      <h2 className="text-4xl md:text-5xl font-serif italic" style={{ fontFamily: "'DM Serif Display', serif" }}>{activeGroup?.name}</h2>
                   </div>
                   <div className="flex -space-x-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-12 h-12 rounded-full border-4 border-[#0a3030] bg-[#C5A059]/20 backdrop-blur-md flex items-center justify-center overflow-hidden">
                           <img src={`https://i.pravatar.cc/150?u=${i + 20}`} alt="member" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      <div className="w-12 h-12 rounded-full border-4 border-[#0a3030] bg-white/10 backdrop-blur-md flex items-center justify-center text-[10px] font-black">
                        +{activeGroup ? activeGroup.members_count - 5 : 0}
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between text-xs font-black uppercase tracking-[0.3em] text-[#C5A059]">
                    <span>Collective Momentum</span>
                    <span>{activeGroup?.completion_rate}% Efficiency</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${activeGroup?.completion_rate}%` }}
                      className="bg-[#C5A059] h-full rounded-full shadow-[0_0_10px_rgba(197,160,89,0.3)]"
                    />
                  </div>
                  <div className="flex items-center gap-3 text-white/40 text-[10px] font-black uppercase tracking-widest italic">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Collective participation unlocks shared weekly rewards.</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-[#C5A059]/10 rounded-full blur-[100px]" />
            </div>

            <div className="bg-white rounded-[3rem] p-10 border border-[#0a3030]/5 shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                <Trophy className="w-5 h-5 text-[#C5A059]" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#0a3030]/60">Fair Leaderboard</h3>
              </div>
              <div className="space-y-6">
                {leaderboard.map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-serif italic text-[#0a3030]/30 w-4">{idx + 1}.</span>
                      <div>
                        <p className="text-sm font-black text-[#0a3030] uppercase tracking-tight">{member.full_name}</p>
                        <p className="text-[8px] text-[#C5A059] font-black uppercase tracking-widest">{member.reward_tier} status</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-[#0a3030]">{member.current_streak} Days</p>
                      <p className="text-[8px] text-[#0a3030]/40 uppercase tracking-widest">Completed</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 md:px-12 space-y-8">
            <div className="flex justify-between items-end border-b border-[#0a3030]/5 pb-6">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#0a3030]/40 mb-2">Encouragement Feed</h3>
                <h2 className="text-3xl font-serif text-[#0a3030] italic" style={{ fontFamily: "'DM Serif Display', serif" }}>Regional Pulses</h2>
              </div>
              <button className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] hover:text-[#0a3030] transition-colors flex items-center gap-2">
                Share Progress <Share2 className="w-3.5 h-3.5" />
              </button>
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
                            <span className="text-[8px] font-black uppercase">{post.subscriber?.current_streak} Day Streak</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[#0a3030]/70 font-sans italic mb-8 leading-relaxed text-lg">
                    "{post.content}"
                  </p>

                  <div className="flex items-center justify-between border-t border-[#0a3030]/5 pt-6">
                    <div className="flex items-center gap-4">
                      {['❤️', '🔥', '👏'].map(emoji => (
                        <button key={emoji} onClick={() => toggleReaction(post.id, 'heart' as any)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all bg-[#0a3030]/5 group-hover:bg-[#0a3030]/10`}>
                          <span className="text-sm">{emoji}</span>
                        </button>
                      ))}
                    </div>

                    <button className="w-10 h-10 rounded-full bg-[#0a3030]/5 flex items-center justify-center text-[#0a3030]/20 hover:text-[#0a3030] transition-colors">
                       <MessageCircle className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )) : (
                <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-[#0a3030]/10">
                   <p className="text-[#0a3030]/30 font-black uppercase tracking-widest text-[10px]">No pulses yet in your region.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CommunityPage;
