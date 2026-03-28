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
        <article className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-500/10">
            <div className="bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_28%),linear-gradient(135deg,_#991B1B_0%,_#E53935_55%,_#FB923C_100%)] px-4 py-4 text-white">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-red-100/90">Fantasy Contest</p>
                        <h2 className="mt-1 text-base font-black tracking-tight leading-tight truncate">{match.matchName || `${match.team1} vs ${match.team2}`}</h2>
                    </div>
                    <FantasyStatusBadge status={match.status} />
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-black/15 px-3 py-3 backdrop-blur-sm">
                    <div className="flex min-w-0 items-center gap-2">
                        <FantasyTeamMark code={match.team1} logoMap={teamLogoMap} className="h-9 w-9 flex-shrink-0" labelClassName="text-xs sm:hidden" />
                        <p className="truncate text-sm font-black hidden sm:block">{match.team1}</p>
                    </div>

                    <div className="rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white flex-shrink-0">VS</div>

                    <div className="flex min-w-0 items-center gap-2 justify-end">
                        <p className="truncate text-sm font-black hidden sm:block">{match.team2}</p>
                        <FantasyTeamMark code={match.team2} logoMap={teamLogoMap} className="h-9 w-9 flex-shrink-0" labelClassName="text-xs sm:hidden" />
                    </div>
                </div>
            </div>

            <div className="space-y-3 p-4">
                <div className="grid gap-2 grid-cols-2">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Start Time</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-black text-gray-900">
                            <CalendarDays size={13} className="text-red-500 flex-shrink-0" />
                            <span className="truncate">{formatMatchDate(match.date)}</span>
                        </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Venue</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-black text-gray-900">
                            <MapPin size={13} className="text-red-500 flex-shrink-0" />
                            <span className="truncate">{match.ground || 'Venue TBD'}</span>
                        </p>
                    </div>
                </div>

                <div className="grid gap-1.5 grid-cols-3">
                    <button
                        onClick={onCreateTeam}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#E53935] px-3 py-2.5 text-xs font-black text-white shadow-md shadow-red-500/20 transition-all duration-200 hover:scale-[1.02] hover:bg-red-600"
                    >
                        <PlusCircle size={14} />
                        Create
                    </button>
                    <button
                        onClick={onOpenTeams}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-black text-gray-900 transition-all duration-200 hover:scale-[1.02] hover:bg-gray-50"
                    >
                        <Users size={14} />
                        My Team
                    </button>
                    <button
                        onClick={onOpenLeaderboard}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-black text-gray-900 transition-all duration-200 hover:scale-[1.02] hover:bg-gray-50"
                    >
                        <Medal size={14} />
                        Board
                    </button>
                </div>
            </div>
        </article>
    );
};

export default FantasyMatchCard;
