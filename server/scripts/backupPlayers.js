import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from '../models/Player.js';
import connectDB from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: 'server/.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupPlayers = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to DB');

        const players = await Player.find({});
        console.log(`📦 Found ${players.length} players to backup.`);

        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
        const backupPath = path.join(__dirname, '..', 'data', `players_backup_${timestamp}.json`);

        fs.writeFileSync(backupPath, JSON.stringify(players, null, 2));
        console.log(`✅ Backup saved to: ${backupPath}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error during backup:', error);
        process.exit(1);
    }
};

backupPlayers();
