import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL as API_URL } from '../config';
import { Shield, Check, AlertCircle, X, User, Plane, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

// Helper for Batting Groups
const getBattingGroupLabel = (groupCode) => {
    switch (groupCode) {
        case 1: return "Opener";
        case 2: return "Middle Order";
        case 3: return "Lower Middle";
        case 4: return "Tail";
        default: return "Any";
    }
};

const getRequiredGroupForPos = (pos) => {
    if (pos <= 2) return 1;
    if (pos <= 4) return 2;
    if (pos <= 7) return 3;
    if (pos <= 11) return 4;
    return null;
};

const SelectPlayingXI = () => {
    const { user: team } = useAuth();
    const [players, setPlayers] = useState([]);

    // Slots State
    const [slots, setSlots] = useState(
        Array.from({ length: 11 }, (_, i) => i + 1).reduce((acc, pos) => ({ ...acc, [pos]: null }), {})
    );

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        const fetchSquad = async () => {
            const localToken = localStorage.getItem('token');
            if (!localToken) return;

            try {
                const payload = JSON.parse(atob(localToken.split('.')[1]));
                const tournamentId = payload.tournamentId;
                const token = sessionStorage.getItem('firebase_token');

                const res = await fetch(`${API_URL}/api/v2/auth/tournaments/${tournamentId}/my-squad`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setPlayers(data.players || []);
                    if (data.playing11 && data.playing11.length > 0) {
                        const newSlots = { ...slots };
                        data.playing11.forEach((p, idx) => {
                            if (idx < 11) newSlots[idx + 1] = p;
                        });
                        setSlots(newSlots);
                    }
                } else {
                    setError('Failed to load squad.');
                }
            } catch (e) {
                console.error(e);
                setError('Error loading data.');
            } finally {
                setLoading(false);
            }
        };

        if (team) fetchSquad();
    }, [team]);

    // Validation Helpers
    const getSquadStats = () => {
        const assigned = Object.values(slots).filter(p => p !== null);
        const overseas = assigned.filter(p => p.isOverseas).length;
        const wks = assigned.filter(p => p.role === 'Wicket Keeper').length;
        const bowlers = assigned.filter(p => p.role === 'Bowler' || p.role === 'All-Rounder').length;

        return {
            count: assigned.length,
            overseas,
            wks,
            bowlers,
            isValid: assigned.length === 11 && overseas <= 4 && wks >= 1 && bowlers >= 5
        };
    };

    const stats = getSquadStats();

    const handleAssign = (player) => {
        const emptyPos = Object.keys(slots).find(pos => slots[pos] === null);
        if (!emptyPos) {
            setError("All 11 slots are full!");
            setTimeout(() => setError(''), 3000);
            return;
        }
        assignToSlot(player, parseInt(emptyPos));
    };

    const assignToSlot = (player, pos) => {
        const reqGroup = getRequiredGroupForPos(pos);
        if (player.battingPositionGroup && player.battingPositionGroup !== reqGroup) {
            const reqLabel = getBattingGroupLabel(reqGroup);
            const playerLabel = getBattingGroupLabel(player.battingPositionGroup);
            setError(`Cannot assign ${player.name} (${playerLabel}) to Slot ${pos}. Requires ${reqLabel}.`);
            setTimeout(() => setError(''), 3000);
            return;
        }
        setSlots(prev => ({ ...prev, [pos]: player }));
        setError('');
    };

    const handleRemove = (pos) => {
        setSlots(prev => ({ ...prev, [pos]: null }));
    };

    const handleSave = async () => {
        if (!stats.isValid) {
            setError("Cannot save: Squad rules validation failed.");
            return;
        }

        setSaving(true);
        setMsg('');
        const token = sessionStorage.getItem('firebase_token');
        const localToken = localStorage.getItem('token');
        try {
            const payload = JSON.parse(atob(localToken.split('.')[1]));
            const tournamentId = payload.tournamentId;

            const payloadData = Object.keys(slots).map(pos => ({
                playerId: slots[pos]._id,
                battingPosition: parseInt(pos)
            }));

            const res = await fetch(`${API_URL}/api/v2/auth/tournaments/${tournamentId}/playing11`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payloadData)
            });

            if (res.ok) {
                setMsg('Playing XI Saved Successfully!');
            } else {
                const data = await res.json();
                setError(data.message || 'Save failed');
            }
        } catch (e) {
            setError('Network error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

    const assignedIds = Object.values(slots).filter(p => p).map(p => p._id);
    const availablePlayers = players.filter(p => !assignedIds.includes(p._id));

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Playing <span className="text-blue-600">XI</span> Selection</h1>
                    <p className="text-gray-500">Construct your final 11 respecting all squad rules.</p>
                </div>
            </header>

            {/* Validation Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={cn("p-3 rounded-xl border flex items-center justify-between", stats.count === 11 ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200")}>
                    <div>
                        <span className="text-xs font-bold uppercase text-gray-400 block">Players</span>
                        <span className={cn("font-bold text-lg", stats.count === 11 ? "text-green-700" : "text-gray-900")}>{stats.count}/11</span>
                    </div>
                    {stats.count === 11 ? <Check size={20} className="text-green-600" /> : <Shield size={20} className="text-gray-300" />}
                </div>

                <div className={cn("p-3 rounded-xl border flex items-center justify-between", stats.overseas <= 4 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                    <div>
                        <span className="text-xs font-bold uppercase text-gray-400 block">Overseas</span>
                        <span className={cn("font-bold text-lg", stats.overseas > 4 ? "text-red-600" : "text-gray-900")}>{stats.overseas}/4</span>
                    </div>
                    {stats.overseas <= 4 ? <Check size={20} className="text-green-600" /> : <AlertTriangle size={20} className="text-red-600" />}
                </div>

                <div className={cn("p-3 rounded-xl border flex items-center justify-between", stats.wks >= 1 ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200")}>
                    <div>
                        <span className="text-xs font-bold uppercase text-gray-400 block">Keepers</span>
                        <span className={cn("font-bold text-lg", stats.wks >= 1 ? "text-green-700" : "text-gray-900")}>{stats.wks}/1 (Min)</span>
                    </div>
                    {stats.wks >= 1 ? <Check size={20} className="text-green-600" /> : <AlertCircle size={20} className="text-orange-500" />}
                </div>

                <div className={cn("p-3 rounded-xl border flex items-center justify-between", stats.bowlers >= 5 ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200")}>
                    <div>
                        <span className="text-xs font-bold uppercase text-gray-400 block">Bowling</span>
                        <span className={cn("font-bold text-lg", stats.bowlers >= 5 ? "text-green-700" : "text-gray-900")}>{stats.bowlers}/5 (Min)</span>
                    </div>
                    {stats.bowlers >= 5 ? <Check size={20} className="text-green-600" /> : <AlertCircle size={20} className="text-orange-500" />}
                </div>
            </div>

            {error && <div className="fixed top-24 right-8 z-50 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg animate-in fade-in slide-in-from-right">{error}</div>}
            {msg && <div className="fixed top-24 right-8 z-50 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg animate-in fade-in slide-in-from-right">{msg}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Available Squad (Left) */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                <User size={20} className="text-blue-600" /> Squad
                            </h2>
                            <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded-full text-gray-500">{availablePlayers.length} Left</span>
                        </div>

                        <div className="space-y-3">
                            {availablePlayers.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">All players assigned</div>}
                            {availablePlayers.map(player => (
                                <div
                                    key={player._id}
                                    onClick={() => handleAssign(player)}
                                    className="p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all group"
                                >
                                    <div className="flex justify-between items-center gap-3">
                                        <div className="flex items-center gap-3">
                                            {/* Player Image / Avatar */}
                                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-gray-100">
                                                {player.image ? (
                                                    <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <User size={16} />
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <h3 className="font-bold text-gray-900 text-sm">{player.name}</h3>
                                                    {player.isOverseas && <Plane size={12} className="text-blue-500 fill-blue-500" />}
                                                </div>
                                                <div className="flex gap-2 mt-0.5">
                                                    <span className="text-[10px] uppercase font-bold text-gray-400">
                                                        {player.role}
                                                    </span>
                                                    <span className={cn("text-[10px] uppercase font-bold px-1.5 rounded-full",
                                                        player.battingPositionGroup ? "bg-purple-50 text-purple-700" : "bg-red-50 text-red-400")}>
                                                        {getBattingGroupLabel(player.battingPositionGroup)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-1 rounded-full border border-gray-200 text-gray-300 group-hover:text-blue-500">
                                            <Check size={12} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Batting Order Slots (Right) */}
                <div className="lg:col-span-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(11)].map((_, i) => {
                            const pos = i + 1;
                            const slotPlayer = slots[pos];
                            const requiredGroup = getRequiredGroupForPos(pos);
                            const requiredLabel = getBattingGroupLabel(requiredGroup);

                            return (
                                <div key={pos} className={cn("relative p-4 rounded-2xl border-2 transition-all min-h-[100px] flex items-center",
                                    slotPlayer ? "bg-white border-blue-500 shadow-md shadow-blue-500/10" : "bg-gray-50 border-dashed border-gray-300"
                                )}>
                                    <div className="absolute top-0 left-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-br-xl rounded-tl-xl">
                                        {pos}
                                    </div>

                                    <div className="w-full pl-8">
                                        {slotPlayer ? (
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    {/* Slot Player Image */}
                                                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-gray-100">
                                                        {slotPlayer.image ? (
                                                            <img src={slotPlayer.image} alt={slotPlayer.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                <User size={20} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-bold text-lg text-gray-900">{slotPlayer.name}</h3>
                                                            {slotPlayer.isOverseas && <Plane size={14} className="text-blue-500 fill-blue-500" />}
                                                        </div>
                                                        <div className="flex gap-2 text-sm mt-0.5">
                                                            <span className="text-gray-500">{slotPlayer.role}</span>
                                                            <span className="text-purple-600 font-bold bg-purple-50 px-2 rounded">
                                                                {getBattingGroupLabel(slotPlayer.battingPositionGroup)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemove(pos)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center py-2">
                                                <div className="text-gray-400 font-medium text-sm uppercase tracking-widest mb-1">Empty Slot</div>
                                                <div className="text-xs font-bold text-blue-400 bg-blue-50 inline-block px-2 py-1 rounded border border-blue-100">
                                                    Required: {requiredLabel}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 p-4 bg-white border border-gray-200 rounded-2xl flex justify-between items-center shadow-sm sticky bottom-4 z-30">
                        <div className="flex items-center gap-2">
                            {!stats.isValid && <AlertTriangle className="text-red-500" size={20} />}
                            <div className={cn("text-sm font-bold", stats.isValid ? "text-green-600" : "text-red-600")}>
                                {stats.isValid ? "Rules Met. Ready to Confirm." : "Fix squad rules to confirm."}
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={!stats.isValid || saving}
                            className={cn("px-8 py-3 rounded-xl font-bold shadow-lg transition-all",
                                stats.isValid && !saving
                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            )}
                        >
                            {saving ? 'Saving...' : 'Confirm Playing XI'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelectPlayingXI;
