import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    ShieldAlert,
    Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import FantasyCaptainSelector from '../components/fantasy/FantasyCaptainSelector';
import FantasyPitchBoard from '../components/fantasy/FantasyPitchBoard';
import FantasyPlayerCard from '../components/fantasy/FantasyPlayerCard';
import { FantasyPlayerCardSkeleton } from '../components/fantasy/FantasySkeletons';
import FantasyTeamMark from '../components/fantasy/FantasyTeamMark';
import { getFantasyPlayers, getMyFantasyTeams, saveFantasyTeam } from '../services/fantasyApi';
import { getTeams } from '../services/api';
import {
    ROLE_TABS,
    buildFantasySummary,
    getPlayerSelectionState,
    getPlayerValue,
    sortFantasyPlayers,
    validateFantasyTeam,
    isMatchLocked
} from '../utils/fantasy';
import { buildFantasyTeamLogoMap } from '../utils/fantasyBranding';

const formatMatchDate = (value) => {
    if (!value) return 'Date TBD';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit'
    });
};

const buildSelectionIssues = (summary) => {
    const issues = [];

    if (summary.selectedCount !== 11) {
        issues.push('Select exactly 11 players.');
    }

    if (summary.valueUsed > 100) {
        issues.push('Keep total value within 100.');
    }

    if (Object.values(summary.teamCounts).some((count) => count > 7)) {
        issues.push('Pick at most 7 players from one team.');
    }

    if (summary.overseasCount > 4) {
        issues.push('At most 4 overseas players allowed.');
    }

    ROLE_TABS.forEach((role) => {
        const count = summary.roleCounts[role.key] || 0;
        if (count < role.min) {
            issues.push(`Add at least ${role.min} ${role.label}.`);
        }
        if (count > role.max) {
            issues.push(`Too many ${role.label}s — max is ${role.max}.`);
        }
    });

    return issues;
};

const BuilderStat = ({ label, value, accent = 'text-white' }) => (
    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm border border-white/10">
        <p className="text-[10px] font-black uppercase tracking-widest text-red-100/90">{label}</p>
        <p className={`mt-1 text-2xl font-black ${accent}`}>{value}</p>
    </div>
);

