
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from '../models/Team.js';
import connectDB from '../config/db.js';

dotenv.config();

const JSON_PATH = path.resolve('../ipl_teams.json');

const updateTeamLogos = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        if (!fs.existsSync(JSON_PATH)) {
            console.error('JSON file not found at:', JSON_PATH);
            process.exit(1);
        }

        const rawData = fs.readFileSync(JSON_PATH, 'utf-8');
        const teamsData = JSON.parse(rawData);

        console.log(`Found ${teamsData.length} teams in JSON.`);

        let updatedCount = 0;

        for (const t of teamsData) {
            // Find by name (Case Insensitive Regex for safer match)
            // e.g. "Chennai Super Kings"
            const team = await Team.findOne({ name: { $regex: new RegExp(`^${t.team_name}$`, 'i') } });

            if (team) {
                team.logo = t.logo_url;
                await team.save();
                // console.log(`Updated Logo for: ${team.name}`);
                updatedCount++;
            } else {
                console.warn(`Team not found in DB: ${t.team_name}`);
            }
        }

        console.log(`\nUpdate Complete.`);
        console.log(`Updated: ${updatedCount}/${teamsData.length}`);

    } catch (error) {
        console.error('Script Error:', error);
    } finally {
        mongoose.disconnect();
        console.log('Disconnected');
    }
};

updateTeamLogos();
