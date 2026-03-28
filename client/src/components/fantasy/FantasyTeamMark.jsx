import React from 'react';
import { getFantasyTeamBrand, getFantasyTeamGradient } from '../../utils/fantasyBranding';

const FantasyTeamMark = ({
    code,
    logoMap = {},
    className = 'h-14 w-14',
    labelClassName = 'text-sm',
    ringClassName = 'border-white/70',
    imageClassName = 'p-1.5',
    square = false
}) => {
    const normalizedCode = String(code || '').toUpperCase();
    const brand = getFantasyTeamBrand(normalizedCode);
    const logo = logoMap[normalizedCode];

    return (
        <div
            className={`relative shrink-0 overflow-hidden border bg-white shadow-lg ${square ? 'rounded-2xl' : 'rounded-full'} ${ringClassName} ${className}`}
            style={logo ? { backgroundColor: '#FFFFFF' } : { background: getFantasyTeamGradient(normalizedCode), color: brand.text }}
            title={brand.name}
        >
            {logo ? (
                <img src={logo} alt={normalizedCode} className={`h-full w-full object-contain ${imageClassName}`} />
            ) : (
                <div className={`flex h-full w-full items-center justify-center font-black ${labelClassName}`} style={{ color: brand.text }}>
                    {normalizedCode || 'IPL'}
                </div>
            )}
        </div>
    );
};

export default FantasyTeamMark;
