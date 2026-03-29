import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Shield, Sparkles, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import FantasyMatchCard from '../components/fantasy/FantasyMatchCard';
import { FantasyMatchCardSkeleton } from '../components/fantasy/FantasySkeletons';
import { getFantasyMatches } from '../services/fantasyApi';
import { getTeams } from '../services/api';
import { buildFantasyTeamLogoMap } from '../utils/fantasyBranding';

const FantasyMatchesPage = () => {
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [teamLogoMap, setTeamLogoMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPageData = async () => {
            try {
                const [matchesData, teamsData] = await Promise.all([
                    getFantasyMatches(),
                    getTeams().catch(() => [])
                ]);

                setMatches(matchesData || []);
                setTeamLogoMap(buildFantasyTeamLogoMap(teamsData || []));
            } catch (err) {
                console.error('Failed to load fantasy matches:', err);
                const message = err.response?.data?.message || 'Failed to load fantasy matches.';
                setError(message);
                toast.error(message);
            } finally {
                setLoading(false);
            }
        };

        fetchPageData();
    }, []);

    return (
        <div className="mx-auto max-w-7xl space-y-5 p-3 md:p-5">
            <section className="overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.24),_transparent_26%),linear-gradient(135deg,_#991B1B_0%,_#E53935_52%,_#FB923C_100%)] px-5 py-6 text-white shadow-lg shadow-red-500/10 md:px-6 md:py-7">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-100">Fantasy Cricket</p>
                        <h1 className="mt-1 max-w-3xl text-2xl font-black tracking-tight sm:text-3xl">
                            Pick a match, build your Dream XI
                        </h1>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <div className="rounded-xl border border-white/20 bg-black/10 px-3 py-2 backdrop-blur-sm">
                                <p className="text-[9px] font-black uppercase tracking-widest text-red-100/90">Matches Live</p>
                                <p className="mt-0.5 text-xl font-black">{matches.length}</p>
                            </div>
                            <div className="rounded-xl border border-white/20 bg-black/10 px-3 py-2 backdrop-blur-sm">
                                <p className="text-[9px] font-black uppercase tracking-widest text-red-100/90">Budget Cap</p>
                                <p className="mt-0.5 text-xl font-black">100</p>
                            </div>
                            <div className="rounded-xl border border-white/20 bg-black/10 px-3 py-2 backdrop-blur-sm">
                                <p className="text-[9px] font-black uppercase tracking-widest text-red-100/90">Squad Size</p>
                                <p className="mt-0.5 text-xl font-black">11</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 flex-wrap lg:flex-col lg:max-w-xs">
                        <Link
                            to="/fantasy/live-points"
                            className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 p-4 backdrop-blur-sm hover:bg-white/25 transition-colors"
                        >
                            <Activity className="h-5 w-5 text-white" />
                            <div>
                                <p className="text-sm font-black leading-tight">Live Points</p>
                                <p className="mt-0.5 text-xs font-medium text-red-50/90 leading-snug">Today's match — real-time leaderboard</p>
                            </div>
                        </Link>
                        <div className="rounded-2xl border border-white/20 bg-black/15 p-4 backdrop-blur-sm">
                            <Shield className="h-5 w-5 text-white" />
                            <p className="mt-2 text-sm font-black leading-tight">Smart role balance</p>
                            <p className="mt-0.5 text-xs font-medium text-red-50/90 leading-snug">Meet role rules, team cap limits, and the 100-value budget.</p>
                        </div>
                        <div className="rounded-2xl border border-white/20 bg-black/15 p-4 backdrop-blur-sm">
                            <Trophy className="h-5 w-5 text-white" />
                            <p className="mt-2 text-sm font-black leading-tight">Match Leaderboards</p>
                            <p className="mt-0.5 text-xs font-medium text-red-50/90 leading-snug">See how your points stack up globally.</p>
                        </div>
                    </div>
                </div>
            </section>

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-700">
                    {error}
                </div>
            )}

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {loading && Array.from({ length: 4 }).map((_, index) => (
                    <FantasyMatchCardSkeleton key={index} />
                ))}

                {!loading && matches.map((match) => (
                    <FantasyMatchCard
                        key={match._id}
                        match={match}
                        teamLogoMap={teamLogoMap}
                        onCreateTeam={() => navigate(`/fantasy/${match._id}/team`)}
                        onOpenTeams={() => navigate(`/fantasy/${match._id}/my-teams`)}
                        onOpenLeaderboard={() => navigate(`/fantasy/${match._id}/leaderboard`)}
                    />
                ))}
            </section>

            {!loading && matches.length === 0 && !error && (
                <div className="rounded-[32px] border border-dashed border-red-200 bg-white px-8 py-16 text-center">
                    <h2 className="text-2xl font-black text-gray-900">No fantasy matches available</h2>
                    <p className="mt-2 font-medium text-gray-500">Once IPL fixtures are available, match cards will appear here.</p>
                </div>
            )}
        </div>
    );
};

export default FantasyMatchesPage;
