
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Models
import Team from '../models/Team.js';
import Player from '../models/Player.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, '../../_deployment_excluded/backups');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};

const backup = async () => {
    await connectDB();

    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    try {
        console.log('Fetching Teams...');
        const teams = await Team.find({});
        fs.writeFileSync(path.join(BACKUP_DIR, `teams_backup_${timestamp}.json`), JSON.stringify(teams, null, 2));
        console.log(`Backed up ${teams.length} teams.`);

        console.log('Fetching Players...');
        const players = await Player.find({});
        fs.writeFileSync(path.join(BACKUP_DIR, `players_backup_${timestamp}.json`), JSON.stringify(players, null, 2));
        console.log(`Backed up ${players.length} players.`);

        console.log('Backup completed successfully to:', BACKUP_DIR);
    } catch (error) {
        console.error('Backup failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

backup();
