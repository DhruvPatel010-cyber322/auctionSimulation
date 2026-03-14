import React from 'react';
import { Activity, Clock } from 'lucide-react';

const MatchCentrePage = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-8 shadow-inner relative overflow-hidden group">
                {/* Ping animation behind */}
                <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-20"></div>
                <Activity size={48} className="relative z-10 animate-pulse" strokeWidth={2.5} />
            </div>
            
            <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Match Centre</h1>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-lg mb-8 relative">
                <div className="absolute -top-3 -right-3">
                    <span className="flex items-center gap-1.5 bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full border border-yellow-200 shadow-sm animate-bounce">
                        <Clock size={12} /> Coming Soon
                    </span>
                </div>
                <p className="text-gray-500 text-lg leading-relaxed">
                    The live Match Centre is currently under construction. Once the tournament begins, this hub will feature live scores, detailed player statistics, and real-time point tracking based on actual match performances!
                </p>
            </div>
            
            <div className="flex gap-4">
                <div className="h-2 w-16 bg-gray-200 rounded-full"></div>
                <div className="h-2 w-16 bg-blue-600 rounded-full"></div>
                <div className="h-2 w-16 bg-gray-200 rounded-full"></div>
            </div>
        </div>
    );
};

export default MatchCentrePage;
