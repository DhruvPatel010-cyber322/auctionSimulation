import React, { useState, useEffect } from 'react';
import { API_BASE_URL as API_URL } from '../config';
import { Trophy, AlertCircle } from 'lucide-react';

const PointsTablePage = () => {
    const [pointsTable, setPointsTable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPoints = async () => {
            const localToken = localStorage.getItem('token');
            if (!localToken) return;

            try {
                const payload = JSON.parse(atob(localToken.split('.')[1]));
                const tournamentId = payload.tournamentId;
                const fbToken = sessionStorage.getItem('firebase_token');

                const res = await fetch(`${API_URL}/api/v2/auth/tournaments/${tournamentId}/points-table`, {
                    headers: { 'Authorization': `Bearer ${fbToken}` }
                });

                const data = await res.json();
                if (res.ok) {
                    setPointsTable(data.pointsTable || []);
                } else {
                    setError('Failed to load points table.');
                }
            } catch (err) {
                console.error(err);
                setError('Network error');
            } finally {
                setLoading(false);
            }
        };

        fetchPoints();
    }, []);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading Points Table...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                    <Trophy className="text-yellow-500" size={32} />
                    Points Table
                </h1>
                <p className="text-gray-500">Standings based on Playing XI performance.</p>
            </header>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-400 font-bold tracking-wider">
                                <th className="p-6">Pos</th>
                                <th className="p-6">Team</th>
                                <th className="p-6 text-center">Playing XI</th>
                                <th className="p-6 text-right">Total Points</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {pointsTable.map((team, index) => (
                                <tr key={team.id} className="hover:bg-blue-50/50 transition-colors group">
                                    <td className="p-6 font-bold text-gray-400 group-hover:text-blue-600 transition-colors">
                                        #{index + 1}
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden p-1 shrink-0">
                                                {team.logo ? <img src={team.logo} className="w-full h-full object-contain rounded-lg" alt={team.id} /> : <div className="w-full h-full bg-gray-200" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">{team.name}</div>
                                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{team.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${team.playing11Count === 11 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {team.playing11Count}/11
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="text-3xl font-black text-gray-900 group-hover:scale-110 transition-transform origin-right">{team.totalPoints}</div>
                                        <div className="text-xs font-bold text-gray-400 uppercase">Pts</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {pointsTable.length === 0 && (
                    <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                        <AlertCircle size={48} className="mb-4 opacity-50" />
                        <p>No teams found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PointsTablePage;
