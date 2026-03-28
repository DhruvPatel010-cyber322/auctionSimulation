import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sparkles, Trophy } from 'lucide-react';
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
        <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
            <section className="overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.24),_transparent_26%),linear-gradient(135deg,_#991B1B_0%,_#E53935_52%,_#FB923C_100%)] px-6 py-8 text-white shadow-xl shadow-red-500/10 md:px-8 md:py-10">
                <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                    <div>
                        <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-red-100">Fantasy Cricket</p>
                        <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
                            Pick a match and build your Dream XI
                        </h1>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <div className="rounded-2xl border border-white/20 bg-black/10 px-4 py-3 backdrop-blur-sm">
                                <p className="text-[10px] font-black uppercase tracking-widest text-red-100/90">Matches Live</p>
                                <p className="mt-1 text-2xl font-black">{matches.length}</p>
                            </div>
                            <div className="rounded-2xl border border-white/20 bg-black/10 px-4 py-3 backdrop-blur-sm">
                                <p className="text-[10px] font-black uppercase tracking-widest text-red-100/90">Budget Cap</p>
                                <p className="mt-1 text-2xl font-black">100</p>
                            </div>
                            <div className="rounded-2xl border border-white/20 bg-black/10 px-4 py-3 backdrop-blur-sm">
                                <p className="text-[10px] font-black uppercase tracking-widest text-red-100/90">Squad Size</p>
                                <p className="mt-1 text-2xl font-black">11</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 self-start sm:grid-cols-3 lg:grid-cols-1">
                        <div className="rounded-[24px] border border-white/20 bg-black/15 p-5 backdrop-blur-sm">
                            <Shield className="h-6 w-6 text-white" />
                            <p className="mt-3 text-lg font-black leading-tight">Smart role balance</p>
                            <p className="mt-1 text-sm font-medium text-red-50/90 leading-snug">Meet role rules, team cap limits, and the 100-value budget before saving.</p>
                        </div>
                        <div className="rounded-[24px] border border-white/20 bg-black/15 p-5 backdrop-blur-sm">
                            <Sparkles className="h-6 w-6 text-white" />
                            <p className="mt-3 text-lg font-black leading-tight">Contest Live Status</p>
                            <p className="mt-1 text-sm font-medium text-red-50/90 leading-snug">Team creation shuts down exactly when the first ball is bowled.</p>
                        </div>
                        <div className="rounded-[24px] border border-white/20 bg-black/15 p-5 backdrop-blur-sm">
                            <Trophy className="h-6 w-6 text-white" />
                            <p className="mt-3 text-lg font-black leading-tight">Match Leaderboards</p>
                            <p className="mt-1 text-sm font-medium text-red-50/90 leading-snug">See how your fantasy points stack up against other users in the global leaderboard.</p>
                        </div>
                    </div>
                </div>
            </section>

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-700">
                    {error}
                </div>
            )}

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
