import jwt from 'jsonwebtoken';
import Team from '../models/Team.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Admin and Spectator bypass session validation
      if (decoded.role === 'admin' || decoded.role === 'spectator') {
        req.user = decoded;
        return next();
      }

      // Team session validation
      const teamCodeFromToken = decoded.teamCode;
      
      // If teamCode is null (e.g. right after login before selecting a team)
      if (!teamCodeFromToken) {
          req.user = {
              userId: decoded.userId,
              role: decoded.role,
              teamCode: null,
              tournamentId: decoded.tournamentId || null,
              sessionId: decoded.sessionId || null
          };
          return next();
      }

      const normalizedCode = teamCodeFromToken.toUpperCase();
      const team = await Team.findOne({ code: normalizedCode });
      
      if (!team) {
        console.error(`[Protect] Team not found for code: ${normalizedCode}`);
        return res.status(401).json({ message: 'Team not found', forceLogout: true });
      }

      // Check for Multi-Tournament Flow
      if (decoded.tournamentId) {
        req.user = {
          teamCode: normalizedCode,
          role: decoded.role,
          tournamentId: decoded.tournamentId,
          userId: decoded.userId,
          sessionId: decoded.sessionId || null
        };
        return next();
      }

      // Legacy Session Validation
      if (team.activeSessionId !== decoded.sessionId) {
        return res.status(401).json({
          message: 'Session invalid. You have been logged out from another location.',
          forceLogout: true
        });
      }

      req.user = {
        teamCode: normalizedCode,
        role: decoded.role,
        sessionId: decoded.sessionId,
        userId: decoded.userId || null
      };
      next();
    } catch (error) {
      console.error('Token Failed:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};
