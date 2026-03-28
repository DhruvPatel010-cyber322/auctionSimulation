import React from 'react';
import { Crown, Star } from 'lucide-react';
import FantasyPlayerAvatar from './FantasyPlayerAvatar';
import { getPlayerValue } from '../../utils/fantasy';

const FantasyCaptainSelector = ({
    players = [],
    captainId = '',
    viceCaptainId = '',
    onCaptain,
    onViceCaptain
}) => {
    return (
        <div className="rounded-[30px] border border-red-100 bg-white p-5 shadow-sm">
            <div className="mb-5">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Captain Selection</p>
                <h3 className="mt-2 text-2xl font-black text-gray-950">Choose C and VC</h3>
                <p className="mt-1 text-sm font-medium text-gray-500">
                    Captain gets 2x points and vice-captain gets 1.5x points.
                </p>
            </div>

            <div className="space-y-3">
                {players.map((player) => {
                    const isCaptain = captainId === player._id;
                    const isViceCaptain = viceCaptainId === player._id;

                    return (
                        <div
                            key={player._id}
                            className={`rounded-[24px] border px-4 py-4 transition-all ${
                                isCaptain || isViceCaptain ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'
                            }`}
                        >
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-3">
                                    <FantasyPlayerAvatar player={player} className="h-14 w-14" textClassName="text-sm" />
                                    <div>
                                        <p className="text-sm font-black text-gray-950">{player.name}</p>
                                        <p className="mt-1 text-sm font-semibold text-gray-500">
                                            {player.orgIPLTeam26} | {player.role} | {getPlayerValue(player).toFixed(1)} value
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => onCaptain(player._id)}
                                        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                                            isCaptain
                                                ? 'bg-amber-400 text-gray-950 shadow-md'
                                                : 'border border-gray-200 bg-white text-gray-900 hover:bg-amber-50'
                                        }`}
                                    >
                                        <Crown size={14} />
                                        C
                                    </button>
                                    <button
                                        onClick={() => onViceCaptain(player._id)}
                                        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                                            isViceCaptain
                                                ? 'bg-sky-400 text-gray-950 shadow-md'
                                                : 'border border-gray-200 bg-white text-gray-900 hover:bg-sky-50'
                                        }`}
                                    >
                                        <Star size={14} />
                                        VC
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FantasyCaptainSelector;
