import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Activity,
    ArrowLeft,
    Clock,
    RefreshCw,
    ShieldCheck,
    Crown,
    Star,
    TrendingUp,
    Zap,
    Users
} from 'lucide-react';
import { fetchLiveMatch, fetchLivePoints } from '../services/fantasyApi';

// Unified API context used via services/fantasyApi
const POLL_MS = 2 * 60 * 1000; // 2 minutes (matches backend)
const MATCH_DURATION_MS = (4 * 60 + 30) * 60 * 1000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(isoString) {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
    });
}

function formatLastUpdated(isoString) {
    if (!isoString) return null;
    return new Date(isoString).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Kolkata'
    });
}

function isToday(isoString) {
    if (!isoString) return false;
    const matchDay = new Date(isoString).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    const today    = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    return matchDay === today;
}

function getMatchPhase(startTimeIso) {
    if (!startTimeIso) return 'unknown';
    const start = new Date(startTimeIso);
    const end   = new Date(start.getTime() + MATCH_DURATION_MS);
    const now   = new Date();
    if (now < start)  return 'upcoming';
    if (now <= end)   return 'live';
    return 'completed';
}

// Role-colour mapping
const teamColour = (team) => {
    const map = {
        'Sunrisers Hyderabad':      { bg: 'bg-orange-50',  text: 'text-orange-700',  badge: 'bg-orange-100' },
        'Mumbai Indians':           { bg: 'bg-blue-50',    text: 'text-blue-700',    badge: 'bg-blue-100'   },
        'Kolkata Knight Riders':    { bg: 'bg-purple-50',  text: 'text-purple-700',  badge: 'bg-purple-100' },
        'Royal Challengers Bengaluru': { bg: 'bg-red-50',  text: 'text-red-700',     badge: 'bg-red-100'    },
        'Chennai Super Kings':      { bg: 'bg-yellow-50',  text: 'text-yellow-700',  badge: 'bg-yellow-100' },
        'Delhi Capitals':           { bg: 'bg-sky-50',     text: 'text-sky-700',     badge: 'bg-sky-100'    },
        'Rajasthan Royals':         { bg: 'bg-pink-50',    text: 'text-pink-700',    badge: 'bg-pink-100'   },
        'Punjab Kings':             { bg: 'bg-red-50',     text: 'text-red-700',     badge: 'bg-red-100'    },
        'Lucknow Super Giants':     { bg: 'bg-teal-50',    text: 'text-teal-700',    badge: 'bg-teal-100'   },
        'Gujarat Titans':           { bg: 'bg-cyan-50',    text: 'text-cyan-700',    badge: 'bg-cyan-100'   }
    };
    return map[team] || { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-100' };
};

// ── Rank medal ────────────────────────────────────────────────────────────────
const RankBadge = ({ rank }) => {
    if (rank === 1) return <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-[11px] font-black text-white shadow-sm">🥇</span>;
    if (rank === 2) return <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-300 text-[11px] font-black text-white shadow-sm">🥈</span>;
    if (rank === 3) return <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-[11px] font-black text-white shadow-sm">🥉</span>;
    return <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-black text-gray-600">{rank}</span>;
};

// ── Mini stat cell ─────────────────────────────────────────────────────────────
const Stat = ({ label, value, highlight }) => (
    <div className={`rounded-xl px-3 py-2 text-center ${highlight ? 'bg-rose-50 text-rose-700' : 'bg-gray-50 text-gray-600'}`}>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</p>
        <p className="mt-0.5 text-sm font-black">{value ?? 0}</p>
    </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const LivePointsPage = () => {
    const [matchInfo,   setMatchInfo]   = useState(null);   // from /match
    const [pointsData,  setPointsData]  = useState(null);   // from /points
    const [phase,       setPhase]       = useState('loading');
    const [lastUpdated, setLastUpdated] = useState(null);
    const [error,       setError]       = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const pollRef      = useRef(null);
    const scheduleRef  = useRef(null);

    // ── Fetch points (direct to external API) ─────────────────────────────────
    const loadPoints = useCallback(async (matchId) => {
        try {
            setIsRefreshing(true);
            const data = await fetchLivePoints(matchId);
            setPointsData(data);
            setLastUpdated(new Date().toISOString());
        } catch (err) {
            console.warn('[LivePoints] Failed to fetch points:', err.message);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // ── Start polling loop ────────────────────────────────────────────────────
    const startPolling = useCallback((matchId) => {
        loadPoints(matchId);
        pollRef.current = setInterval(() => loadPoints(matchId), POLL_MS);

        // Auto-stop after match window
        scheduleRef.current = setTimeout(() => {
            clearInterval(pollRef.current);
            setPhase('completed');
        }, MATCH_DURATION_MS);
    }, [loadPoints]);

    // ── Init: fetch /match, decide phase ─────────────────────────────────────
    useEffect(() => {
        let scheduleTimer = null;

        const init = async () => {
            try {
                const match = await fetchLiveMatch();
                setMatchInfo(match);

                const { match_id, start_time } = match;

                if (!isToday(start_time)) {
                    setPhase('no-match');
                    return;
                }

                const currentPhase = getMatchPhase(start_time);
                setPhase(currentPhase);

                if (currentPhase === 'live') {
                    startPolling(match_id);
                } else if (currentPhase === 'upcoming') {
                    const msUntil = new Date(start_time).getTime() - Date.now();
                    scheduleTimer = setTimeout(() => {
                        setPhase('live');
                        startPolling(match_id);
                    }, msUntil);
                }
                // 'completed' — just show last known data, no polling
                if (currentPhase === 'completed') {
                    loadPoints(match_id);
                }
            } catch (err) {
                console.error('[LivePoints] Init failed:', err.message);
                setError('Could not reach the fantasy points server. Please try again.');
                setPhase('error');
            }
        };

        init();

        return () => {
            clearInterval(pollRef.current);
            clearTimeout(scheduleRef.current);
            if (scheduleTimer) clearTimeout(scheduleTimer);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Manual refresh ────────────────────────────────────────────────────────
    const handleManualRefresh = () => {
        if (matchInfo?.match_id) loadPoints(matchInfo.match_id);
    };

    // ── Render helpers ────────────────────────────────────────────────────────
    const players = pointsData?.data ?? [];

    const headerGradient = phase === 'live'
        ? 'bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_30%),linear-gradient(135deg,_#991b1b_0%,_#e11d48_52%,_#fb923c_100%)]'
        : phase === 'upcoming'
        ? 'bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.14),_transparent_30%),linear-gradient(135deg,_#1e3a5f_0%,_#1d4ed8_60%,_#3b82f6_100%)]'
        : 'bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_30%),linear-gradient(135deg,_#1f2937_0%,_#374151_60%,_#4b5563_100%)]';

    // ── Loading ───────────────────────────────────────────────────────────────
    if (phase === 'loading') {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <div className="relative h-14 w-14">
                    <div className="absolute inset-0 animate-ping rounded-full bg-rose-400 opacity-30" />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 shadow-lg">
                        <Activity className="h-6 w-6 text-white" />
                    </div>
                </div>
                <p className="font-bold text-gray-500">Fetching live match data…</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-5 p-3 md:p-5">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <section className={`overflow-hidden rounded-2xl px-5 py-6 text-white shadow-lg ${headerGradient}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/fantasy"
                            className="flex-shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <ArrowLeft size={16} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Live Fantasy Points</p>
                                {phase === 'live' && (
                                    <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-300" />
                                        Live
                                    </span>
                                )}
                                {phase === 'upcoming' && (
                                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">
                                        Upcoming
                                    </span>
                                )}
                                {phase === 'completed' && (
                                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">
                                        Final
                                    </span>
                                )}
                            </div>
                            <h1 className="mt-1 text-lg font-black tracking-tight leading-tight">
                                {matchInfo?.match_name ?? "Today's IPL Match"}
                            </h1>
                            {matchInfo?.start_time && (
                                <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium opacity-80">
                                    <Clock size={11} />
                                    {phase === 'upcoming'
                                        ? `Starts at ${formatTime(matchInfo.start_time)} IST`
                                        : `Started at ${formatTime(matchInfo.start_time)} IST`}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:flex-col sm:items-end">
                        {lastUpdated && (
                            <p className="text-[10px] font-medium opacity-70">
                                Updated {formatLastUpdated(lastUpdated)}
                            </p>
                        )}
                        <button
                            onClick={handleManualRefresh}
                            disabled={isRefreshing || !matchInfo?.match_id}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-black hover:bg-white/20 disabled:opacity-40 transition-colors"
                        >
                            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Error ──────────────────────────────────────────────────── */}
            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-700">
                    {error}
                </div>
            )}

            {/* ── Upcoming state ─────────────────────────────────────────── */}
            {phase === 'upcoming' && !error && (
                <div className="rounded-[32px] border border-dashed border-blue-200 bg-white px-8 py-16 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                        <Clock className="h-8 w-8 text-blue-500" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900">Match hasn't started yet</h2>
                    <p className="mt-2 text-gray-500">
                        Live points will appear here at{' '}
                        <strong>{formatTime(matchInfo?.start_time)} IST</strong>.
                        This page will auto-refresh.
                    </p>
                </div>
            )}

            {/* ── No match today ─────────────────────────────────────────── */}
            {phase === 'no-match' && (
                <div className="rounded-[32px] border border-dashed border-gray-200 bg-white px-8 py-16 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                        <ShieldCheck className="h-8 w-8 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900">No match today</h2>
                    <p className="mt-2 text-gray-500">
                        Next match: <strong>{matchInfo?.match_name}</strong>
                        {matchInfo?.start_time && ` at ${formatTime(matchInfo.start_time)} IST`}
                    </p>
                </div>
            )}

            {/* ── Points table ────────────────────────────────────────────── */}
            {players.length > 0 && (
                <>
                    {/* Summary strip */}
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-rose-600">
                                <Users size={16} />
                                <p className="text-[10px] font-black uppercase tracking-widest">Players</p>
                            </div>
                            <p className="mt-1 text-2xl font-black text-gray-900">{players.length}</p>
                        </div>
                        <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-amber-600">
                                <TrendingUp size={16} />
                                <p className="text-[10px] font-black uppercase tracking-widest">Top Score</p>
                            </div>
                            <p className="mt-1 text-2xl font-black text-gray-900">
                                {Math.max(...players.map(p => p.total ?? 0))}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-emerald-600">
                                <Zap size={16} />
                                <p className="text-[10px] font-black uppercase tracking-widest">Updated</p>
                            </div>
                            <p className="mt-1 text-sm font-black text-gray-700">
                                {pointsData?.updated_at
                                    ? new Date(pointsData.updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
                                    : '—'}
                            </p>
                        </div>
                    </div>

                    {/* Table header */}
                    <div className="hidden sm:grid grid-cols-[48px_1fr_120px_48px_48px_48px_48px_56px] gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <span>#</span>
                        <span>Player</span>
                        <span>Team</span>
                        <span className="text-center">Bat</span>
                        <span className="text-center">Bowl</span>
                        <span className="text-center">Field</span>
                        <span className="text-center">Play</span>
                        <span className="text-right">Total</span>
                    </div>

                    {/* Player rows */}
                    <div className="space-y-2">
                        {players.map((player) => {
                            const colours = teamColour(player.team);
                            return (
                                <div
                                    key={player.rank}
                                    className="grid grid-cols-[48px_1fr] gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm transition-shadow hover:shadow-md sm:grid-cols-[48px_1fr_120px_48px_48px_48px_48px_56px] sm:items-center sm:gap-2"
                                >
                                    {/* Rank */}
                                    <div className="flex items-center">
                                        <RankBadge rank={player.rank} />
                                    </div>

                                    {/* Name + mobile stats */}
                                    <div>
                                        <p className="text-sm font-black text-gray-900 leading-tight">{player.player}</p>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:hidden">
                                            <span className={`rounded-lg px-2 py-0.5 text-[10px] font-black ${colours.badge} ${colours.text}`}>
                                                {player.team?.split(' ').pop()}
                                            </span>
                                            <span className="text-[11px] font-semibold text-gray-500">Bat {player.bat}</span>
                                            <span className="text-[11px] font-semibold text-gray-500">Bowl {player.bowl}</span>
                                            <span className="text-[11px] font-semibold text-gray-500">Field {player.field}</span>
                                            <span className="ml-auto rounded-xl bg-rose-600 px-2.5 py-0.5 text-xs font-black text-white">
                                                {player.total} pts
                                            </span>
                                        </div>
                                    </div>

                                    {/* Team badge — desktop only */}
                                    <div className="hidden sm:flex items-center">
                                        <span className={`rounded-xl px-2.5 py-1 text-[10px] font-black leading-tight ${colours.badge} ${colours.text}`}>
                                            {player.team}
                                        </span>
                                    </div>

                                    {/* Stats — desktop only */}
                                    <p className="hidden sm:block text-center text-sm font-bold text-gray-700">{player.bat}</p>
                                    <p className="hidden sm:block text-center text-sm font-bold text-gray-700">{player.bowl}</p>
                                    <p className="hidden sm:block text-center text-sm font-bold text-gray-700">{player.field}</p>
                                    <p className="hidden sm:block text-center text-sm font-bold text-gray-500">{player.play}</p>

                                    {/* Total — desktop only */}
                                    <div className="hidden sm:flex justify-end">
                                        <span className={`rounded-xl px-3 py-1.5 text-sm font-black text-white ${
                                            player.rank <= 3 ? 'bg-rose-600 shadow-sm shadow-rose-300' : 'bg-gray-800'
                                        }`}>
                                            {player.total}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Auto-refresh note */}
                    {phase === 'live' && (
                        <p className="pb-2 text-center text-xs font-medium text-gray-400">
                            ↻ Auto-refreshes every 2 minutes during the match
                        </p>
                    )}
                </>
            )}

            {/* No data yet during live */}
            {phase === 'live' && players.length === 0 && !error && (
                <div className="rounded-[32px] border border-dashed border-rose-200 bg-white px-8 py-14 text-center">
                    <Activity className="mx-auto mb-3 h-10 w-10 animate-pulse text-rose-400" />
                    <p className="font-bold text-gray-500">Waiting for first data from the API…</p>
                </div>
            )}
        </div>
    );
};

export default LivePointsPage;
