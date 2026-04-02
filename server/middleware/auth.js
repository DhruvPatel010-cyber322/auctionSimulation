import jwt from 'jsonwebtoken';
import Team from '../models/Team.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch full user from DB to restore fields not guaranteed in JWT payload
      const dbUser = decoded.userId ? await User.findById(decoded.userId).lean() : null;

      // Admin and Spectator bypass session validation
      if (decoded.role === 'admin' || decoded.role === 'spectator') {
        req.user = {
          ...decoded,
          teamCode: dbUser?.teamCode ?? decoded.teamCode ?? null,
          tournamentId: dbUser?.tournamentId ?? decoded.tournamentId ?? null
        };
        return next();
      }

      // Team session validation
      const teamCodeFromToken = dbUser?.teamCode ?? decoded.teamCode;

      // If teamCode is null (e.g. right after login before selecting a team)
      if (!teamCodeFromToken) {
        req.user = {
          userId: decoded.userId,
          role: decoded.role,
          teamCode: null,
          tournamentId: dbUser?.tournamentId ?? decoded.tournamentId ?? null,
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
      if (decoded.tournamentId || dbUser?.tournamentId) {
        req.user = {
          ...decoded,
          teamCode: normalizedCode,
          tournamentId: dbUser?.tournamentId ?? decoded.tournamentId,
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
        ...decoded,
        teamCode: normalizedCode,
        tournamentId: dbUser?.tournamentId ?? decoded.tournamentId ?? null,
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
