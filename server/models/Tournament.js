import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    accessCode: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['OPEN', 'ACTIVE', 'RUNNING', 'CLOSED', 'ARCHIVED'],
        default: 'OPEN'
    },
    selectionMode: {
        type: String,
        enum: ['USER_CHOICE', 'ADMIN_ASSIGN'],
        default: 'USER_CHOICE'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const Tournament = mongoose.model('Tournament', tournamentSchema);
export default Tournament;
