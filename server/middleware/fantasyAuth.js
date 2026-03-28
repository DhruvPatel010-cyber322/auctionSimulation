import jwt from 'jsonwebtoken';
import firebaseAdmin from '../config/firebaseAdmin.js';
import getFantasyUserModel from '../models/FantasyUser.js';

const buildPlaceholderEmail = (seed) => `dream11-${seed}@local.invalid`;

export const fantasyAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const FantasyUser = await getFantasyUserModel();

        try {
            const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
            const firebaseUid = decodedToken.uid;
            const email = decodedToken.email || buildPlaceholderEmail(firebaseUid);
            const name = decodedToken.name || 'User';

            const user = await FantasyUser.findOneAndUpdate(
                { firebaseUid },
                {
                    $set: {
                        firebaseUid,
                        email,
                        name
                    },
                    $setOnInsert: {
                        username: null,
                        role: email === 'dhruvpatel3768@gmail.com' ? 'admin' : 'user'
                    }
                },
                {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true
                }
            );

            req.user = user;
            req.firebaseUser = decodedToken;
            return next();
        } catch (firebaseError) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded.userId) {
                return res.status(401).json({ message: 'Fantasy auth requires a user-based session token.' });
            }

            const authUserId = String(decoded.userId);
            let user = await FantasyUser.findOne({ authUserId });

            if (!user) {
                user = await FantasyUser.create({
                    authUserId,
                    firebaseUid: null,
                    email: buildPlaceholderEmail(authUserId),
                    name: 'User',
                    username: null,
                    role: decoded.role === 'admin' ? 'admin' : 'user'
                });
            } else if (decoded.role === 'admin' && user.role !== 'admin') {
                user.role = 'admin';
                await user.save();
            }

            req.user = user;
            req.firebaseUser = null;
            req.user.tokenData = decoded;
            return next();
        }
    } catch (error) {
        console.error('Fantasy auth failed:', error.message);
        return res.status(401).json({ message: 'Invalid token' });
    }
};
