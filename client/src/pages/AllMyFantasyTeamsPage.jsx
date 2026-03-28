import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, Trophy, Crown, Star, CalendarDays } from 'lucide-react';
import { getAllMyFantasyTeams } from '../services/fantasyApi';
import FantasyStatusBadge from '../components/fantasy/FantasyStatusBadge';
import toast from 'react-hot-toast';

const formatMatchDate = (value) => {
    if (!value) return 'Date TBD';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: 'numeric', minute: '2-digit'
    });
};

const AllMyFantasyTeamsPage = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMyTeams = async () => {
            try {
                const data = await getAllMyFantasyTeams();
                setTeams(data.teams || []);
            } catch (err) {
                console.error('Failed to load global fantasy teams:', err);
                toast.error('Failed to load your fantasy teams.');
            } finally {
                setLoading(false);
            }
        };
        fetchMyTeams();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-red-600" />
                <p className="font-bold text-gray-500">Loading your fantasy teams...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
            <section className="overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.24),_transparent_26%),linear-gradient(135deg,_#991B1B_0%,_#E53935_52%,_#FB923C_100%)] px-6 py-8 text-white shadow-xl shadow-red-500/10 md:px-8 md:py-10">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-red-100">Global Overview</p>
                        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">My Fantasy Teams</h1>
                    </div>
                    <div className="rounded-2xl border border-white/20 bg-black/10 px-6 py-4 backdrop-blur-sm self-start lg:self-auto">
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-100/90">Total Contests</p>
                        <p className="mt-1 text-3xl font-black">{teams.length}</p>
                    </div>
                </div>
            </section>

            {teams.length === 0 ? (
                <div className="rounded-[32px] border border-dashed border-red-200 bg-white px-8 py-16 text-center shadow-sm">
                    <Trophy className="mx-auto mb-4 h-12 w-12 text-red-200" />
                    <h2 className="text-2xl font-black text-gray-900">No teams created yet</h2>
                    <p className="mt-2 font-medium text-gray-500">Head over to the matches page and build your first dream team.</p>
                    <Link to="/fantasy" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-700 hover:scale-[1.02]">
                        View Matches
                    </Link>
                </div>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {teams.map(({ _id, match, totalPoints, captain, viceCaptain }) => (
                        <article key={_id} className="group overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-xl shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/10 flex flex-col">
                            <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Match</p>
                                        <h3 className="mt-1 text-lg font-black leading-tight text-gray-900 line-clamp-2">
                                            {match ? (match.matchName || `${match.team1} vs ${match.team2}`) : 'Unknown Match'}
                                        </h3>
                                    </div>
                                    {match && <FantasyStatusBadge status={match.status} />}
                                </div>
                                {match && (
                                    <p className="mt-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-500">
                                        <CalendarDays size={14} className="text-red-500" />
                                        {formatMatchDate(match.date)}
                                    </p>
                                )}
                            </div>

                            <div className="flex-1 p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-[16px] bg-red-50 px-3 py-3 border border-red-100">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-red-800">Total Points</p>
                                        <p className="mt-1 text-2xl font-black text-red-600">{totalPoints || 0}</p>
                                    </div>
                                    <div className="flex flex-col justify-center rounded-[16px] bg-gray-50 px-3 py-3 border border-gray-100 space-y-2 overflow-hidden">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className="bg-amber-100 text-amber-700 rounded p-1 flex-shrink-0"><Crown size={12} strokeWidth={3} /></div>
                                            <span className="text-xs font-black text-gray-900 truncate" title={captain?.name || 'None'}>{captain?.name || 'None'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className="bg-sky-100 text-sky-700 rounded p-1 flex-shrink-0"><Star size={12} strokeWidth={3} /></div>
                                            <span className="text-xs font-black text-gray-900 truncate" title={viceCaptain?.name || 'None'}>{viceCaptain?.name || 'None'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="px-5 pb-5 mt-auto">
                                <button
                                    onClick={() => navigate(`/fantasy/${match?.matchId || match?._id}/my-teams`)}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-black text-white transition-all hover:bg-gray-800"
                                >
                                    View Squad <ArrowRight size={16} />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AllMyFantasyTeamsPage;
