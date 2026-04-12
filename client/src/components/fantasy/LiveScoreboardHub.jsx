import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { API_BASE_URL } from '../../config';
import MatchScoreCard from './MatchScoreCard';

const LiveScoreboardHub = () => {
    const [summaries, setSummaries] = useState([]);
    const { socket, isConnected } = useSocket();

    // 1. Initial Load from REST API
    useEffect(() => {
        const fetchInitialStatus = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/fantasy/live-status`);
                if (response.data && response.data.summaries) {
                    setSummaries(response.data.summaries);
                }
            } catch (err) {
                console.error("Failed to fetch initial scores", err);
            }
        };

        fetchInitialStatus();
    }, []);

    // 2. Real-time updates via Socket
    useEffect(() => {
        if (!socket) return;

        const handleUpdate = (newSummaries) => {
            console.log("Live score update received:", newSummaries);
            setSummaries(newSummaries);
        };

        socket.on('fantasy:match_summaries_update', handleUpdate);

        return () => {
            socket.off('fantasy:match_summaries_update', handleUpdate);
        };
    }, [socket]);

    if (summaries.length === 0) return null;

    return (
        <div className="live-scoreboard-hub">
            {summaries.map((s) => (
                <MatchScoreCard key={s.matchId} summary={s} />
            ))}
        </div>
    );
};

export default LiveScoreboardHub;
