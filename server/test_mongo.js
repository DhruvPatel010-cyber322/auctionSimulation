import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

console.log('Connecting to mongoose...');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected');
        try {
            const TU = mongoose.connection.db.collection('tournamentusers');
            const docs = await TU.find({ teamCode: { $ne: null } }).toArray();
            console.log("Documents with teamCode:", JSON.stringify(docs, null, 2));

            process.exit(0);
        } catch (e) {
            console.error("Error:", e);
            process.exit(1);
        }
    })
    .catch(e => {
        console.error('Connection error', e);
        process.exit(1);
    });
