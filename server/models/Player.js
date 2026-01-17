import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
    srNo: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper', 'All-rounder'] // Covering variations just in case
    },
    basePrice: {
        type: Number,
        required: true
    },
    isOverseas: {
        type: Boolean,
        required: true,
        default: false
    },
    status: {
        type: String,
        enum: ['AVAILABLE', 'SOLD', 'UNSOLD', 'LIVE'],
        default: 'AVAILABLE'
    },
    soldPrice: {
        type: Number,
        default: null
    },
    soldToTeam: {
        type: String, // Team Code
        default: null
    },
    image: {
        type: String,
        default: null,
        trim: true
    },
    set: {
        type: Number,
        default: 1
    },
    // Future Rule Validation Field
    // 1: Openers (1-2)
    // 2: Middle Order (3-4)
    // 3: Lower Middle Order (5-7)
    // 4: Lower Order (8-11)
    battingPositionGroup: {
        type: Number,
        default: null
    }
}, {
    timestamps: true
});

const Player = mongoose.model('Player', playerSchema);

export default Player;
