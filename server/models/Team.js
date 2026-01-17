import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    name: {
        type: String,
        required: true
    },
    logo: {
        type: String, // Stores URL
        default: null
    },
    totalPurse: {
        type: Number,
        default: 120 // 120 Cr
    },
    remainingPurse: {
        type: Number,
        required: true
    },
    playersBought: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
    }],
    playing11: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
    }],
    squadSize: {
        type: Number,
        default: 0
    },
    overseasCount: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: false
    },
    isLoggedIn: {
        type: Boolean,
        default: false
    },
    activeSessionId: {
        type: String,
        default: null
    },
    lastLoginAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

const Team = mongoose.model('Team', teamSchema);

export default Team;
