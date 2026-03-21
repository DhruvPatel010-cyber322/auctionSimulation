import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Trophy, X, Construction } from 'lucide-react';
import schedule from '../data/ipl_schedule.json';

// Helper to format date nicely: "28 Mar 2026"
const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Helper to format time to 12-hour: "7:30 PM"
const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
};

// Group matches by date
const groupByDate = (matches) => {
    return matches.reduce((acc, match) => {
        const key = match.MatchDate;
        if (!acc[key]) acc[key] = [];
        acc[key].push(match);
        return acc;
    }, {});
};

const StatusBadge = ({ status }) => {
    const styles = {
        Live: 'bg-red-100 text-red-700 border-red-200 animate-pulse',
        UpComing: 'bg-blue-50 text-blue-600 border-blue-100',
        Completed: 'bg-green-50 text-green-700 border-green-100',
    };
    const labels = {
        Live: '🔴 Live',
        UpComing: 'Upcoming',
        Completed: 'Completed',
    };
    return (
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${styles[status] || styles.UpComing}`}>
            {labels[status] || status}
        </span>
    );
};

// Modal shown when a match card is clicked
const MatchDetailModal = ({ match, onClose }) => {
    const [t1Err, setT1Err] = useState(false);
    const [t2Err, setT2Err] = useState(false);

    if (!match) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">IPL 2026</p>
                        <StatusBadge status={match.MatchStatus} />
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Teams */}
                <div className="px-6 py-6 flex items-center justify-between gap-4">
                    <div className="flex flex-col items-center gap-2 flex-1">
                        <div className="w-16 h-16 rounded-full bg-gray-50 border-2 border-gray-100 overflow-hidden shadow-sm flex items-center justify-center">
                            {match.Team1Logo && !t1Err ? (
                                <img src={match.Team1Logo} alt={match.Team1Code} className="w-full h-full object-contain p-1" onError={() => setT1Err(true)} />
                            ) : (
                                <span className="font-black text-gray-500 text-sm">{match.Team1Code}</span>
                            )}
                        </div>
                        <span className="font-black text-gray-900 text-center text-sm leading-snug">{match.Team1Code}</span>
                    </div>

                    <span className="text-2xl font-black text-gray-200">VS</span>

                    <div className="flex flex-col items-center gap-2 flex-1">
                        <div className="w-16 h-16 rounded-full bg-gray-50 border-2 border-gray-100 overflow-hidden shadow-sm flex items-center justify-center">
                            {match.Team2Logo && !t2Err ? (
                                <img src={match.Team2Logo} alt={match.Team2Code} className="w-full h-full object-contain p-1" onError={() => setT2Err(true)} />
                            ) : (
                                <span className="font-black text-gray-500 text-sm">{match.Team2Code}</span>
                            )}
                        </div>
                        <span className="font-black text-gray-900 text-center text-sm leading-snug">{match.Team2Code}</span>
                    </div>
                </div>

                {/* Match Info */}
                <div className="px-6 pb-4 grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Date</p>
                        <p className="text-sm font-bold text-gray-800">{formatDate(match.MatchDate)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Time</p>
                        <p className="text-sm font-bold text-gray-800">{formatTime(match.MatchTime)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 col-span-2">
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Venue</p>
                        <p className="text-sm font-bold text-gray-800">{match.Ground}, {match.City}</p>
                    </div>
                </div>

                {/* Coming Soon Banner */}
                <div className="mx-6 mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <Construction size={18} className="text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-amber-900">Full Match Details</p>
                        <p className="text-xs text-amber-700 font-medium">Live scores, stats & scorecards — Coming Soon!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MatchCard = ({ match, onClick }) => {
    const [team1Error, setTeam1Error] = useState(false);
    const [team2Error, setTeam2Error] = useState(false);

    const TeamLogo = ({ src, code, onError, hasError }) => (
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-50 border-2 border-gray-100 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
            {src && !hasError ? (
                <img src={src} alt={code} className="w-full h-full object-contain p-1" onError={onError} />
            ) : (
                <span className="text-sm font-black text-gray-500">{code}</span>
            )}
        </div>
    );

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden cursor-pointer active:scale-95"
        >
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-2 flex items-center justify-between">
                <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest">
                    IPL 2026
                </span>
                <StatusBadge status={match.MatchStatus} />
            </div>

            {/* Teams Row */}
            <div className="px-4 py-5 flex items-center justify-between gap-3">
                {/* Team 1 */}
                <div className="flex flex-col items-center gap-2 flex-1">
                    <TeamLogo
                        src={match.Team1Logo}
                        code={match.Team1Code}
                        onError={() => setTeam1Error(true)}
                        hasError={team1Error}
                    />
                    <span className="text-sm font-black text-gray-800 text-center leading-tight">
                        {match.Team1Code}
                    </span>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center gap-1 px-3">
                    <span className="text-xs font-black text-gray-300 uppercase tracking-widest">vs</span>
                </div>

                {/* Team 2 */}
                <div className="flex flex-col items-center gap-2 flex-1">
                    <TeamLogo
                        src={match.Team2Logo}
                        code={match.Team2Code}
                        onError={() => setTeam2Error(true)}
                        hasError={team2Error}
                    />
                    <span className="text-sm font-black text-gray-800 text-center leading-tight">
                        {match.Team2Code}
                    </span>
                </div>
            </div>

            {/* Match Info Footer */}
            <div className="border-t border-gray-50 px-4 py-3 flex flex-wrap gap-x-4 gap-y-1.5 bg-gray-50/50">
                <div className="flex items-center gap-1.5 text-gray-400">
                    <Clock size={11} />
                    <span className="text-[11px] font-bold">{formatTime(match.MatchTime)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                    <MapPin size={11} />
                    <span className="text-[11px] font-bold truncate max-w-[160px]" title={match.Ground}>
                        {match.Ground}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                    <span className="text-[11px] font-bold">{match.City}</span>
                </div>
            </div>
        </div>
    );
};

const MatchCentrePage = () => {
    const grouped = groupByDate(schedule);
    const sortedDates = Object.keys(grouped).sort();
    const [selectedMatch, setSelectedMatch] = useState(null);

    return (
        <div className="max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                        <Trophy size={18} className="text-white" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Match Centre</h1>
                </div>
                <p className="text-sm text-gray-400 font-medium ml-12">
                    Tata IPL 2026 · {schedule.length} Matches
                </p>
            </div>

            {/* Schedule */}
            <div className="space-y-8">
                {sortedDates.map((date) => (
                    <div key={date}>
                        {/* Date Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3.5 py-2 shadow-sm">
                                <Calendar size={13} className="text-blue-600" />
                                <span className="text-sm font-black text-gray-700">
                                    {formatDate(date)}
                                </span>
                            </div>
                            <div className="flex-1 h-px bg-gray-100" />
                            <span className="text-[11px] font-bold text-gray-300">
                                {grouped[date].length} {grouped[date].length === 1 ? 'match' : 'matches'}
                            </span>
                        </div>

                        {/* Match Cards for this date */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {grouped[date].map((match) => (
                                <MatchCard
                                    key={match.MatchID}
                                    match={match}
                                    onClick={() => setSelectedMatch(match)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Match Detail Modal */}
            {selectedMatch && (
                <MatchDetailModal
                    match={selectedMatch}
                    onClose={() => setSelectedMatch(null)}
                />
            )}
        </div>
    );
};

export default MatchCentrePage;
