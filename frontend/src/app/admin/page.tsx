'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { api, Bounty, Metrics, User, Feedback } from '@/lib/api';
import { MOCK_BOUNTIES, MOCK_USERS, MOCK_METRICS, simulateDelay } from '@/lib/mockData';
import { Coins, Users, Activity, Database, RefreshCw, AlertTriangle, Shield, Wallet, TrendingUp, Clock, Zap, Target, GitBranch, ExternalLink, Server, Award, Link2, Box, MessageSquare, Star, Bug, Lightbulb, Heart, Check, X, ChevronDown, ChevronUp, Mail, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminPage() {
  const { user, loading, isDemo } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [eligibleForEscalation, setEligibleForEscalation] = useState<Bounty[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [escalating, setEscalating] = useState(false);
  
  // Feedback state
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<{ total: number; pending: number; reviewed: number; resolved: number }>({ total: 0, pending: 0, reviewed: 0, resolved: 0 });
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all');
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState<'all' | 'bug' | 'feature' | 'general' | 'praise'>('all');
  const [expandedFeedback, setExpandedFeedback] = useState<number | null>(null);
  const [updatingFeedback, setUpdatingFeedback] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isDemo]);

  const loadData = async () => {
    setLoadingData(true);
    
    // Use mock data in demo mode
    if (isDemo) {
      await simulateDelay(500);
      setMetrics(MOCK_METRICS as Metrics);
      setBounties(MOCK_BOUNTIES.slice(0, 10) as Bounty[]);
      setUsers(MOCK_USERS as User[]);
      // Filter bounties eligible for escalation in demo
      const eligibleBounties = MOCK_BOUNTIES.filter(b => b.isEligibleForEscalation);
      setEligibleForEscalation(eligibleBounties as Bounty[]);
      // Mock feedback data
      setFeedbackList([]);
      setFeedbackStats({ total: 0, pending: 0, reviewed: 0, resolved: 0 });
      setLoadingData(false);
      return;
    }

    try {
      const [metricsData, bountiesData, usersData, escalationData, feedbackData] = await Promise.all([
        api.getMetrics(),
        api.getAllBounties({ limit: 10 }),
        api.getAllUsers({ limit: 10 }),
        api.getEligibleForEscalation(),
        api.getAllFeedback({ limit: 50 }),
      ]);
      setMetrics(metricsData);
      setBounties(bountiesData.bounties || []);
      setUsers(usersData.users || []);
      setEligibleForEscalation(escalationData);
      setFeedbackList(feedbackData.feedback || []);
      setFeedbackStats(feedbackData.stats || { total: 0, pending: 0, reviewed: 0, resolved: 0 });
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleUpdateFeedbackStatus = async (feedbackId: number, status: 'pending' | 'reviewed' | 'resolved', notes?: string) => {
    setUpdatingFeedback(feedbackId);
    try {
      await api.updateFeedbackStatus(feedbackId, status, notes);
      // Update local state
      setFeedbackList(prev => prev.map(f =>
        f.id === feedbackId ? { ...f, status, admin_notes: notes || f.admin_notes } : f
      ));
      // Update stats
      setFeedbackStats(prev => {
        const oldStatus = feedbackList.find(f => f.id === feedbackId)?.status || 'pending';
        return {
          ...prev,
          [oldStatus]: prev[oldStatus as keyof typeof prev] - 1,
          [status]: (prev[status as keyof typeof prev] || 0) + 1,
        };
      });
    } catch (error) {
      console.error('Failed to update feedback:', error);
    } finally {
      setUpdatingFeedback(null);
    }
  };

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="w-4 h-4 text-red-500" />;
      case 'feature': return <Lightbulb className="w-4 h-4 text-honey-500" />;
      case 'praise': return <Heart className="w-4 h-4 text-pink-500" />;
      default: return <MessageSquare className="w-4 h-4 text-ocean-500" />;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Unknown';
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const filteredFeedback = feedbackList.filter(f => {
    if (feedbackFilter !== 'all' && f.status !== feedbackFilter) return false;
    if (feedbackTypeFilter !== 'all' && f.type !== feedbackTypeFilter) return false;
    return true;
  });

  const handleEscalation = async () => {
    setEscalating(true);
    
    // Simulate escalation in demo mode
    if (isDemo) {
      await simulateDelay(1500);
      alert(`Demo: ${eligibleForEscalation.length} bounties would be escalated`);
      setEscalating(false);
      return;
    }

    try {
      const result = await api.triggerEscalationCheck();
      alert(`Escalation complete: ${result.escalated} bounties escalated`);
      loadData();
    } catch (error) {
      console.error('Escalation failed:', error);
      alert('Escalation check failed');
    } finally {
      setEscalating(false);
    }
  };

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-grape-400 to-grape-600 flex items-center justify-center animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <p className="text-warm-500 animate-pulse">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-grape-400 to-grape-600 flex items-center justify-center shadow-grape">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-warm-900">Admin Dashboard</h1>
              <p className="text-warm-500">System overview and management</p>
            </div>
          </div>
          <button onClick={loadData} className="btn-secondary self-start md:self-auto" disabled={loadingData}>
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <div className="stat-card-ocean">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ocean-400 to-ocean-600 flex items-center justify-center shadow-ocean">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="badge-active text-xs">Live</span>
            </div>
            <div className="text-3xl font-bold text-ocean-600">{loadingData ? '...' : metrics?.bounties.total || 0}</div>
            <p className="text-warm-500 text-sm mt-1">Total Bounties</p>
          </div>

          <div className="stat-card-honey">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-honey-400 to-honey-600 flex items-center justify-center shadow-honey">
                <Coins className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="bounty-amount text-3xl">{loadingData ? '...' : metrics?.tokens.locked.toFixed(0) || 0}</div>
            <p className="text-warm-500 text-sm mt-1">MNEE Locked</p>
          </div>

          <div className="stat-card-grape">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-grape-400 to-grape-600 flex items-center justify-center shadow-grape">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-grape-600">{loadingData ? '...' : metrics?.bounties.active || 0}</div>
            <p className="text-warm-500 text-sm mt-1">Active Bounties</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600">{loadingData ? '...' : metrics?.bounties.success_rate || '0%'}</div>
            <p className="text-warm-500 text-sm mt-1">Success Rate</p>
          </div>
        </div>

        {/* Escrow Contract Section - Show when blockchain mode is enabled */}
        {metrics?.escrow?.enabled && (
          <div className="glass-card p-6 mb-8 border-2 border-ocean-200 bg-gradient-to-r from-ocean-50/50 to-grape-50/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-400 to-ocean-600 flex items-center justify-center">
                <Box className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-warm-800">Escrow Contract</h2>
                <p className="text-sm text-warm-500">On-chain bounty funds</p>
              </div>
              <span className="ml-auto badge-active">On-Chain</span>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/80 border border-ocean-100">
                <p className="text-xs text-warm-500 uppercase tracking-wide font-medium mb-1">Contract Address</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-warm-800 text-sm truncate" title={metrics.escrow.contract_address || ''}>
                    {metrics.escrow.contract_address
                      ? `${metrics.escrow.contract_address.slice(0, 8)}...${metrics.escrow.contract_address.slice(-6)}`
                      : 'Not configured'}
                  </p>
                  {metrics.escrow.contract_address && (
                    <a
                      href={`https://sepolia.etherscan.io/address/${metrics.escrow.contract_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ocean-500 hover:text-ocean-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-gradient-to-r from-ocean-100 to-grape-100 border border-ocean-200">
                <p className="text-xs text-warm-500 uppercase tracking-wide font-medium mb-1">Escrow Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-ocean-700">{metrics.escrow.balance?.toFixed(2) || '0'}</span>
                  <span className="text-ocean-600 font-medium">MNEE</span>
                </div>
                <p className="text-xs text-warm-500 mt-1">Funds locked in active bounties</p>
              </div>
              
              <div className="p-4 rounded-xl bg-white/80 border border-ocean-100">
                <p className="text-xs text-warm-500 uppercase tracking-wide font-medium mb-1">On-Chain Bounties</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-grape-700">{metrics.bounties.on_chain || 0}</span>
                  <span className="text-warm-500 text-sm">bounties</span>
                </div>
                <p className="text-xs text-warm-500 mt-1">Owner-funded via smart contract</p>
              </div>
            </div>
            
            {metrics.escrow.error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Error: {metrics.escrow.error}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legacy Wallet Section - Show when blockchain mode is disabled or as secondary info */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-honey-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-honey-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-warm-800">
                {metrics?.system.blockchain_mode ? 'Legacy MNEE Wallet' : 'Bot Wallet'}
              </h2>
              <p className="text-sm text-warm-500">
                {metrics?.system.blockchain_mode ? 'MNEE SDK wallet (for direct payments)' : 'System treasury status'}
              </p>
            </div>
            {!metrics?.system.blockchain_mode && (
              <span className="ml-auto text-xs text-warm-500 bg-warm-100 px-2 py-1 rounded">Off-chain mode</span>
            )}
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-warm-50 border border-warm-100">
              <p className="text-xs text-warm-500 uppercase tracking-wide font-medium mb-1">Wallet Address</p>
              <p className="font-mono text-warm-800 text-sm break-all">{metrics?.tokens.wallet_address || 'Loading...'}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-r from-honey-50 to-ocean-50 border border-honey-100">
              <p className="text-xs text-warm-500 uppercase tracking-wide font-medium mb-1">Available Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="bounty-amount text-3xl">{metrics?.tokens.wallet_balance?.toFixed(2) || '0'}</span>
                <span className="text-warm-500 font-medium">MNEE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Escalation Alert */}
        {eligibleForEscalation.length > 0 && (
          <div className="glass-card p-6 mb-8 border-2 border-grape-200 bg-gradient-to-r from-grape-50 to-honey-50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-grape-400 to-grape-600 flex items-center justify-center animate-pulse">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-grape-800">
                    {eligibleForEscalation.length} Bounties Ready for Escalation
                  </h2>
                  <p className="text-sm text-grape-600">These bounties have been unclaimed long enough to increase their rewards</p>
                </div>
              </div>
              <button onClick={handleEscalation} disabled={escalating} className="btn-grape self-start md:self-auto">
                {escalating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Run Escalation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Data Panels */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Bounties */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-warm-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-ocean-100 flex items-center justify-center">
                    <GitBranch className="w-5 h-5 text-ocean-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-warm-800">Recent Bounties</h2>
                </div>
              </div>
            </div>
            
            {loadingData ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-xl skeleton mx-auto mb-3" />
                <div className="skeleton-text w-32 mx-auto" />
              </div>
            ) : (
              <div className="divide-y divide-warm-100">
                {bounties.map((bounty) => (
                  <div key={bounty.bountyId} className="p-4 hover:bg-warm-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-warm-100 flex items-center justify-center flex-shrink-0">
                          <GitBranch className="w-5 h-5 text-warm-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-warm-800 truncate">{bounty.repository.split('/')[1] || bounty.repository}</p>
                          <a href={bounty.issueUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-honey-600 hover:text-honey-700 flex items-center gap-1">
                            Issue #{bounty.issueId} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="font-bold text-warm-800">{bounty.currentAmount} MNEE</div>
                        <span className={`badge-${bounty.status} text-xs`}>
                          {bounty.status.charAt(0).toUpperCase() + bounty.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Users */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-warm-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-grape-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-grape-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-warm-800">Recent Users</h2>
                </div>
              </div>
            </div>
            
            {loadingData ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-full skeleton mx-auto mb-3" />
                <div className="skeleton-text w-32 mx-auto" />
              </div>
            ) : (
              <div className="divide-y divide-warm-100">
                {users.map((u) => (
                  <div key={u.id} className="p-4 hover:bg-warm-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        {u.avatarUrl ? (
                          <Image src={u.avatarUrl} alt={u.name || u.githubLogin} width={40} height={40} className="rounded-lg ring-2 ring-white shadow-sm" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-honey-400 to-honey-600 flex items-center justify-center text-white font-bold">
                            {u.githubLogin[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-warm-800 truncate">{u.name || u.githubLogin}</p>
                          <p className="text-xs text-warm-500">@{u.githubLogin}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="flex items-baseline gap-1">
                          <span className="font-bold text-warm-800">{u.totalEarned?.toFixed(0) || 0}</span>
                          <span className="text-xs text-warm-500">MNEE</span>
                        </div>
                        {u.role === 'admin' && (
                          <span className="badge-pending text-xs">
                            <Shield className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Feedback Section */}
        <div className="glass-card overflow-hidden mb-8">
          <div className="p-6 border-b border-warm-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-grape-500 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-warm-800">User Feedback</h2>
                  <p className="text-sm text-warm-500">
                    {feedbackStats.pending > 0 ? (
                      <span className="text-grape-600 font-medium">{feedbackStats.pending} pending review</span>
                    ) : (
                      'All caught up!'
                    )}
                  </p>
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={feedbackFilter}
                  onChange={(e) => setFeedbackFilter(e.target.value as typeof feedbackFilter)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-warm-200 bg-white focus:ring-2 focus:ring-grape-300 focus:border-grape-400"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending ({feedbackStats.pending})</option>
                  <option value="reviewed">Reviewed ({feedbackStats.reviewed})</option>
                  <option value="resolved">Resolved ({feedbackStats.resolved})</option>
                </select>
                <select
                  value={feedbackTypeFilter}
                  onChange={(e) => setFeedbackTypeFilter(e.target.value as typeof feedbackTypeFilter)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-warm-200 bg-white focus:ring-2 focus:ring-grape-300 focus:border-grape-400"
                >
                  <option value="all">All Types</option>
                  <option value="bug">🐛 Bugs</option>
                  <option value="feature">💡 Features</option>
                  <option value="general">💬 General</option>
                  <option value="praise">❤️ Praise</option>
                </select>
              </div>
            </div>
            
            {/* Stats Summary */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              <div className="p-3 rounded-lg bg-warm-50 text-center">
                <div className="text-2xl font-bold text-warm-800">{feedbackStats.total}</div>
                <div className="text-xs text-warm-500">Total</div>
              </div>
              <div className="p-3 rounded-lg bg-honey-50 text-center">
                <div className="text-2xl font-bold text-honey-600">{feedbackStats.pending}</div>
                <div className="text-xs text-honey-600">Pending</div>
              </div>
              <div className="p-3 rounded-lg bg-ocean-50 text-center">
                <div className="text-2xl font-bold text-ocean-600">{feedbackStats.reviewed}</div>
                <div className="text-xs text-ocean-600">Reviewed</div>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-center">
                <div className="text-2xl font-bold text-green-600">{feedbackStats.resolved}</div>
                <div className="text-xs text-green-600">Resolved</div>
              </div>
            </div>
          </div>
          
          {/* Feedback List */}
          {loadingData ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 rounded-xl skeleton mx-auto mb-3" />
              <div className="skeleton-text w-32 mx-auto" />
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-warm-300 mx-auto mb-3" />
              <p className="text-warm-500">No feedback found</p>
              <p className="text-sm text-warm-400">Feedback from users will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-warm-100 max-h-[600px] overflow-y-auto">
              {filteredFeedback.map((feedback) => (
                <div key={feedback.id} className={`transition-colors ${expandedFeedback === feedback.id ? 'bg-warm-50/50' : 'hover:bg-warm-50/30'}`}>
                  {/* Feedback Header */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedFeedback(expandedFeedback === feedback.id ? null : feedback.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white border border-warm-100 flex items-center justify-center flex-shrink-0">
                        {getFeedbackTypeIcon(feedback.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            feedback.status === 'pending' ? 'bg-honey-100 text-honey-700' :
                            feedback.status === 'reviewed' ? 'bg-ocean-100 text-ocean-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                          </span>
                          <span className="text-xs text-warm-400 capitalize">{feedback.type}</span>
                          {feedback.rating && (
                            <span className="flex items-center gap-0.5 text-xs text-honey-500">
                              <Star className="w-3 h-3 fill-current" />
                              {feedback.rating}
                            </span>
                          )}
                        </div>
                        <p className="text-warm-800 text-sm line-clamp-2">{feedback.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-warm-400">
                          <span>{formatDate(feedback.created_at)}</span>
                          {feedback.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {feedback.email}
                            </span>
                          )}
                          {feedback.page && (
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {feedback.page}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {expandedFeedback === feedback.id ? (
                          <ChevronUp className="w-5 h-5 text-warm-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-warm-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedFeedback === feedback.id && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="ml-12 p-4 rounded-xl bg-white border border-warm-100">
                        <p className="text-warm-700 text-sm whitespace-pre-wrap mb-4">{feedback.message}</p>
                        
                        {feedback.user_agent && (
                          <div className="text-xs text-warm-400 mb-4 p-2 bg-warm-50 rounded-lg font-mono overflow-x-auto">
                            {feedback.user_agent}
                          </div>
                        )}
                        
                        {feedback.admin_notes && (
                          <div className="mb-4 p-3 rounded-lg bg-grape-50 border border-grape-100">
                            <p className="text-xs text-grape-600 font-medium mb-1">Admin Notes</p>
                            <p className="text-sm text-grape-800">{feedback.admin_notes}</p>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          {feedback.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateFeedbackStatus(feedback.id, 'reviewed')}
                              disabled={updatingFeedback === feedback.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-ocean-100 text-ocean-700 hover:bg-ocean-200 transition-colors disabled:opacity-50"
                            >
                              {updatingFeedback === feedback.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Mark as Reviewed
                            </button>
                          )}
                          {feedback.status !== 'resolved' && (
                            <button
                              onClick={() => handleUpdateFeedbackStatus(feedback.id, 'resolved')}
                              disabled={updatingFeedback === feedback.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50"
                            >
                              {updatingFeedback === feedback.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Mark as Resolved
                            </button>
                          )}
                          {feedback.status === 'resolved' && (
                            <button
                              onClick={() => handleUpdateFeedbackStatus(feedback.id, 'pending')}
                              disabled={updatingFeedback === feedback.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-warm-100 text-warm-700 hover:bg-warm-200 transition-colors disabled:opacity-50"
                            >
                              {updatingFeedback === feedback.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <X className="w-3.5 h-3.5" />
                              )}
                              Reopen
                            </button>
                          )}
                          {feedback.email && (
                            <a
                              href={`mailto:${feedback.email}?subject=Re: Your feedback on FixFlow`}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-grape-100 text-grape-700 hover:bg-grape-200 transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              Reply
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Info */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center">
              <Server className="w-5 h-5 text-warm-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-warm-800">System Information</h2>
              <p className="text-sm text-warm-500">Backend health and statistics</p>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-warm-50">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-warm-400" />
                <span className="text-xs text-warm-500 uppercase tracking-wide font-medium">Node Version</span>
              </div>
              <p className="font-mono text-warm-800">{metrics?.system.node_version || 'N/A'}</p>
            </div>
            
            <div className="p-4 rounded-xl bg-warm-50">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-warm-400" />
                <span className="text-xs text-warm-500 uppercase tracking-wide font-medium">Uptime</span>
              </div>
              <p className="font-mono text-warm-800">
                {metrics?.system.uptime ? `${Math.floor(metrics.system.uptime / 3600)}h ${Math.floor((metrics.system.uptime % 3600) / 60)}m` : 'N/A'}
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-warm-50">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-warm-400" />
                <span className="text-xs text-warm-500 uppercase tracking-wide font-medium">Total Claimed</span>
              </div>
              <p className="font-mono text-warm-800">{metrics?.tokens.claimed?.toFixed(2) || 0} MNEE</p>
            </div>
            
            <div className="p-4 rounded-xl bg-warm-50">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-warm-400" />
                <span className="text-xs text-warm-500 uppercase tracking-wide font-medium">Total Users</span>
              </div>
              <p className="font-mono text-warm-800">{users.length}+</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}