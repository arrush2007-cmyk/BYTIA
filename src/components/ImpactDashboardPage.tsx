import { useState, type FormEvent } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Award, CheckCircle2, Lock, Target, Trophy } from 'lucide-react';
import type { User } from 'firebase/auth';
import type {
  AchievementRecord,
  PublicProfile,
  UserActivity,
  UserProfile,
} from '../types/sustainability';
import {
  BADGE_DEFINITIONS,
  buildCategoryDistribution,
  buildMonthlyProgressSeries,
  buildWeeklyActivitySeries,
  computeGoalProgress,
} from '../utils/impactCalculations';
import { updateUserProfileData } from '../services/firestoreService';
import { SafeImage } from './SafeImage';

interface ImpactDashboardPageProps {
  user: User | null;
  profile: UserProfile | null;
  myPublicProfile: PublicProfile | null;
  publicProfiles: PublicProfile[];
  activities: UserActivity[];
  achievements: AchievementRecord[];
  onOpenAuth: () => void;
}

const CHART_COLORS = ['#1B5E20', '#4CAF50', '#81C784', '#DCC9A3', '#263238', '#689F38'];

export function ImpactDashboardPage({
  user,
  profile,
  myPublicProfile,
  publicProfiles,
  activities,
  achievements,
  onOpenAuth,
}: ImpactDashboardPageProps) {
  const [goalReuse, setGoalReuse] = useState(profile?.goalReuse ?? 5);
  const [goalDonate, setGoalDonate] = useState(profile?.goalDonate ?? 3);
  const [goalRecycle, setGoalRecycle] = useState(profile?.goalRecycle ?? 10);
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalNotice, setGoalNotice] = useState<string | null>(null);

  const scannedCount = myPublicProfile?.scannedCount ?? 0;
  const reusedCount = myPublicProfile?.reusedCount ?? 0;
  const donatedCount = myPublicProfile?.donatedCount ?? 0;
  const recycledCount = myPublicProfile?.recycledCount ?? 0;
  const exchangedCount = myPublicProfile?.exchangedCount ?? 0;
  const disposedCount = myPublicProfile?.disposedCount ?? 0;
  const estimatedKg = myPublicProfile?.estimatedKgDiverted ?? 0;
  const secondLifeCount = reusedCount + donatedCount + exchangedCount;

  const weeklyData = buildWeeklyActivitySeries(activities);
  const monthlyData = buildMonthlyProgressSeries(activities);
  const categoryData = buildCategoryDistribution(activities);
  const comparisonData = [
    { pathway: 'Reused', count: reusedCount },
    { pathway: 'Donated', count: donatedCount },
    { pathway: 'Recycled', count: recycledCount },
    { pathway: 'Exchanged', count: exchangedCount },
  ];

  const unlockedSet = new Set(achievements.map((a) => a.badgeType));

  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);
  const monthlyActivities = activities.filter((a) => new Date(a.createdAt) >= currentMonthStart);
  const monthlyReused = monthlyActivities.filter((a) => a.activityType === 'reuse').length;
  const monthlyDonated = monthlyActivities.filter((a) => a.activityType === 'donate').length;
  const monthlyRecycled = monthlyActivities.filter((a) => a.activityType === 'recycle').length;

  const handleSaveGoals = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !user.emailVerified) return;
    try {
      await updateUserProfileData(user.uid, {
        goalReuse: Number(goalReuse),
        goalDonate: Number(goalDonate),
        goalRecycle: Number(goalRecycle),
      });
      setGoalNotice('Monthly targets updated.');
      setEditingGoals(false);
    } catch (err) {
      setGoalNotice(err instanceof Error ? err.message : 'Unable to save goals.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-20 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#263238]">
            Environmental Impact Dashboard
          </h1>
          <p className="text-sm text-[#263238]/75 mt-1">
            All statistics below reflect your real verified activities in Firestore—duplicate actions are blocked automatically.
          </p>
        </div>
        {user && (
          <div className="bg-white rounded-xl border border-[#263238]/10 px-4 py-2.5 text-right shrink-0">
            <span className="text-xs text-[#263238]/65 block">Your Eco-Points</span>
            <span className="font-mono tabular-nums text-xl font-bold text-[#1B5E20]">
              {myPublicProfile?.ecoPoints ?? 0} pts
            </span>
          </div>
        )}
      </div>

      {!user && (
        <div className="bg-[#E8F5E9] border border-[#4CAF50]/40 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[#1B5E20]">Sign in to track your personal impact</h2>
            <p className="text-sm text-[#263238]/80 mt-1">
              Your personal counts start at zero and update as you scan, reuse, donate, recycle, and exchange items. Below you can also inspect the live community leaderboard.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="px-5 py-2.5 rounded-xl bg-[#1B5E20] hover:bg-[#144718] text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* A. 5 Statistics KPI Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Items Scanned', value: scannedCount },
          { label: 'Items Reused', value: reusedCount },
          { label: 'Items Donated', value: donatedCount },
          { label: 'Items Recycled', value: recycledCount },
          { label: 'Items Exchanged', value: exchangedCount },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-[#263238]/10 p-5">
            <p className="text-xs font-medium text-[#263238]/65">{kpi.label}</p>
            <p className="font-mono tabular-nums text-3xl font-bold text-[#1B5E20] mt-2">{kpi.value}</p>
          </div>
        ))}
      </section>

      {/* C. Environmental Impact Summary + Methodology Note */}
      <section className="bg-white rounded-2xl border border-[#263238]/10 p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-[#263238]/65">Estimated Landfill Diverted</p>
            <p className="font-mono tabular-nums text-2xl font-bold text-[#1B5E20] mt-1">{estimatedKg} kg</p>
          </div>
          <div>
            <p className="text-xs text-[#263238]/65">Products Given a Second Life</p>
            <p className="font-mono tabular-nums text-2xl font-bold text-[#263238] mt-1">{secondLifeCount}</p>
          </div>
          <div>
            <p className="text-xs text-[#263238]/65">Community Donations & Swaps</p>
            <p className="font-mono tabular-nums text-2xl font-bold text-[#263238] mt-1">
              {donatedCount + exchangedCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#263238]/65">Safely Disposed</p>
            <p className="font-mono tabular-nums text-2xl font-bold text-[#263238] mt-1">{disposedCount}</p>
          </div>
        </div>
        <p className="text-xs text-[#263238]/60 mt-5 pt-4 border-t border-[#263238]/10">
          Calculation note: Diversion weight uses conservative category averages (e.g., 0.15 kg for plastic containers, 0.45 kg for glass, 0.6 kg for textiles, 8.0 kg for furniture) or Gemini&apos;s item weight estimate. It is an educational estimate rather than weighed scale data.
        </p>
      </section>

      {/* B. Interactive Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#263238]/10 p-6">
          <h2 className="font-display text-lg font-bold text-[#263238] mb-1">Weekly Waste Management Activity</h2>
          <p className="text-xs text-[#263238]/65 mb-4">Verified actions over the last 7 days</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="reused" name="Reused" stackId="a" fill="#1B5E20" />
                <Bar dataKey="donated" name="Donated" stackId="a" fill="#4CAF50" />
                <Bar dataKey="recycled" name="Recycled" stackId="a" fill="#81C784" />
                <Bar dataKey="exchanged" name="Exchanged" stackId="a" fill="#DCC9A3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#263238]/10 p-6">
          <h2 className="font-display text-lg font-bold text-[#263238] mb-1">Monthly Diversion & Recycling Progress</h2>
          <p className="text-xs text-[#263238]/65 mb-4">Estimated kg diverted across the past 6 months</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="divertedKg"
                  name="Est. kg diverted"
                  stroke="#1B5E20"
                  fill="#E8F5E9"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="recycled"
                  name="Recycled items"
                  stroke="#4CAF50"
                  fill="#4CAF50"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#263238]/10 p-6">
          <h2 className="font-display text-lg font-bold text-[#263238] mb-1">Reuse vs Recycling Comparison</h2>
          <p className="text-xs text-[#263238]/65 mb-4">Distribution across circular pathways</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="pathway" tick={{ fontSize: 12 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" name="Items" fill="#1B5E20" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#263238]/10 p-6">
          <h2 className="font-display text-lg font-bold text-[#263238] mb-1">Product Category Distribution</h2>
          <p className="text-xs text-[#263238]/65 mb-4">Materials assessed & diverted by category</p>
          {categoryData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {categoryData.map((entry, idx) => (
                      <Cell key={entry.category} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-[#263238]/60 bg-[#F7F9F5] rounded-xl">
              Scan or log your first product to see category breakdowns.
            </div>
          )}
        </div>
      </section>

      {/* F. Personal Monthly Goals & D. Achievement System */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#263238]/10 p-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#1B5E20]" />
              <h2 className="font-display text-xl font-bold text-[#263238]">Monthly Sustainability Goals</h2>
            </div>
            {user && user.emailVerified && (
              <button
                type="button"
                onClick={() => {
                  setGoalReuse(profile?.goalReuse ?? 5);
                  setGoalDonate(profile?.goalDonate ?? 3);
                  setGoalRecycle(profile?.goalRecycle ?? 10);
                  setEditingGoals(!editingGoals);
                  setGoalNotice(null);
                }}
                className="text-xs font-semibold text-[#1B5E20] hover:underline cursor-pointer"
              >
                {editingGoals ? 'Cancel' : 'Edit Targets'}
              </button>
            )}
          </div>

          {editingGoals ? (
            <form onSubmit={handleSaveGoals} className="space-y-3">
              <div>
                <label htmlFor="goal-reuse" className="block text-xs font-medium text-[#263238] mb-1">
                  Monthly Reuse Target
                </label>
                <input
                  id="goal-reuse"
                  type="number"
                  min={1}
                  max={500}
                  value={goalReuse}
                  onChange={(e) => setGoalReuse(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#263238]/20"
                />
              </div>
              <div>
                <label htmlFor="goal-donate" className="block text-xs font-medium text-[#263238] mb-1">
                  Monthly Donate Target
                </label>
                <input
                  id="goal-donate"
                  type="number"
                  min={1}
                  max={500}
                  value={goalDonate}
                  onChange={(e) => setGoalDonate(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#263238]/20"
                />
              </div>
              <div>
                <label htmlFor="goal-recycle" className="block text-xs font-medium text-[#263238] mb-1">
                  Monthly Recycle Target
                </label>
                <input
                  id="goal-recycle"
                  type="number"
                  min={1}
                  max={500}
                  value={goalRecycle}
                  onChange={(e) => setGoalRecycle(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#263238]/20"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#1B5E20] text-white text-xs font-semibold cursor-pointer"
              >
                Save Monthly Targets
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Reuse products', current: monthlyReused, target: profile?.goalReuse ?? 5 },
                { label: 'Donate products', current: monthlyDonated, target: profile?.goalDonate ?? 3 },
                { label: 'Recycle products', current: monthlyRecycled, target: profile?.goalRecycle ?? 10 },
              ].map((goal) => {
                const pct = computeGoalProgress(goal.current, goal.target);
                return (
                  <div key={goal.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#263238]">{goal.label}</span>
                      <span className="font-mono tabular-nums font-semibold text-[#1B5E20]">
                        {goal.current} / {goal.target} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[#E8F5E9] overflow-hidden">
                      <div
                        className="h-full bg-[#4CAF50] transition-all duration-200"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {goalNotice && <p className="text-xs font-medium text-[#1B5E20]">{goalNotice}</p>}
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#263238]/10 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#1B5E20]" />
            <h2 className="font-display text-xl font-bold text-[#263238]">Achievement Badges</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {BADGE_DEFINITIONS.map((badge) => {
              const unlocked = unlockedSet.has(badge.badgeType);
              return (
                <div
                  key={badge.badgeType}
                  className={`p-4 rounded-xl border ${
                    unlocked
                      ? 'bg-[#E8F5E9]/60 border-[#4CAF50]/40'
                      : 'bg-[#F7F9F5] border-[#263238]/10 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-sm font-bold text-[#263238]">{badge.badgeType}</h3>
                    {unlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-[#1B5E20] shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-[#263238]/40 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#263238]/75 mt-1">{badge.description}</p>
                  <p className="text-[11px] font-medium text-[#1B5E20] mt-2">
                    {unlocked ? 'Earned' : `Requirement: ${badge.requirementText}`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* E. Community Leaderboard */}
      <section className="bg-white rounded-2xl border border-[#263238]/10 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#1B5E20]" />
          <h2 className="font-display text-xl font-bold text-[#263238]">Community Contributors Leaderboard</h2>
        </div>

        {publicProfiles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#263238]/10 text-xs text-[#263238]/65">
                  <th className="py-2.5 pr-4 font-semibold">Rank</th>
                  <th className="py-2.5 pr-4 font-semibold">Contributor</th>
                  <th className="py-2.5 pr-4 font-semibold text-right">Eco-Points</th>
                  <th className="py-2.5 pr-4 font-semibold text-right">Reused</th>
                  <th className="py-2.5 pr-4 font-semibold text-right">Recycled</th>
                  <th className="py-2.5 font-semibold text-right">Donated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263238]/10 text-sm">
                {publicProfiles.slice(0, 10).map((contributor, idx) => (
                  <tr key={contributor.userId} className="hover:bg-[#F7F9F5]">
                    <td className="py-3 pr-4 font-mono tabular-nums text-xs font-semibold text-[#263238]/70">
                      #{idx + 1}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-[#263238]/10 shrink-0">
                          <SafeImage
                            src={contributor.photoUrl}
                            alt={contributor.displayName}
                            className="w-full h-full object-cover"
                            fallbackLabel={contributor.displayName.slice(0, 2).toUpperCase()}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-[#263238]">{contributor.displayName}</p>
                          {contributor.city && (
                            <p className="text-xs text-[#263238]/60">{contributor.city}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums font-bold text-[#1B5E20]">
                      {contributor.ecoPoints}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums">{contributor.reusedCount}</td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums">{contributor.recycledCount}</td>
                    <td className="py-3 text-right font-mono tabular-nums">{contributor.donatedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-[#263238]/65">
            No contributor scores logged yet. Sign in and record your first reuse, donation, or recycling action to lead the board.
          </p>
        )}
      </section>
    </div>
  );
}
