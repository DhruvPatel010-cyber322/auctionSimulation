import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';
import './NextMatchCard.css';

const NextMatchCard = ({ match }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!match?.startTime) return;

        const timer = setInterval(() => {
            const now = new Date();
            const start = new Date(match.startTime);
            const diff = start - now;

            if (diff <= 0) {
                setTimeLeft('Starting soon...');
                clearInterval(timer);
                return;
            }

            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);

            setTimeLeft(`${h}h ${m}m ${s}s`);
        }, 1000);

        return () => clearInterval(timer);
    }, [match]);

    if (!match) return null;

    return (
        <div className="next-match-card">
            <div className="next-header">
                <span className="upcoming-tag">UPCOMING MATCH</span>
                <div className="countdown">
                    <Clock size={12} /> {timeLeft}
                </div>
            </div>

            <div className="next-teams">
                <div className="team">
                    <span className="team-name">{match.team1}</span>
                </div>
                <div className="vs">VS</div>
                <div className="team">
                    <span className="team-name">{match.team2}</span>
                </div>
            </div>

            <div className="next-details">
                <div className="detail-item">
                    <Calendar size={14} />
                    <span>{new Date(match.startTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} IST</span>
                </div>
                {match.venue && (
                    <div className="detail-item">
                        <MapPin size={14} />
                        <span>{match.venue}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NextMatchCard;
