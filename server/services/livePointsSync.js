/**
 * livePointsSync.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Background service that polls the external fantasy points API and updates
 * the Player collection (auction_v2 DB) every 5 minutes during a live match.
 *
 * FLOW:
 *   1. On startup → GET /match from external API
 *   2. Check if today (IST) matches the match's start_time date
 *   3. Schedule a setTimeout to fire AT start_time
 *   4. Every 5 minutes: GET /points?match_id=X
 *   5. Normalize player names → match against Player collection
 *   6. Respect isInPlaying11, isCaptain, isViceCaptain flags
 *   7. $set Player.points (override, not accumulate)
 *   8. Auto-stop 4h 30min after start_time
 */

import Player from '../models/Player.js';
import getFantasyPlayerModel from '../models/FantasyPlayer.js';
import getFantasyMatchModel from '../models/FantasyMatch.js';

const EXTERNAL_API_BASE = 'https://a-bhavy-bot-bbheroku-5f1b58e25c41.herokuapp.com';
const POLL_INTERVAL_MS  = 2 * 60 * 1000; // 2 minutes
const MATCH_DURATION_MS = (4 * 60 + 30) * 60 * 1000; // 4h 30min

// ── In-memory state (exported for /live-status endpoint) ─────────────────────
const state = {
    isLive:      false,
    matchId:     null,
    matchName:   null,
    startTime:   null,
    lastUpdatedAt: null,
    pollTimer:   null,
    stopTimer:   null
};

export const getSyncState = () => ({
    isLive:       state.isLive,
    matchId:      state.matchId,
    matchName:    state.matchName,
    startTime:    state.startTime,
    lastUpdatedAt: state.lastUpdatedAt
});


// ── Helpers ───────────────────────────────────────────────────────────────────

