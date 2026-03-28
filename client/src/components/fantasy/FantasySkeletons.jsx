import React from 'react';

export const FantasyMatchCardSkeleton = () => (
    <div className="overflow-hidden rounded-[28px] border border-red-100 bg-white shadow-sm">
        <div className="h-36 animate-pulse bg-gradient-to-r from-red-100 via-rose-50 to-red-100" />
        <div className="space-y-4 p-5">
            <div className="h-5 w-2/3 animate-pulse rounded-full bg-gray-100" />
            <div className="grid grid-cols-2 gap-3">
                <div className="h-20 animate-pulse rounded-2xl bg-gray-100" />
                <div className="h-20 animate-pulse rounded-2xl bg-gray-100" />
            </div>
            <div className="h-12 animate-pulse rounded-2xl bg-gray-100" />
        </div>
    </div>
);

export const FantasyPlayerCardSkeleton = () => (
    <div className="rounded-[28px] border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
            <div className="h-16 w-16 animate-pulse rounded-full bg-gray-100" />
            <div className="flex-1 space-y-3">
                <div className="h-4 w-1/2 animate-pulse rounded-full bg-gray-100" />
                <div className="h-3 w-1/3 animate-pulse rounded-full bg-gray-100" />
                <div className="h-10 w-full animate-pulse rounded-2xl bg-gray-100" />
            </div>
        </div>
    </div>
);
