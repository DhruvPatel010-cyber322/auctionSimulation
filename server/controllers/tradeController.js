import Trade from '../models/Trade.js';
import Team from '../models/Team.js';
import Player from '../models/Player.js';
import AuctionState from '../models/AuctionState.js';

const getIsTradingOpen = async () => {
    let state = await AuctionState.findOne();
    return state ? state.isTradingOpen : false;
};

export const getCompletedTrades = async (req, res) => {
    try {
        const completedProposals = await Trade.find({ status: 'ACCEPTED' })
            .populate('senderTeam', 'name code logo')
            .populate('receiverTeam', 'name code logo')
            .populate('offerPlayers', 'name basePrice soldPrice isOverseas role image')
            .populate('requestPlayers', 'name basePrice soldPrice isOverseas role image')
            .sort({ updatedAt: -1 });
            
        res.json(completedProposals);
    } catch (error) {
        console.error('Error fetching completed trades:', error);
        res.status(500).json({ message: 'Server error fetching completed trades', error: error.message });
    }
};

export const createProposal = async (req, res) => {
    try {
        const isOpen = await getIsTradingOpen();
        if (!isOpen) {
            return res.status(403).json({ message: 'Trading window is currently closed.' });
        }

        const { receiverTeamId, offerPlayerIds, requestPlayerIds } = req.body;
        const senderTeamCode = req.user.teamCode;
        
        const senderTeam = await Team.findOne({ code: senderTeamCode });
        if (!senderTeam) return res.status(404).json({ message: 'Sender team not found' });
        
        if (senderTeam._id.toString() === receiverTeamId) {
            return res.status(400).json({ message: 'Cannot trade with yourself' });
        }

        if ((!offerPlayerIds || offerPlayerIds.length === 0) && (!requestPlayerIds || requestPlayerIds.length === 0)) {
            return res.status(400).json({ message: 'Must provide at least one player to offer or request' });
        }
        
        const offerPlayers = offerPlayerIds?.length > 0 ? await Player.find({ _id: { $in: offerPlayerIds } }) : [];
        const requestPlayers = requestPlayerIds?.length > 0 ? await Player.find({ _id: { $in: requestPlayerIds } }) : [];
        
        if (offerPlayers.length !== (offerPlayerIds?.length || 0) || requestPlayers.length !== (requestPlayerIds?.length || 0)) {
            return res.status(400).json({ message: 'Some players not found' });
        }
        
        // Validate ownership
        const invalidOffer = offerPlayers.some(p => p.soldToTeam !== senderTeam.code);
        if (invalidOffer) {
            return res.status(400).json({ message: 'You do not own all the players you are offering' });
        }
        
        const receiverTeam = await Team.findById(receiverTeamId);
        if (!receiverTeam) return res.status(404).json({ message: 'Receiver team not found' });
        
        const invalidRequest = requestPlayers.some(p => p.soldToTeam !== receiverTeam.code);
        if (invalidRequest) {
            return res.status(400).json({ message: 'Requested players do not all belong to the target team' });
        }

        // --- NEW CONSTRAINTS (Prevent invalid trades from entering Pending state) ---
        // 1. Check if any involved players are ALREADY in a PENDING trade
        const allInvolvedPlayerIds = [...(offerPlayerIds || []), ...(requestPlayerIds || [])];
        const playerInPendingTrade = await Trade.findOne({
            status: 'PENDING',
            $or: [
                { offerPlayers: { $in: allInvolvedPlayerIds } },
                { requestPlayers: { $in: allInvolvedPlayerIds } }
            ]
        });

        if (playerInPendingTrade) {
            return res.status(400).json({ message: 'One or more selected players are already involved in an active pending trade proposal.' });
        }

        // 2. Validate Squad Limits & Overseas Limits pre-emptively
        const senderSizeChange = requestPlayers.length - offerPlayers.length;
        const receiverSizeChange = offerPlayers.length - requestPlayers.length;

        if (senderTeam.squadSize + senderSizeChange > 25) {
            return res.status(400).json({ message: 'Trade invalid: You would exceed the maximum squad size of 25' });
        }
        if (receiverTeam.squadSize + receiverSizeChange > 25) {
            return res.status(400).json({ message: 'Trade invalid: Target team would exceed the maximum squad size of 25' });
        }

        const offerOverseasCount = offerPlayers.filter(p => p.isOverseas).length;
        const requestOverseasCount = requestPlayers.filter(p => p.isOverseas).length;

        const senderOverseasChange = requestOverseasCount - offerOverseasCount;
        const receiverOverseasChange = offerOverseasCount - requestOverseasCount;

        if (senderTeam.overseasCount + senderOverseasChange > 8) {
             return res.status(400).json({ message: 'Trade invalid: You would exceed the maximum of 8 overseas players' });
        }
        if (receiverTeam.overseasCount + receiverOverseasChange > 8) {
             return res.status(400).json({ message: 'Trade invalid: Target team would exceed the maximum of 8 overseas players' });
        }
        // --------------------------------------------------------------------------
        
        // Exact Duplicate Check still applies just in case
        const existingTrade = await Trade.findOne({
            senderTeam: senderTeam._id,
            receiverTeam: receiverTeam._id,
            offerPlayers: { $size: offerPlayerIds.length, $all: offerPlayerIds },
            requestPlayers: { $size: requestPlayerIds.length, $all: requestPlayerIds },
            status: 'PENDING'
        });
        
        if (existingTrade) {
            return res.status(400).json({ message: 'An identical exact trade proposal is already pending' });
        }
        
        const trade = new Trade({
            senderTeam: senderTeam._id,
            receiverTeam: receiverTeam._id,
            offerPlayers: offerPlayerIds || [],
            requestPlayers: requestPlayerIds || []
        });
        
        await trade.save();
        
        res.status(201).json({ message: 'Trade proposal created successfully', trade });
    } catch (error) {
        console.error('Error creating trade proposal:', error);
        res.status(500).json({ message: 'Server error creating trade proposal', error: error.message });
    }
};

