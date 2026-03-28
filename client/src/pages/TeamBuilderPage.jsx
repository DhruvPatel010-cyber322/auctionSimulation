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

    ROLE_TABS.forEach((role) => {
        if ((summary.roleCounts[role.key] || 0) < role.min) {
            issues.push(`Add at least ${role.min} ${role.label}.`);
        }
    });

    return issues;
};

const BuilderStat = ({ label, value, accent = 'text-white' }) => (
    <div className="rounded-3xl bg-white/12 p-4 backdrop-blur-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-red-100/80">{label}</p>
        <p className={`mt-2 text-3xl font-black ${accent}`}>{value}</p>
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
            <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8 pb-36">
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
        <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8 pb-36">
            <section className="overflow-hidden rounded-[36px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.24),_transparent_28%),linear-gradient(135deg,_#991B1B_0%,_#E53935_52%,_#FB923C_100%)] text-white shadow-[0_28px_90px_rgba(229,57,53,0.22)]">
                <div className="grid gap-6 px-6 py-7 md:grid-cols-[1.15fr_0.85fr] md:px-8">
                    <div>
                        <Link
                            to="/fantasy"
                            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-white/90"
                        >
                            <ArrowLeft size={14} />
                            Back to Matches
                        </Link>

                        <div className="mt-5 flex items-center gap-3">
                            <FantasyTeamMark code={match?.team1} logoMap={teamLogoMap} className="h-16 w-16" labelClassName="text-sm" />
                            <div className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-white">vs</div>
                            <FantasyTeamMark code={match?.team2} logoMap={teamLogoMap} className="h-16 w-16" labelClassName="text-sm" />
                        </div>

                        <p className="mt-5 text-xs font-black uppercase tracking-[0.35em] text-red-100">Dream Team Builder</p>
                        <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">{match?.team1} vs {match?.team2}</h1>
                        <p className="mt-3 max-w-xl text-sm font-medium text-red-50/90 md:text-base">
                            Step 1: pick your XI. Step 2: assign captain and vice-captain. The entire flow stays mobile-first and contest-style.
                        </p>
                        <p className="mt-3 text-sm font-semibold text-red-100/85">{formatMatchDate(match?.date)} • {match?.ground || 'Venue TBD'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 self-start">
                        <BuilderStat label="Selected" value={`${summary.selectedCount}/11`} />
                        <BuilderStat label="Value Left" value={summary.valueLeft.toFixed(1)} />
                        <BuilderStat label="Stage" value={stage === 'build' ? '1/2' : '2/2'} />
                        <BuilderStat label="Max From One Team" value={Math.max(...Object.values(summary.teamCounts), 0)} />
                    </div>
                </div>
            </section>

            {isMatchLocked(match) && (
                <div className="rounded-2xl border border-red-500 bg-red-50 px-5 py-4 font-black flex items-center gap-3 text-red-700 shadow-sm animate-pulse">
                    <ShieldAlert size={20} className="text-red-500" />
                    <span>Match has started. Team editing is now locked.</span>
                </div>
            )}

            <section className="sticky top-4 z-20 rounded-[28px] border border-red-100 bg-white/90 p-3 shadow-lg backdrop-blur-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: 'build', label: '1. Create Team' },
                            { key: 'captains', label: '2. Choose C / VC' }
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
                                    className={`rounded-2xl px-4 py-3 text-sm font-black transition-all ${
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

                    <div className="flex flex-wrap gap-2">
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
                                    className={`rounded-2xl border px-4 py-3 text-sm font-black transition-all ${
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
                        <div className="rounded-[30px] border border-red-100 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Player Pool</p>
                                    <h2 className="mt-2 text-2xl font-black text-gray-950">{activeTab}</h2>
                                </div>
                                <div className="rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-700">
                                    Value used: {summary.valueUsed.toFixed(1)}/100
                                </div>
                            </div>

                            <div className="mt-5 space-y-4">
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

                    <div className="space-y-5 xl:sticky xl:top-32">
                        <FantasyPitchBoard
                            players={selectedPlayers}
                            captainId={captainId}
                            viceCaptainId={viceCaptainId}
                            title="Your Ground View"
                            subtitle="Selected players appear on the pitch in role-wise rows."
                            emptyText="Start selecting players to build your Dream XI."
                        />

                        <div className="rounded-[30px] border border-red-100 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <Sparkles size={18} className="text-red-500" />
                                <h3 className="text-lg font-black text-gray-950">Selection Rules</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {ROLE_TABS.map((role) => (
                                    <div key={role.key} className="rounded-2xl bg-gray-50 p-4">
                                        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-400">{role.label}</p>
                                        <p className="mt-2 text-2xl font-black text-gray-950">{summary.roleCounts[role.key] || 0}</p>
                                        <p className="text-sm font-semibold text-gray-500">Min {role.min}</p>
                                    </div>
                                ))}
                            </div>

                            {selectionIssues.length > 0 && (
                                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                                    <p className="mb-2 flex items-center gap-2 text-sm font-black text-amber-800">
                                        <AlertTriangle size={16} />
                                        Complete these before continuing
                                    </p>
                                    <div className="space-y-1 text-sm font-semibold text-amber-700">
                                        {selectionIssues.slice(0, 4).map((issue) => (
                                            <p key={issue}>{issue}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {canContinue && (
                                <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700">
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

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-red-100 bg-white/95 px-4 py-4 shadow-[0_-12px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-3 py-2 text-sm font-black text-gray-700">
                            {summary.selectedCount}/11 selected
                        </span>
                        <span className="rounded-full bg-red-50 px-3 py-2 text-sm font-black text-red-700">
                            {summary.valueLeft.toFixed(1)} value left
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-2 text-sm font-black text-gray-700">
                            Stage {stage === 'build' ? 'Create Team' : 'Captain Selection'}
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
