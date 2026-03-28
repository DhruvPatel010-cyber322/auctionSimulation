import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Crown, Loader2, Medal, Star, Trophy } from 'lucide-react';
import FantasyPlayerAvatar from '../components/fantasy/FantasyPlayerAvatar';
import { useAuth } from '../context/AuthContext';
import { getFantasyLeaderboard } from '../services/fantasyApi';

const formatMatchDate = (value) => {
    if (!value) return 'Date TBD';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
};

const rankStyles = {
    1: 'from-amber-300 to-yellow-500 text-gray-950 shadow-amber-300/30',
    2: 'from-slate-200 to-slate-400 text-gray-950 shadow-slate-300/30',
    3: 'from-orange-300 to-orange-500 text-gray-950 shadow-orange-300/30'
};

const LeaderboardPage = () => {
    const { matchId } = useParams();
    const { user } = useAuth();
    const [match, setMatch] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    const topThree = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
    const remaining = useMemo(() => leaderboard.slice(3), [leaderboard]);
    const currentUserTokens = useMemo(() => {
        const values = [
            user?.username,
            user?.name,
            user?.email,
            user?.code,
            user?.id
        ].filter(Boolean);

        return new Set(values.map((value) => String(value).toLowerCase()));
    }, [user]);

    const isCurrentUserEntry = (entry) => {
        const values = [
            entry?.user?.displayName,
            entry?.user?.username,
            entry?.user?.name,
            entry?.user?._id
        ].filter(Boolean);

        return values.some((value) => currentUserTokens.has(String(value).toLowerCase()));
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-rose-600" />
                <p className="font-bold text-gray-500">Loading leaderboard...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-5 p-3 md:p-5">
            <section className="overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_30%),linear-gradient(135deg,_#111827_0%,_#7f1d1d_44%,_#e11d48_100%)] px-4 py-5 text-white shadow-2xl shadow-rose-900/25">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link to="/fantasy" className="flex-shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition-colors">
                            <ArrowLeft size={16} />
                        </Link>
                        <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-widest text-rose-100">Fantasy Leaderboard</p>
                            <h1 className="text-base font-black tracking-tight truncate mt-0.5">{match?.team1} vs {match?.team2}</h1>
                            <p className="text-[10px] font-medium text-rose-50/80 mt-0.5">
                                {match ? formatMatchDate(match.date) : 'Selected fixture'}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                        <Link
                            to={`/fantasy/${matchId}/team`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-black text-rose-700 transition-colors hover:bg-rose-50"
                        >
                            <Trophy size={14} />
                            Build Team
                        </Link>
                        <Link
                            to={`/fantasy/${matchId}/my-teams`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/15 px-3 py-2 text-xs font-black text-white transition-colors hover:bg-black/25"
                        >
                            <Medal size={14} />
                            My Team
                        </Link>
                    </div>
                </div>
            </section>

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-700">
                    {error}
                </div>
            )}

            {!loading && leaderboard.length === 0 && !error && (
                <div className="rounded-[32px] border border-dashed border-rose-200 bg-white px-8 py-16 text-center">
                    <h2 className="text-2xl font-black text-gray-900">No fantasy entries yet</h2>
                    <p className="mt-2 text-gray-500">Once users save teams for this match, rankings will appear here.</p>
                </div>
            )}

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
                                    <div className="text-right">
                                        <span className="text-lg font-black">{entry.team.totalPoints} <span className="text-[10px] uppercase opacity-80 tracking-widest">pts</span></span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="mb-4">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-black text-gray-950 truncate" title={entry.user.username || entry.user.displayName}>
                                            {entry.user.username ? `@${entry.user.username}` : entry.user.displayName}
                                        </h2>
                                        {isCurrentUserEntry(entry) && (
                                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">You</span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-2.5">
                                        <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-600">
                                            <Crown size={12} /> Captain
                                        </p>
                                        <p className="mt-1 text-xs font-bold text-gray-900 truncate">{entry.team.captain?.name || 'Not set'}</p>
                                    </div>
                                    <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-2.5">
                                        <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-sky-600">
                                            <Star size={12} /> Vice-Capt
                                        </p>
                                        <p className="mt-1 text-xs font-bold text-gray-900 truncate">{entry.team.viceCaptain?.name || 'Not set'}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2.5">Squad Preview</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(entry.team.players || []).slice(0, 5).map((player) => (
                                            <FantasyPlayerAvatar key={player._id} player={player} className="h-9 w-9" textClassName="text-[10px]" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </section>
            )}

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
                                            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">
                                                You
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-1 flex items-center gap-3 text-[10px] sm:text-xs text-gray-500">
                                        <span className="flex items-center gap-1.5"><Crown size={12} className="text-amber-500" /> <span className="truncate max-w-[80px] sm:max-w-[120px]">{entry.team.captain?.name || 'N/A'}</span></span>
                                        <span className="flex items-center gap-1.5"><Star size={12} className="text-sky-500" /> <span className="truncate max-w-[80px] sm:max-w-[120px]">{entry.team.viceCaptain?.name || 'N/A'}</span></span>
                                    </div>
                                </div>

                                <div className="shrink-0 text-right">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600/80">Points</p>
                                    <p className="text-lg sm:text-xl font-black text-emerald-700 leading-tight">{entry.team.totalPoints}</p>
                                </div>
                            </div>
                        </article>
                    ))}
                </section>
            )}
        </div>
    );
};

export default LeaderboardPage;
