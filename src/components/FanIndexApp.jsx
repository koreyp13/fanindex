import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { BarChart3, TrendingUp, TrendingDown, Users, Award, Bell, Search, Menu, Home, Vote, BarChart2, MessageSquare, User, X, ChevronRight, ChevronDown, Clock, Star, Filter, Share2, Check, Calendar, Trophy, Flame, Settings, Moon, Sun } from 'lucide-react';

const FanIndexApp = () => {
  // Core State
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [votingOpen, setVotingOpen] = useState(true);
  const [userBallot, setUserBallot] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const { signOut } = useAuth()
  const [showShareModal, setShowShareModal] = useState(false);
  const [ballotSubmitted, setBallotSubmitted] = useState(false);

  // Fetch teams from Supabase on mount
  useEffect(() => {
    fetchTeams();
    checkAuth();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Transform Supabase data to match app format
      const formattedTeams = data.map(team => ({
        id: team.id,
        name: team.name,
        logo: team.logo_emoji,
        conference: team.conference,
        rank: null,
        votes: 0,
        record: '0-0',
        momentum: 0,
        confidence: 0
      }));
      
      setTeams(formattedTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleAddToRanking = (team) => {
  if (userBallot.length >= 25) {
    alert('You can only rank 25 teams!');
    return;
  }
  if (userBallot.find(t => t.id === team.id)) {
    alert('Team already in your rankings!');
    return;
  }
  // Add to END of ballot, not at a specific rank
  setUserBallot([...userBallot, team]);
};

  const handleRemoveFromRanking = (teamId) => {
    setUserBallot(userBallot.filter(t => t.id !== teamId));
  };

  const moveTeam = (fromIndex, toIndex) => {
    const newBallot = [...userBallot];
    const [movedTeam] = newBallot.splice(fromIndex, 1);
    newBallot.splice(toIndex, 0, movedTeam);
    setUserBallot(newBallot);
  };

  const submitBallot = async () => {
    if (userBallot.length !== 25) {
      alert('Please rank exactly 25 teams before submitting!');
      return;
    }

    if (!user) {
      alert('Please sign in to submit your ballot!');
      return;
    }

    try {
      const rankings = userBallot.map((team, index) => ({
        rank: index + 1,
        team_id: team.id
      }));

      const { error } = await supabase
        .from('ballots')
        .insert({
          user_id: user.id,
          week_id: 1, // You'll need to get the current week
          rankings: rankings
        });

      if (error) throw error;

      setBallotSubmitted(true);
      setShowShareModal(true);
      alert('Ballot submitted successfully!');
    } catch (error) {
      console.error('Error submitting ballot:', error);
      alert('Error submitting ballot. Please try again.');
    }
  };

  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-orange-50';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  if (loading) {
    return (
      <div className={`min-h-screen ${bgColor} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-6xl mb-4">🏀</div>
          <div className={`text-xl ${textPrimary}`}>Loading FanIndex...</div>
          <div className={`text-sm ${textSecondary} mt-2`}>Connecting to database...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgColor} transition-colors duration-300`}>
      {/* Top Navigation */}
      <nav className={`${cardBg} shadow-lg sticky top-0 z-50 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏀</div>
              <div>
                <h1 className={`text-2xl font-bold ${textPrimary}`}>FanIndex</h1>
                <p className={`text-xs ${textSecondary}`}>College Basketball</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>
              <Bell className={`w-6 h-6 ${textSecondary} cursor-pointer hover:text-blue-600`} />
              <button onClick={signOut} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <User className={`w-6 h-6 ${textSecondary}`} />
                </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'vote', label: 'Vote', icon: Vote },
            { id: 'rankings', label: 'Rankings', icon: BarChart2 },
            { id: 'community', label: 'Community', icon: MessageSquare }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : `${cardBg} ${textPrimary} hover:bg-gray-100 dark:hover:bg-gray-700`
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className={`${cardBg} rounded-2xl p-8 shadow-xl`}>
              <h2 className={`text-3xl font-bold ${textPrimary} mb-2`}>Welcome to FanIndex! 🏀</h2>
              <p className={`${textSecondary} mb-6`}>Vote on your Top 25 and see how you compare to other fans!</p>
              
              {votingOpen ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-orange-600">
                    <Clock className="w-6 h-6" />
                    <span className="font-semibold">Voting is OPEN! Submit your ballot now.</span>
                  </div>
                  <button 
                    onClick={() => setActiveTab('vote')}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-lg"
                  >
                    🗳️ Vote Now
                  </button>
                </div>
              ) : (
                <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-6 text-center">
                  <p className={`${textSecondary}`}>Voting opens Sunday at noon</p>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`${cardBg} rounded-xl p-6 shadow-lg`}>
                <div className="flex items-center justify-between mb-3">
                  <Users className="w-8 h-8 text-blue-600" />
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <p className={`text-3xl font-bold ${textPrimary}`}>{teams.length}</p>
                <p className={`${textSecondary} text-sm`}>Teams Available</p>
              </div>
              
              <div className={`${cardBg} rounded-xl p-6 shadow-lg`}>
                <div className="flex items-center justify-between mb-3">
                  <Trophy className="w-8 h-8 text-yellow-600" />
                  <Flame className="w-6 h-6 text-orange-600" />
                </div>
                <p className={`text-3xl font-bold ${textPrimary}`}>Week 1</p>
                <p className={`${textSecondary} text-sm`}>Current Season</p>
              </div>
              
              <div className={`${cardBg} rounded-xl p-6 shadow-lg`}>
                <div className="flex items-center justify-between mb-3">
                  <Award className="w-8 h-8 text-purple-600" />
                  <Star className="w-6 h-6 text-yellow-500" />
                </div>
                <p className={`text-3xl font-bold ${textPrimary}`}>0</p>
                <p className={`${textSecondary} text-sm`}>Your Votes This Season</p>
              </div>
            </div>

            {/* Database Status */}
            <div className={`${cardBg} rounded-xl p-6 shadow-lg border-2 border-green-500`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h3 className={`text-xl font-bold ${textPrimary}`}>✅ Connected to Supabase!</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className={`text-2xl font-bold text-green-600`}>{teams.length}</p>
                  <p className={`${textSecondary} text-sm`}>Teams Loaded</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold text-blue-600`}>
                    {[...new Set(teams.map(t => t.conference))].length}
                  </p>
                  <p className={`${textSecondary} text-sm`}>Conferences</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold text-purple-600`}>Live</p>
                  <p className={`${textSecondary} text-sm`}>Backend Status</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold text-orange-600`}>Ready</p>
                  <p className={`${textSecondary} text-sm`}>To Vote</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vote Tab */}
        {activeTab === 'vote' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Your Rankings */}
            <div className={`${cardBg} rounded-2xl p-6 shadow-xl`}>
              <h2 className={`text-2xl font-bold ${textPrimary} mb-4`}>Your Top 25</h2>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className={`${textSecondary} text-sm`}>Progress</span>
                  <span className={`font-bold ${textPrimary}`}>{userBallot.length}/25</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(userBallot.length / 25) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                {userBallot.length === 0 ? (
                  <div className="text-center py-12">
                    <p className={`${textSecondary} mb-2`}>No teams ranked yet</p>
                    <p className="text-sm text-gray-400">Select teams from the right →</p>
                  </div>
                ) : (
                  userBallot.map((team, index) => (
                    <div 
                      key={team.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => index > 0 && moveTeam(index, index - 1)}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-500 rounded disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => index < userBallot.length - 1 && moveTeam(index, index + 1)}
                          disabled={index === userBallot.length - 1}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-500 rounded disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                      <span className="font-bold text-blue-600 w-8">{index + 1}.</span>
                      <span className="text-2xl">{team.logo}</span>
                      <span className={`font-semibold flex-1 ${textPrimary}`}>{team.name}</span>
                      <span className={`text-xs ${textSecondary}`}>{team.conference}</span>
                      <button
                        onClick={() => handleRemoveFromRanking(team.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={submitBallot}
                disabled={userBallot.length !== 25 || ballotSubmitted}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  userBallot.length === 25 && !ballotSubmitted
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {ballotSubmitted ? '✅ Ballot Submitted!' : `Submit Ballot (${userBallot.length}/25)`}
              </button>
            </div>

            {/* Available Teams */}
            <div className={`${cardBg} rounded-2xl p-6 shadow-xl`}>
              <div className="mb-4">
                <h2 className={`text-2xl font-bold ${textPrimary} mb-2`}>Available Teams</h2>
                <input
                  type="text"
                  placeholder="Search teams..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {teams.map(team => {
                  const isRanked = userBallot.find(t => t.id === team.id);
                  return (
                    <button
                      key={team.id}
                      onClick={() => !isRanked && handleAddToRanking(team)}
                      disabled={isRanked}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        isRanked
                          ? 'bg-gray-100 dark:bg-gray-700 opacity-50 cursor-not-allowed'
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span className="text-2xl">{team.logo}</span>
                      <div className="flex-1 text-left">
                        <div className={`font-semibold ${textPrimary}`}>{team.name}</div>
                        <div className={`text-xs ${textSecondary}`}>{team.conference}</div>
                      </div>
                      {isRanked && <Check className="w-5 h-5 text-green-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Rankings Tab */}
        {activeTab === 'rankings' && (
          <div className={`${cardBg} rounded-2xl p-8 shadow-xl`}>
            <h2 className={`text-3xl font-bold ${textPrimary} mb-6`}>FanIndex Rankings</h2>
            <p className={`${textSecondary} mb-6`}>Rankings will appear here after voting closes.</p>
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No rankings yet - be the first to vote!</p>
            </div>
          </div>
        )}

        {/* Community Tab */}
        {activeTab === 'community' && (
          <div className={`${cardBg} rounded-2xl p-8 shadow-xl`}>
            <h2 className={`text-3xl font-bold ${textPrimary} mb-6`}>Community</h2>
            <p className={`${textSecondary} mb-6`}>Hot takes and discussions coming soon!</p>
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Community features launching soon!</p>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} rounded-2xl p-8 max-w-md w-full`}>
            <h3 className={`text-2xl font-bold ${textPrimary} mb-4`}>🎉 Ballot Submitted!</h3>
            <p className={`${textSecondary} mb-6`}>Share your rankings with friends!</p>
            <div className="space-y-3">
              <button className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800">
                Share to X (Twitter)
              </button>
              <button 
                onClick={() => setShowShareModal(false)}
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-3 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FanIndexApp;