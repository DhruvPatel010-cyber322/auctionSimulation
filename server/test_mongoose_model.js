import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TournamentUser from './models/TournamentUser.js';
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        try {
            // Try to find using Strings with the Mongoose Model (which auto-casts)
            const stringPayload = {
                tournament: "69a2b2ba532487310905ecab",
                user: "69a2b283532487310905ec0d"
            };
            console.log("Mongoose Model Querying with Strings:", stringPayload);
            const res = await TournamentUser.findOne(stringPayload);
            console.log("Result purely string through Model:", res ? "FOUND" : "NOT FOUND");

            // Now what if we pass an invalid user ID length (like the username 'dhruv')
            try {
                const badPayload = {
                    tournament: "69a2b2ba532487310905ecab",
                    user: "dhruv"
                };
                console.log("Querying with bad string:", badPayload);
                await TournamentUser.findOne(badPayload);
            } catch (err) {
                console.log("CAUGHT ERROR:", err.message);
            }

            process.exit(0);
        } catch (e) {
            console.error("Error:", e);
            process.exit(1);
        }
    });
