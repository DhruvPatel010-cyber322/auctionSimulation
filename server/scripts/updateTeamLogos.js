
import mongoose from 'mongoose';
import Team from '../models/Team.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const run = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        const jsonPath = path.join(__dirname, '../../ipl_teams.json');
        const rawData = fs.readFileSync(jsonPath);
        const teamsData = JSON.parse(rawData);

        for (const t of teamsData) {
            console.log(`Updating ${t.team_name}...`);
            // Match by name or some clever way if name differs slightly, but names look clean
            // Try matching by name first
            let team = await Team.findOne({ name: t.team_name });

            if (!team) {
                // Try matching by checking if DB name contains part of JSON name or vice versa?
                // Or just hardcode mapping if needed. But let's assume names match for now.
                // Actually, let's try to find by ID based on known abbreviations if names fail?
                // But names in JSON are full names like "Chennai Super Kings".
                // DB names are also full names.
                console.log(`Could not find team with name: ${t.team_name}`);
                continue;
            }

            team.logo = t.logo_url;
            await team.save();
            console.log(`Updated logo for ${team.name}`);
        }

        console.log('Done!');
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

run();
