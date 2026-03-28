import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { CalendarDays, Trophy, UserCircle, LogOut, ArrowLeft, Menu, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const FantasyLayout = () => {
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Dynamic Navigation Items for Fantasy Mode
    const navItems = [
        { name: 'Matches', path: '/fantasy', icon: CalendarDays },
        // Future global routes could be added here
        { name: 'Main Menu', path: '/main-menu', icon: ArrowLeft },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-900">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shadow-xl h-screen fixed left-0 top-0 z-30 border-r border-slate-800">
                <div className="p-6 border-b border-slate-800 flex items-center justify-center gap-2">
                    <Sparkles className="text-red-500" />
                    <h1 className="text-2xl font-black tracking-tighter text-white">Fantasy <span className="text-red-500">Cricket</span></h1>
                </div>
                
                <nav className="flex-1 overflow-y-auto py-6">
                    <ul className="space-y-2 px-4">
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    end={item.path === '/fantasy'} // exact match for /fantasy so it doesn't stay 'active' when in nested routes
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 font-bold text-sm",
                                            isActive
                                                ? "bg-red-600 text-white shadow-lg shadow-red-500/30 translate-x-1"
                                                : "text-slate-400 hover:bg-slate-800 hover:text-white hover:pl-6"
                                        )
                                    }
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon size={20} strokeWidth={2.5} />
                                        <span>{item.name}</span>
                                    </div>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                    <button
                        onClick={logout}
                        className="w-full py-3 px-4 rounded-xl border border-red-900/50 text-sm font-bold text-red-500 hover:bg-red-900/40 hover:text-red-400 transition-colors flex items-center justify-center gap-2">
                        <LogOut size={16} /> <span>Disconnect</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden bg-gray-50">
                {/* Top Header */}
                <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
                    <div className="md:hidden flex items-center gap-2">
                        <Sparkles className="text-red-500" size={20} />
                        <h1 className="text-xl font-black text-slate-900">Fantasy <span className="text-red-500">Cricket</span></h1>
                    </div>
                    
                    {/* Empty div to push user profile to right on desktop */}
                    <div className="hidden md:block flex-1"></div>

                    {/* User Menu / Right Side */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            <Link to="/profile" className="flex items-center gap-3 pl-6 border-l border-gray-200 hover:opacity-80 transition-opacity cursor-pointer">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-gray-900 leading-none">{user.username || 'Fantasy Player'}</p>
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">{user.email || 'Pro User'}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-red-100 border border-red-200 flex items-center justify-center overflow-hidden">
                                    <UserCircle size={24} className="text-red-500" />
                                </div>
                            </Link>
                        ) : (
                            <span className="text-sm font-bold text-gray-400">Guest Mode</span>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            {(() => {
                return (
                    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.07)] z-30 border-t border-gray-100 flex items-stretch"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/fantasy'}
                                className={({ isActive }) =>
                                    cn(
                                        "flex-1 flex flex-col items-center justify-center gap-0.5 py-3 transition-colors relative",
                                        isActive ? "text-red-600 bg-red-50/50" : "text-gray-400 hover:text-gray-600"
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-red-600" />
                                        )}
                                        <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                                        <span className="text-[10px] font-semibold tracking-tight">{item.name}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                );
            })()}
        </div>
    );
};

export default FantasyLayout;
