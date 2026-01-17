import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Gavel, Users, UserCircle, Menu, X, BookOpen, LogOut, Wallet, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const MainLayout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user: team, logout } = useAuth(); // Map user to team for compatibility
    const { socket } = useSocket();
    const [budget, setBudget] = useState(team?.remainingPurse || team?.budget || 0);

    // Sync Budget
    useEffect(() => {
        if (team) {
            setBudget(team.remainingPurse || team.budget || 0);
        }
    }, [team]);

    useEffect(() => {
        if (socket && team) {
            const handleUpdate = (data) => {
                if (data.teams) {
                    const myData = data.teams.find(t => t.id === team.id || t.code === team.code);
                    if (myData) {
                        setBudget(myData.remainingPurse || myData.budget || 0);
                    }
                }
            };

            const handleTeamUpdate = (update) => {
                if (update.teamCode === team.id || update.teamCode === team.code) {
                    setBudget(update.remainingPurse);
                }
            };

            socket.on('auction:state', handleUpdate);
            socket.on('auction:sync', handleUpdate);
            socket.on('team:update', handleTeamUpdate);
            // Also Request sync on mount to ensure freshness
            socket.emit('auction:request_sync');

            return () => {
                socket.off('auction:state', handleUpdate);
                socket.off('auction:sync', handleUpdate);
                socket.off('team:update', handleTeamUpdate);
            };
        }
    }, [socket, team]);

    // Navigation Items
    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Auction', path: '/auction', icon: Gavel },
        { name: 'Players', path: '/players', icon: Users },
        { name: 'Teams', path: '/teams', icon: Users },
        { name: 'Rules', path: '/rules', icon: BookOpen },
    ];

    // Conditionally add Admin Link
    if (team?.role === 'admin') {
        navItems.push({ name: 'Admin', path: '/admin', icon: Shield });
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-900">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white shadow-xl h-screen fixed left-0 top-0 z-30 border-r border-gray-100">
                <div className="p-6 border-b border-gray-100 flex items-center justify-center">
                    <h1 className="text-2xl font-black text-auction-primary tracking-tighter">Auction <span className="text-auction-secondary">Arena</span></h1>
                </div>
                <nav className="flex-1 overflow-y-auto py-6">
                    <ul className="space-y-2 px-4">
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 font-bold text-sm",
                                            isActive
                                                ? "bg-auction-primary text-white shadow-lg shadow-blue-500/30 translate-x-1"
                                                : "text-gray-500 hover:bg-gray-50 hover:text-auction-primary hover:pl-6"
                                        )
                                    }
                                >
                                    <item.icon size={20} strokeWidth={2.5} />
                                    <span>{item.name}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={logout}
                        className="w-full py-3 px-4 rounded-xl border border-red-100 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden">
                {/* Top Header */}
                <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
                    <div className="md:hidden">
                        <h1 className="text-xl font-black text-auction-primary">Auction <span className="text-auction-secondary">Arena</span></h1>
                    </div>
                    <div className="hidden md:block">
                        <h2 className="text-lg font-bold text-gray-800">Auction Dashboard</h2>
                    </div>

                    {/* User Menu / Right Side */}
                    <div className="flex items-center gap-4">
                        {team ? (

                            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-gray-900 leading-none">{team.name}</p>
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">{team.username || team.code || 'Team Account'}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center overflow-hidden p-1">
                                    {team.logo ? (
                                        <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white font-bold text-lg">{team.code?.[0]}</span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-gray-400">
                                <span className="text-sm font-bold">Guest Mode</span>
                            </div>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30 px-6 py-3 flex justify-between items-center border-t border-gray-100">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                                isActive ? "text-auction-primary" : "text-gray-400 hover:text-gray-600"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] font-medium">{item.name}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
        </div >
    );
};

export default MainLayout;
