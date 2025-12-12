# FixFlow API Documentation

This document describes all API endpoints available in the FixFlow bot server.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require API key authentication. Include the API key in the request header:

```
X-API-Key: your_api_key_here
```

---

## Health Check

### GET /api/health

Check if the server is running and healthy.

**Authentication**: None required

**Response**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

---

## Bounties

### GET /api/bounties

List all bounties with optional filtering.

**Authentication**: Required

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: PENDING, ACTIVE, CLAIMED, COMPLETED, EXPIRED, ESCALATED |
| `severity` | string | Filter by severity: CRITICAL, HIGH, MEDIUM, LOW |
| `repositoryId` | string | Filter by repository ID |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |
| `sortBy` | string | Sort field (default: createdAt) |
| `sortOrder` | string | Sort order: asc, desc (default: desc) |

**Response**
```json
{
  "data": [
    {
      "id": "clx1234567890",
      "repositoryId": "clx0987654321",
      "issueNumber": 42,
      "title": "Fix authentication timeout",
      "description": "Users experiencing timeout errors...",
      "amount": 150.00,
      "originalAmount": 75.00,
      "status": "ACTIVE",
      "severity": "HIGH",
      "workflowRunId": "12345678",
      "workflowName": "CI Tests",
      "testName": "test_oauth_flow",
      "claimedBy": null,
      "claimedAt": null,
      "claimantWallet": null,
      "completedAt": null,
      "pullRequestNumber": null,
      "expiresAt": "2024-02-15T10:30:00.000Z",
      "escalationLevel": 2,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-16T10:30:00.000Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

### GET /api/bounties/:id

Get a specific bounty by ID.

**Authentication**: Required

**Response**
```json
{
  "id": "clx1234567890",
  "repositoryId": "clx0987654321",
  "issueNumber": 42,
  "title": "Fix authentication timeout",
  "amount": 150.00,
  "status": "ACTIVE",
  "severity": "HIGH",
  "repository": {
    "id": "clx0987654321",
    "owner": "acme",
    "name": "auth-service",
    "fullName": "acme/auth-service"
  },
  "payments": [],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-16T10:30:00.000Z"
}
```

### POST /api/bounties

Create a new bounty.

**Authentication**: Required

**Request Body**
```json
{
  "repositoryId": "clx0987654321",
  "title": "Fix failing test",
  "description": "The test_login test is failing",
  "amount": 75.00,
  "severity": "MEDIUM",
  "workflowRunId": "12345678",
  "workflowName": "CI Tests",
  "testName": "test_login"
}
```

**Response**
```json
{
  "id": "clx1234567890",
  "status": "PENDING",
  "issueNumber": 42,
  "message": "Bounty created successfully"
}
```

### PATCH /api/bounties/:id

Update a bounty.

**Authentication**: Required

**Request Body**
```json
{
  "amount": 100.00,
  "severity": "HIGH"
}
```

### POST /api/bounties/:id/claim

Claim a bounty.

**Authentication**: Required

**Request Body**
```json
{
  "claimedBy": "username",
  "walletAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
}
```

**Response**
```json
{
  "success": true,
  "message": "Bounty claimed successfully",
  "bounty": {
    "id": "clx1234567890",
    "status": "CLAIMED",
    "claimedBy": "username",
    "claimedAt": "2024-01-16T10:30:00.000Z"
  }
}
```

### POST /api/bounties/:id/complete

Mark a bounty as complete and trigger payment.

**Authentication**: Required

**Request Body**
```json
{
  "pullRequestNumber": 123
}
```

**Response**
```json
{
  "success": true,
  "message": "Bounty completed, payment initiated",
  "payment": {
    "id": "clxpay123456",
    "amount": 150.00,
    "status": "PROCESSING"
  }
}
```

### POST /api/bounties/:id/cancel

Cancel a bounty.

**Authentication**: Required

**Response**
```json
{
  "success": true,
  "message": "Bounty cancelled"
}
```

---

## Repositories

### GET /api/repositories

List all registered repositories.

**Authentication**: Required

**Response**
```json
{
  "data": [
    {
      "id": "clx0987654321",
      "owner": "acme",
      "name": "auth-service",
      "fullName": "acme/auth-service",
      "installationId": 12345678,
      "walletAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      "defaultBountyAmount": 75.00,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "_count": {
        "bounties": 24
      }
    }
  ]
}
```

### GET /api/repositories/:id

Get a specific repository.

**Authentication**: Required

### PATCH /api/repositories/:id

Update repository settings.

**Authentication**: Required

**Request Body**
```json
{
  "walletAddress": "new_wallet_address",
  "defaultBountyAmount": 100.00,
  "isActive": true
}
```

### GET /api/repositories/:id/bounties

Get bounties for a specific repository.

**Authentication**: Required

**Query Parameters**: Same as GET /api/bounties

### GET /api/repositories/:id/balance

Get wallet balance for a repository.

**Authentication**: Required

**Response**
```json
{
  "balance": 500.00,
  "walletAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "currency": "MNEE"
}
```

---

## Payments

### GET /api/payments

List all payments.

**Authentication**: Required

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: PENDING, PROCESSING, COMPLETED, FAILED |
| `bountyId` | string | Filter by bounty ID |

**Response**
```json
{
  "data": [
    {
      "id": "clxpay123456",
      "bountyId": "clx1234567890",
      "amount": 150.00,
      "recipientWallet": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      "transactionId": "tx_abc123",
      "status": "COMPLETED",
      "createdAt": "2024-01-16T10:30:00.000Z",
      "updatedAt": "2024-01-16T10:35:00.000Z"
    }
  ]
}
```

### GET /api/payments/:id

Get a specific payment.

**Authentication**: Required

---

## Webhooks

### POST /api/webhooks/github

Handle incoming GitHub webhooks.

**Authentication**: GitHub webhook signature (X-Hub-Signature-256)

**Headers**
```
X-GitHub-Event: workflow_run | issue_comment | pull_request | installation
X-Hub-Signature-256: sha256=...
X-GitHub-Delivery: unique-delivery-id
```

**Supported Events**

| Event | Action | Description |
|-------|--------|-------------|
| `workflow_run` | `completed` | Detect test failures |
| `issue_comment` | `created` | Process /claim commands |
| `pull_request` | `closed` + merged | Verify fixes and complete bounties |
| `installation` | `created` | Register new repositories |

### POST /api/webhooks/mnee

Handle incoming MNEE payment webhooks.

**Authentication**: MNEE webhook signature

**Payload**
```json
{
  "event": "transaction.completed",
  "transactionId": "tx_abc123",
  "status": "completed",
  "amount": 150.00,
  "timestamp": "2024-01-16T10:35:00.000Z"
}
```

---

## Dashboard Stats

### GET /api/dashboard/stats

Get dashboard statistics.

**Authentication**: Required

**Response**
```json
{
  "totalBounties": 156,
  "activeBounties": 23,
  "completedBounties": 118,
  "totalPaidOut": 15420.00,
  "averageBountyAmount": 98.85,
  "averageResolutionTime": 4.2,
  "bountiesByStatus": {
    "PENDING": 5,
    "ACTIVE": 23,
    "CLAIMED": 10,
    "COMPLETED": 118
  },
  "bountiesBySeverity": {
    "CRITICAL": 12,
    "HIGH": 45,
    "MEDIUM": 78,
    "LOW": 21
  },
  "recentActivity": [
    {
      "id": "act_123",
      "type": "bounty_completed",
      "description": "Bounty #142 completed by @developer",
      "timestamp": "2024-01-16T10:30:00.000Z"
    }
  ]
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid API key |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `CONFLICT` | 409 | Resource conflict (e.g., already claimed) |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Default**: 100 requests per minute per API key
- **Webhooks**: 1000 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705402200
```

---

## Webhook Signature Verification

### GitHub Webhooks

GitHub signs webhooks using HMAC-SHA256. The signature is in the `X-Hub-Signature-256` header.

```javascript
const crypto = require('crypto');

function verifyGitHubSignature(payload, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

### MNEE Webhooks

MNEE webhooks are verified using a similar HMAC signature scheme. Refer to MNEE documentation for specifics.