import React from 'react';

const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'P';
};

const FantasyPlayerAvatar = ({
    player,
    className = 'h-14 w-14',
    textClassName = 'text-sm'
}) => {
    const image = player?.image || null;
    const name = player?.name || 'Player';

    return (
        <div className={`relative shrink-0 overflow-hidden rounded-full border-2 border-white/80 bg-gradient-to-br from-rose-500 via-red-600 to-orange-500 shadow-lg ${className}`}>
            {image ? (
                <img
                    src={image}
                    alt={name}
                    className="h-full w-full object-cover"
                />
            ) : (
                <div className={`flex h-full w-full items-center justify-center font-black text-white ${textClassName}`}>
                    {getInitials(name)}
                </div>
            )}
        </div>
    );
};

export default FantasyPlayerAvatar;
