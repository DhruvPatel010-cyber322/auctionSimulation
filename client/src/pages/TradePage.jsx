import React from 'react';
import { ArrowLeftRight, Clock, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TradePage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                
                {/* Visual Icon Grid */}
                <div className="relative mx-auto w-48 h-48 flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse opacity-50"></div>
                    <div className="absolute inset-4 bg-blue-50/80 rounded-full backdrop-blur-sm border border-blue-200"></div>
                    <ArrowLeftRight className="relative z-10 text-blue-600 drop-shadow-lg" size={80} strokeWidth={1.5} />
                    
                    {/* Floating Badges */}
                    <div className="absolute top-0 right-0 p-3 bg-white rounded-2xl shadow-xl transform rotate-12">
                        <Clock className="text-orange-500" size={24} />
                    </div>
                    <div className="absolute bottom-4 left-0 p-3 bg-white rounded-2xl shadow-xl transform -rotate-12">
                        <ShieldAlert className="text-indigo-500" size={24} />
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                        Trading Window <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Coming Soon</span>
                    </h1>
                    <p className="text-lg text-gray-500 max-w-md mx-auto leading-relaxed">
                        We are building a robust system to swap players and balance budgets securely. Stay tuned for the next major release!
                    </p>
                </div>

                {/* Return Action */}
                <div className="pt-8">
                    <button 
                        onClick={() => navigate('/teams')}
                        className="bg-gray-900 hover:bg-black text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                        Return to Teams Viewer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TradePage;
