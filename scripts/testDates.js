import { mongoose } from 'mongoose';
import { getDream11Connection } from '../server/config/dream11Db.js';
import getFantasyMatchModel from '../server/models/FantasyMatch.js';

async function test() {
    try {
        const FantasyMatch = await getFantasyMatchModel();
        const matches = await FantasyMatch.find().limit(5).lean();
        console.log("MATCHES DATES: ", matches.map(m => ({date: m.date, time: m.time, status: m.status})));
    } catch (err) {
        console.error("Error", err);
    } finally {
        mongoose.disconnect();
    }
}
test();
