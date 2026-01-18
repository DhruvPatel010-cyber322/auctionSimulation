import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Player from '../models/Player.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/auction_db';

const exportCsv = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);

        console.log(`Connected to DB: ${mongoose.connection.name}`);
        console.log(`Querying Collection: ${Player.collection.name}`);

        console.log('Fetching players...');
        const players = await Player.find({}).sort({ srNo: 1 });

        const headers = [
            'SrNo', 'Name', 'Country', 'Role', 'BasePrice', 'IsOverseas',
            'Status', 'SoldPrice', 'SoldToTeam', 'BattingPositionGroup', 'Set'
        ];

        let csvContent = headers.join(',') + '\n';

        players.forEach(p => {
            const row = [
                p.srNo,
                `"${p.name}"`,
                p.country,
                p.role,
                p.basePrice,
                p.isOverseas ? 'Yes' : 'No',
                p.status,
                p.soldPrice || '',
                p.soldToTeam || '',
                p.battingPositionGroup || '',
                p.set
            ];
            csvContent += row.join(',') + '\n';
        });

        const outputPath = path.join(__dirname, '../../players_export_v2.csv');
        fs.writeFileSync(outputPath, csvContent);

        console.log(`✅ Exported ${players.length} players to ${outputPath}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Export failed:', err);
        process.exit(1);
    }
};

exportCsv();
