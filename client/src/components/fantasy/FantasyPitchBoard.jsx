import React from 'react';
import { Crown, ShieldCheck, Star } from 'lucide-react';
import FantasyPlayerAvatar from './FantasyPlayerAvatar';
import { ROLE_TABS } from '../../utils/fantasy';

const groupPlayersByRole = (players = []) => ROLE_TABS.reduce((acc, role) => {
    acc[role.key] = players.filter((player) => player.role === role.key);
    return acc;
}, {});

const captionStyles = {
    captain: 'bg-amber-400 text-gray-950',
    viceCaptain: 'bg-sky-400 text-gray-950'
};

const FantasyPitchBoard = ({
    players = [],
    captainId = '',
    viceCaptainId = '',
    title = 'Dream Team',
    subtitle = 'Build your starting XI',
    emptyText = 'Select players to see your XI on the pitch.',
    showMeta = true,
    onPlayerClick,
    actionLabel = 'Tap'
}) => {
    const playersByRole = groupPlayersByRole(players);

    return (
        <div className="overflow-hidden rounded-[24px] border border-emerald-900/40 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_38%),linear-gradient(180deg,_rgba(22,163,74,0.98),_rgba(5,150,105,0.95)_42%,_rgba(4,47,46,0.98))] text-white shadow-xl shadow-emerald-900/30">
            {/* Header */}
            <div className="border-b border-white/10 px-4 py-3 flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-base font-black">{title}</h2>
                    <p className="text-xs font-medium text-emerald-50/75 mt-0.5">{subtitle}</p>
                </div>
                {showMeta && (
                    <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-right backdrop-blur-sm flex-shrink-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-100/70">Selected</p>
                        <p className="text-lg font-black leading-none mt-0.5">{players.length}/11</p>
                    </div>
                )}
            </div>

            {/* Pitch Area */}
            <div className="relative space-y-2 px-3 py-3">
                {/* Decorative lines */}
                <div className="pointer-events-none absolute inset-0 opacity-20">
                    <div className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-white/30" />
                    <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
                </div>

                {players.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-black/10 px-4 py-10 text-center">
                        <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-emerald-100/70" />
                        <p className="text-xs font-semibold text-emerald-50/70">{emptyText}</p>
                    </div>
                )}

                {ROLE_TABS.map((role) => {
                    const rolePlayers = playersByRole[role.key] || [];

                    return (
                        <div key={role.key} className="relative rounded-xl border border-white/10 bg-black/10 p-3 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-100/70">{role.label} · {rolePlayers.length}</span>
                            </div>

                            {rolePlayers.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-white/10 px-3 py-3 text-center text-[10px] font-semibold text-emerald-50/50">
                                    No {role.key.toLowerCase()} selected
                                </div>
                            ) : (
                                <div className={`grid gap-2 ${rolePlayers.length > 2 ? 'grid-cols-3' : rolePlayers.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    {rolePlayers.map((player) => {
                                        const isCaptain = captainId === player._id;
                                        const isViceCaptain = viceCaptainId === player._id;

                                        return (
                                            <button
                                                key={player._id}
                                                type="button"
                                                onClick={() => onPlayerClick?.(player)}
                                                className={`rounded-xl px-2 py-2 text-left transition-all ${
                                                    onPlayerClick ? 'hover:border-white/25 hover:bg-white/10 cursor-pointer' : 'cursor-default'
                                                } ${isCaptain || isViceCaptain ? 'border border-white/25 bg-white/10' : 'border border-white/10 bg-black/10'}`}
                                            >
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="relative">
                                                        <FantasyPlayerAvatar player={player} className="h-9 w-9" textClassName="text-xs" />
                                                        {isCaptain && (
                                                            <span className="absolute -bottom-1 -right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full border border-amber-200 bg-amber-400 px-0.5 text-[8px] font-black text-gray-950">C</span>
                                                        )}
                                                        {isViceCaptain && (
                                                            <span className="absolute -bottom-1 -right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full border border-sky-200 bg-sky-400 px-0.5 text-[8px] font-black text-gray-950">VC</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] font-black text-white leading-tight text-center w-full truncate">{player.name?.split(' ').slice(-1)[0]}</p>
                                                    {(isCaptain || isViceCaptain) && (
                                                        <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-black ${captionStyles[isCaptain ? 'captain' : 'viceCaptain']}`}>
                                                            {isCaptain ? <><Crown size={8} />2x</> : <><Star size={8} />1.5x</>}
                                                        </span>
                                                    )}
                                                    {onPlayerClick && (
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-emerald-100/60">{actionLabel}</p>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FantasyPitchBoard;
