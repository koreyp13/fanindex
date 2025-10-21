import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Trophy, TrendingUp, Flame, Target, Users, MessageSquare, Share2, Award, BarChart3, Zap, Crown, Menu, X, Moon, Sun, Home, User, Settings, LogOut, Bell, Search, Filter, ArrowUpDown, ChevronRight, ThumbsUp, ThumbsDown, Eye, Clock, Calendar, Star, Activity, Shield } from 'lucide-react';

const ACHIEVEMENTS = [
  { id: 1, name: 'Early Adopter', icon: '🚀', description: 'Voted in Week 1', unlocked: true },
  { id: 2, name: 'Perfect Week', icon: '💯', description: '100% accuracy vs AP Poll', unlocked: true },
  { id: 3, name: 'Chaos Agent', icon: '🌪️', description: 'Voted for 5+ upsets', unlocked: true },
  { id: 4, name: 'Homer Protector', icon: '🏠', description: 'Always rank your team', unlocked: true },
  { id: 5, name: 'Bracket Buster', icon: '💥', description: 'Predict major upset', unlocked: false },
  { id: 6, name: 'Fire Streak', icon: '🔥', description: '10 week voting streak', unlocked: false },
  { id: 7, name: 'Social Butterfly', icon: '🦋', description: '50 ballot shares', unlocked: false },
  { id: 8, name: 'Season MVP', icon: '👑', description: 'Top accuracy all season', unlocked: false },
];

const LEADERBOARD_DATA = [
  { rank: 1, user: 'BigTenBill', accuracy: 92.1, streak: 12, badges: 8 },
  { rank: 2, user: 'SECSupremacy', accuracy: 91.7, streak: 12, badges: 7 },
  { rank: 3, user: 'CoachK_Fan', accuracy: 90.3, streak: 11, badges: 6 },
  { rank: 4, user: 'MarchMadness22', accuracy: 89.8, streak: 12, badges: 7 },
  { rank: 5, user: 'hoopsfan23', accuracy: 87.3, streak: 7, badges: 4, isCurrentUser: true },
];

export default function FanIndexApp() {
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [userBadges, setUserBadges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [fanIndexRankings, setFanIndexRankings] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [teams, setTeams] = useState([]);
  const [myRankings, setMyRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [roastText, setRoastText] = useState('');
  const [celebrateVote, setCelebrateVote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedFavoriteTeam, setSelectedFavoriteTeam] = useState('');
  const [hasVotedThisWeek, setHasVotedThisWeek] = useState(false);
  const [checkingVoteStatus, setCheckingVoteStatus] = useState(false);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchedItem, setTouchedItem] = useState(null);
  // removed duplicate teamStats/controversialTeams declarations to avoid redeclare error
  const [analyticsData, setAnalyticsData] = useState({
    totalVoters: 0,
    avgAccuracy: 0,
    activeDebates: 0,
    teamsTracked: 0
  });
  const [conferencePower, setConferencePower] = useState([]);
  const [teamStats, setTeamStats] = useState([]);
  const [controversialTeams, setControversialTeams] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [selectedConference, setSelectedConference] = useState('AP Top 25');
  const [userRank, setUserRank] = useState(null);
  const [debateTopics, setDebateTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [debateComments, setDebateComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch teams from Supabase
  const fetchTeams = async () => {
  console.log('🔍 fetchTeams STARTED');
  try {
    setLoading(true);
    console.log('📡 About to fetch from Supabase...');
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name', { ascending: true });

    console.log('📊 Supabase response:', { data, error });

    if (error) throw error;

    setTeams(data || []);
    setAvailableTeams(data || []);
    setMyRankings([]);

    // Also calculate FanIndex rankings
    calculateFanIndexRankings();

    console.log('✅ Teams loaded:', data?.length);
  } catch (error) {
    console.error('❌ Error fetching teams:', error);
    alert('Error loading teams. Check console for details.');
  } finally {
    console.log('🏁 Setting loading to false');
    setLoading(false);
  }
};
// Check if user has already voted this week
const checkIfAlreadyVoted = async (userId) => {
  try {
    setCheckingVoteStatus(true);
    
    // Get current week (for now, week 1)
    const currentWeek = 1;
    
    // Check if user has a ballot for this week
    const { data, error } = await supabase
      .from('user_ballots')
      .select('id')
      .eq('user_id', userId)
      .eq('week_id', currentWeek);
    
    if (error) throw error;
    
    const alreadyVoted = data && data.length > 0;
    setHasVotedThisWeek(alreadyVoted);
    
    console.log('✅ Vote status checked:', alreadyVoted ? 'Already voted' : 'Can vote');
    return alreadyVoted;
    
  } catch (error) {
    console.error('Error checking vote status:', error);
    return false;
  } finally {
    setCheckingVoteStatus(false);
  }
};
// Fetch teams on component mount
// Check for existing session and fetch teams
useEffect(() => {
  // Check if user is logged in
  supabase.auth.getSession().then(({ data: { session } }) => {
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    console.log('👤 User state:', currentUser);
    // Check if user has already voted this week
const checkIfAlreadyVoted = async (userId) => {
  try {
    setCheckingVoteStatus(true);
    
    // Get current week (for now, week 1)
    const currentWeek = 1;
    
    // Check if user has a ballot for this week
    const { data, error } = await supabase
      .from('user_ballots')
      .select('id')
      .eq('user_id', userId)
      .eq('week_id', currentWeek);
    
    if (error) throw error;
    
    const alreadyVoted = data && data.length > 0;
    setHasVotedThisWeek(alreadyVoted);
    
    console.log('✅ Vote status checked:', alreadyVoted ? 'Already voted' : 'Can vote');
    return alreadyVoted;
    
  } catch (error) {
    console.error('Error checking vote status:', error);
    return false;
  } finally {
    setCheckingVoteStatus(false);
  }
};
    // Check for user profile if logged in
    if (currentUser) {
      checkUserProfile(currentUser.id);
    }
  });

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    
    // Check for user profile on login
    if (currentUser) {
      checkUserProfile(currentUser.id);
    }
  });

  // Fetch teams
  fetchTeams();

  return () => subscription.unsubscribe();
}, []);
  useEffect(() => {
  if (user && userProfile) {
    fetchLeaderboard();
    calculateTeamStats();
    fetchDebateTopics();
    calculateAnalytics();
    checkIfAlreadyVoted(user.id);
  }
}, [user, userProfile]);
// Auth functions
const handleSignup = async (e) => {
  e.preventDefault();
  try {
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    alert('Check your email for confirmation link!');
    setEmail('');
    setPassword('');
  } catch (error) {
    alert(error.message);
  } finally {
    setAuthLoading(false);
  }
};

const handleLogin = async (e) => {
  e.preventDefault();
  try {
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    setUser(data.user);
  } catch (error) {
    alert(error.message);
  } finally {
    setAuthLoading(false);
  }
};

const handleLogout = async () => {
  await supabase.auth.signOut();
  setUser(null);
};
// Check if user has profile, if not create one
const checkUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    // No profile exists
    setNeedsUsername(true);
  } else {
    // Profile exists - set it with Fan DNA
    setUserProfile({
      ...data,
      fanDNA: {
        homerScore: data.homer_score || 0,
        chaosScore: data.chaos_score || 0,
        contrarian: data.contrarian_score || 0
      }
    });
    setNeedsUsername(false);

    // Load badges
    fetchAllBadges();
    fetchUserBadges(userId);
  }
};
const createUserProfile = async (e) => {
  e.preventDefault();
  try {
    setAuthLoading(true);
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        username: newUsername,
        email: user.email,
        favorite_team_id: selectedFavoriteTeam || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    setUserProfile(data);
    setNeedsUsername(false);
    setNewUsername('');
    setSelectedFavoriteTeam('');
  } catch (error) {
    alert(error.message);
  } finally {
    setAuthLoading(false);
  }
};

