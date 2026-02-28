import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL as API_URL } from '../config';
import { Shield, Check, AlertCircle, X, User, Plane, AlertTriangle, Lock, Edit2, ChevronDown, Users } from 'lucide-react';
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

const decodeJwtPayload = (token) => {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;

        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

        // Add required padding
        while (base64.length % 4) {
            base64 += '=';
        }

        return JSON.parse(atob(base64));
    } catch (err) {
        console.error('Invalid token', err);
        return null;
    }
};

const SelectPlayingXI = () => {
    const { user, token } = useAuth(); // User object might contain username, not tournament-team info directly
    const [myTeamCode, setMyTeamCode] = useState(null);
    const [selectedTeam, setSelectedTeam] = useState(null); // The team code we are viewing
    const [allTeams, setAllTeams] = useState([]); // For Dropdown

    // Data State
    const [squad, setSquad] = useState([]);
    const [playing11, setPlaying11] = useState([]); // Read-only Array

    // Edit Mode State
    const [isEditMode, setIsEditMode] = useState(false);
    const [slots, setSlots] = useState(
        Array.from({ length: 11 }, (_, i) => i + 1).reduce((acc, pos) => ({ ...acc, [pos]: null }), {})
    );

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    // 1. Initial Load: Get My Team Code & All Teams List
    useEffect(() => {
        const init = async () => {
            const localToken = localStorage.getItem('token');
            if (!localToken) return;

            try {
                const payload = decodeJwtPayload(localToken);
                if (!payload) {
                    window.location.href = '/email-login';
                    return;
                }
                const tournamentId = payload.tournamentId;
                if (!tournamentId) {
                    setError("No active tournament session.");
                    setLoading(false);
                    return;
                }
                const fbToken = sessionStorage.getItem('firebase_token');

                // Get All Teams
                const res = await fetch(`${API_URL}/api/v2/auth/tournaments/${tournamentId}/teams`, {
                    headers: { 'Authorization': `Bearer ${fbToken}` }
                });
                const data = await res.json();

                if (res.ok) {
                    setAllTeams(data.teams);
                    // Determine My Team
                    if (data.myTeamCode) {
                        const myTeam = data.myTeamCode.toLowerCase();
                        setMyTeamCode(myTeam);
                        setSelectedTeam(myTeam); // Default to viewing my team
                    } else if (data.teams.length > 0) {
                        setSelectedTeam(data.teams[0].id.toLowerCase()); // Default to first if I have no team
                    }
                }
            } catch (e) {
                console.error("Init Error", e);
                setError("Failed to load tournament data");
            }
        };
        init();
    }, []);

    // 2. Fetch Squad Data when Selected Team Changes
    useEffect(() => {
        if (!selectedTeam) return;

        const fetchSquad = async () => {
            setLoading(true);
            setError('');
            const localToken = localStorage.getItem('token');
            if (!localToken) return;

            try {
                const payload = decodeJwtPayload(localToken);
                if (!payload) {
                    window.location.href = '/email-login';
                    return;
                }
                const tournamentId = payload.tournamentId;
                if (!tournamentId) return;
                const fbToken = sessionStorage.getItem('firebase_token');

                // Use the Public Endpoint for consistency
                const res = await fetch(`${API_URL}/api/v2/auth/tournaments/${tournamentId}/teams/${selectedTeam}/squad`, {
                    headers: { 'Authorization': `Bearer ${fbToken}` }
                });

                const data = await res.json();
                if (res.ok) {
                    setSquad(data.players || []);
                    setPlaying11(data.playing11 || []);

                    // If switching to My Team and I have saved data, View Mode.
                    // If no saved data, maybe Auto-Edit? No, stick to View -> Edit.

                    // Sync Slots for Edit Mode if it's my team
                    if (selectedTeam === myTeamCode && data.playing11 && data.playing11.length > 0) {
                        const newSlots = Array.from({ length: 11 }, (_, i) => i + 1).reduce((acc, pos) => ({ ...acc, [pos]: null }), {});
                        data.playing11.forEach((p, idx) => {
                            if (idx < 11) newSlots[idx + 1] = p;
                        });
                        setSlots(newSlots);
                    } else if (selectedTeam === myTeamCode) {
                        // Reset if empty
                        setSlots(Array.from({ length: 11 }, (_, i) => i + 1).reduce((acc, pos) => ({ ...acc, [pos]: null }), {}));
                    }

                    setIsEditMode(false); // Always reset to View Mode on switch
                } else {
                    setError('Failed to load team data.');
                }
            } catch (e) {
                console.error(e);
                setError('Error loading squad.');
            } finally {
                setLoading(false);
            }
        };

        fetchSquad();
    }, [selectedTeam, myTeamCode]);


    // --- EDIT MODE LOGIC ---
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
    const stats = isEditMode ? getSquadStats() : null; // Only calculate if in edit mode

    const handleAssign = (player) => {
        const emptyPos = Object.keys(slots).find(pos => slots[pos] === null);
        if (!emptyPos) { setError("All slots full!"); setTimeout(() => setError(''), 2000); return; }
        assignToSlot(player, parseInt(emptyPos));
    };

    const assignToSlot = (player, pos) => {
        const reqGroup = getRequiredGroupForPos(pos);
        if (player.battingPositionGroup && player.battingPositionGroup !== reqGroup) {
            setError(`Invalid Position: Requires ${getBattingGroupLabel(reqGroup)}`);
            setTimeout(() => setError(''), 2000);
            return;
        }
        setSlots(prev => ({ ...prev, [pos]: player }));
        setError('');
    };

    const handleRemove = (pos) => setSlots(prev => ({ ...prev, [pos]: null }));

    const handleSave = async () => {
        if (!stats.isValid) {
            setError("Cannot save: Squad rules validation failed.");
            setTimeout(() => setError(''), 3000);
            return;
        }
        setSaving(true);
        const fbToken = sessionStorage.getItem('firebase_token');
        const localToken = localStorage.getItem('token');
        try {
            const payload = decodeJwtPayload(localToken);
            if (!payload) {
                window.location.href = '/email-login';
                return;
            }
            const tournamentId = payload.tournamentId;
            if (!tournamentId) throw new Error("Missing Tournament ID");
            const payloadData = Object.keys(slots).map(pos => ({ playerId: slots[pos]._id, battingPosition: parseInt(pos) }));

            const res = await fetch(`${API_URL}/api/v2/auth/tournaments/${tournamentId}/playing11`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${fbToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadData)
            });

            if (res.ok) {
                setMsg('Saved Successfully!');
                // Refresh Data to View Mode
                const data = await res.json();
                setPlaying11(data.playing11); // Optimistic update or from response
                setIsEditMode(false);
                setTimeout(() => setMsg(''), 3000);
            } else {
                const data = await res.json();
                setError(data.message || 'Save failed');
                setTimeout(() => setError(''), 3000);
            }
        } catch (e) {
            setError('Network error');
            setTimeout(() => setError(''), 3000);
        }
        finally { setSaving(false); }
    };

    // --- RENDER HELPERS ---
    const isMyTeam = selectedTeam === myTeamCode;

    if (loading && !squad.length && !allTeams.length) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

    // View Mode Data
    const benchPlayers = squad.filter(p => !playing11.find(xi => xi._id === p._id));

    // Edit Mode Data
    const assignedIds = Object.values(slots).filter(p => p).map(p => p._id);
    const availableForEdit = squad
        .filter(p => !assignedIds.includes(p._id))
        .sort((a, b) => {
            // Sort by Batting Group (1 -> 4)
            const groupA = a.battingPositionGroup || 99; // 99 for undefined (put at end)
            const groupB = b.battingPositionGroup || 99;
            if (groupA !== groupB) return groupA - groupB;
            // Then by Name
            return a.name.localeCompare(b.name);
        });

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            {/* Header & Controls */}
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <User className="text-blue-600" size={32} />
                        Playing XI
                    </h1>
                    <p className="text-gray-500">View and manage squad lineups.</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Team Selector */}
                    <div className="relative">
                        <select
                            value={selectedTeam || ''}
                            onChange={(e) => setSelectedTeam(e.target.value)}
                            className="appearance-none bg-white border border-gray-200 pl-4 pr-10 py-2 rounded-xl font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {allTeams.map(t => (
                                <option key={t.id} value={t.id}>{t.name} {t.id === myTeamCode ? '(You)' : ''}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>

                    {isMyTeam && !isEditMode && (
                        <button
                            onClick={() => setIsEditMode(true)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold transition-colors"
                        >
                            <Edit2 size={16} /> Edit XI
                        </button>
                    )}

                    {isEditMode && (
                        <button
                            onClick={() => setIsEditMode(false)}
                            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold transition-colors"
                        >
                            <X size={16} /> Cancel
                        </button>
                    )}
                </div>
            </header>

            {error && <div className="fixed top-24 right-8 z-50 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg animate-in fade-in slide-in-from-right">{error}</div>}
            {msg && <div className="fixed top-24 right-8 z-50 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg animate-in fade-in slide-in-from-right">{msg}</div>}

            {/* --- VIEW MODE --- */}
            {!isEditMode && (
                <div className="space-y-8 animate-in fade-in">
                    {playing11.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
                            <Shield size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">No Playing XI Selected</h3>
                            <p className="text-gray-500 mb-6">{isMyTeam ? "You haven't finalized your team yet." : "This team hasn't announced their Playing XI."}</p>
                            {isMyTeam && (
                                <button onClick={() => setIsEditMode(true)} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">
                                    Create Playing XI
                                </button>
                            )}
                        </div>
                    ) : (
                        <div>
                            {/* Playing XI Grid */}
                            <div className="flex items-center gap-2 mb-4">
                                <Shield className="text-green-600" />
                                <h2 className="text-xl font-bold text-gray-800">Final 11</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {playing11.map((p, i) => (
                                    <div key={p._id} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                                        <div className="absolute top-0 left-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-br-lg">
                                            #{i + 1}
                                        </div>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                                                {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-gray-300" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1">
                                                    <h3 className="font-bold text-gray-900">{p.name}</h3>
                                                    {p.isOverseas && <Plane size={14} className="text-blue-500 fill-blue-500" />}
                                                </div>
                                                <p className="text-xs font-bold text-gray-500 uppercase">{p.role}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bench Section */}
                    {benchPlayers.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-4 mt-8">
                                <Users className="text-gray-400" />
                                <h2 className="text-xl font-bold text-gray-800">Bench ({benchPlayers.length})</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                {benchPlayers.map(p => (
                                    <div key={p._id} className="bg-gray-50 p-3 rounded-xl border border-gray-200 opacity-75 hover:opacity-100 transition-opacity flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 overflow-hidden shrink-0">
                                            {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-gray-300" />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-700">{p.name}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">{p.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}


            {/* --- EDIT MODE --- */}
            {isEditMode && (
                <div className="animate-in slide-in-from-bottom-4">
                    {/* Reuse existing Edit UI logic here */}

                    {/* Stats Panel */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className={cn("p-3 rounded-xl border flex items-center justify-between", stats.count === 11 ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200")}>
                            <div><span className="text-xs font-bold uppercase text-gray-400 block">Players</span><span className={cn("font-bold text-lg", stats.count === 11 ? "text-green-700" : "text-gray-900")}>{stats.count}/11</span></div>
                            {stats.count === 11 ? <Check size={20} className="text-green-600" /> : <Shield size={20} className="text-gray-300" />}
                        </div>
                        <div className={cn("p-3 rounded-xl border flex items-center justify-between", stats.overseas <= 4 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                            <div><span className="text-xs font-bold uppercase text-gray-400 block">Overseas</span><span className={cn("font-bold text-lg", stats.overseas > 4 ? "text-red-600" : "text-gray-900")}>{stats.overseas}/4</span></div>
                            {stats.overseas <= 4 ? <Check size={20} className="text-green-600" /> : <AlertTriangle size={20} className="text-red-600" />}
                        </div>
                        <div className={cn("p-3 rounded-xl border flex items-center justify-between", stats.wks >= 1 ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200")}>
                            <div><span className="text-xs font-bold uppercase text-gray-400 block">Keepers</span><span className={cn("font-bold text-lg", stats.wks >= 1 ? "text-green-700" : "text-gray-900")}>{stats.wks}/1 (Min)</span></div>
                            {stats.wks >= 1 ? <Check size={20} className="text-green-600" /> : <AlertCircle size={20} className="text-orange-500" />}
                        </div>
                        <div className={cn("p-3 rounded-xl border flex items-center justify-between", stats.bowlers >= 5 ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200")}>
                            <div><span className="text-xs font-bold uppercase text-gray-400 block">Bowling</span><span className={cn("font-bold text-lg", stats.bowlers >= 5 ? "text-green-700" : "text-gray-900")}>{stats.bowlers}/5 (Min)</span></div>
                            {stats.bowlers >= 5 ? <Check size={20} className="text-green-600" /> : <AlertCircle size={20} className="text-orange-500" />}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-4">
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
                                <h2 className="font-bold text-gray-800 mb-4">Available Squad ({availableForEdit.length})</h2>
                                <div className="space-y-2">
                                    {availableForEdit.map(p => (
                                        <div key={p._id} onClick={() => handleAssign(p)} className="p-3 border rounded-xl hover:bg-blue-50 cursor-pointer flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                                                {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-gray-300" />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold">{p.name} {p.isOverseas && '✈️'}</div>
                                                <div className="text-xs text-gray-500">{p.role} • {getBattingGroupLabel(p.battingPositionGroup)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Slots */}
                        <div className="lg:col-span-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...Array(11)].map((_, i) => {
                                    const pos = i + 1;
                                    const p = slots[pos];
                                    return (
                                        <div key={pos} className={cn("relative p-4 rounded-2xl border-2 min-h-[90px] flex items-center", p ? "bg-white border-blue-500" : "bg-gray-50 border-dashed")}>
                                            <span className="absolute top-0 left-0 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-br">{pos}</span>
                                            {p ? (
                                                <div className="w-full pl-6 flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                                                            {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-gray-300" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold">{p.name} {p.isOverseas && '✈️'}</div>
                                                            <div className="text-xs text-gray-500">{p.role}</div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleRemove(pos)} className="p-2 hover:bg-red-50 text-red-500 rounded-full"><X size={16} /></button>
                                                </div>
                                            ) : (
                                                <div className="w-full text-center text-xs text-gray-400 font-bold uppercase tracking-wider pl-6">
                                                    Required: {getBattingGroupLabel(getRequiredGroupForPos(pos))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={!stats.isValid || saving}
                                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Saving...' : 'Save Playing XI'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SelectPlayingXI;
