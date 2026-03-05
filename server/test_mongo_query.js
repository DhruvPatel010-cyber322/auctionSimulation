import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        try {
            const TournamentUser = mongoose.connection.db.collection('tournamentusers');
            // Try to find
            const payload = {
                tournament: new mongoose.Types.ObjectId("69a2b2ba532487310905ecab"),
                user: new mongoose.Types.ObjectId("69a2b283532487310905ec0d")
            };
            console.log("Querying with ObjectIds:", payload);
            let res = await TournamentUser.findOne(payload);
            console.log("Result strictly with ObjectIds:", res ? "FOUND" : "NOT FOUND");

            // What if we query with strings? String vs ObjectId?
            const stringPayload = {
                tournament: "69a2b2ba532487310905ecab",
                user: "69a2b283532487310905ec0d"
            };
            console.log("Querying with Strings:", stringPayload);
            res = await TournamentUser.findOne(stringPayload);
            console.log("Result purely string:", res ? "FOUND" : "NOT FOUND");

            process.exit(0);
        } catch (e) {
            console.error("Error:", e);
            process.exit(1);
        }
    });
