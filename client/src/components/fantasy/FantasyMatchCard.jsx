import React from 'react';
import { CalendarDays, ChevronRight, MapPin, Medal, PlusCircle, Users } from 'lucide-react';
import FantasyStatusBadge from './FantasyStatusBadge';
import FantasyTeamMark from './FantasyTeamMark';

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

const FantasyMatchCard = ({
    match,
    teamLogoMap = {},
    onCreateTeam,
    onOpenTeams,
    onOpenLeaderboard
}) => {
    return (
        <article className="group overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-xl shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/10">
            <div className="bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_28%),linear-gradient(135deg,_#991B1B_0%,_#E53935_55%,_#FB923C_100%)] px-5 py-5 text-white">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-100/90">Fantasy Contest</p>
                        <h2 className="mt-2 text-xl font-black tracking-tight leading-tight">{match.matchName || `${match.team1} vs ${match.team2}`}</h2>
                    </div>
                    <FantasyStatusBadge status={match.status} />
                </div>

                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-white/15 bg-black/15 px-4 py-4 backdrop-blur-sm">
                    <div className="flex min-w-0 items-center justify-end flex-row-reverse sm:flex-row gap-3">
                        <div className="min-w-0 text-left sm:text-right hidden sm:block">
                            <p className="text-[9px] font-black uppercase tracking-widest text-red-100/70">Team 1</p>
                            <p className="truncate text-base font-black">{match.team1}</p>
                        </div>
                        <FantasyTeamMark code={match.team1} logoMap={teamLogoMap} className="h-12 w-12" labelClassName="text-sm sm:hidden" />
                    </div>

                    <div className="rounded-full bg-white/15 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white mx-2">VS</div>

                    <div className="flex min-w-0 items-center justify-start gap-3">
                        <FantasyTeamMark code={match.team2} logoMap={teamLogoMap} className="h-12 w-12" labelClassName="text-sm sm:hidden" />
                        <div className="min-w-0 text-left hidden sm:block">
                            <p className="text-[9px] font-black uppercase tracking-widest text-red-100/70">Team 2</p>
                            <p className="truncate text-base font-black">{match.team2}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-5 p-5">
                <div className="grid gap-3 grid-cols-2">
                    <div className="rounded-[20px] border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Start Time</p>
                        <p className="mt-2 flex items-center gap-2 text-sm font-black text-gray-900">
                            <CalendarDays size={16} className="text-red-500" />
                            {formatMatchDate(match.date)}
                        </p>
                    </div>
                    <div className="rounded-[20px] border border-gray-100 bg-gray-50 px-4 py-3 col-span-2 sm:col-span-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Venue</p>
                        <p className="mt-2 flex items-center gap-2 text-sm font-black text-gray-900 truncate">
                            <MapPin size={16} className="text-red-500 flex-shrink-0" />
                            <span className="truncate">{match.ground || 'Venue TBD'}</span>
                        </p>
                    </div>
                </div>

                <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
                    <button
                        onClick={onCreateTeam}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#E53935] px-4 py-3 text-sm font-black text-white shadow-lg shadow-red-500/20 transition-all duration-200 hover:scale-[1.02] hover:bg-red-600"
                    >
                        <PlusCircle size={18} />
                        Create Team
                    </button>
                    <button
                        onClick={onOpenTeams}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-900 transition-all duration-200 hover:scale-[1.02] hover:bg-gray-50"
                    >
                        <Users size={18} />
                        My Teams
                    </button>
                    <button
                        onClick={onOpenLeaderboard}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-900 transition-all duration-200 hover:scale-[1.02] hover:bg-gray-50"
                    >
                        <Medal size={18} />
                        Leaderboard
                        <ChevronRight size={16} className="text-gray-400" />
                    </button>
                </div>
            </div>
        </article>
    );
};

export default FantasyMatchCard;
