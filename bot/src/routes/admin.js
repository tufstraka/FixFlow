const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const Bounty = require('../models/Bounty');
const contractService = require('../services/contract');
const mneeService = require('../services/mnee');
const escalationService = require('../services/escalation');

// Get system metrics
router.get('/metrics', async (req, res) => {
  try {
    const [
      totalBounties,
      activeBounties,
      claimedBounties,
      totalLocked,
      totalClaimed,
      walletBalance
    ] = await Promise.all([
      Bounty.countDocuments(),
      Bounty.countDocuments({ status: 'active' }),
      Bounty.countDocuments({ status: 'claimed' }),
      Bounty.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: '$currentAmount' } } }
      ]),
      Bounty.aggregate([
        { $match: { status: 'claimed' } },
        { $group: { _id: null, total: { $sum: '$claimedAmount' } } }
      ]),
      mneeService.getBalance()
    ]);

    const metrics = {
      bounties: {
        total: totalBounties,
        active: activeBounties,
        claimed: claimedBounties,
        success_rate: totalBounties > 0 ? (claimedBounties / totalBounties * 100).toFixed(2) + '%' : '0%'
      },
      tokens: {
        locked: totalLocked[0]?.total || 0,
        claimed: totalClaimed[0]?.total || 0,
        wallet_balance: walletBalance.balance,
        wallet_address: walletBalance.address
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node_version: process.version
      }
    };

    res.json(metrics);
  } catch (error) {
    logger.error('Failed to get metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Get all bounties with pagination
router.get('/bounties', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, repository } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (repository) query.repository = repository;

    const bounties = await Bounty.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Bounty.countDocuments(query);

    res.json({
      bounties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Failed to list bounties:', error);
    res.status(500).json({ error: 'Failed to list bounties' });
  }
});

// Get bounties by repository
router.get('/repositories', async (req, res) => {
  try {
    const repositories = await Bounty.aggregate([
      {
        $group: {
          _id: '$repository',
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          claimed: {
            $sum: { $cond: [{ $eq: ['$status', 'claimed'] }, 1, 0] }
          },
          totalLocked: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, '$currentAmount', 0] }
          },
          totalClaimed: {
            $sum: { $cond: [{ $eq: ['$status', 'claimed'] }, '$claimedAmount', 0] }
          }
        }
      },
      {
        $project: {
          repository: '$_id',
          _id: 0,
          total: 1,
          active: 1,
          claimed: 1,
          totalLocked: 1,
          totalClaimed: 1,
          success_rate: {
            $multiply: [
              { $divide: ['$claimed', '$total'] },
              100
            ]
          }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json(repositories);
  } catch (error) {
    logger.error('Failed to get repository stats:', error);
    res.status(500).json({ error: 'Failed to get repository stats' });
  }
});

// Get eligible bounties for escalation
router.get('/escalation/eligible', async (req, res) => {
  try {
    const eligible = await escalationService.getEligibleBounties();
    res.json(eligible);
  } catch (error) {
    logger.error('Failed to get eligible bounties:', error);
    res.status(500).json({ error: 'Failed to get eligible bounties' });
  }
});

// Manually trigger escalation check
router.post('/escalation/check', async (req, res) => {
  try {
    const result = await escalationService.checkAndEscalateBounties();
    res.json(result);
  } catch (error) {
    logger.error('Failed to run escalation check:', error);
    res.status(500).json({ error: 'Failed to run escalation check' });
  }
});

// Manually escalate a specific bounty
router.post('/bounties/:bountyId/escalate', async (req, res) => {
  try {
    const { bountyId } = req.params;
    const result = await escalationService.escalateSingleBounty(parseInt(bountyId));
    res.json(result);
  } catch (error) {
    logger.error('Failed to escalate bounty:', error);
    res.status(500).json({ error: 'Failed to escalate bounty' });
  }
});

// Get top contributors
router.get('/contributors', async (req, res) => {
  try {
    const contributors = await Bounty.aggregate([
      { $match: { status: 'claimed', solver: { $ne: null } } },
      {
        $group: {
          _id: '$solver',
          bounties_claimed: { $sum: 1 },
          total_earned: { $sum: '$claimedAmount' },
          repositories: { $addToSet: '$repository' }
        }
      },
      {
        $project: {
          solver: '$_id',
          _id: 0,
          bounties_claimed: 1,
          total_earned: 1,
          repositories_count: { $size: '$repositories' }
        }
      },
      { $sort: { total_earned: -1 } },
      { $limit: 50 }
    ]);

    res.json(contributors);
  } catch (error) {
    logger.error('Failed to get contributors:', error);
    res.status(500).json({ error: 'Failed to get contributors' });
  }
});

// Export bounty data
router.get('/export', async (req, res) => {
  try {
    const { format = 'json', status } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    const bounties = await Bounty.find(query).lean();
    
    if (format === 'csv') {
      // Generate CSV
      const csv = [
        'BountyID,Repository,IssueID,Status,InitialAmount,CurrentAmount,Solver,ClaimedAmount,CreatedAt,ClaimedAt',
        ...bounties.map(b => 
          `${b.bountyId},${b.repository},${b.issueId},${b.status},${b.initialAmount},${b.currentAmount},${b.solver || ''},${b.claimedAmount || ''},${b.createdAt},${b.claimedAt || ''}`
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=bounties.csv');
      res.send(csv);
    } else {
      res.json(bounties);
    }
  } catch (error) {
    logger.error('Failed to export bounties:', error);
    res.status(500).json({ error: 'Failed to export bounties' });
  }
});

module.exports = router;