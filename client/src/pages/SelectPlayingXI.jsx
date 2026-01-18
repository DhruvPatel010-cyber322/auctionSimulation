import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL as API_URL } from '../config';
import { Shield, Check, AlertCircle, X, User } from 'lucide-react';
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

    // Slots State: { 1: playerObj, 2: null, ... }
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
                        // Map array index to Position (Index 0 -> Pos 1)
                        data.playing11.forEach((p, idx) => {
                            if (idx < 11) {
                                newSlots[idx + 1] = p; // p is likely populated object
                            }
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

    const handleAssign = (player) => {
        // Find first empty slot
        const emptyPos = Object.keys(slots).find(pos => slots[pos] === null);
        if (!emptyPos) {
            setError("All 11 slots are full!");
            setTimeout(() => setError(''), 3000);
            return;
        }
        assignToSlot(player, parseInt(emptyPos));
    };

    const assignToSlot = (player, pos) => {
        // Validation Rule
        const reqGroup = getRequiredGroupForPos(pos);
        if (player.battingPositionGroup && player.battingPositionGroup !== reqGroup) {
            const reqLabel = getBattingGroupLabel(reqGroup);
            const playerLabel = getBattingGroupLabel(player.battingPositionGroup);
            setError(`Cannot assign ${player.name} (${playerLabel}) to Slot ${pos}. Requires ${reqLabel}.`);
            setTimeout(() => setError(''), 3000);
            return;
        }

        setSlots(prev => ({
            ...prev,
            [pos]: player
        }));
        setError('');
    };

    const handleRemove = (pos) => {
        setSlots(prev => ({
            ...prev,
            [pos]: null
        }));
    };

    const handleSave = async () => {
        const filled = Object.values(slots).filter(p => p !== null);
        if (filled.length !== 11) {
            setError("You must fill all 11 slots.");
            return;
        }

        setSaving(true);
        setMsg('');
        const token = sessionStorage.getItem('firebase_token');
        const localToken = localStorage.getItem('token');
        try {
            const payload = JSON.parse(atob(localToken.split('.')[1]));
            const tournamentId = payload.tournamentId;

            // Payload: Array of objects { playerId, battingPosition }
            // Note: We scan slots 1-11
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

    // Filter available players (not in any slot)
    const assignedIds = Object.values(slots).filter(p => p).map(p => p._id);
    const availablePlayers = players.filter(p => !assignedIds.includes(p._id));

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-gray-900">Playing <span className="text-blue-600">XI</span> Selection</h1>
                <p className="text-gray-500">Drag and drop or click to build your squad order.</p>
            </header>

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
                            {availablePlayers.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-sm">All players assigned</div>
                            )}
                            {availablePlayers.map(player => (
                                <div
                                    key={player._id}
                                    onClick={() => handleAssign(player)}
                                    className="p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-sm">{player.name}</h3>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[10px] uppercase font-bold text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-100">
                                                    {player.role}
                                                </span>
                                                <span className={cn("text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                                                    player.battingPositionGroup ? "bg-purple-100 text-purple-700" : "bg-red-50 text-red-400")}>
                                                    {getBattingGroupLabel(player.battingPositionGroup)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-white p-1 rounded-full border border-gray-200 text-gray-300 group-hover:text-blue-500 group-hover:border-blue-300">
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
                        {/* Render 11 Slots */}
                        {[...Array(11)].map((_, i) => {
                            const pos = i + 1;
                            const slotPlayer = slots[pos];
                            const requiredGroup = getRequiredGroupForPos(pos);
                            const requiredLabel = getBattingGroupLabel(requiredGroup);

                            return (
                                <div key={pos} className={cn("relative p-4 rounded-2xl border-2 transition-all min-h-[100px] flex items-center",
                                    slotPlayer ? "bg-white border-blue-500 shadow-md shadow-blue-500/10" : "bg-gray-50 border-dashed border-gray-300"
                                )}>
                                    {/* Position Badge */}
                                    <div className="absolute top-0 left-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-br-xl rounded-tl-xl">
                                        {pos}
                                    </div>

                                    {/* Slot Content */}
                                    <div className="w-full pl-8">
                                        {slotPlayer ? (
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900">{slotPlayer.name}</h3>
                                                    <div className="flex gap-2 text-sm mt-1">
                                                        <span className="text-gray-500">{slotPlayer.role}</span>
                                                        <span className="text-purple-600 font-bold bg-purple-50 px-2 rounded">
                                                            {getBattingGroupLabel(slotPlayer.battingPositionGroup)}
                                                        </span>
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

                    {/* Action Bar */}
                    <div className="mt-8 p-4 bg-white border border-gray-200 rounded-2xl flex justify-between items-center shadow-sm sticky bottom-4">
                        <div className="text-sm font-bold text-gray-600">
                            {11 - assignedIds.length} Slots Remaining
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={assignedIds.length !== 11 || saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
