
import firebaseAdmin from '../config/firebaseAdmin.js';
import User from '../models/User.js';

export const firebaseAuth = async (req, res, next) => {
    // 1. Get Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 2. Verify with Firebase
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
        const { uid, email, name, picture } = decodedToken;

        // 3. Find or Create User in Mongo
        // Upsert ensures we always have the latest data from Firebase
        let user = await User.findOne({ firebaseUid: uid });

        if (!user) {
            user = await User.create({
                firebaseUid: uid,
                email: email,
                name: name || 'User',
                role: email === 'dhruvpatel3768@gmail.com' ? 'admin' : 'user'
            });
        } else if (email === 'dhruvpatel3768@gmail.com' && user.role !== 'admin') {
            user.role = 'admin';
            await user.save();
        }

        // Attach to request
        req.user = user;
        req.firebaseUser = decodedToken;
        next();
    } catch (error) {
        console.error('Firebase Auth Error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
};
