
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from '../models/Team.js';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected Successfully');

        const count = await Team.countDocuments();
        console.log(`Total Teams in DB: ${count}`);

        if (count === 0) {
            console.log('WARNING: Database has 0 teams. Seeding might be required.');
        } else {
            console.log('Database seems populated.');
            // List a few to be sure
            const teams = await Team.find({}).limit(3);
            console.log('Sample Teams:', teams.map(t => t.code));
        }

        process.exit(0);
    } catch (err) {
        console.error('MongoDB Connection Failed:', err.message);
        process.exit(1);
    }
};

connectDB();
