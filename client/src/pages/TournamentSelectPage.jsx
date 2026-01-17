
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Lock, ArrowRight, Activity, Plus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';


const TournamentSelectPage = () => {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState(null);

    const [username, setUsername] = useState(null);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [newUsername, setNewUsername] = useState('');

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createName, setCreateName] = useState('');
    const [createCode, setCreateCode] = useState('');
    const [createMode, setCreateMode] = useState('USER_CHOICE');
    const [creating, setCreating] = useState(false);



    useEffect(() => {
        const initValues = async () => {
            const token = sessionStorage.getItem('firebase_token');
            if (!token) {
                navigate('/email-login');
                return;
            }

            try {
                // Parallel fetch: Tournaments and User Info
                const [tourRes, userRes] = await Promise.all([
                    fetch(`${API_URL}/api/v2/auth/tournaments`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/api/v2/auth/login`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (tourRes.ok) {
                    const data = await tourRes.json();
                    setTournaments(data);
                }

                if (userRes.ok) {
                    const userData = await userRes.json();
                    if (userData.user && userData.user.username) {
                        setUsername(userData.user.username);
                        setUserRole(userData.user.role || 'USER'); // Store role
                    }
                }

            } catch (err) {
                console.error("Failed to fetch initial data", err);
            } finally {
                setLoading(false);
            }
        };
        initValues();
    }, [navigate]);

    const handleJoin = async (e) => {
        e.preventDefault();
        setError('');

        if (!username) {
            setShowUsernameModal(true);
            return;
        }

        const token = sessionStorage.getItem('firebase_token');
        try {
            const res = await fetch(`${API_URL}/api/v2/auth/tournaments/${selectedTournament._id}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ accessCode })
            });
            const data = await res.json();

            if (res.ok) {
                if (data.autoLogin && data.token) {
                    // Direct to Dashboard
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.team));
                    window.location.href = '/dashboard';
                } else {
                    // Go to Team Selector
                    navigate(`/tournaments/${selectedTournament._id}/teams`);
                }
            } else {
                setError(data.message || 'Invalid Access Code');
            }
        } catch (err) {
            setError('Failed to join tournament');
        }
    };

    const handleCreateTournament = async (e) => {
        e.preventDefault();
        setCreating(true);
        setError('');

        const token = sessionStorage.getItem('firebase_token');
        try {
            const res = await fetch(`${API_URL}/api/v2/auth/create-tournament`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: createName,
                    accessCode: createCode,
                    selectionMode: createMode
                })
            });

            const data = await res.json();
            if (res.ok) {
                setTournaments(prev => [...prev, data.tournament]);
                setShowCreateModal(false);
                setCreateName('');
                setCreateCode('');
                setCreateMode('USER_CHOICE');
            } else {
                setError(data.message || 'Failed to create tournament');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-2xl border border-gray-100">
                <div className="text-center mb-8">
                    {selectedTournament ? (
                        <div className="flex flex-col items-center">
                            <button
                                onClick={() => setSelectedTournament(null)}
                                className="text-sm text-gray-400 hover:text-gray-600 mb-4"
                            >
                                &larr; Back to Tournaments
                            </button>
                            <h1 className="text-2xl font-black text-gray-900 mb-2">{selectedTournament.name}</h1>
                            <p className="text-gray-500">Enter Access Code to Enter</p>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-2xl font-black text-gray-900 mb-2">Active Tournaments</h1>
                            <p className="text-gray-500">Select a tournament to participate in.</p>
                        </>
                    )}
                </div>

                {selectedTournament ? (
                    <form onSubmit={handleJoin} className="max-w-md mx-auto space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Access Code</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    placeholder="Enter Code"
                                    required
                                />
                            </div>
                        </div>
                        {error && <div className="p-3 bg-red-50 text-red-600 font-bold text-center rounded-lg">{error}</div>}
                        <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">
                            Verify & Enter
                        </button>
                    </form>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {loading ? <p className="text-center">Loading...</p> : tournaments.map(t => (
                            <div
                                key={t._id}
                                onClick={() => setSelectedTournament(t)}
                                className="p-6 border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                        <Trophy size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{t.name}</h3>
                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">{t.status}</span>
                                    </div>
                                </div>
                                <ArrowRight className="text-gray-300 group-hover:text-blue-500 transition" />
                            </div>
                        ))}

                        {userRole === 'admin' && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all flex items-center justify-center group gap-2 text-gray-500 hover:text-blue-600 font-bold"
                            >
                                <Plus size={24} /> Create New Tournament
                            </button>
                        )}
                    </div>
                )}
            </div>
            {
                showUsernameModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
                            <h2 className="text-2xl font-black text-gray-900 mb-2">Create Username</h2>
                            <p className="text-gray-500 mb-6">You need a unique username to join tournaments.</p>

                            {error && <div className="p-3 mb-4 bg-red-50 text-red-600 font-bold text-sm rounded-lg">{error}</div>}

                            <input
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                placeholder="e.g. MasterStrategist"
                                autoFocus
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowUsernameModal(false)}
                                    className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!newUsername.trim()) return;
                                        const token = sessionStorage.getItem('firebase_token');
                                        try {
                                            const res = await fetch(`${API_URL}/api/v2/auth/set-username`, {
                                                method: 'POST',
                                                headers: {
                                                    'Authorization': `Bearer ${token}`,
                                                    'Content-Type': 'application/json'
                                                },
                                                body: JSON.stringify({ username: newUsername })
                                            });

                                            const data = await res.json();
                                            if (res.ok) {
                                                setUsername(data.username);
                                                setShowUsernameModal(false);
                                                // Optional: Auto-submit the join form? 
                                                // User has to click "Verify & Enter" again, which is fine.
                                            } else {
                                                setError(data.message || 'Failed to set username');
                                            }
                                        } catch (err) {
                                            setError('Network error');
                                        }
                                    }}
                                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
                                >
                                    Save & Continue
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                showCreateModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
                            <h2 className="text-2xl font-black text-gray-900 mb-2">New Tournament</h2>
                            <p className="text-gray-500 mb-6">Setup a new tournament instance.</p>

                            <form onSubmit={handleCreateTournament} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tournament Name</label>
                                    <input
                                        type="text"
                                        value={createName}
                                        onChange={(e) => setCreateName(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                        placeholder="e.g. IPL 2024"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Access Code</label>
                                    <input
                                        type="text"
                                        value={createCode}
                                        onChange={(e) => setCreateCode(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                        placeholder="e.g. PLAY123"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Team Selection Mode</label>
                                    <select
                                        value={createMode}
                                        onChange={(e) => setCreateMode(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                    >
                                        <option value="USER_CHOICE">User Choice (Classic)</option>
                                        <option value="ADMIN_ASSIGN">Admin Assignment (Locked)</option>
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1 ml-1 leading-snug">
                                        {createMode === 'USER_CHOICE'
                                            ? "Users can pick any available team."
                                            : "Users must wait for Admin to assign them a team."}
                                    </p>
                                </div>

                                {error && <div className="p-3 bg-red-50 text-red-600 font-bold text-sm rounded-lg">{error}</div>}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:bg-gray-400"
                                    >
                                        {creating ? 'Creating...' : 'Create Tournament'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default TournamentSelectPage;