/** Strip role/status suffixes the API appends to player names */
function normalizeApiName(raw) {
    if (!raw) return '';
    return raw
        .replace(/\s*\((c|wk|ip|rp|impact\s*player)\)\s*/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Fuzzy name match — same strategy as masterScript.js findDbPlayer()
 * exact → dbName contains apiName → apiName contains dbName
 */
function fuzzyMatch(dbName, apiName) {
    const db  = dbName.toLowerCase().trim();
    const api = apiName.toLowerCase().trim();
    if (db === api)             return true;
    if (db.includes(api))       return true;
    if (api.includes(db))       return true;
    return false;
}


// ── Core poll tick ────────────────────────────────────────────────────────────

async function pollAndUpdate() {
    const tag = '[LiveSync]';
    try {
        // 1. Fetch points from external API
        const res = await fetch(
            `${EXTERNAL_API_BASE}/points?match_id=${state.matchId}`
        );
        if (!res.ok) {
            console.warn(`${tag} /points responded ${res.status} — skipping tick`);
            return;
        }
        const json = await res.json();
        const apiPlayers = json?.data;
        if (!Array.isArray(apiPlayers) || apiPlayers.length === 0) {
            console.warn(`${tag} No player data returned for match ${state.matchId}`);
            return;
        }

        // 2. Load all players from auction_v2 and dream11 once per tick
        const dbPlayers = await Player.find({}).lean();
        const FantasyPlayer = await getFantasyPlayerModel();
        const fantasyPlayers = await FantasyPlayer.find({}).lean();

        let updated  = 0;
        let skipped  = 0;
        let notFound = 0;

        // 3. Process each API player
        for (const apiPlayer of apiPlayers) {
            const normalizedName = normalizeApiName(apiPlayer.player);
            const basePoints = Number(apiPlayer.total) || 0;

            // --- 1. Update FANTASY module (dream11 DB) ---
            const dbFantasyPlayer = fantasyPlayers.find(p => fuzzyMatch(p.name, normalizedName));
            if (dbFantasyPlayer) {
                await FantasyPlayer.findByIdAndUpdate(dbFantasyPlayer._id, {
                    $set: { points: basePoints }
                });
            }

            // --- 2. Update AUCTION module (auction_v2 DB) ---
            // Find matching DB player (fuzzy)
            const dbPlayer = dbPlayers.find(p => fuzzyMatch(p.name, normalizedName));

            if (!dbPlayer) {
                notFound++;
                continue;
            }

            // Check isInPlaying11 — skip if not in XI
            if (!dbPlayer.isInPlaying11) {
                skipped++;
                continue;
            }

            // Apply C/VC multiplier
            let finalPoints  = basePoints;

            if (dbPlayer.isCaptain)     finalPoints = basePoints * 2;
            else if (dbPlayer.isViceCaptain) finalPoints = basePoints * 1.5;

            // Override points ($set — not accumulate)
            await Player.findByIdAndUpdate(dbPlayer._id, {
                $set: { points: Number(finalPoints.toFixed(2)) }
            });

            updated++;
        }

        state.lastUpdatedAt = new Date().toISOString();
        console.log(
            `${tag} Tick | Updated: ${updated} | Benched/Skipped: ${skipped} | Not found: ${notFound} | ${state.lastUpdatedAt}`
        );

    } catch (err) {
        console.error(`[LiveSync] Poll error:`, err.message);
    }
}


// ── Scheduler ─────────────────────────────────────────────────────────────────

async function startPolling() {
    console.log(`[LiveSync] ▶ Polling started for match ${state.matchId} every ${POLL_INTERVAL_MS / 60000} min`);
    state.isLive = true;

    try {
        const FantasyMatch = await getFantasyMatchModel();
        await FantasyMatch.findOneAndUpdate(
            { legacyMatchId: String(state.matchId) },
            { $set: { status: 'Live' } }
        );
    } catch (e) {
        console.warn('[LiveSync] Failed to mark match as Live in DB', e.message);
    }

    // Immediate first fetch
    pollAndUpdate();

    // Recurring interval
    state.pollTimer = setInterval(pollAndUpdate, POLL_INTERVAL_MS);

    // Auto-stop after match window
    state.stopTimer = setTimeout(() => {
        console.log('[LiveSync] ■ Match window ended — stopping sync');
        stopPolling();
    }, MATCH_DURATION_MS);
}

async function stopPolling() {
    state.isLive = false;
    if (state.pollTimer) { clearInterval(state.pollTimer); state.pollTimer = null; }
    if (state.stopTimer) { clearTimeout(state.stopTimer);  state.stopTimer = null; }

    try {
        if (state.matchId) {
            const FantasyMatch = await getFantasyMatchModel();
            await FantasyMatch.findOneAndUpdate(
                { legacyMatchId: String(state.matchId) },
                { $set: { status: 'Completed' } }
            );
        }
    } catch (e) {
        console.warn('[LiveSync] Failed to mark match as Completed in DB', e.message);
    }
}


// ── Entry point ───────────────────────────────────────────────────────────────

export async function startLivePointsSync() {
    try {
        console.log('[LiveSync] Initialising — fetching today\'s match from external API...');

        const res = await fetch(`${EXTERNAL_API_BASE}/match`);
        if (!res.ok) {
            console.warn(`[LiveSync] /match responded ${res.status} — sync disabled`);
            return;
        }
        const matchData = await res.json();

        const { match_id, match_name, start_time, is_active } = matchData;
        if (!match_id || !start_time) {
            console.warn('[LiveSync] No match_id or start_time returned — sync disabled');
            return;
        }

        // Parse start_time (IST ISO string e.g. "2026-03-29T19:30:00+05:30")
        const matchStart = new Date(start_time);
        const matchEnd   = new Date(matchStart.getTime() + MATCH_DURATION_MS);
        const now        = new Date();

        // Check if the match is today (IST date comparison)
        const todayIST = new Date(
            now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
        );
        const matchDayIST = new Date(
            matchStart.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
        );

        const sameDay =
            todayIST.getFullYear() === matchDayIST.getFullYear() &&
            todayIST.getMonth()    === matchDayIST.getMonth()    &&
            todayIST.getDate()     === matchDayIST.getDate();

        if (!sameDay) {
            console.log(
                `[LiveSync] Today's match (${match_name}) is not today — sync will not run`
            );
            return;
        }

        // Store match info in state
        state.matchId   = String(match_id);
        state.matchName = match_name;
        state.startTime = start_time;

        console.log(`[LiveSync] Today's match: ${match_name} (id=${match_id})`);
        console.log(`[LiveSync] Start time: ${matchStart.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);

        // If already past start time but still within match window, start immediately
        if (now >= matchStart && now < matchEnd) {
            console.log('[LiveSync] Match is LIVE now — starting poll immediately');
            startPolling();
            return;
        }

        // If match is already over
        if (now >= matchEnd) {
            console.log('[LiveSync] Match already completed today — sync not needed');
            return;
        }

        // Schedule to start at match time
        const msUntilStart = matchStart.getTime() - now.getTime();
        console.log(`[LiveSync] Scheduled to start in ${Math.round(msUntilStart / 60000)} minutes`);

        setTimeout(() => {
            console.log('[LiveSync] ⏰ Match start time reached — beginning sync');
            startPolling();
        }, msUntilStart);

    } catch (err) {
        console.error('[LiveSync] Init failed:', err.message);
    }
}
