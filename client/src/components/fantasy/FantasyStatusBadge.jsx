import React from 'react';

const STATUS_CONFIG = {
    Live: {
        className: 'border-red-300 bg-red-100 text-red-700',
        dot: 'bg-red-500 animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
        dotInner: 'bg-red-600'
    },
    Completed: {
        className: 'border-emerald-200 bg-emerald-100 text-emerald-700',
        dot: null,
        dotInner: null
    },
    Upcoming: {
        className: 'border-amber-200 bg-amber-100 text-amber-700',
        dot: null,
        dotInner: null
    }
};

const FantasyStatusBadge = ({ status = 'Upcoming' }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.Upcoming;

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${config.className}`}>
            {status === 'Live' && (
                <span className="relative flex h-2 w-2">
                    <span className={config.dot} />
                    <span className={`relative inline-flex h-2 w-2 rounded-full ${config.dotInner}`} />
                </span>
            )}
            {status}
        </span>
    );
};

export default FantasyStatusBadge;
