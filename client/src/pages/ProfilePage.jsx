import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCircle, KeyRound, ShieldCheck, Mail, Save } from 'lucide-react';
import { API_BASE_URL } from '../config';

const ProfilePage = () => {
    const { user, token } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSetPassword = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (password.length < 6) {
            return setError('Password must be at least 6 characters long.');
        }
        if (password !== confirmPassword) {
            return setError('Passwords do not match.');
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v2/auth/set-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ password })
            });

            const data = await res.json();
            if (res.ok) {
                setMessage('Password updated successfully! You can now use your username and password to log in.');
                setPassword('');
                setConfirmPassword('');
            } else {
                setError(data.message || 'Failed to update password.');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred while updating the password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                <UserCircle className="text-blue-600" size={32} />
                Your Profile
            </h1>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 md:p-8 space-y-8">
                    {/* User Info Section */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Account Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-4 rounded-xl space-y-1 border border-gray-100">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Mail size={14} /> Email Address</span>
                                <p className="text-gray-900 font-medium">{user?.email || 'Not available'}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl space-y-1 border border-gray-100">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><UserCircle size={14} /> Username</span>
                                <p className="text-gray-900 font-medium">{user?.username || user?.code || 'Not available'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Password Section */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                            <KeyRound className="text-blue-500" size={20} /> Security
                        </h2>
                        
                        <form onSubmit={handleSetPassword} className="max-w-md space-y-4">
                            <p className="text-sm text-gray-500 mb-4">
                                Set a local password to log in directly using your username instead of relying on Google/Email links.
                            </p>

                            {message && (
                                <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 text-sm font-medium flex items-center gap-2">
                                    <ShieldCheck size={18} />
                                    {message}
                                </div>
                            )}

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600 uppercase">New Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    placeholder="Minimum 6 characters"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600 uppercase">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    placeholder="Must match password"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !password || !confirmPassword}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Saving...' : 'Set Password'}
                                {!loading && <Save size={18} />}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
