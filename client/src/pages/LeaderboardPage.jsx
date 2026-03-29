import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Crown, Eye, EyeOff, Loader2, Lock, Medal, Star, Trophy, X } from 'lucide-react';
import FantasyPlayerAvatar from '../components/fantasy/FantasyPlayerAvatar';
import { useAuth } from '../context/AuthContext';
import { getFantasyLeaderboard } from '../services/fantasyApi';

/* ─── helpers ─────────────────────────────────────────────────── */
const formatMatchDate = (value) => {
    if (!value) return 'Date TBD';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const ROLE_ORDER = ['Wicket Keeper', 'Batsman', 'All-Rounder', 'Bowler'];
const ROLE_COLORS = {
    'Wicket Keeper': 'bg-purple-100 text-purple-700 border-purple-200',
    'Batsman':       'bg-sky-100 text-sky-700 border-sky-200',
    'All-Rounder':   'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Bowler':        'bg-orange-100 text-orange-700 border-orange-200'
};

const sortPlayers = (players) =>
    [...players].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));

const rankStyles = {
    1: 'from-amber-300 to-yellow-500 text-gray-950',
    2: 'from-slate-200 to-slate-400 text-gray-950',
    3: 'from-orange-300 to-orange-500 text-gray-950'
};

/* ─── Team Viewer Modal ────────────────────────────────────────── */
const TeamViewerModal = ({ entry, onClose }) => {
    if (!entry) return null;

    const players = sortPlayers(entry.team.players || []);
    const captainId = entry.team.captain?._id;
    const vcId = entry.team.viceCaptain?._id;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Sheet */}
            <div
                className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
                style={{ maxHeight: '90dvh' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-gray-950 to-rose-900 px-5 py-4 text-white">
                    <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-rose-200/80">Full Squad</p>
                        <h2 className="mt-0.5 text-base font-black truncate">
                            {entry.user.username ? `@${entry.user.username}` : entry.user.displayName}
                        </h2>
                        <p className="text-[10px] text-rose-100/70 mt-0.5">
                            Rank #{entry.rank} &bull; {entry.team.totalPoints} pts
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Captain / VC chips */}
                <div className="flex gap-3 px-5 pt-4 pb-2">
                    <div className="flex-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                        <p className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-600">
                            <Crown size={11} /> Captain (2×)
                        </p>
                        <p className="mt-1 text-xs font-black text-amber-900 truncate">{entry.team.captain?.name || '—'}</p>
                    </div>
                    <div className="flex-1 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
                        <p className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-sky-600">
                            <Star size={11} /> Vice-Captain (1.5×)
                        </p>
                        <p className="mt-1 text-xs font-black text-sky-900 truncate">{entry.team.viceCaptain?.name || '—'}</p>
                    </div>
                </div>

                {/* Player list */}
                <div className="overflow-y-auto px-5 pb-6" style={{ maxHeight: 'calc(90dvh - 180px)' }}>
                    <div className="space-y-2">
                        {players.map((player) => {
                            const isCap = player._id === captainId;
                            const isVc = player._id === vcId;
                            return (
                                <div
                                    key={player._id}
                                    className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${
                                        isCap ? 'border-amber-200 bg-amber-50/70' :
                                        isVc  ? 'border-sky-200 bg-sky-50/70' :
                                                'border-gray-100 bg-gray-50/50'
                                    }`}
                                >
                                    <FantasyPlayerAvatar player={player} className="h-10 w-10 shrink-0" textClassName="text-xs" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-sm font-black text-gray-900 truncate">{player.name}</p>
                                            {isCap && <span className="shrink-0 rounded-full bg-amber-200 px-1.5 py-0.5 text-[9px] font-black text-amber-800">C</span>}
                                            {isVc  && <span className="shrink-0 rounded-full bg-sky-200 px-1.5 py-0.5 text-[9px] font-black text-sky-800">VC</span>}
                                        </div>
                                        <div className="mt-0.5 flex items-center gap-2">
                                            <span className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-black ${ROLE_COLORS[player.role] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                {player.role}
                                            </span>
                                            <span className="text-[10px] font-semibold text-gray-500">{player.orgIPLTeam26}</span>
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-sm font-black text-gray-900">
                                            {isCap ? (player.points * 2).toFixed(1) : isVc ? (player.points * 1.5).toFixed(1) : player.points}
                                            <span className="text-[10px] font-semibold text-gray-400"> pts</span>
                                        </p>
                                        {(isCap || isVc) && (
                                            <p className="text-[9px] text-gray-400">({player.points} base)</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─── View Team Button ─────────────────────────────────────────── */
const ViewTeamButton = ({ entry, isUpcoming, onView }) => {
    if (isUpcoming) {
        return (
            <button
                disabled
                title="Team is private until the match begins"
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-100 px-3 py-1.5 text-[10px] font-black text-gray-400 cursor-not-allowed"
            >
                <Lock size={11} />
                View
            </button>
        );
    }
    return (
        <button
            onClick={() => onView(entry)}
            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-black text-rose-700 hover:bg-rose-100 transition-colors"
        >
            <Eye size={11} />
            View Team
        </button>
    );
};

/* ─── Main Page ────────────────────────────────────────────────── */
const LeaderboardPage = () => {
    const { matchId } = useParams();
    const { user } = useAuth();
    const [match, setMatch] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewingEntry, setViewingEntry] = useState(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const data = await getFantasyLeaderboard(matchId);
                setMatch(data.match);
                setLeaderboard(data.leaderboard || []);
            } catch (err) {
                console.error('Failed to load fantasy leaderboard:', err);
                setError(err.response?.data?.message || 'Failed to load the fantasy leaderboard.');
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [matchId]);

    const topThree  = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
    const remaining = useMemo(() => leaderboard.slice(3),    [leaderboard]);

    const currentUserTokens = useMemo(() => {
        const values = [user?.username, user?.name, user?.email, user?.code, user?.id].filter(Boolean);
        return new Set(values.map((v) => String(v).toLowerCase()));
    }, [user]);

    const isCurrentUserEntry = (entry) => {
        const values = [entry?.user?.displayName, entry?.user?.username, entry?.user?.name, entry?.user?._id].filter(Boolean);
        return values.some((v) => currentUserTokens.has(String(v).toLowerCase()));
    };

    const isUpcoming = match?.status === 'Upcoming';

    if (loading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-rose-600" />
                <p className="font-bold text-gray-500">Loading leaderboard...</p>
            </div>
        );
    }

    return (
        <>
            {/* Team viewer modal */}
            {viewingEntry && (
                <TeamViewerModal entry={viewingEntry} onClose={() => setViewingEntry(null)} />
            )}

            <div className="mx-auto max-w-7xl space-y-5 p-3 md:p-5">
                {/* Header */}
                <section className="overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_30%),linear-gradient(135deg,_#111827_0%,_#7f1d1d_44%,_#e11d48_100%)] px-4 py-5 text-white shadow-2xl shadow-rose-900/25">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <Link to="/fantasy" className="flex-shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition-colors">
                                <ArrowLeft size={16} />
                            </Link>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-rose-100">Fantasy Leaderboard</p>
                                    {match?.status && (
                                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                            match.status === 'Live'      ? 'bg-red-500 text-white' :
                                            match.status === 'Completed' ? 'bg-emerald-500 text-white' :
                                                                           'bg-amber-400 text-gray-900'
                                        }`}>
                                            {match.status === 'Live' && <span className="mr-1">●</span>}
                                            {match.status}
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-base font-black tracking-tight truncate mt-0.5">{match?.team1} vs {match?.team2}</h1>
                                <p className="text-[10px] font-medium text-rose-50/80 mt-0.5">{match ? formatMatchDate(match.date) : 'Selected fixture'}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                            <Link to={`/fantasy/${matchId}/team`} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-black text-rose-700 transition-colors hover:bg-rose-50">
                                <Trophy size={14} /> Build Team
                            </Link>
                            <Link to={`/fantasy/${matchId}/my-teams`} className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/15 px-3 py-2 text-xs font-black text-white transition-colors hover:bg-black/25">
                                <Medal size={14} /> My Team
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Upcoming notice banner (non-blocking) */}
                {isUpcoming && (
                    <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <Lock size={16} className="text-amber-600 shrink-0" />
                        <p className="text-sm font-semibold text-amber-800">
                            Match hasn't started yet — team selections are hidden until the match goes <strong>Live</strong>.
                        </p>
                    </div>
                )}

                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-700">{error}</div>
                )}

                {!loading && !error && leaderboard.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-rose-200 bg-white px-8 py-16 text-center">
                        <h2 className="text-2xl font-black text-gray-900">No fantasy entries yet</h2>
                        <p className="mt-2 text-gray-500">Once users save teams for this match, rankings will appear here.</p>
                    </div>
                )}

                {/* Top 3 */}
                {topThree.length > 0 && (
                    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {topThree.map((entry) => (
                            <article
                                key={entry.team._id}
                                className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
                                    isCurrentUserEntry(entry) ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-rose-100'
                                }`}
                            >
                                <div className={`bg-gradient-to-r px-4 py-3 ${rankStyles[entry.rank] || 'from-gray-200 to-gray-300 text-gray-950'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Trophy size={18} className="opacity-90" />
                                            <span className="text-sm font-black uppercase tracking-widest">Rank {entry.rank}</span>
                                        </div>
                                        <span className="text-lg font-black">
                                            {entry.team.totalPoints} <span className="text-[10px] uppercase opacity-80 tracking-widest">pts</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <div className="mb-3 flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-base font-black text-gray-950 truncate" title={entry.user.username || entry.user.displayName}>
                                                    {entry.user.username ? `@${entry.user.username}` : entry.user.displayName}
                                                </h2>
                                                {isCurrentUserEntry(entry) && (
                                                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">You</span>
                                                )}
                                            </div>
                                        </div>
                                        <ViewTeamButton entry={entry} isUpcoming={isUpcoming} onView={setViewingEntry} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-2.5">
                                            <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-600"><Crown size={12} /> Captain</p>
                                            <p className="mt-1 text-xs font-bold text-gray-900 truncate">{entry.team.captain?.name || 'Not set'}</p>
                                        </div>
                                        <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-2.5">
                                            <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-sky-600"><Star size={12} /> Vice-Capt</p>
                                            <p className="mt-1 text-xs font-bold text-gray-900 truncate">{entry.team.viceCaptain?.name || 'Not set'}</p>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </section>
                )}

                {/* Rank 4+ */}
                {remaining.length > 0 && (
                    <section className="space-y-3">
                        {remaining.map((entry) => (
                            <article
                                key={entry.team._id}
                                className={`rounded-2xl border bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md ${
                                    isCurrentUserEntry(entry) ? 'border-emerald-300 bg-emerald-50/20 ring-1 ring-emerald-200' : 'border-rose-100'
                                }`}
                            >
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 border border-gray-100 text-sm font-black text-gray-900">
                                        #{entry.rank}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-sm font-black text-gray-950 truncate" title={entry.user.username || entry.user.displayName}>
                                                {entry.user.username ? `@${entry.user.username}` : entry.user.displayName}
                                            </h2>
                                            {isCurrentUserEntry(entry) && (
                                                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">You</span>
                                            )}
                                        </div>
                                        <div className="mt-1 flex items-center gap-3 text-[10px] sm:text-xs text-gray-500">
                                            <span className="flex items-center gap-1.5"><Crown size={12} className="text-amber-500" /> <span className="truncate max-w-[80px] sm:max-w-[120px]">{entry.team.captain?.name || 'N/A'}</span></span>
                                            <span className="flex items-center gap-1.5"><Star size={12} className="text-sky-500" /> <span className="truncate max-w-[80px] sm:max-w-[120px]">{entry.team.viceCaptain?.name || 'N/A'}</span></span>
                                        </div>
                                    </div>

                                    <div className="shrink-0 flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600/80">Points</p>
                                            <p className="text-lg sm:text-xl font-black text-emerald-700 leading-tight">{entry.team.totalPoints}</p>
                                        </div>
                                        <ViewTeamButton entry={entry} isUpcoming={isUpcoming} onView={setViewingEntry} />
                                    </div>
                                </div>
                            </article>
                        ))}
                    </section>
                )}
            </div>
        </>
    );
};

export default LeaderboardPage;