const TeamBuilderPage = () => {
    const navigate = useNavigate();
    const { matchId } = useParams();

    const [match, setMatch] = useState(null);
    const [teamLogoMap, setTeamLogoMap] = useState({});
    const [playersByRole, setPlayersByRole] = useState({
        'Wicket Keeper': [],
        Batsman: [],
        'All-Rounder': [],
        Bowler: []
    });
    const [allPlayers, setAllPlayers] = useState([]);
    const [activeTab, setActiveTab] = useState('Wicket Keeper');
    const [selectedIds, setSelectedIds] = useState([]);
    const [captainId, setCaptainId] = useState('');
    const [viceCaptainId, setViceCaptainId] = useState('');
    const [hasExistingTeam, setHasExistingTeam] = useState(false);
    const [stage, setStage] = useState('build');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadBuilder = async () => {
            try {
                const [playersResponse, myTeamsResponse, teamsResponse] = await Promise.all([
                    getFantasyPlayers(matchId),
                    getMyFantasyTeams(matchId).catch(() => ({ teams: [] })),
                    getTeams().catch(() => [])
                ]);

                setMatch(playersResponse.match);
                setPlayersByRole(playersResponse.players || {});
                setAllPlayers(playersResponse.allPlayers || []);
                setTeamLogoMap(buildFantasyTeamLogoMap(teamsResponse || []));

                const existingTeam = myTeamsResponse?.teams?.[0];
                if (existingTeam) {
                    setHasExistingTeam(true);
                    setSelectedIds(existingTeam.players.map((player) => player._id));
                    setCaptainId(existingTeam.captain?._id || '');
                    setViceCaptainId(existingTeam.viceCaptain?._id || '');
                }
            } catch (err) {
                console.error('Failed to load fantasy builder:', err);
                const message = err.response?.data?.message || 'Failed to load the team builder.';
                setError(message);
                toast.error(message);
            } finally {
                setLoading(false);
            }
        };

        loadBuilder();
    }, [matchId]);

    const selectedPlayers = useMemo(() => sortFantasyPlayers(
        allPlayers.filter((player) => selectedIds.includes(player._id))
    ), [allPlayers, selectedIds]);

    const summary = useMemo(() => buildFantasySummary(selectedPlayers), [selectedPlayers]);
    const validation = useMemo(
        () => validateFantasyTeam(selectedPlayers, captainId, viceCaptainId),
        [selectedPlayers, captainId, viceCaptainId]
    );
    const selectionIssues = useMemo(() => buildSelectionIssues(summary), [summary]);
    const canContinue = selectionIssues.length === 0;

    const togglePlayer = (player) => {
        if (isMatchLocked(match)) {
            toast.error('Team editing is locked. This match has already started.');
            return;
        }

        const isSelected = selectedIds.includes(player._id);

        if (isSelected) {
            setSelectedIds((prev) => prev.filter((id) => id !== player._id));
            if (captainId === player._id) setCaptainId('');
            if (viceCaptainId === player._id) setViceCaptainId('');
            setError('');
            return;
        }

        const availability = getPlayerSelectionState(player, selectedPlayers);
        if (!availability.allowed) {
            setError(availability.reason);
            toast.error(availability.reason);
            return;
        }

        setSelectedIds((prev) => [...prev, player._id]);
        setError('');
    };

    const assignCaptain = (playerId) => {
        if (isMatchLocked(match)) return;
        setCaptainId(playerId);
        if (viceCaptainId === playerId) {
            setViceCaptainId('');
        }
    };

    const assignViceCaptain = (playerId) => {
        if (isMatchLocked(match)) return;
        setViceCaptainId(playerId);
        if (captainId === playerId) {
            setCaptainId('');
        }
    };

    const handleContinue = () => {
        if (!canContinue) {
            const message = selectionIssues[0] || 'Complete your XI before continuing.';
            setError(message);
            toast.error(message);
            return;
        }

        setStage('captains');
        setError('');
        toast.success('Now choose captain and vice-captain.');
    };

    const handleSaveTeam = async () => {
        if (!validation.isValid) {
            const message = validation.errors[0];
            setError(message);
            toast.error(message);
            return;
        }

        setSaving(true);
        setError('');

        try {
            await saveFantasyTeam({
                matchId,
                players: selectedPlayers.map((player) => player._id),
                captain: captainId,
                viceCaptain: viceCaptainId
            });

            toast.success(hasExistingTeam ? 'Fantasy team updated.' : 'Fantasy team saved.');
            navigate(`/fantasy/${matchId}/my-teams`);
        } catch (err) {
            console.error('Failed to save fantasy team:', err);
            const message = err.response?.data?.message || 'Failed to save your fantasy team.';
            setError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full overflow-y-auto px-4 py-6 space-y-6 max-w-7xl mx-auto">
                <div className="h-52 animate-pulse rounded-[36px] bg-gradient-to-r from-red-100 via-rose-50 to-orange-100" />
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <FantasyPlayerCardSkeleton key={index} />
                        ))}
                    </div>
                    <div className="h-[520px] animate-pulse rounded-[32px] bg-emerald-100" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* ── TOP: match header + lock warning ── */}
            <div className="shrink-0 px-3 md:px-5 pt-3 md:pt-4 space-y-3">
            <section className="overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.24),_transparent_28%),linear-gradient(135deg,_#991B1B_0%,_#E53935_52%,_#FB923C_100%)] text-white shadow-lg shadow-red-500/10">
                <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-5">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link
                            to="/fantasy"
                            className="flex-shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-full border border-white/20 bg-white/10 transition-colors hover:bg-white/20"
                        >
                            <ArrowLeft size={16} />
                        </Link>
                        <div className="flex items-center gap-2 min-w-0">
                            <FantasyTeamMark code={match?.team1} logoMap={teamLogoMap} className="h-10 w-10 flex-shrink-0" labelClassName="text-xs" />
                            <div className="min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-widest text-red-100 leading-none">Team Builder</p>
                                <h1 className="text-sm sm:text-base font-black tracking-tight truncate mt-0.5">{match?.team1} vs {match?.team2}</h1>
                                <p className="text-[10px] font-medium text-red-100/80 mt-0.5 truncate">{match?.ground || 'Venue TBD'}</p>
                            </div>
                            <FantasyTeamMark code={match?.team2} logoMap={teamLogoMap} className="h-10 w-10 flex-shrink-0" labelClassName="text-xs" />
                        </div>
                    </div>

                    <div className="flex-shrink-0 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-white/10 border border-white/10 px-2.5 py-2 text-center backdrop-blur-sm">
                            <p className="text-[9px] font-black uppercase tracking-widest text-red-100/80 leading-none">Picked</p>
                            <p className="text-lg font-black leading-tight mt-0.5">{summary.selectedCount}/11</p>
                        </div>
                        <div className="rounded-xl bg-white/10 border border-white/10 px-2.5 py-2 text-center backdrop-blur-sm">
                            <p className="text-[9px] font-black uppercase tracking-widest text-red-100/80 leading-none">Value</p>
                            <p className="text-lg font-black leading-tight mt-0.5">{summary.valueLeft.toFixed(0)}</p>
                        </div>
                    </div>
                </div>
            </section>

            {isMatchLocked(match) && (
                <div className="rounded-2xl border border-red-500 bg-red-50 px-5 py-4 font-black flex items-center gap-3 text-red-700 shadow-sm animate-pulse">
                    <ShieldAlert size={20} className="text-red-500" />
                    <span>Match has started. Team editing is now locked.</span>
                </div>
            )}
            </div>{/* /top-static */}

            {/* ── TAB NAVIGATION ── sandwiched between top and content ── */}
            <div className="shrink-0 px-3 md:px-5">
            <section className="rounded-2xl border border-red-100 bg-white/90 p-2.5 shadow-lg backdrop-blur-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: 'build', label: '1. Build' },
                            { key: 'captains', label: '2. C / VC' }
                        ].map((stepItem) => {
                            const isActive = stage === stepItem.key;
                            const disabled = stepItem.key === 'captains' && !canContinue && stage === 'build';

                            return (
                                <button
                                    key={stepItem.key}
                                    onClick={() => {
                                        if (stepItem.key === 'captains' && !canContinue) {
                                            toast.error(selectionIssues[0] || 'Complete your XI first.');
                                            return;
                                        }
                                        setStage(stepItem.key);
                                    }}
                                    className={`rounded-xl px-3 py-2 text-xs font-black transition-all ${
                                        isActive
                                            ? 'bg-[#E53935] text-white shadow-md'
                                            : disabled
                                                ? 'bg-gray-100 text-gray-400'
                                                : 'bg-gray-50 text-gray-700 hover:bg-red-50'
                                    }`}
                                >
                                    {stepItem.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {ROLE_TABS.map((tab) => {
                            const isActive = activeTab === tab.key;
                            const count = summary.roleCounts[tab.key] || 0;

                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => {
                                        setStage('build');
                                        setActiveTab(tab.key);
                                    }}
                                    className={`rounded-xl border px-3 py-1.5 text-xs font-black transition-all ${
                                        isActive
                                            ? 'border-red-200 bg-red-50 text-red-700'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-red-100 hover:bg-red-50'
                                    }`}
                                >
                                    {tab.label} <span className="ml-1 opacity-70">{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>
            </div>{/* /tab-nav */}

            {/* ── SCROLLABLE CONTENT: player pool / captain selector ── */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3 md:px-5">
            <div className="py-4 space-y-4">

            {hasExistingTeam && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 font-semibold text-amber-800">
                    You already have a saved team for this match. Saving again will update the same team.
                </div>
            )}

            {error && (
                <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-700">
                    <ShieldAlert size={18} />
                    {error}
                </div>
            )}

            {stage === 'build' ? (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-5">
                        <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Player Pool</p>
                                    <h2 className="text-xl font-black text-gray-950 mt-0.5">{activeTab}</h2>
                                </div>
                                <div className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-black text-red-700">
                                    Value used: {summary.valueUsed.toFixed(1)}/100
                                </div>
                            </div>

                            <div className="mt-3 space-y-2.5">
                                {(playersByRole[activeTab] || []).map((player) => {
                                    const selectionState = getPlayerSelectionState(player, selectedPlayers);

                                    return (
                                        <FantasyPlayerCard
                                            key={player._id}
                                            player={player}
                                            teamLogoMap={teamLogoMap}
                                            value={getPlayerValue(player)}
                                            isSelected={selectedIds.includes(player._id)}
                                            allowed={selectionState.allowed}
                                            disabledReason={selectionState.reason}
                                            onToggle={togglePlayer}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5 xl:sticky xl:top-4">
                        <FantasyPitchBoard
                            players={selectedPlayers}
                            captainId={captainId}
                            viceCaptainId={viceCaptainId}
                            title="Your Ground View"
                            subtitle="Selected players appear on the pitch in role-wise rows."
                            emptyText="Start selecting players to build your Dream XI."
                        />

                        <div className="rounded-[30px] border border-red-100 bg-white p-5 shadow-sm space-y-5">
                            {/* Header */}
                            <div className="flex items-center gap-2">
                                <Sparkles size={18} className="text-red-500" />
                                <h3 className="text-lg font-black text-gray-950">Selection Rules</h3>
                            </div>

                            {/* Players + Overseas row */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Total players */}
                                <div className={`rounded-2xl p-4 flex flex-col gap-2 ${
                                    summary.selectedCount === 11 ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-100'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Players</p>
                                        <span className={`text-xs font-black ${
                                            summary.selectedCount === 11 ? 'text-emerald-600' : 'text-gray-400'
                                        }`}>{summary.selectedCount}/11</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                summary.selectedCount === 11 ? 'bg-emerald-500' : 'bg-blue-400'
                                            }`}
                                            style={{ width: `${(summary.selectedCount / 11) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Overseas */}
                                <div className={`rounded-2xl p-4 flex flex-col gap-2 ${
                                    summary.overseasCount > 4
                                        ? 'bg-red-50 border border-red-300'
                                        : summary.overseasCount === 4
                                            ? 'bg-amber-50 border border-amber-200'
                                            : 'bg-sky-50 border border-sky-100'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">✈ Overseas</p>
                                        <span className={`text-xs font-black ${
                                            summary.overseasCount > 4 ? 'text-red-600' : summary.overseasCount === 4 ? 'text-amber-600' : 'text-sky-600'
                                        }`}>{summary.overseasCount}/4</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                summary.overseasCount > 4 ? 'bg-red-500' : summary.overseasCount === 4 ? 'bg-amber-400' : 'bg-sky-400'
                                            }`}
                                            style={{ width: `${Math.min((summary.overseasCount / 4) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Role constraints */}
                            <div className="space-y-3">
                                {ROLE_TABS.map((role) => {
                                    const count = summary.roleCounts[role.key] || 0;
                                    const pct = Math.min(Math.max((count - role.min) / Math.max(role.max - role.min, 1), 0), 1);
                                    const isTooFew = count < role.min;
                                    const isTooMany = count > role.max;
                                    const isOk = !isTooFew && !isTooMany;

                                    const roleColors = {
                                        'Wicket Keeper': { bar: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', icon: '🧤' },
                                        'Batsman':       { bar: 'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200',   icon: '🏏' },
                                        'All-Rounder':   { bar: 'bg-amber-500',  bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-200',  icon: '⭐' },
                                        'Bowler':        { bar: 'bg-red-500',    bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200',    icon: '🏐' },
                                    };
                                    const colors = roleColors[role.key] || { bar: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: '' };

                                    return (
                                        <div key={role.key} className={`rounded-2xl border p-3.5 ${
                                            isTooMany ? 'bg-red-50 border-red-300' : isTooFew ? 'bg-gray-50 border-gray-100' : `${colors.bg} ${colors.border}`
                                        }`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base leading-none">{colors.icon}</span>
                                                    <span className="text-xs font-black text-gray-800">{role.label}</span>
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">({role.min}–{role.max})</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`text-sm font-black ${isTooMany ? 'text-red-600' : isTooFew ? 'text-gray-400' : colors.text}`}>{count}</span>
                                                    {isOk && count > 0 && <span className="text-emerald-500 text-xs">✓</span>}
                                                    {isTooMany && <span className="text-red-500 text-xs">✗</span>}
                                                </div>
                                            </div>

                                            {/* Range bar — min to max, fill position based on count */}
                                            <div className="relative h-2 rounded-full bg-gray-200 overflow-hidden">
                                                {/* min threshold marker */}
                                                <div
                                                    className="absolute top-0 bottom-0 w-0.5 bg-gray-400/60 z-10"
                                                    style={{ left: `${(role.min / role.max) * 100}%` }}
                                                />
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        isTooMany ? 'bg-red-500' : isTooFew ? 'bg-gray-300' : colors.bar
                                                    }`}
                                                    style={{ width: `${Math.min((count / role.max) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-1">
                                                <span className="text-[9px] text-gray-400 font-bold">Min {role.min}</span>
                                                <span className="text-[9px] text-gray-400 font-bold">Max {role.max}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {selectionIssues.length > 0 && (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                                    <p className="mb-2 flex items-center gap-2 text-sm font-black text-amber-800">
                                        <AlertTriangle size={16} />
                                        Complete these before continuing
                                    </p>
                                    <div className="space-y-1 text-sm font-semibold text-amber-700">
                                        {selectionIssues.slice(0, 4).map((issue) => (
                                            <p key={issue}>• {issue}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {canContinue && (
                                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700">
                                    <CheckCircle2 size={16} />
                                    Your XI is ready. Continue to captain selection.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.9fr]">
                    <FantasyCaptainSelector
                        players={selectedPlayers}
                        captainId={captainId}
                        viceCaptainId={viceCaptainId}
                        onCaptain={assignCaptain}
                        onViceCaptain={assignViceCaptain}
                    />

                    <div className="space-y-5 xl:sticky xl:top-32">
                        <FantasyPitchBoard
                            players={selectedPlayers}
                            captainId={captainId}
                            viceCaptainId={viceCaptainId}
                            title="Final Team Preview"
                            subtitle="Review your XI before saving."
                            emptyText="Add players first to see your pitch."
                        />

                        {!validation.isValid && validation.errors.length > 0 && (
                            <div className="rounded-[30px] border border-amber-200 bg-amber-50 px-5 py-5">
                                <p className="mb-2 flex items-center gap-2 text-sm font-black text-amber-800">
                                    <AlertTriangle size={16} />
                                    Fix before saving
                                </p>
                                <div className="space-y-1 text-sm font-semibold text-amber-700">
                                    {validation.errors.slice(0, 4).map((issue) => (
                                        <p key={issue}>{issue}</p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            </div>{/* /py-4 space-y-4 */}
            </div>{/* /scrollable-content */}

            {/* ── FOOTER ACTION BAR ── always pinned at bottom ── */}
            <div className="shrink-0 border-t border-red-100 bg-white/95 backdrop-blur-sm shadow-[0_-8px_32px_rgba(229,57,53,0.1)]">
                <div className="px-4 py-3 max-w-7xl mx-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-black text-gray-700">
                            {summary.selectedCount}/11 Selected
                        </span>
                        <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-black text-red-600">
                            {summary.valueLeft.toFixed(1)} Value Left
                        </span>
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-black text-gray-700 hidden sm:inline-flex">
                            Stage: {stage === 'build' ? 'Squad' : 'Captain'}
                        </span>
                    </div>

                    <div className="flex gap-3">
                        {stage === 'captains' && (
                            <button
                                onClick={() => setStage('build')}
                                className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-900 transition-all hover:bg-gray-50"
                            >
                                Back
                            </button>
                        )}

                        {stage === 'build' ? (
                            <button
                                onClick={handleContinue}
                                disabled={!canContinue}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#E53935] px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-500/20 transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none"
                            >
                                Continue
                                <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSaveTeam}
                                disabled={saving || isMatchLocked(match)}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#E53935] px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-500/20 transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none"
                            >
                                {isMatchLocked(match) ? 'Locked' : saving ? 'Saving Team...' : hasExistingTeam ? 'Update Team' : 'Save Team'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamBuilderPage;