export const getProposals = async (req, res) => {
    try {
        const teamCode = req.user.teamCode;
        const team = await Team.findOne({ code: teamCode });
        
        if (!team) return res.status(404).json({ message: 'Team not found' });
        
        const sentProposals = await Trade.find({ senderTeam: team._id })
            .populate('receiverTeam', 'name code')
            .populate('offerPlayers', 'name basePrice soldPrice isOverseas role')
            .populate('requestPlayers', 'name basePrice soldPrice isOverseas role')
            .sort({ createdAt: -1 });
            
        const receivedProposals = await Trade.find({ receiverTeam: team._id })
            .populate('senderTeam', 'name code')
            .populate('offerPlayers', 'name basePrice soldPrice isOverseas role')
            .populate('requestPlayers', 'name basePrice soldPrice isOverseas role')
            .sort({ createdAt: -1 });
            
        res.json({ sent: sentProposals, received: receivedProposals });
    } catch (error) {
        console.error('Error fetching trade proposals:', error);
        res.status(500).json({ message: 'Server error fetching trade proposals', error: error.message });
    }
};

export const updateProposalStatus = async (req, res) => {
    try {
        const isOpen = await getIsTradingOpen();
        if (!isOpen) {
            return res.status(403).json({ message: 'Trading window is currently closed.' });
        }

        const { proposalId } = req.params;
        const { status } = req.body; 
        const teamCode = req.user.teamCode;
        
        if (!['ACCEPTED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        
        const currentTeam = await Team.findOne({ code: teamCode });
        if (!currentTeam) return res.status(404).json({ message: 'Team not found' });
        
        const trade = await Trade.findById(proposalId)
            .populate('senderTeam')
            .populate('receiverTeam')
            .populate('offerPlayers')
            .populate('requestPlayers');
            
        if (!trade) return res.status(404).json({ message: 'Trade proposal not found' });
        
        if (trade.status !== 'PENDING') {
            return res.status(400).json({ message: `Trade is already ${trade.status}` });
        }
        
        if (trade.receiverTeam._id.toString() !== currentTeam._id.toString()) {
            return res.status(403).json({ message: 'Only the receiving team can accept or reject this proposal' });
        }
        
        if (status === 'REJECTED') {
            trade.status = 'REJECTED';
            await trade.save();
            return res.json({ message: 'Trade rejected', trade });
        }
        
        // ACCEPTED LOGIC (0-Cost True Trading)
        const sender = trade.senderTeam;
        const receiver = trade.receiverTeam;
        const offerPlayers = trade.offerPlayers; // Array, going to receiver
        const requestPlayers = trade.requestPlayers; // Array, going to sender
        
        // Squad Size Validations
        const senderSizeChange = requestPlayers.length - offerPlayers.length;
        const receiverSizeChange = offerPlayers.length - requestPlayers.length;

        if (sender.squadSize + senderSizeChange > 25) {
            return res.status(400).json({ message: 'Trade invalid: Sender team would exceed maximum squad size of 25' });
        }
        if (receiver.squadSize + receiverSizeChange > 25) {
            return res.status(400).json({ message: 'Trade invalid: You would exceed maximum squad size of 25' });
        }

        // Overseas Validations
        const offerOverseasCount = offerPlayers.filter(p => p.isOverseas).length;
        const requestOverseasCount = requestPlayers.filter(p => p.isOverseas).length;

        const senderOverseasChange = requestOverseasCount - offerOverseasCount;
        const receiverOverseasChange = offerOverseasCount - requestOverseasCount;

        if (sender.overseasCount + senderOverseasChange > 8) {
             return res.status(400).json({ message: 'Trade invalid: Sender team would exceed maximum of 8 overseas players' });
        }
        if (receiver.overseasCount + receiverOverseasChange > 8) {
             return res.status(400).json({ message: 'Trade invalid: You would exceed maximum of 8 overseas players' });
        }

        // --- EXECUTE ---
        
        // 1. Update Players: Swap teams and set 'Traded' price flag (-1)
        const offerIds = offerPlayers.map(p => p._id.toString());
        const requestIds = requestPlayers.map(p => p._id.toString());

        for (const p of offerPlayers) {
            p.soldToTeam = receiver.code;
            p.soldPrice = -1; // -1 represents "Traded"
            await p.save();
        }
        for (const p of requestPlayers) {
            p.soldToTeam = sender.code;
            p.soldPrice = -1; // -1 represents "Traded"
            await p.save();
        }
        
        // 2. Update Sender Team (No Purse Impact)
        sender.overseasCount += senderOverseasChange;
        sender.squadSize += senderSizeChange;
        
        sender.playersBought = sender.playersBought.filter(pId => !offerIds.includes(pId.toString()));
        for (const id of requestIds) sender.playersBought.push(id);
        
        // Forcefully clear Playing XI logic due to massive roster shift
        sender.playing11 = [];
        sender.captain = null;
        sender.viceCaptain = null;
        
        // 3. Update Receiver Team (No Purse Impact)
        receiver.overseasCount += receiverOverseasChange;
        receiver.squadSize += receiverSizeChange;
        
        receiver.playersBought = receiver.playersBought.filter(pId => !requestIds.includes(pId.toString()));
        for (const id of offerIds) receiver.playersBought.push(id);
        
        // Forcefully clear Playing XI logic due to massive roster shift
        receiver.playing11 = [];
        receiver.captain = null;
        receiver.viceCaptain = null;
        
        await sender.save();
        await receiver.save();
        
        // Clear Playing XI flags on all players involved in the trade (their XI was wiped above)
        const allTradedIds = [...offerIds, ...requestIds];
        // Also clear flags for all squad members of both teams since XI was nullified
        const allAffectedPlayerIds = [
            ...sender.playersBought.map(id => id.toString()),
            ...receiver.playersBought.map(id => id.toString())
        ];
        await Player.updateMany(
            { _id: { $in: [...new Set([...allAffectedPlayerIds, ...allTradedIds])] } },
            { $set: { isInPlaying11: false, isCaptain: false, isViceCaptain: false } }
        );
        
        // 4. Mark status
        trade.status = 'ACCEPTED';
        await trade.save();
        
        // 5. Auto-reject other pending trades involving these players
        const allInvolvedIds = [...offerPlayers.map(p => p._id), ...requestPlayers.map(p => p._id)];
        
        await Trade.updateMany({
            status: 'PENDING',
            _id: { $ne: trade._id },
            $or: [
                { offerPlayers: { $in: allInvolvedIds } },
                { requestPlayers: { $in: allInvolvedIds } }
            ]
        }, { status: 'REJECTED' });
        
        res.json({ message: 'Trade completed successfully', trade });
    } catch (error) {
        console.error('Error updating trade status:', error);
        res.status(500).json({ message: 'Server error updating trade status', error: error.message });
    }
};
