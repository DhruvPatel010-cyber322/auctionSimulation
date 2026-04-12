import React from 'react';
import './MatchScoreCard.css';

const MatchScoreCard = ({ summary }) => {
    if (!summary) return null;

    const {
        battingTeam,
        bowlingTeam,
        totalScore,
        crr,
        batters = [],
        bowler = null,
        inningsNo
    } = summary;

    return (
        <div className="match-score-card">
            <div className="score-header">
                <div className="teams">
                    <span className="team-name">{battingTeam}</span>
                    <span className="vs">vs</span>
                    <span className="team-name">{bowlingTeam}</span>
                </div>
                <div className="live-badge">
                    <span className="pulse"></span> LIVE
                </div>
            </div>

            <div className="score-main">
                <div className="score-text">{totalScore}</div>
                <div className="crr-text">CRR: {crr}</div>
            </div>

            <div className="stats-grid">
                <div className="batting-section">
                    <div className="section-title">BATTING</div>
                    {batters.length > 0 ? batters.map((b, i) => (
                        <div key={i} className="player-row">
                            <span className="player-name">{b.name}*</span>
                            <span className="player-score">
                                <strong>{b.runs}</strong>({b.balls})
                            </span>
                        </div>
                    )) : (
                        <div className="player-row placeholder">Waiting for batters...</div>
                    )}
                </div>

                <div className="bowling-section">
                    <div className="section-title">BOWLING</div>
                    {bowler ? (
                        <div className="player-row">
                            <span className="player-name">{bowler.name}</span>
                            <span className="player-score">
                                <strong>{bowler.wickets}</strong>/{bowler.runs} ({bowler.overs})
                            </span>
                        </div>
                    ) : (
                        <div className="player-row placeholder">Waiting for bowler...</div>
                    )}
                </div>
            </div>
            
            <div className="innings-footer">
                Innings {inningsNo}
            </div>
        </div>
    );
};

export default MatchScoreCard;
