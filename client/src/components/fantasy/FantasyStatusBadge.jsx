import React from 'react';

const STATUS_STYLES = {
    Live: 'border-red-200 bg-red-100 text-red-700',
    Completed: 'border-emerald-200 bg-emerald-100 text-emerald-700',
    UpComing: 'border-amber-200 bg-amber-100 text-amber-700',
    Upcoming: 'border-amber-200 bg-amber-100 text-amber-700'
};

const FantasyStatusBadge = ({ status = 'Upcoming' }) => (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] ${STATUS_STYLES[status] || STATUS_STYLES.Upcoming}`}>
        {status}
    </span>
);

export default FantasyStatusBadge;
