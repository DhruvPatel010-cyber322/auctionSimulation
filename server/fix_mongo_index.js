import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        try {
            const TU = mongoose.connection.db.collection('tournamentusers');
            const indexes = await TU.indexes();
            console.log("Indexes:", JSON.stringify(indexes, null, 2));

            // Drop the old tournament_1_teamCode_1 index if it exists
            console.log("Dropping index tournament_1_teamCode_1...");
            await TU.dropIndex("tournament_1_teamCode_1").catch(e => console.log("Did not exist or already dropped"));
            console.log("Dropped!");

            process.exit(0);
        } catch (e) {
            console.error("Error:", e);
            process.exit(1);
        }
    });
