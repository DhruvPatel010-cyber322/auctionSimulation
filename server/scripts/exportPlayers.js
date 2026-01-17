import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import Player from '../models/Player.js';
import connectDB from '../config/db.js';

dotenv.config({ path: 'server/.env' });

const exportPlayers = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to DB');

        const players = await Player.find({}).sort({ srNo: 1 });

        if (players.length === 0) {
            console.log('⚠️ No players found to export.');
            process.exit(0);
        }

        const headers = ['SrNo', 'Name', 'Role', 'Country', 'Base Price (Cr)', 'Status', 'Sold Price', 'Sold To', 'Image', 'Is Overseas'];

        const csvRows = players.map(p => {
            return [
                p.srNo,
                `"${p.name}"`, // Quote name to handle commas etc
                p.role,
                p.country,
                p.basePrice,
                p.status,
                p.soldPrice || '',
                p.soldToTeam || '',
                p.image || '',
                p.isOverseas ? 'Yes' : 'No'
            ].join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');

        const outputPath = 'players_export.csv';
        fs.writeFileSync(outputPath, csvContent);

        console.log(`✅ Successfully exported ${players.length} players to ${outputPath}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

exportPlayers();
