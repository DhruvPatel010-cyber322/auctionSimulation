import React, { useState } from 'react';
import { CalendarDays, MapPin, Medal, PlusCircle, Users } from 'lucide-react';
import FantasyStatusBadge from './FantasyStatusBadge';
import { getFantasyTeamBrand } from '../../utils/fantasyBranding';

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
    const [t1Err, setT1Err] = useState(false);
    const [t2Err, setT2Err] = useState(false);

    const brand1 = getFantasyTeamBrand(match.team1);
    const brand2 = getFantasyTeamBrand(match.team2);
    const logo1 = teamLogoMap[String(match.team1).toUpperCase()];
    const logo2 = teamLogoMap[String(match.team2).toUpperCase()];

    return (
        <article className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
            {/* Half-and-half team color header */}
            <div className="relative overflow-hidden" style={{ minHeight: '130px' }}>
                {/* Left half – Team 1 */}
                <div
                    className="absolute inset-y-0 left-0 w-1/2"
                    style={{ background: `linear-gradient(135deg, ${brand1.primary}ee, ${brand1.primary}bb)` }}
                />
                {/* Right half – Team 2 */}
                <div
                    className="absolute inset-y-0 right-0 w-1/2"
                    style={{ background: `linear-gradient(225deg, ${brand2.primary}ee, ${brand2.primary}bb)` }}
                />
                {/* Diagonal blend seam */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-transparent" style={{ width: '4px', left: 'calc(50% - 2px)' }} />
                {/* Dark overlay for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full px-4 py-3">
                    {/* Top row: label + status */}
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/80">Fantasy Contest</p>
                        <FantasyStatusBadge status={match.status} />
                    </div>

                    {/* Teams row */}
                    <div className="flex items-center justify-between gap-2">
                        {/* Team 1 */}
                        <div className="flex flex-1 flex-col items-center gap-1.5">
                            <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center overflow-hidden shadow-lg backdrop-blur-sm">
                                {logo1 && !t1Err ? (
                                    <img src={logo1} alt={match.team1} className="w-full h-full object-contain p-1" onError={() => setT1Err(true)} />
                                ) : (
                                    <span className="text-xs font-black text-white">{match.team1}</span>
                                )}
                            </div>
                            <span className="text-sm font-black text-white text-center drop-shadow-sm leading-tight">{match.team1}</span>
                        </div>

                        {/* VS pill */}
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div className="rounded-full bg-white/20 border border-white/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-sm shadow">
                                VS
                            </div>
                        </div>

                        {/* Team 2 */}
                        <div className="flex flex-1 flex-col items-center gap-1.5">
                            <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center overflow-hidden shadow-lg backdrop-blur-sm">
                                {logo2 && !t2Err ? (
                                    <img src={logo2} alt={match.team2} className="w-full h-full object-contain p-1" onError={() => setT2Err(true)} />
                                ) : (
                                    <span className="text-xs font-black text-white">{match.team2}</span>
                                )}
                            </div>
                            <span className="text-sm font-black text-white text-center drop-shadow-sm leading-tight">{match.team2}</span>
                        </div>
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
