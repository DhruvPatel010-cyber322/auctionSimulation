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
            </div>

            {/* Playing XI Validation */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 md:col-span-2">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                    <AlertCircle size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Playing XI Validation Rules</h2>
                <p className="text-gray-500 mb-6">When selecting your final 11, players must be assigned positions matching their role group.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-xs font-bold text-purple-600 uppercase tracking-widest block mb-1">Positions 1-2</span>
                        <span className="font-bold text-gray-900">Openers</span>
                        <p className="text-xs text-gray-400 mt-2">Must be Group 1</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-xs font-bold text-purple-600 uppercase tracking-widest block mb-1">Positions 3-4</span>
                        <span className="font-bold text-gray-900">Middle Order</span>
                        <p className="text-xs text-gray-400 mt-2">Must be Group 2</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-xs font-bold text-purple-600 uppercase tracking-widest block mb-1">Positions 5-7</span>
                        <span className="font-bold text-gray-900">Lower Middle</span>
                        <p className="text-xs text-gray-400 mt-2">Must be Group 3</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-xs font-bold text-purple-600 uppercase tracking-widest block mb-1">Positions 8-11</span>
                        <span className="font-bold text-gray-900">Tail / Lower</span>
                        <p className="text-xs text-gray-400 mt-2">Must be Group 4</p>
                    </div>
                </div>
            </div>
        </div>

            {/* Auction Format */ }
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
