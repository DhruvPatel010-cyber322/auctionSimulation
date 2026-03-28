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
    accent = 'emerald',
    showMeta = true,
    onPlayerClick,
    actionLabel = 'Tap'
}) => {
    const playersByRole = groupPlayersByRole(players);

    return (
        <div className="overflow-hidden rounded-[32px] border border-emerald-900/40 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_38%),linear-gradient(180deg,_rgba(22,163,74,0.98),_rgba(5,150,105,0.95)_42%,_rgba(4,47,46,0.98))] text-white shadow-[0_30px_90px_rgba(6,95,70,0.35)]">
            <div className="border-b border-white/10 px-5 py-5 md:px-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-emerald-100/70">{accent} pitch</p>
                        <h2 className="mt-2 text-2xl font-black">{title}</h2>
                        <p className="mt-1 text-sm font-medium text-emerald-50/85">{subtitle}</p>
                    </div>
                    {showMeta && (
                        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-right backdrop-blur-sm">
                            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-100/70">Selected</p>
                            <p className="mt-1 text-2xl font-black">{players.length}/11</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative space-y-4 bg-[linear-gradient(180deg,_rgba(34,197,94,0.14),_rgba(5,46,22,0.05))] px-4 py-5 md:px-6">
                <div className="pointer-events-none absolute inset-0 opacity-30">
                    <div className="absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-white/20" />
                    <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
                </div>
                {players.length === 0 && (
                    <div className="rounded-[28px] border border-dashed border-white/15 bg-black/10 px-5 py-14 text-center">
                        <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-emerald-100/80" />
                        <p className="text-sm font-semibold text-emerald-50/80">{emptyText}</p>
                    </div>
                )}

                {ROLE_TABS.map((role) => {
                    const rolePlayers = playersByRole[role.key] || [];

                    return (
                        <div key={role.key} className="relative rounded-[28px] border border-white/10 bg-black/10 p-4 backdrop-blur-sm">
                            <div className="pointer-events-none absolute left-6 right-6 top-1/2 border-t border-dashed border-white/15" />
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.35em] text-emerald-100/70">{role.label}</p>
                                    <p className="mt-1 text-sm font-semibold text-emerald-50/80">{rolePlayers.length} picked</p>
                                </div>
                            </div>

                            {rolePlayers.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-center text-xs font-semibold text-emerald-50/60">
                                    No {role.key.toLowerCase()} selected yet.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {rolePlayers.map((player) => {
                                        const isCaptain = captainId === player._id;
                                        const isViceCaptain = viceCaptainId === player._id;

                                        return (
                                            <button
                                                key={player._id}
                                                type="button"
                                                onClick={() => onPlayerClick?.(player)}
                                                className={`rounded-[24px] border px-4 py-4 text-left transition-all ${
                                                    onPlayerClick ? 'hover:border-white/25 hover:bg-white/10' : ''
                                                } ${isCaptain || isViceCaptain ? 'border-white/20 bg-white/12' : 'border-white/10 bg-black/10'}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="relative">
                                                        <FantasyPlayerAvatar player={player} className="h-14 w-14" textClassName="text-sm" />
                                                        {isCaptain && (
                                                            <span className="absolute -bottom-1 -right-1 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full border border-amber-200 bg-amber-400 px-1 text-[10px] font-black text-gray-950">
                                                                C
                                                            </span>
                                                        )}
                                                        {isViceCaptain && (
                                                            <span className="absolute -bottom-1 -right-1 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full border border-sky-200 bg-sky-400 px-1 text-[10px] font-black text-gray-950">
                                                                VC
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="truncate text-sm font-black text-white">{player.name}</p>
                                                            <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-50">
                                                                {player.orgIPLTeam26}
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black text-white">
                                                                {Number(player.value ?? player.Value ?? player.credits ?? 0).toFixed(1)} value
                                                            </span>
                                                            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black text-white">
                                                                {player.points || 0} pts
                                                            </span>
                                                            {(isCaptain || isViceCaptain) && (
                                                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${captionStyles[isCaptain ? 'captain' : 'viceCaptain']}`}>
                                                                    {isCaptain ? <Crown size={12} /> : <Star size={12} />}
                                                                    {isCaptain ? '2x' : '1.5x'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {onPlayerClick && (
                                                            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-100/70">
                                                                {actionLabel}
                                                            </p>
                                                        )}
                                                    </div>
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
