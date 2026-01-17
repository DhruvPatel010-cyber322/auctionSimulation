
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL as API_URL } from '../config';
import { Shield, Check, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

// Helper for Batting Groups
const getBattingGroupLabel = (groupCode) => {
    switch (groupCode) {
        case 1: return "Opener";
        case 2: return "Middle Order";
        case 3: return "Lower Middle";
        case 4: return "Tail";
        default: return "Unassigned";
    }
};

const SelectPlayingXI = () => {
    const { user: team } = useAuth(); // 'user' is the Team object in this app context often
    const [players, setPlayers] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        const fetchSquad = async () => {
            const token = sessionStorage.getItem('firebase_token');
            // We need tournament ID. Assuming it's in localStorage or we can fetch "my-squad" which infers it from token if possible?
            // Actually `authRoutes.js` endpoints use `:id` for tournament. 
            // We need to know the current tournament ID. 
            // Ideally `team` context would have it.
            // Looking at `authRoutes.js` select-team response: token has tournamentId.
            // But valid REST requirement in created route uses `:id`.
            // Let's try to get it from the `team` context or we might need to adjust endpoint to not require ID in URL if token implies it. 
            // NOTE: The `authRoutes.js` uses `req.params.id`.
            // We need to grab it from `team.tournamentId` if available?
            // Let's decode token to find tournamentId? Or check `localStorage`.
            // For now, let's assume we can get it or use a broader endpoint.
            // Wait, `MainLayout` uses `team`.

            // Simplification: We'll Iterate stored tournaments or just rely on the token info if possible?
            // Actually, checking `authRoutes.js`, checking token...
            // `const token = jwt.sign({... tournamentId ...})`.
            // So we can parse the JWT to get the ID!

            const localToken = localStorage.getItem('token');
            if (!localToken) return;

            try {
                const payload = JSON.parse(atob(localToken.split('.')[1]));
                const tournamentId = payload.tournamentId;

                const res = await fetch(`${API_URL}/api/v2/auth/tournaments/${tournamentId}/my-squad`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setPlayers(data.players || []);
                    // Pre-select existing playing 11
                    if (data.playing11 && data.playing11.length > 0) {
                        setSelectedIds(data.playing11.map(p => p._id));
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

    const togglePlayer = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(pid => pid !== id));
        } else {
            if (selectedIds.length >= 11) {
                // Don't allow more than 11
                return;
            }
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMsg('');
        const token = sessionStorage.getItem('firebase_token');
        const localToken = localStorage.getItem('token');
        try {
            const payload = JSON.parse(atob(localToken.split('.')[1]));
            const tournamentId = payload.tournamentId;

            const res = await fetch(`${API_URL}/api/v2/auth/tournaments/${tournamentId}/playing11`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ playerIds: selectedIds })
            });

            const data = await res.json();
            if (res.ok) {
                setMsg('Playing XI Saved Successfully!');
            } else {
                setError(data.message || 'Save failed');
            }
        } catch (e) {
            setError('Network error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Squad...</div>;

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Select Playing <span className="text-blue-600">XI</span></h1>
                    <p className="text-gray-500">Choose your best 11 players for the upcoming match.</p>
                </div>
                <div className="text-right">
                    <div className={cn("text-4xl font-black", selectedIds.length === 11 ? "text-green-600" : "text-gray-300")}>
                        {selectedIds.length}<span className="text-xl text-gray-400">/11</span>
                    </div>
                </div>
            </div>

            {/* Validation Placeholder */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 flex items-center gap-3">
                <AlertCircle className="text-yellow-600" size={24} />
                <span className="text-yellow-800 font-bold">Playing XI rules validation will be applied soon</span>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 font-bold">{error}</div>}
            {msg && <div className="bg-green-50 text-green-600 p-4 rounded-xl mb-4 font-bold">{msg}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
                {players.map(player => {
                    const isSelected = selectedIds.includes(player._id);
                    return (
                        <div
                            key={player._id}
                            onClick={() => togglePlayer(player._id)}
                            className={cn(
                                "relative p-4 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02]",
                                isSelected
                                    ? "bg-blue-50 border-blue-500 shadow-lg shadow-blue-500/20"
                                    : "bg-white border-gray-100 hover:border-gray-200"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                {/* Checkbox Indicator */}
                                <div className={cn(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                    isSelected ? "bg-blue-500 border-blue-500" : "border-gray-300"
                                )}>
                                    {isSelected && <Check size={14} className="text-white" />}
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-900 leading-snug">{player.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold text-gray-400 uppercase">{player.role}</span>
                                        <span className={cn(
                                            "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                                            player.battingPositionGroup ? "bg-gray-100 text-gray-600" : "bg-red-50 text-red-400"
                                        )}>
                                            {getBattingGroupLabel(player.battingPositionGroup)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-200 p-4 z-20 flex justify-between items-center px-8">
                <div className="text-sm font-bold text-gray-500">
                    {11 - selectedIds.length > 0 ? `${11 - selectedIds.length} players remaining to select` : "Ready to Save"}
                </div>
                <button
                    onClick={handleSave}
                    disabled={selectedIds.length !== 11 || saving}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {saving ? 'Saving...' : 'Save Playing XI'}
                </button>
            </div>
        </div>
    );
};

export default SelectPlayingXI;
