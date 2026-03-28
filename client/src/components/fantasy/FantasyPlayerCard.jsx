import React from 'react';
import { Minus, Plus } from 'lucide-react';
import FantasyPlayerAvatar from './FantasyPlayerAvatar';
import FantasyTeamMark from './FantasyTeamMark';

const FantasyPlayerCard = ({
    player,
    teamLogoMap = {},
    value,
    isSelected = false,
    allowed = true,
    disabledReason = '',
    onToggle
}) => {
    return (
        <div
            className={`rounded-[28px] border p-4 transition-all duration-200 ${
                isSelected
                    ? 'border-red-300 bg-red-50 shadow-[0_18px_40px_rgba(229,57,53,0.12)]'
                    : 'border-gray-100 bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md'
            }`}
        >
            <div className="flex items-start gap-4">
                <FantasyPlayerAvatar player={player} className="h-16 w-16" textClassName="text-sm" />

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="truncate text-base font-black text-gray-950">{player.name}</h3>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <FantasyTeamMark
                                    code={player.orgIPLTeam26}
                                    logoMap={teamLogoMap}
                                    className="h-8 w-8"
                                    labelClassName="text-[10px]"
                                    imageClassName="p-1"
                                    ringClassName="border-white"
                                />
                                <span className="rounded-full bg-gray-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                                    {player.orgIPLTeam26}
                                </span>
                                <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-gray-700">
                                    {player.role}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => onToggle(player)}
                            disabled={!isSelected && !allowed}
                            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-200 ${
                                isSelected
                                    ? 'border-red-600 bg-red-600 text-white hover:bg-red-700'
                                    : allowed
                                        ? 'border-gray-200 bg-white text-gray-900 hover:border-red-200 hover:bg-red-50 hover:text-red-600'
                                        : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                            }`}
                        >
                            {isSelected ? <Minus size={18} /> : <Plus size={18} />}
                        </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-white px-3 py-3 shadow-sm ring-1 ring-gray-100">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Value</p>
                            <p className="mt-1 text-lg font-black text-gray-950">{value.toFixed(1)}</p>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-3 shadow-sm ring-1 ring-gray-100">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Points</p>
                            <p className="mt-1 text-lg font-black text-gray-950">{player.points || 0}</p>
                        </div>
                    </div>

                    {!isSelected && !allowed && disabledReason && (
                        <p className="mt-3 text-sm font-semibold text-red-600">{disabledReason}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FantasyPlayerCard;
