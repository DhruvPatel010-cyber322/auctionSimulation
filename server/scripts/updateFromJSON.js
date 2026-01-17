import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from '../models/Player.js';
import connectDB from '../config/db.js';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: 'server/.env' });

const JSON_PATH = 'D:\\Projects\\Auction\\players_final.json';

const getRoleFromCategory = (category) => {
    switch (category) {
        case 'Batter': return 'Batsman';
        case 'WK-Batter': return 'Wicket Keeper';
        case 'Bowler': return 'Bowler';
        case 'All-Rounder': return 'All-Rounder';
        default: return category; // Fallback
    }
};

const updatePlayers = async () => {
    try {
        if (!fs.existsSync(JSON_PATH)) {
            console.error(`❌ JSON file not found at: ${JSON_PATH}`);
            process.exit(1);
        }

        const rawData = fs.readFileSync(JSON_PATH, 'utf-8');
        const updates = JSON.parse(rawData);

        await connectDB();
        console.log('✅ Connected to DB');
        console.log(`🔍 Processing ${updates.length} updates...`);

        let updatedCount = 0;
        let notFoundCount = 0;
        let errorCount = 0;

        for (const update of updates) {
            try {
                const player = await Player.findOne({ name: update.name });

                if (!player) {
                    notFoundCount++;
                    continue;
                }

                let hasChanges = false;

                // 1. Fix Role (Category -> Role)
                if (update.category) {
                    const validRole = getRoleFromCategory(update.category);
                    if (player.role !== validRole) {
                        player.role = validRole;
                        hasChanges = true;
                    }
                }

                // 2. Update Base Price
                if (update.basePrice !== null && update.basePrice !== undefined) {
                    // JSON has Lakhs (e.g., 30, 200). DB wants Crores (e.g., 0.3, 2.0).
                    // 100 Lakhs = 1 Crore.
                    const newBasePrice = update.basePrice / 100;
                    if (player.basePrice !== newBasePrice) {
                        player.basePrice = newBasePrice;
                        hasChanges = true;
                    }
                } else if (!player.basePrice) {
                    // Default to 0.2 Cr (20 Lakhs) as valid fallback
                    player.basePrice = 0.2;
                    hasChanges = true;
                }

                // 3. Update Image
                if (update.image) {
                    if (player.image !== update.image) {
                        player.image = update.image;
                        hasChanges = true;
                    }
                }

                if (hasChanges) {
                    await player.save();
                    updatedCount++;
                }

            } catch (err) {
                console.error(`❌ Error updating ${update.name}:`, err.message);
                errorCount++;
            }
        }

        console.log('--------------------------------------------------');
        console.log(`✅ Update Complete.`);
        console.log(`📝 Updated: ${updatedCount}`);
        console.log(`⚠️ Not Found: ${notFoundCount}`);
        console.log(`❌ Errors: ${errorCount}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal Error:', error);
        process.exit(1);
    }
};

updatePlayers();
