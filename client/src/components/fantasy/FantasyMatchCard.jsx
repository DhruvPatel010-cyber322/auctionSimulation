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
        <article className="group overflow-hidden rounded-[30px] border border-red-100 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(229,57,53,0.12)]">
            <div className="bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_28%),linear-gradient(135deg,_#991B1B_0%,_#E53935_55%,_#FB923C_100%)] px-5 py-5 text-white">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.32em] text-red-100/85">Fantasy contest</p>
                        <h2 className="mt-3 text-2xl font-black tracking-tight">{match.matchName || `${match.team1} vs ${match.team2}`}</h2>
                    </div>
                    <FantasyStatusBadge status={match.status} />
                </div>

                <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-[28px] border border-white/10 bg-black/15 px-4 py-4 backdrop-blur-sm">
                    <div className="flex min-w-0 items-center gap-3">
                        <FantasyTeamMark code={match.team1} logoMap={teamLogoMap} className="h-14 w-14" labelClassName="text-sm" />
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-100/80">Team 1</p>
                            <p className="truncate text-lg font-black">{match.team1}</p>
                        </div>
                    </div>

                    <div className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-white">vs</div>

                    <div className="flex min-w-0 items-center justify-end gap-3">
                        <div className="min-w-0 text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-100/80">Team 2</p>
                            <p className="truncate text-lg font-black">{match.team2}</p>
                        </div>
                        <FantasyTeamMark code={match.team2} logoMap={teamLogoMap} className="h-14 w-14" labelClassName="text-sm" />
                    </div>
                </div>
            </div>

            <div className="space-y-5 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-gray-100 bg-gray-50 px-4 py-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">Start time</p>
                        <p className="mt-2 flex items-center gap-2 text-sm font-black text-gray-900">
                            <CalendarDays size={16} className="text-red-500" />
                            {formatMatchDate(match.date)}
                        </p>
                    </div>
                    <div className="rounded-[24px] border border-gray-100 bg-gray-50 px-4 py-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">Venue</p>
                        <p className="mt-2 flex items-center gap-2 text-sm font-black text-gray-900">
                            <MapPin size={16} className="text-red-500" />
                            {match.ground || 'Venue TBD'}
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-500">{match.city || 'City TBD'}</p>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
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