// Drag and drop handlers
const handleDragStart = (e, index) => {
  setDraggedItem(index);
  e.dataTransfer.effectAllowed = 'move';
};

const handleDragOver = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
};

const handleDrop = (e, dropIndex) => {
  e.preventDefault();
  
  if (draggedItem === null || draggedItem === dropIndex) return;

  const newRankings = [...myRankings];
  const draggedTeam = newRankings[draggedItem];
  
  // Remove from old position
  newRankings.splice(draggedItem, 1);
  
  // Insert at new position
  newRankings.splice(dropIndex, 0, draggedTeam);
  
  setMyRankings(newRankings);
  setDraggedItem(null);
};

const handleDragEnd = () => {
  setDraggedItem(null);
};
// Touch handlers for mobile
const handleTouchStart = (e, index) => {
  setTouchedItem(index);
  setTouchStartY(e.touches[0].clientY);
};

const handleTouchMove = (e) => {
  if (touchedItem === null) return;
  e.preventDefault();
};

const handleTouchEnd = (e, dropIndex) => {
  if (touchedItem === null || touchedItem === dropIndex) {
    setTouchedItem(null);
    setTouchStartY(null);
    return;
  }

  const newRankings = [...myRankings];
  const draggedTeam = newRankings[touchedItem];
  
  newRankings.splice(touchedItem, 1);
  newRankings.splice(dropIndex, 0, draggedTeam);
  
  setMyRankings(newRankings);
  setTouchedItem(null);
  setTouchStartY(null);
};
// Move team up or down in rankings
const moveTeamUp = (index) => {
  if (index === 0) return; // Already at top
  const newRankings = [...myRankings];
  const temp = newRankings[index - 1];
  newRankings[index - 1] = newRankings[index];
  newRankings[index] = temp;
  setMyRankings(newRankings);
};

const moveTeamDown = (index) => {
  if (index === myRankings.length - 1) return; // Already at bottom
  const newRankings = [...myRankings];
  const temp = newRankings[index + 1];
  newRankings[index + 1] = newRankings[index];
  newRankings[index] = temp;
  setMyRankings(newRankings);
};
// userRank already declared above; duplicate removed

