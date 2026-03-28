import React from 'react';
import { Minus, Plus } from 'lucide-react';

const FantasyPlayerCard = ({
    player,
    teamLogoMap = {},
    value,
    isSelected = false,
    allowed = true,
    disabledReason = '',
    onToggle
}) => {
    const image = player?.image || null;
    const initials = (player?.name || 'P')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
        .toUpperCase() || 'P';

    return (
        <div
            className={`rounded-2xl border transition-all duration-200 ${
                isSelected
                    ? 'border-red-300 bg-red-50 shadow-[0_12px_32px_rgba(229,57,53,0.12)]'
                    : 'border-gray-100 bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md'
            }`}
        >
            <div className="flex items-center gap-0">

                {/* Left: Avatar with team badge */}
                <div className="relative shrink-0 self-stretch flex flex-col items-center justify-center w-[72px] py-3 pl-3 pr-2">
                    <div className="relative w-14 h-14">
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white bg-gradient-to-br from-rose-500 via-red-600 to-orange-500 shadow-md">
                            {image ? (
                                <img src={image} alt={player.name} className="h-full w-full object-cover object-top" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center font-black text-white text-sm">
                                    {initials}
                                </div>
                            )}
                        </div>
                        {/* Team badge pinned at bottom of photo */}
                        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gray-950 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white shadow">
                            {player.orgIPLTeam26 || '—'}
                        </span>
                    </div>
                </div>

                {/* Middle: Name + role */}
                <div className="flex-1 min-w-0 py-3 pr-2">
                    <h3 className="truncate text-sm font-black text-gray-950 leading-tight">{player.name}</h3>
                    <span className="mt-1 inline-block rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">
                        {player.role}
                    </span>
                    {!isSelected && !allowed && disabledReason && (
                        <p className="mt-1 text-[10px] font-semibold text-red-500 truncate">{disabledReason}</p>
                    )}
                </div>

                {/* Right: Credits + Points + Button */}
                <div className="flex items-center gap-2 pr-3 py-3 shrink-0">
                    {/* Credits */}
                    <div className="text-center min-w-[36px]">
                        <p className="text-[8px] font-black uppercase tracking-wider text-gray-400 leading-none">Pts</p>
                        <p className="mt-0.5 text-sm font-black text-gray-950">{player.points ?? 0}</p>
                    </div>

                    {/* Points */}
                    <div className="text-center min-w-[36px]">
                        <p className="text-[8px] font-black uppercase tracking-wider text-gray-400 leading-none">Cr</p>
                        <p className="mt-0.5 text-sm font-black text-gray-950">{value?.toFixed(1)}</p>
                    </div>

                    {/* Add / Remove button */}
                    <button
                        onClick={() => onToggle(player)}
                        disabled={!isSelected && !allowed}
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                            isSelected
                                ? 'border-red-600 bg-red-600 text-white hover:bg-red-700'
                                : allowed
                                    ? 'border-gray-300 bg-white text-gray-800 hover:border-red-400 hover:bg-red-50 hover:text-red-600'
                                    : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-300'
                        }`}
                    >
                        {isSelected ? <Minus size={14} /> : <Plus size={14} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FantasyPlayerCard;
