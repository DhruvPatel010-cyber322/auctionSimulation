import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TournamentUser from './models/TournamentUser.js';
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        try {
            const tournamentId = "69a2b2ba532487310905ecab";
            const userId = "69a2b283532487310905ec0d";

            const assignment = await TournamentUser.findOneAndUpdate(
                { tournament: tournamentId, user: userId },
                { $set: { teamCode: null } },
                { new: true }
            );

            console.log("Success:", assignment);
            process.exit(0);
        } catch (e) {
            console.error("Error:", e);
            process.exit(1);
        }
    });