// REPLACE the existing fetchLeaderboard function (around line 237) with this improved version:
const fetchLeaderboard = async () => {
  try {
    setLeaderboardLoading(true);
    
    // Get all users with their vote counts and streaks
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, username, fan_confidence_score, total_weeks_participated, current_streak');
    
    if (usersError) throw usersError;

    // Get ballot counts for each user
    const leaderboard = await Promise.all(
      usersData.map(async (userData) => {
        // Count total ballots
        const { count, error } = await supabase
          .from('user_ballots')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userData.id);
        
        if (error) console.error('Error counting ballots:', error);

        return {
          user: userData.username || 'Anonymous',
          accuracy: userData.fan_confidence_score || 0,
          streak: userData.current_streak || userData.total_weeks_participated || 0,
          badges: 0,
          totalVotes: count || 0,
          userId: userData.id,
          isCurrentUser: userData.id === user?.id
        };
      })
    );

    // Sort by current streak first, then by total votes
    const sortedLeaderboard = leaderboard
      .filter(entry => entry.totalVotes > 0)
      .sort((a, b) => {
        // First sort by streak
        if (b.streak !== a.streak) {
          return b.streak - a.streak;
        }
        // If streaks are equal, sort by total votes
        return b.totalVotes - a.totalVotes;
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

    setLeaderboardData(sortedLeaderboard);

    // Find current user's rank
    const currentUserEntry = sortedLeaderboard.find(entry => entry.userId === user?.id);
    setUserRank(currentUserEntry ? currentUserEntry.rank : null);

    return sortedLeaderboard;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  } finally {
    setLeaderboardLoading(false);
  }
};
// Calculate team momentum and controversy
const calculateTeamStats = async () => {
  try {
    // Get all ballot rankings
    const { data: allRankings, error } = await supabase
      .from('ballot_rankings')
      .select('team_id, rank_position');
    
    if (error) throw error;

    // Group by team and calculate stats
    const teamMetrics = {};
    
    allRankings.forEach(ranking => {
      if (!teamMetrics[ranking.team_id]) {
        teamMetrics[ranking.team_id] = {
          appearances: 0,
          rankings: [],
          totalPoints: 0
        };
      }
      teamMetrics[ranking.team_id].appearances++;
      teamMetrics[ranking.team_id].rankings.push(ranking.rank_position);
      teamMetrics[ranking.team_id].totalPoints += (26 - ranking.rank_position);
    });

    // Calculate variance and hype for each team
    const stats = await Promise.all(
      Object.entries(teamMetrics).map(async ([teamId, metrics]) => {
        const { data: team } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .single();
        
        if (!team) return null;

        // Calculate average rank
        const avgRank = metrics.rankings.reduce((a, b) => a + b, 0) / metrics.rankings.length;
        
        // Calculate variance (spread of rankings)
        const variance = metrics.rankings.reduce((sum, rank) => {
          return sum + Math.pow(rank - avgRank, 2);
        }, 0) / metrics.rankings.length;
        
        // Calculate hype score (0-100)
        const maxAppearances = Math.max(...Object.values(teamMetrics).map(m => m.appearances));
        const hypeScore = Math.round((metrics.appearances / maxAppearances) * 100);
        
        // Calculate momentum (FanIndex rank vs AP rank)
        const fanIndexRank = fanIndexRankings.find(t => t.id === teamId)?.fanIndexRank || 999;
        const apRank = team.ap_rank || 999;
        const momentum = apRank - fanIndexRank; // Positive = fans rank higher than AP

        return {
          ...team,
          appearances: metrics.appearances,
          avgRank: Math.round(avgRank * 10) / 10,
          variance: Math.round(variance * 10) / 10,
          hypeScore,
          momentum
        };
      })
    );

    const validStats = stats.filter(s => s !== null);

    // Sort by hype for momentum section
    const topHype = validStats
      .sort((a, b) => b.hypeScore - a.hypeScore)
      .slice(0, 10);
    
    setTeamStats(topHype);

    // Sort by variance for controversial section
    const mostControversial = validStats
      .filter(s => s.appearances >= 3) // Only teams with enough votes
      .sort((a, b) => b.variance - a.variance)
      .slice(0, 6);
    
    setControversialTeams(mostControversial);

  } catch (error) {
    console.error('Error calculating team stats:', error);
  }
};
// Calculate analytics hub data
const calculateAnalytics = async () => {
  try {
    // Get total voters (users who have submitted at least one ballot)
    const { data: voters, error: votersError } = await supabase
      .from('user_ballots')
      .select('user_id', { count: 'exact' });
    
    if (votersError) throw votersError;
    
    const uniqueVoters = new Set(voters?.map(v => v.user_id) || []).size;

    // Get average accuracy
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('fan_confidence_score');
    
    if (usersError) throw usersError;
    
    const scoresWithData = users?.filter(u => u.fan_confidence_score > 0) || [];
    const avgAccuracy = scoresWithData.length > 0
      ? Math.round(scoresWithData.reduce((sum, u) => sum + u.fan_confidence_score, 0) / scoresWithData.length)
      : 0;

    // Get active debates count
    const { count: debatesCount, error: debatesError } = await supabase
      .from('debate_topics')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    if (debatesError) throw debatesError;

    // Set analytics data
    setAnalyticsData({
      totalVoters: uniqueVoters,
      avgAccuracy,
      activeDebates: debatesCount || 0,
      teamsTracked: teams.length
    });

    // Calculate conference power rankings
    await calculateConferencePower();

  } catch (error) {
    console.error('Error calculating analytics:', error);
  }
};
// Calculate Fan DNA for a user
// Calculate Fan DNA for a user
const calculateFanDNA = async (userId) => {
  try {
    // Get user's ballots
    const { data: userBallots, error: ballotsError } = await supabase
      .from('user_ballots')
      .select('id')
      .eq('user_id', userId);
    
    if (ballotsError) throw ballotsError;
    if (!userBallots || userBallots.length === 0) return null;

    // Get all user's rankings
    const { data: userRankings, error: rankingsError } = await supabase
      .from('ballot_rankings')
      .select('team_id, rank_position, ballot_id')
      .in('ballot_id', userBallots.map(b => b.id));
    
    if (rankingsError) throw rankingsError;

    // Get user's favorite team
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('favorite_team_id')
      .eq('id', userId)
      .single();
    
    if (profileError) throw profileError;

    // CALCULATE HOMER SCORE
    let homerScore = 50; // Default neutral
    if (userProfile?.favorite_team_id) {
      const favoriteRankings = userRankings.filter(r => r.team_id === userProfile.favorite_team_id);
      
      if (favoriteRankings.length > 0) {
        const avgRank = favoriteRankings.reduce((sum, r) => sum + r.rank_position, 0) / favoriteRankings.length;
        
        // Get consensus rank for this team
        const { data: allRankings } = await supabase
          .from('ballot_rankings')
          .select('rank_position')
          .eq('team_id', userProfile.favorite_team_id);
        
        if (allRankings && allRankings.length > 0) {
          const consensusRank = allRankings.reduce((sum, r) => sum + r.rank_position, 0) / allRankings.length;
          const difference = consensusRank - avgRank;
          homerScore = Math.min(100, Math.max(0, Math.round(50 + (difference * 10))));
        }
      }
    }

    // CALCULATE CHAOS SCORE
    const { data: teams } = await supabase
      .from('teams')
      .select('id, ap_rank, wins, losses');
    
    let chaosVotes = 0;
    let totalVotes = userRankings.length;
    
    userRankings.forEach(ranking => {
      const team = teams.find(t => t.id === ranking.team_id);
      if (team) {
        // Ranked in top 15 but not in AP top 25
        if (ranking.rank_position <= 15 && (!team.ap_rank || team.ap_rank > 25)) {
          chaosVotes += 2; // Heavy weight for top 15
        }
        // Ranked in top 20 but has losing record
        if (ranking.rank_position <= 20 && team.losses > team.wins) {
          chaosVotes++;
        }
      }
    });
    
    const chaosScore = Math.min(100, Math.round((chaosVotes / totalVotes) * 150));

    // CALCULATE CONTRARIAN INDEX
    const { data: allRankings } = await supabase
      .from('ballot_rankings')
      .select('team_id, rank_position');
    
    // Calculate consensus rankings
    const teamConsensus = {};
    allRankings.forEach(r => {
      if (!teamConsensus[r.team_id]) {
        teamConsensus[r.team_id] = [];
      }
      teamConsensus[r.team_id].push(r.rank_position);
    });
    
    let totalDifference = 0;
    let validComparisons = 0;
    
    userRankings.forEach(r => {
      if (teamConsensus[r.team_id] && teamConsensus[r.team_id].length > 1) {
        const consensusRank = teamConsensus[r.team_id].reduce((a, b) => a + b, 0) / teamConsensus[r.team_id].length;
        totalDifference += Math.abs(r.rank_position - consensusRank);
        validComparisons++;
      }
    });
    
    const avgDifference = validComparisons > 0 ? totalDifference / validComparisons : 0;
    const contrarian = Math.min(100, Math.round(avgDifference * 8));

    // Calculate accuracy score
    const accuracyScore = Math.max(0, Math.round(100 - (avgDifference * 5)));

    // SAVE TO DATABASE
    const { error: updateError } = await supabase
      .from('users')
      .update({
        fan_confidence_score: accuracyScore,
        homer_score: homerScore,
        chaos_score: chaosScore,
        contrarian_score: contrarian
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error updating Fan DNA:', updateError);
      throw updateError;
    }

    console.log('✅ Fan DNA calculated:', { homerScore, chaosScore, contrarian, accuracyScore });

    return {
      homerScore,
      chaosScore,
      contrarian
    };

  } catch (error) {
    console.error('❌ Error calculating Fan DNA:', error);
    return null;
  }
};
// Calculate user's voting streak
const calculateVotingStreak = async (userId) => {
  try {
    // Get all voting weeks in order
    const { data: weeks, error: weeksError } = await supabase
      .from('voting_weeks')
      .select('week_number')
      .order('week_number', { ascending: false });
    
    if (weeksError) throw weeksError;
    if (!weeks || weeks.length === 0) return 0;

    // Get user's ballots
    const { data: userBallots, error: ballotsError } = await supabase
      .from('user_ballots')
      .select('week_id')
      .eq('user_id', userId)
      .order('week_id', { ascending: false });
    
    if (ballotsError) throw ballotsError;
    if (!userBallots || userBallots.length === 0) return 0;

    const votedWeeks = new Set(userBallots.map(b => b.week_id));
    
    // Calculate streak from most recent week backwards
    let streak = 0;
    const currentWeek = Math.max(...weeks.map(w => w.week_number));
    
    for (let week = currentWeek; week >= 1; week--) {
      if (votedWeeks.has(week)) {
        streak++;
      } else {
        break; // Streak broken
      }
    }

    // Update user's streak in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        total_weeks_participated: userBallots.length,
        current_streak: streak
      })
      .eq('id', userId);
    
    if (updateError) console.error('Error updating streak:', updateError);

    return streak;

  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
};
// Calculate conference power rankings based on fan votes
const calculateConferencePower = async () => {
  try {
    // Get all ballot rankings
    const { data: allRankings, error } = await supabase
      .from('ballot_rankings')
      .select('team_id, rank_position');
    
    if (error) throw error;

    // Calculate points for each team
    const teamPoints = {};
    allRankings.forEach(ranking => {
      const points = 26 - ranking.rank_position;
      if (!teamPoints[ranking.team_id]) {
        teamPoints[ranking.team_id] = 0;
      }
      teamPoints[ranking.team_id] += points;
    });

    // Get teams with their conferences
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('id, conference');
    
    if (teamsError) throw teamsError;

    // Sum points by conference
    const conferencePoints = {};
    teamsData.forEach(team => {
      if (teamPoints[team.id]) {
        if (!conferencePoints[team.conference]) {
          conferencePoints[team.conference] = 0;
        }
        conferencePoints[team.conference] += teamPoints[team.id];
      }
    });

    // Sort conferences by total points
    const sortedConferences = Object.entries(conferencePoints)
      .map(([conference, points]) => ({
        conference,
        points: Math.round(points),
        rating: Math.round((points / Math.max(...Object.values(conferencePoints))) * 100)
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 8); // Top 8 conferences

    setConferencePower(sortedConferences);

  } catch (error) {
    console.error('Error calculating conference power:', error);
  }
};
// Fetch debate topics
const fetchDebateTopics = async () => {
  try {
    const { data, error } = await supabase
      .from('debate_topics')
      .select(`
        *,
        debate_comments(count),
        upvotes:debate_topic_votes(count).eq(vote_type, 'up'),
        downvotes:debate_topic_votes(count).eq(vote_type, 'down')
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Process the counts
    const processedTopics = data.map(topic => ({
      ...topic,
      upvotes: topic.upvotes?.[0]?.count || 0,
      downvotes: topic.downvotes?.[0]?.count || 0,
      commentCount: topic.debate_comments?.[0]?.count || 0
    }));
    
    setDebateTopics(processedTopics);
  } catch (error) {
    console.error('Error fetching debates:', error);
  }
};

// Fetch comments for a topic
const fetchDebateComments = async (topicId) => {
  try {
    const { data, error } = await supabase
      .from('debate_comments')
      .select('*, users(username)')
      .eq('topic_id', topicId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setDebateComments(data || []);
  } catch (error) {
    console.error('Error fetching comments:', error);
  }
};

// Vote on a topic
// Vote on a topic
const voteOnTopic = async (topicId, voteType) => {
  try {
    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('debate_topic_votes')
      .select('*')
      .eq('topic_id', topicId)
      .eq('user_id', user.id)
      .single();

    if (existingVote) {
      // Update existing vote
      if (existingVote.vote_type === voteType) {
        // Remove vote if clicking same button
        await supabase
          .from('debate_topic_votes')
          .delete()
          .eq('topic_id', topicId)
          .eq('user_id', user.id);
      } else {
        // Change vote
        await supabase
          .from('debate_topic_votes')
          .update({ vote_type: voteType })
          .eq('topic_id', topicId)
          .eq('user_id', user.id);
      }
    } else {
      // Insert new vote
      await supabase
        .from('debate_topic_votes')
        .insert({
          topic_id: topicId,
          user_id: user.id,
          vote_type: voteType
        });
    }
    
    // Refresh topics to show updated counts
    await fetchDebateTopics();
  } catch (error) {
    console.error('Error voting:', error);
  }
};

// Post a comment
const postComment = async (topicId) => {
  if (!newComment.trim()) return;
  
  try {
    const { error } = await supabase
      .from('debate_comments')
      .insert({
        topic_id: topicId,
        user_id: user.id,
        comment_text: newComment
      });
    
    if (error) throw error;
    
    setNewComment('');
    fetchDebateComments(topicId);
    fetchDebateTopics(); // Refresh count
  } catch (error) {
    console.error('Error posting comment:', error);
  }
};
// ADD THIS NEW useEffect to load leaderboard when user logs in (add after your existing useEffect around line 95)
useEffect(() => {
  if (user && userProfile) {
    fetchLeaderboard();
  }
}, [user, userProfile]);

// Quick Actions duplicate removed — actual Quick Actions button is rendered inside the HOME view.
// Calculate FanIndex rankings from all ballots
const calculateFanIndexRankings = async () => {
  try {
    // Get all ballot rankings
    const { data: allRankings, error } = await supabase
      .from('ballot_rankings')
      .select('team_id, rank_position');
    
    if (error) throw error;

    // Calculate points for each team (25 points for #1, 24 for #2, etc.)
    const teamPoints = {};
    
    allRankings.forEach(ranking => {
      const points = 26 - ranking.rank_position; // #1 gets 25 pts, #2 gets 24 pts, etc.
      if (!teamPoints[ranking.team_id]) {
        teamPoints[ranking.team_id] = 0;
      }
      teamPoints[ranking.team_id] += points;
    });

    // Get team details and combine with points
    const rankedTeams = await Promise.all(
      Object.entries(teamPoints).map(async ([teamId, points]) => {
        const { data: team } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .single();
        
        return {
          ...team,
          fanIndexPoints: points
        };
      })
    );

    // Sort by points and add rank
    const sorted = rankedTeams
      .sort((a, b) => b.fanIndexPoints - a.fanIndexPoints)
      .slice(0, 25)
      .map((team, index) => ({
        ...team,
        fanIndexRank: index + 1
      }));

    setFanIndexRankings(sorted);
    calculateTeamStats();
  } catch (error) {
    console.error('Error calculating FanIndex:', error);
  }
};
// Fetch all available badges
const fetchAllBadges = async () => {
  try {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('id');
    
    if (error) throw error;
    setAllBadges(data || []);
  } catch (error) {
    console.error('Error fetching badges:', error);
  }
};

// Fetch user's earned badges
const fetchUserBadges = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at, badges(*)')
      .eq('user_id', userId);
    
    if (error) throw error;
    setUserBadges(data || []);
  } catch (error) {
    console.error('Error fetching user badges:', error);
  }
};
// Check and award "Early Adopter" badge automatically
const checkAndAwardBadges = async (userId) => {
  try {
    // Check if user has any votes
    const { count } = await supabase
      .from('user_ballots')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (count > 0) {
      // Award "Early Adopter" badge
      const { error } = await supabase
        .from('user_badges')
        .insert({ user_id: userId, badge_id: 1 }) // badge_id 1 = Early Adopter
        .select();
      
      if (!error) {
        // Refresh badges
        fetchUserBadges(userId);
      }
    }
  } catch (error) {
    // Ignore duplicate errors (badge already awarded)
    if (!error.message?.includes('duplicate')) {
      console.error('Error checking badges:', error);
    }
  }
};
// Save ballot to database
const submitVote = async () => {
  // SAFETY CHECK: Prevent multiple votes per week
  const alreadyVoted = await checkIfAlreadyVoted(user.id);
  if (alreadyVoted) {
    alert('You have already voted this week! Come back next Monday.');
    return;
  }

  try {
    setSaving(true);

    // Create ballot
    const { data: ballot, error: ballotError } = await supabase
      .from('user_ballots')
      .insert({
        user_id: user?.id ?? null,
        week_id: 1, // Current week
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (ballotError) throw ballotError;

    // Create ballot rankings
    const rankings = myRankings.map((team, index) => ({
      ballot_id: ballot.id,
      team_id: team.id,
      rank_position: index + 1
    }));

    const { error: rankingsError } = await supabase
      .from('ballot_rankings')
      .insert(rankings);

    if (rankingsError) throw rankingsError;

    console.log('✅ Rankings inserted');

    // Check for new badges
    await checkAndAwardBadges(user.id);
    console.log('✅ Badges checked');

    // Recalculate FanIndex rankings
    await calculateFanIndexRankings();
    console.log('✅ FanIndex recalculated');

    // Update voting streak
    const newStreak = await calculateVotingStreak(user.id);
    console.log('✅ Streak updated:', newStreak);

    // Reload profile to get new streak
    await checkUserProfile(user.id);

    // Calculate Fan DNA
    const dnaResult = await calculateFanDNA(user.id);
    console.log('✅ Fan DNA calculated:', dnaResult);

    // Show celebration and navigate to results
    setCelebrateVote(true);
    setTimeout(() => {
      setCelebrateVote(false);
      setCurrentView('results');
    }, 2000);

  } catch (error) {
    console.error('Error submitting vote:', error);
    alert('Error submitting ballot. Check console for details.');
  } finally {
    setSaving(false);
  }
};
  // Generate roast
  const generateRoast = () => {
  if (myRankings.length === 0) {
    setRoastText("Can't roast an empty ballot! Pick some teams first. 🤷");
    return;
  }

  const roasts = [];
  
  // Check for favorite team bias
  const favoriteTeam = teams.find(t => t.id === userProfile?.favorite_team_id);
  if (favoriteTeam && myRankings.find(r => r.id === favoriteTeam.id)) {
    const favoriteRank = myRankings.findIndex(r => r.id === favoriteTeam.id) + 1;
    if (favoriteRank <= 5) {
      roasts.push(`${favoriteTeam.name} at #${favoriteRank}? Homer much? 🏠`);
    }
  }
  
  // Check for controversial picks
  const unrankedTeams = myRankings.filter(t => !t.ap_rank || t.ap_rank > 25);
  if (unrankedTeams.length > 5) {
    roasts.push(`${unrankedTeams.length} unranked teams? Someone's feeling spicy! 🌶️`);
  }
  
  // Check for blue blood bias
  const blueBloods = ['Kansas', 'Duke', 'North Carolina', 'Kentucky', 'UCLA'];
  const blueBloodCount = myRankings.filter(r => 
    blueBloods.some(bb => r.name.includes(bb))
  ).length;
  if (blueBloodCount >= 4) {
    roasts.push("Did ESPN make this ballot for you? So many blue bloods. 📺");
  }
  
  // Check for conference bias
  const conferenceCount = {};
  myRankings.forEach(r => {
    conferenceCount[r.conference] = (conferenceCount[r.conference] || 0) + 1;
  });
  const topConf = Object.entries(conferenceCount).sort((a, b) => b[1] - a[1])[0];
  if (topConf && topConf[1] >= 6) {
    roasts.push(`${topConf[1]} ${topConf[0]} teams? Your bias is showing. 🔔`);
  }
  
  // Default roasts if nothing specific
  if (roasts.length === 0) {
    roasts.push(
      "This ballot is... actually pretty reasonable. Boring! 😴",
      "Interesting choices. Bold strategy, Cotton. 🎯",
      "Are we ranking basketball teams or your favorite mascots? 🤔"
    );
  }
  
  setRoastText(roasts[Math.floor(Math.random() * roasts.length)]);
};

  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = darkMode ? 'text-white' : 'text-gray-900';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';

  // Show login screen if not authenticated
if (!user) {
  return (
    <div className={`min-h-screen ${bgColor} ${textColor} flex items-center justify-center`}>
      <div className={`${cardBg} p-8 rounded-lg border ${borderColor} w-full max-w-md`}>
        <div className="text-center mb-6">
          <Trophy className="text-blue-500 mx-auto mb-4" size={48} />
          <h1 className="text-3xl font-bold">FanIndex</h1>
          <p className="text-gray-500">College Basketball Fan Rankings</p>
        </div>

        {authView === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full px-4 py-2 ${cardBg} border ${borderColor} rounded-lg`}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full px-4 py-2 ${cardBg} border ${borderColor} rounded-lg`}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold disabled:opacity-50"
            >
              {authLoading ? 'Loading...' : 'Login'}
            </button>
            <p className="text-center text-sm">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthView('signup')}
                className="text-blue-500 hover:underline"
              >
                Sign up
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full px-4 py-2 ${cardBg} border ${borderColor} rounded-lg`}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={`w-full px-4 py-2 ${cardBg} border ${borderColor} rounded-lg`}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold disabled:opacity-50"
            >
              {authLoading ? 'Loading...' : 'Sign Up'}
            </button>
            <p className="text-center text-sm">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthView('login')}
                className="text-blue-500 hover:underline"
              >
                Login
              </button>
            </p>
          </form>
        )}
    </div>
  </div>
  );
}
// Show username creation screen if needed
// Show username creation screen if needed
if (needsUsername) {
  return (
    <div className={`min-h-screen ${bgColor} ${textColor} flex items-center justify-center`}>
      <div className={`${cardBg} p-8 rounded-lg border ${borderColor} w-full max-w-md`}>
        <div className="text-center mb-6">
          <Trophy className="text-blue-500 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold">Welcome to FanIndex!</h1>
          <p className="text-gray-500 mt-2">Set up your profile</p>
        </div>

        <form onSubmit={createUserProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
              className={`w-full px-4 py-2 ${cardBg} border ${borderColor} rounded-lg`}
              placeholder="hoopsfan23"
            />
            <p className="text-xs text-gray-500 mt-1">3-20 characters, letters, numbers, and underscores only</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Favorite Team (Optional)</label>
            <input
              type="text"
              placeholder="Search for your team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-2 ${cardBg} border ${borderColor} rounded-lg mb-2`}
            />
            <select
              value={selectedFavoriteTeam}
              onChange={(e) => setSelectedFavoriteTeam(e.target.value)}
              className={`w-full px-4 py-2 ${cardBg} border ${borderColor} rounded-lg`}
            >
              <option value="">-- Select Your Team --</option>
              {teams
                .filter(team => searchQuery === '' || team.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(team => (
                  <option key={team.id} value={team.id}>
                    {team.logo_emoji} {team.name}
                  </option>
                ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">This helps us calculate your Homer Score!</p>
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold disabled:opacity-50"
          >
            {authLoading ? 'Creating...' : 'Continue to FanIndex'}
          </button>
        </form>
      </div>
    </div>
  );
}

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} transition-colors duration-300`}>
      {/* Celebrate Animation */}
      {celebrateVote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 pointer-events-none">
          <div className="text-center animate-bounce">
            <div className="text-8xl mb-4">🎉</div>
            <div className="text-4xl font-bold text-white">Vote Submitted!</div>
            <div className="text-xl text-gray-300 mt-2">+10 Accuracy Points</div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`${cardBg} border-b ${borderColor} sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <Trophy className="text-blue-500" size={32} />
              <div>
                <h1 className="text-2xl font-bold">FanIndex</h1>
                <p className="text-xs text-gray-500">CBB Voting Open• Voting Open</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-orange-500 bg-opacity-20 rounded-lg">
              <Flame className="text-orange-500" size={20} />
              <span className="font-bold">{userProfile?.current_streak || 0}</span>
            </div>

            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-700 rounded-lg"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-gray-700 rounded-lg"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

           <button onClick={() => setCurrentView('profile')} className="flex items-center gap-2">
            <div className="text-2xl">👤</div>
            <span className="hidden md:block text-sm">{userProfile?.username || user?.email?.split('@')[0]}</span>
          </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${cardBg} border-r ${borderColor} w-64 fixed lg:sticky top-16 h-screen transition-transform duration-300 z-30 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <nav className="p-4 space-y-2">
            <button
              onClick={() => { setCurrentView('home'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${currentView === 'home' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
            >
              <Home size={20} />
              <span>Home</span>
            </button>
            <button
              onClick={() => { setCurrentView('vote'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${currentView === 'vote' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
            >
              <Target size={20} />
              <span>Vote Now</span>
            </button>
            <button
              onClick={() => { setCurrentView('results'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${currentView === 'results' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
            >
              <BarChart3 size={20} />
              <span>Results</span>
            </button>
            <button
              onClick={() => { setCurrentView('leaderboard'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${currentView === 'leaderboard' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
            >
              <Trophy size={20} />
              <span>Leaderboard</span>
            </button>
            <button
              onClick={() => { setCurrentView('debate'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${currentView === 'debate' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
            >
              <MessageSquare size={20} />
              <span>Debate Zone</span>
            </button>
            <button
              onClick={() => { setCurrentView('profile'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${currentView === 'profile' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
            >
              <User size={20} />
              <span>My Profile</span>
            </button>
            <button
              onClick={() => { setCurrentView('analytics'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${currentView === 'analytics' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
            >
              <Activity size={20} />
              <span>Analytics Hub</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition hover:bg-red-600 text-red-400 hover:text-white mt-4"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <div role="main" className="flex-1 p-6">
          {/* HOME VIEW */}
          {currentView === 'home' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold">Welcome back, {userProfile?.username || user?.email?.split('@')[0]}! 👋</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Voting Streak</p>
                      <p className="text-3xl font-bold">{userProfile?.current_streak || 0}</p>
                    </div>
                    <Flame className="text-orange-500" size={32} />
                  </div>
                </div>
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Accuracy</p>
                      <p className="text-3xl font-bold">{userProfile?.fan_confidence_score || 0}%</p>
                    </div>
                    <Target className="text-green-500" size={32} />
                  </div>
                </div>
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total Votes</p>
                      <p className="text-3xl font-bold">{userProfile?.current_streak || 0}</p>
                    </div>
                    <Award className="text-blue-500" size={32} />
                  </div>
                </div>
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Badges</p>
                      <p className="text-3xl font-bold">{userBadges.length}</p>
                    </div>
                    <Trophy className="text-yellow-500" size={32} />
                  </div>
                </div>
              </div>

              <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
  <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <button
      onClick={() => setCurrentView('vote')}
      className="flex items-center gap-3 p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
    >
      <Target size={24} />
      <div className="text-left">
        <p className="font-bold">Submit Ballot</p>
        <p className="text-sm text-gray-200">Voting Open</p>
      </div>
    </button>
    <button
      onClick={() => {
        fetchLeaderboard();
        setCurrentView('leaderboard');
      }}
      className="flex items-center gap-3 p-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
    >
      <Trophy size={24} />
      <div className="text-left">
        <p className="font-bold">View Leaderboard</p>
        <p className="text-sm text-gray-200">
          {userRank ? `You're rank #${userRank}!` : 'Submit a ballot to get ranked!'}
        </p>
      </div>
    </button>
   <button
  onClick={() => setCurrentView('debate')}
  className="flex items-center gap-3 p-4 bg-green-600 hover:bg-green-700 rounded-lg transition"
>
  <MessageSquare size={24} />
  <div className="text-left">
    <p className="font-bold">Join Debate</p>
    <p className="text-sm text-gray-200">
      {debateTopics.length} active discussion{debateTopics.length !== 1 ? 's' : ''}
    </p>
  </div>
</button>
  </div>
</div>

              <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
  <h3 className="text-2xl font-bold mb-6 text-center">AP Poll vs FanIndex Poll</h3>
  
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* AP POLL */}
    <div>
      <h4 className="text-xl font-bold mb-4 text-blue-500 flex items-center gap-2">
        <Trophy size={24} />
        AP Poll (Official)
      </h4>
      <div className="space-y-2">
        {teams
          .filter(team => team.ap_rank && team.ap_rank <= 25)
          .sort((a, b) => a.ap_rank - b.ap_rank)
          .slice(0, 10)
          .map((team) => (
            <div key={team.id} className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition">
              <span className="text-xl font-bold text-gray-500 w-8">#{team.ap_rank}</span>
              <span className="text-2xl">{team.logo_emoji}</span>
              <div className="flex-1">
                <p className="font-bold">{team.name}</p>
                <p className="text-xs text-gray-500">{team.conference}</p>
              </div>
              <span className="text-sm text-gray-400">{team.ap_points} pts</span>
            </div>
          ))}
      </div>
    </div>

    {/* FANINDEX POLL */}
    <div>
      <h4 className="text-xl font-bold mb-4 text-green-500 flex items-center gap-2">
        <Users size={24} />
        FanIndex Poll (Fan Votes)
      </h4>
      <div className="space-y-2">
        {fanIndexRankings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No votes yet!</p>
            <p className="text-sm mt-2">Be the first to vote</p>
          </div>
        ) : (
          fanIndexRankings.slice(0, 10).map((team) => (
            <div key={team.id} className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition">
              <span className="text-xl font-bold text-gray-500 w-8">#{team.fanIndexRank}</span>
              <span className="text-2xl">{team.logo_emoji}</span>
              <div className="flex-1">
                <p className="font-bold">{team.name}</p>
                <p className="text-xs text-gray-500">{team.conference}</p>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-400">{team.fanIndexPoints} pts</span>
                {team.ap_rank && (
                  <p className="text-xs text-gray-600">AP: #{team.ap_rank}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
    </div>
  </div>
)}

  {/* VOTE VIEW */}
{currentView === 'vote' && (
  <div className="space-y-6">
    {/* Check if already voted */}
    {hasVotedThisWeek ? (
      <div className="text-center py-12">
        <div className={`${cardBg} p-8 rounded-lg border ${borderColor} max-w-2xl mx-auto`}>
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-3xl font-bold mb-4">You've Already Voted This Week!</h2>
          <p className="text-gray-400 mb-6">
            Thanks for submitting your ballot. Come back next Monday to vote again!
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setCurrentView('results')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
            >
              View Results
            </button>
            <button
              onClick={() => setCurrentView('leaderboard')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold"
            >
              Check Leaderboard
            </button>
          </div>
        </div>
      </div>
    ) : (
      <>
        {/* Your existing vote UI */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-3xl font-bold">Build Your Top 25</h2>
          <div className="flex gap-2">
            <button
              onClick={generateRoast}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
            >
              <Zap size={20} />
              Roast My Ballot
            </button>
            <button
              onClick={submitVote}
              disabled={saving || myRankings.length !== 25}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold disabled:opacity-50"
            >
              <Trophy size={20} />
              {saving ? 'Saving...' : myRankings.length === 25 ? 'Submit Vote' : `Select ${25 - myRankings.length} More`}
            </button>
          </div>
        </div>

        {roastText && (
          <div className="bg-purple-600 bg-opacity-20 border border-purple-500 rounded-lg p-4">
            <p className="text-lg">{roastText}</p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* LEFT SIDE - Available Teams */}
          <div className={`${cardBg} p-8 rounded-lg border ${borderColor}`}>
            <h3 className="text-xl font-bold mb-4">Available Teams</h3>
            
            {/* Conference Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['AP Top 25', 'ACC', 'Big 12', 'Big Ten', 'SEC', 'Big East', 'All Teams'].map((conf) => (
                <button
                  key={conf}
                  onClick={() => setSelectedConference(conf)}
                  className={`px-4 py-2 rounded-lg transition ${
                    selectedConference === conf
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {conf}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-2 ${cardBg} border ${borderColor} rounded-lg mb-4`}
            />

            {/* Team List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {availableTeams
                .filter(team => {
                  // Filter by conference
                  if (selectedConference === 'All Teams') return true;
                  if (selectedConference === 'AP Top 25') return team.ap_rank && team.ap_rank <= 25;
                  return team.conference === selectedConference;
                })
                .filter(team => {
                  // Filter by search
                  if (!searchQuery) return true;
                  return team.name.toLowerCase().includes(searchQuery.toLowerCase());
                })
                .filter(team => {
                  // Don't show teams already in ballot
                  return !myRankings.find(t => t.id === team.id);
                })
                .sort((a, b) => {
                  // Sort AP Poll by rank
                  if (selectedConference === 'AP Top 25') {
                    return (a.ap_rank || 999) - (b.ap_rank || 999);
                  }
                  // Keep alphabetical for all other tabs
                  return a.name.localeCompare(b.name);
                })
                .map((team) => (
                  <div
                    key={team.id}
                    onClick={() => {
                      if (myRankings.length < 25) {
                        setMyRankings([...myRankings, team]);
                      }
                    }}
                    className={`flex items-center gap-3 p-3 border ${borderColor} rounded-lg cursor-pointer hover:bg-gray-700 transition ${
                      myRankings.length >= 25 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <span className="text-2xl">{team.logo_emoji}</span>
                    <div className="flex-1">
                      <p className="font-bold">{team.name}</p>
                      <p className="text-xs text-gray-500">{team.conference} • {team.wins}-{team.losses}</p>
                    </div>
                    <span className="text-sm text-blue-500">+ Add</span>
                  </div>
                ))}
            </div>
          </div>

          {/* RIGHT SIDE - My Top 25 Ballot */}
          <div className={`${cardBg} p-8 rounded-lg border ${borderColor}`}>
            <h3 className="text-xl font-bold mb-4">
              Your Top 25 ({myRankings.length}/25)
            </h3>
            <p className="text-sm text-gray-500 mb-4">👆 Drag to reorder • Click X to remove</p>
            
            <div className="space-y-2 max-h-[700px] overflow-y-auto">
              {myRankings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Trophy size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Click teams from the left to add to your ballot</p>
                </div>
              ) : (
                myRankings.map((team, index) => (
                  <div
                    key={team.id}
                    className={`flex items-center gap-2 p-4 ${cardBg} border ${borderColor} rounded-lg transition-all duration-200 ${
                      draggedItem === index ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Up/Down Arrows for Mobile */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveTeamUp(index)}
                        disabled={index === 0}
                        className="p-1 hover:bg-blue-600 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ChevronRight size={20} className="rotate-[-90deg]" />
                      </button>
                      <button
                        onClick={() => moveTeamDown(index)}
                        disabled={index === myRankings.length - 1}
                        className="p-1 hover:bg-blue-600 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ChevronRight size={20} className="rotate-90" />
                      </button>
                    </div>

                    <span className="text-2xl font-bold text-gray-500 w-8">#{index + 1}</span>
                    <span className="text-3xl">{team.logo_emoji}</span>
                    <div className="flex-1">
                      <p className="font-bold">{team.name}</p>
                      <p className="text-sm text-gray-500">{team.conference}</p>
                    </div>
                    <button
                      onClick={() => {
                        const newRankings = myRankings.filter(t => t.id !== team.id);
                        setMyRankings(newRankings);
                      }}
                      className="p-2 hover:bg-red-600 rounded-lg transition"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </>
    )}
  </div>
)}
{/* RESULTS VIEW */}
{currentView === 'results' && (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold">Results & Analytics</h2>

    <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Activity size={24} className="text-blue-500" />
        Team Momentum & Hype Meter
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        Teams getting the most fan attention and votes
      </p>
      <div className="space-y-4">
        {teamStats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No voting data yet!</p>
            <p className="text-sm mt-2">Vote to see team momentum</p>
          </div>
        ) : (
          teamStats.map((team) => (
            <div key={team.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{team.logo_emoji}</span>
                  <div>
                    <span className="font-bold">{team.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      Avg Rank: #{team.avgRank} • {team.appearances} votes
                    </span>
                  </div>
                </div>
                <span className="text-sm font-bold">{team.hypeScore}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    team.hypeScore > 85 ? 'bg-green-500' : 
                    team.hypeScore > 70 ? 'bg-yellow-500' : 
                    'bg-blue-500'
                  }`}
                  style={{ width: `${team.hypeScore}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>

   <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
    <Zap size={24} className="text-yellow-500" />
    Volatility Index - Most Controversial Teams
  </h3>
  <p className="text-sm text-gray-400 mb-4">
    Teams with the biggest disagreements in fan rankings
  </p>
  {controversialTeams.length === 0 ? (
    <div className="text-center py-8 text-gray-500">
      <p>Not enough data yet!</p>
      <p className="text-sm mt-2">More votes needed to calculate controversy</p>
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {controversialTeams.map((team) => (
        <div key={team.id} className="p-4 bg-red-600 bg-opacity-20 border border-red-500 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{team.logo_emoji}</span>
            <div>
              <p className="font-bold">{team.name}</p>
              <p className="text-sm text-gray-400">
                Variance: {team.variance ? team.variance.toFixed(1) : 'N/A'}
              </p>
            </div>
          </div>
          <p className="text-sm">
            High ranking disagreement among voters
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {team.appearances} voters • Avg: #{team.avgRank}
          </p>
        </div>
      ))}
    </div>
  )}
</div>
  </div>
)}

          {/* LEADERBOARD VIEW */}
          {currentView === 'leaderboard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Global Leaderboard</h2>
                <button
                  onClick={fetchLeaderboard}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                >
                  🔄 Refresh
                </button>
              </div>

              <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
                <div className="space-y-3">
                  {leaderboardLoading ? (
                    <div className="text-center py-8">
                      <p>Loading leaderboard...</p>
                    </div>
                  ) : leaderboardData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No voters yet. Be the first to submit a ballot!</p>
                    </div>
                  ) : (
                     leaderboardData.map((user) => (
                    <div
                      key={user.rank}
                      className={`flex items-center gap-4 p-4 rounded-lg ${
                        user.isCurrentUser ? 'bg-blue-600 bg-opacity-20 border border-blue-500' : 'hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-700 font-bold text-xl">
                        {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : `#${user.rank}`}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold">{user.user}</p>
                          {user.isCurrentUser && <span className="text-xs bg-blue-600 px-2 py-1 rounded">YOU</span>}
                        </div>
                        <p className="text-sm text-gray-400">Accuracy: {user.accuracy}%</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-orange-500">
                          <Flame size={20} />
                          <span className="font-bold">{user.streak}</span>
                        </div>
                        <p className="text-sm text-gray-400">{user.badges} badges</p>
                      </div>
                    </div>
                  ))
                )}
                </div>
              </div>
            </div>
          )}

          {/* DEBATE VIEW */}
{currentView === 'debate' && (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold">Debate Zone - Defend Your Ballot</h2>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {debateTopics.map((topic) => (
        <div key={topic.id} className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">{topic.title}</h3>
            <span className="text-sm text-gray-500">
              {topic.commentCount} comments
            </span>
          </div>
          <p className="text-gray-400 mb-4">{topic.description}</p>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => voteOnTopic(topic.id, 'up')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
            >
              <ThumbsUp size={16} />
              <span>{topic.upvotes || 0}</span>
            </button>
            <button 
              onClick={() => voteOnTopic(topic.id, 'down')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
            >
              <ThumbsDown size={16} />
              <span>{topic.downvotes || 0}</span>
            </button>
            <button 
              onClick={() => {
                setSelectedTopic(topic);
                fetchDebateComments(topic.id);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded ml-auto"
            >
              <MessageSquare size={16} />
              <span>Join Discussion</span>
            </button>
          </div>
        </div>
      ))}
    </div>

    {/* Comment Modal - Full Screen Overlay */}
    {selectedTopic && (
      <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
        <div className={`${cardBg} rounded-lg border ${borderColor} w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex-1">
              <h3 className="text-2xl font-bold">{selectedTopic.title}</h3>
              <p className="text-gray-400 mt-2">{selectedTopic.description}</p>
            </div>
            <button 
              onClick={() => setSelectedTopic(null)}
              className="text-gray-500 hover:text-white ml-4"
            >
              <X size={32} />
            </button>
          </div>
          
          {/* Post Comment */}
          <div className="p-6 border-b border-gray-700">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              className={`w-full px-4 py-3 ${cardBg} border ${borderColor} rounded-lg min-h-[100px]`}
            />
            <button
              onClick={() => postComment(selectedTopic.id)}
              disabled={!newComment.trim()}
              className="mt-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold disabled:opacity-50"
            >
              Post Comment
            </button>
          </div>

          {/* Comments List - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {debateComments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No comments yet. Be the first to share your opinion!
              </p>
            ) : (
              debateComments.map((comment) => (
                <div key={comment.id} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold">{comment.users?.username || 'Anonymous'}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300">{comment.comment_text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )}
  </div>
)}

{/* PROFILE VIEW */}
{currentView === 'profile' && (
  <div className="space-y-6">
    <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
      <div className="flex items-start gap-6">
        <div className="text-6xl">👤</div>
        <div className="flex-1">
          <h2 className="text-3xl font-bold">{userProfile?.full_name || userProfile?.username || 'User'}</h2>
          <p className="text-gray-500">@{userProfile?.username}</p>
          <p className="text-sm text-gray-400">{user?.email}</p>
          <div className="flex items-center gap-6 mt-4">
            <div>
              <p className="font-bold">0</p>
              <p className="text-sm text-gray-500">Following</p>
            </div>
            <div>
              <p className="font-bold">0</p>
              <p className="text-sm text-gray-500">Followers</p>
            </div>
            <div>
              <p className="font-bold">{userProfile?.total_weeks_participated || 0}</p>
              <p className="text-sm text-gray-500">Votes</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Zap size={24} className="text-purple-500" />
        Your Fan DNA
      </h3>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span>Homer Score</span>
            <span className="font-bold">{userProfile?.fanDNA?.homerScore ?? 0}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${userProfile?.fanDNA?.homerScore ?? 0}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span>Chaos Score</span>
            <span className="font-bold">{userProfile?.fanDNA?.chaosScore ?? 0}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div className="bg-orange-500 h-full rounded-full" style={{ width: `${userProfile?.fanDNA?.chaosScore ?? 0}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span>Contrarian Index</span>
            <span className="font-bold">{userProfile?.fanDNA?.contrarian ?? 0}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${userProfile?.fanDNA?.contrarian ?? 0}%` }} />
          </div>
        </div>
      </div>
    </div>

    <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
      <h3 className="text-xl font-bold mb-4">Achievements</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {allBadges.map((badge) => {
          const isUnlocked = userBadges.some(ub => ub.badge_id === badge.id);
          return (
            <div
              key={badge.id}
              className={`p-4 rounded-lg border ${
                isUnlocked
                  ? 'bg-yellow-600 bg-opacity-20 border-yellow-500'
                  : 'bg-gray-700 opacity-50 border-gray-600'
              }`}
            >
              <div className="text-4xl text-center mb-2">{badge.icon}</div>
              <p className="text-center font-bold text-sm">{badge.name}</p>
              <p className="text-center text-xs text-gray-400">{badge.description}</p>
              {isUnlocked && (
                <p className="text-center text-xs text-green-500 mt-1">✓ Unlocked</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  </div>
)}
          {/* ANALYTICS VIEW */}
{currentView === 'analytics' && (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold">Analytics Hub</h2>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
        <p className="text-gray-500 text-sm">Total Voters</p>
        <p className="text-3xl font-bold">{analyticsData.totalVoters.toLocaleString()}</p>
      </div>
      <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
        <p className="text-gray-500 text-sm">Avg Accuracy</p>
        <p className="text-3xl font-bold">
          {analyticsData.avgAccuracy > 0 ? `${analyticsData.avgAccuracy}%` : 'N/A'}
        </p>
      </div>
      <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
        <p className="text-gray-500 text-sm">Active Debates</p>
        <p className="text-3xl font-bold">{analyticsData.activeDebates}</p>
      </div>
      <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
        <p className="text-gray-500 text-sm">Teams Tracked</p>
        <p className="text-3xl font-bold">{analyticsData.teamsTracked}</p>
      </div>
    </div>

    <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
      <h3 className="text-xl font-bold mb-4">Conference Power Rankings</h3>
      <p className="text-sm text-gray-400 mb-4">
        Based on total fan voting points across all teams in each conference
      </p>
      {conferencePower.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No voting data yet!</p>
          <p className="text-sm mt-2">Submit ballots to see conference rankings</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conferencePower.map((conf, idx) => (
            <div key={conf.conference} className="flex items-center justify-between p-3 bg-blue-600 bg-opacity-20 rounded">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-gray-500 w-8">#{idx + 1}</span>
                <span className="font-bold">{conf.conference}</span>
              </div>
              <div className="text-right">
                <p className="font-bold">{conf.rating}/100</p>
                <p className="text-xs text-gray-500">{conf.points} pts</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    <div className={`${cardBg} p-6 rounded-lg border ${borderColor}`}>
      <h3 className="text-xl font-bold mb-4">Platform Insights</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-bold mb-2">Most Active Voters</h4>
          {leaderboardData.length === 0 ? (
            <p className="text-sm text-gray-500">No data yet</p>
          ) : (
            <div className="space-y-2">
              {leaderboardData.slice(0, 5).map((voter) => (
                <div key={voter.rank} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                  <span className="text-sm">{voter.user}</span>
                  <span className="text-xs text-gray-400">{voter.totalVotes} votes</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h4 className="font-bold mb-2">Trending Teams</h4>
          {teamStats.length === 0 ? (
            <p className="text-sm text-gray-500">No data yet</p>
          ) : (
            <div className="space-y-2">
              {teamStats.slice(0, 5).map((team) => (
                <div key={team.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{team.logo_emoji}</span>
                    <span className="text-sm">{team.name}</span>
                  </div>
                  <span className="text-xs text-green-500">{team.hypeScore}% hype</span>
                </div>
              ))}
            </div>
         )}
        </div>
      </div>
    </div>
  </div>
)}
         </div>
      </div>
    </div>
  );
}