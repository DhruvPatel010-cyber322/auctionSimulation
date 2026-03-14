import React from 'react';
import { BookOpen, AlertCircle, CheckCircle, Users, DollarSign } from 'lucide-react';

const RulesPage = () => {
    return (
        <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-10">
            <div className="text-center md:text-left border-b border-gray-100 pb-6">
                <h1 className="text-4xl font-black text-gray-900 mb-2">Auction Rules</h1>
                <p className="text-xl text-gray-500">Official regulations for the IPL Mock Auction.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Squad Composition */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                        <Users size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Squad Composition</h2>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <CheckCircle className="text-green-500 shrink-0 mt-1" size={20} />
                            <div>
                                <span className="font-bold text-gray-800">Max Squad Size</span>
                                <p className="text-gray-500 text-sm">Each team can purchase a maximum of <span className="font-bold text-gray-900">25 Players</span>.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle className="text-green-500 shrink-0 mt-1" size={20} />
                            <div>
                                <span className="font-bold text-gray-800">Overseas Limit</span>
                                <p className="text-gray-500 text-sm">Maximum of <span className="font-bold text-gray-900">8 Overseas Players</span> per squad.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <AlertCircle className="text-amber-500 shrink-0 mt-1" size={20} />
                            <div>
                                <span className="font-bold text-gray-800">Minimum Squad</span>
                                <p className="text-gray-500 text-sm">Teams must buy at least <span className="font-bold text-gray-900">18 players</span> to execute a valid auction.</p>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* Financials */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-6">
                        <DollarSign size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Purse & Bidding</h2>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <CheckCircle className="text-green-500 shrink-0 mt-1" size={20} />
                            <div>
                                <span className="font-bold text-gray-800">Total Budget</span>
                                <p className="text-gray-500 text-sm">Each team enters with a purse of <span className="font-bold text-gray-900">₹120.00 Crores</span>.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle className="text-green-500 shrink-0 mt-1" size={20} />
                            <div>
                                <span className="font-bold text-gray-800">Increments</span>
                                <p className="text-gray-500 text-sm">Bids can be raised by <span className="font-mono bg-gray-100 px-1 rounded">0.2</span>, <span className="font-mono bg-gray-100 px-1 rounded">0.5</span>, or <span className="font-mono bg-gray-100 px-1 rounded">1.0</span> Cr.</p>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* Playing XI Validation */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 md:col-span-2">
                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                        <AlertCircle size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Playing XI Validation Rules</h2>
                    <p className="text-gray-500 mb-6">When selecting your final 11, players must be assigned positions matching their role group.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <span className="text-xs font-black text-blue-600 uppercase tracking-widest block mb-1">Positions 1-2</span>
                            <span className="font-bold text-gray-900 text-lg">Openers</span>
                            <p className="text-xs text-gray-500 mt-2 font-medium">Must be assigned to players from <span className="font-bold text-gray-700">Group 1</span>.</p>
                        </div>
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-purple-200 transition-colors">
                            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                            <span className="text-xs font-black text-purple-600 uppercase tracking-widest block mb-1">Positions 3-8</span>
                            <span className="font-bold text-gray-900 text-lg">Middle Order</span>
                            <p className="text-xs text-gray-500 mt-2 font-medium">Any mix of Middle, Lower Middle, or Tail <span className="font-bold text-gray-700">(Groups 2, 3, or 4)</span>.</p>
                        </div>
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-colors">
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                            <span className="text-xs font-black text-orange-600 uppercase tracking-widest block mb-1">Positions 9-11</span>
                            <span className="font-bold text-gray-900 text-lg">Tail / Lower Order</span>
                            <p className="text-xs text-gray-500 mt-2 font-medium">Strictly Lower Middle or Tail <span className="font-bold text-gray-700">(Groups 3 or 4)</span>.</p>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Composition Requirements</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1 text-gray-700 bg-red-50 p-4 rounded-xl border border-red-100">
                                <span className="font-bold text-red-700 text-xl">Max 4</span>
                                <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Overseas Players</span>
                            </div>
                            <div className="flex flex-col gap-1 text-gray-700 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <span className="font-bold text-blue-700 text-xl">Min 1</span>
                                <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Wicket Keeper</span>
                            </div>
                            <div className="flex flex-col gap-1 text-gray-700 bg-green-50 p-4 rounded-xl border border-green-100">
                                <span className="font-bold text-green-700 text-xl">Min 5</span>
                                <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Bowling Options</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Points System Placeholder */}
            <div className="p-8 border-2 border-dashed border-gray-200 rounded-3xl text-center bg-gray-50/50">
                <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-600 rounded-2xl mb-4">
                    <AlertCircle size={28} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Points System</h2>
                <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold uppercase tracking-wider rounded-lg border border-yellow-200 shadow-sm mb-4">Coming Soon</span>
                <p className="text-gray-500 max-w-2xl mx-auto">
                    The intricate scoring matrix that dictates how your playing 11 generates points on match days is currently under final review by the league committee. Check back soon for the official points distribution rules!
                </p>
            </div>

            {/* Auction Format */}
            <div className="bg-gradient-to-r from-slate-900 to-black p-8 md:p-10 rounded-3xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4"></div>

                <h2 className="text-2xl font-bold mb-6 relative z-10">Auction Process</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 text-gray-300">
                    <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 block">Step 01</span>
                        <h3 className="font-bold text-white mb-2">The Call</h3>
                        <p className="text-sm">Auctioneer announces the player and base price. Bidding opens immediately.</p>
                    </div>
                    <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 block">Step 02</span>
                        <h3 className="font-bold text-white mb-2">The Battle</h3>
                        <p className="text-sm">Teams place bids. The timer resets to 30s with every new valid bid.</p>
                    </div>
                    <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 block">Step 03</span>
                        <h3 className="font-bold text-white mb-2">The Gavel</h3>
                        <p className="text-sm">When the timer hits zero, the player is sold to the highest bidder.</p>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default RulesPage;
