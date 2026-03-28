import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Crown, Loader2, Medal, PencilLine, Star, Trophy } from 'lucide-react';
import FantasyPitchBoard from '../components/fantasy/FantasyPitchBoard';
import FantasyPlayerAvatar from '../components/fantasy/FantasyPlayerAvatar';
import { getMyFantasyTeams } from '../services/fantasyApi';
import { getPlayerValue, sortFantasyPlayers } from '../utils/fantasy';

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

const MyFantasyTeamsPage = () => {
    const { matchId } = useParams();
    const [match, setMatch] = useState(null);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const data = await getMyFantasyTeams(matchId);
                setMatch(data.match);
                setTeams(data.teams || []);
            } catch (err) {
                console.error('Failed to load fantasy teams:', err);
                setError(err.response?.data?.message || 'Failed to load your fantasy team.');
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, [matchId]);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-rose-600" />
                <p className="font-bold text-gray-500">Loading your fantasy team...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
            <section className="overflow-hidden rounded-[36px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_30%),linear-gradient(135deg,_#991b1b_0%,_#e11d48_52%,_#fb923c_100%)] px-6 py-8 text-white shadow-[0_28px_90px_rgba(225,29,72,0.24)] md:px-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <Link to="/fantasy" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-white/90">
                            <ArrowLeft size={14} />
                            Back to Matches
                        </Link>
                        <p className="mt-5 text-xs font-black uppercase tracking-[0.35em] text-rose-100">My Fantasy Squad</p>
                        <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">{match?.team1} vs {match?.team2}</h1>
                        <p className="mt-3 text-sm font-medium text-rose-50/90">
                            {match ? formatMatchDate(match.date) : 'Selected fixture'}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            to={`/fantasy/${matchId}/team`}
                            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-rose-700 transition-colors hover:bg-rose-50"
                        >
                            <PencilLine size={18} />
                            Edit Team
                        </Link>
                        <Link
                            to={`/fantasy/${matchId}/leaderboard`}
                            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-black/15 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-black/25"
                        >
                            <Medal size={18} />
                            View Leaderboard
                        </Link>
                    </div>
                </div>
            </section>

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-700">
                    {error}
                </div>
            )}

            {!loading && teams.length === 0 && !error && (
                <div className="rounded-[32px] border border-dashed border-rose-200 bg-white px-8 py-16 text-center">
                    <h2 className="text-2xl font-black text-gray-900">No fantasy team saved yet</h2>
                    <p className="mb-6 mt-2 text-gray-500">Build your XI for this fixture to start competing.</p>
                    <Link
                        to={`/fantasy/${matchId}/team`}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#dc2626,_#f43f5e)] px-5 py-3 font-black text-white"
                    >
                        <Trophy size={18} />
                        Build Team
                    </Link>
                </div>
            )}

            <div className="space-y-6">
                {teams.map((team) => {
                    const players = sortFantasyPlayers(team.players || []);
                    const valueUsed = typeof team.summary?.valueUsed === 'number'
                        ? team.summary.valueUsed.toFixed(1)
                        : typeof team.summary?.creditsUsed === 'number'
                            ? team.summary.creditsUsed.toFixed(1)
                            : '0.0';

                    return (
                        <article key={team._id} className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                            <FantasyPitchBoard
                                players={players}
                                captainId={team.captain?._id || ''}
                                viceCaptainId={team.viceCaptain?._id || ''}
                                title="Saved Dream XI"
                                subtitle={`Updated ${team.updatedAt ? new Date(team.updatedAt).toLocaleString('en-IN') : 'recently'}`}
                                emptyText="No players saved in this squad yet."
                                showMeta={false}
                            />

                            <div className="space-y-5">
                                <div className="rounded-[30px] border border-rose-100 bg-white p-5 shadow-sm">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl bg-gray-950 p-4 text-white">
                                            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-400">Total Value</p>
                                            <p className="mt-2 text-3xl font-black">{valueUsed}</p>
                                        </div>
                                        <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-800">
                                            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600">Total Points</p>
                                            <p className="mt-2 text-3xl font-black">{team.totalPoints}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-3">
                                        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <FantasyPlayerAvatar player={{ name: team.captain?.name }} className="h-12 w-12" textClassName="text-sm" />
                                                <div>
                                                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-700">Captain</p>
                                                    <p className="mt-1 flex items-center gap-2 text-sm font-black text-amber-900">
                                                        <Crown size={14} />
                                                        {team.captain?.name || 'Not set'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="rounded-[24px] border border-sky-200 bg-sky-50 px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <FantasyPlayerAvatar player={{ name: team.viceCaptain?.name }} className="h-12 w-12" textClassName="text-sm" />
                                                <div>
                                                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-sky-700">Vice-Captain</p>
                                                    <p className="mt-1 flex items-center gap-2 text-sm font-black text-sky-900">
                                                        <Star size={14} />
                                                        {team.viceCaptain?.name || 'Not set'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[30px] border border-rose-100 bg-white p-5 shadow-sm">
                                    <p className="text-xs font-black uppercase tracking-[0.3em] text-rose-500">Squad List</p>
                                    <div className="mt-4 space-y-3">
                                        {players.map((player) => (
                                            <div key={player._id} className="rounded-[22px] border border-gray-100 bg-gray-50 px-4 py-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <FantasyPlayerAvatar player={player} className="h-12 w-12" textClassName="text-sm" />
                                                        <div>
                                                            <p className="text-sm font-black text-gray-950">{player.name}</p>
                                                            <p className="mt-1 text-sm font-semibold text-gray-500">
                                                                {player.orgIPLTeam26} | {player.role}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-gray-900">{getPlayerValue(player).toFixed(1)} value</p>
                                                        <p className="text-xs font-semibold text-gray-500">{player.points || 0} pts</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
};

export default MyFantasyTeamsPage;
