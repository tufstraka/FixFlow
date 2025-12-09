const mongoose = require('mongoose');

const bountySchema = new mongoose.Schema({
  bountyId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  repository: {
    type: String,
    required: true,
    index: true
  },
  issueId: {
    type: Number,
    required: true
  },
  issueUrl: {
    type: String,
    required: true
  },
  initialAmount: {
    type: Number,
    required: true
  },
  currentAmount: {
    type: Number,
    required: true
  },
  maxAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'claimed', 'cancelled', 'expired'],
    default: 'active',
    index: true
  },
  solver: {
    type: String,
    default: null
  },
  claimedAmount: {
    type: Number,
    default: null
  },
  transactionHash: {
    type: String,
    required: true
  },
  claimTransactionHash: {
    type: String,
    default: null
  },
  blockNumber: {
    type: Number,
    required: true
  },
  pullRequestUrl: {
    type: String,
    default: null
  },
  escalationCount: {
    type: Number,
    default: 0
  },
  lastEscalation: {
    type: Date,
    default: null
  },
  metadata: {
    workflowRunId: String,
    commit: String,
    errorSummary: String,
    testType: String,
    severity: String
  },
  claimedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for repository + status queries
bountySchema.index({ repository: 1, status: 1, createdAt: -1 });

// Index for escalation queries
bountySchema.index({ status: 1, lastEscalation: 1 });

// Virtual for time since creation (in hours)
bountySchema.virtual('hoursElapsed').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

// Method to check if eligible for escalation
bountySchema.methods.isEligibleForEscalation = function() {
  if (this.status !== 'active') return false;
  if (this.currentAmount >= this.maxAmount) return false;
  
  const hoursElapsed = this.hoursElapsed;
  const lastEscalationHours = this.lastEscalation 
    ? Math.floor((Date.now() - this.lastEscalation) / (1000 * 60 * 60))
    : hoursElapsed;
  
  // Default escalation schedule
  const escalationSchedule = [24, 72, 168]; // 1 day, 3 days, 1 week
  
  // Check if we've passed any threshold since last escalation
  for (const threshold of escalationSchedule) {
    if (hoursElapsed >= threshold && lastEscalationHours >= 24) {
      return true;
    }
  }
  
  return false;
};

// Method to format for API response
bountySchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.hoursElapsed = this.hoursElapsed;
  obj.isEligibleForEscalation = this.isEligibleForEscalation();
  return obj;
};

const Bounty = mongoose.model('Bounty', bountySchema);

module.exports = Bounty;