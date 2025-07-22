# API Documentation

## Base URL
```
Development: http://localhost:3001
Production: https://api.landregistry.com
```

## Authentication

### Login with MetaMask
```http
POST /auth
Content-Type: application/json

{
    "address": "0x...",
    "signature": "0x...",
    "message": "Login message with timestamp"
}
```

Response:
```json
{
    "token": "jwt_token",
    "user": {
        "address": "0x...",
        "roles": ["USER", "AGENT", "ADMIN"]
    }
}
```

### Validate Token
```http
GET /auth/validate
Authorization: Bearer jwt_token
```

Response:
```json
{
    "valid": true,
    "user": {
        "address": "0x...",
        "roles": ["USER", "AGENT", "ADMIN"]
    }
}
```

## Property Management

### Get Properties List
```http
GET /api/properties
Authorization: Bearer jwt_token
Query Parameters:
- owner: Filter by owner address
- agent: Filter by agent address
- status: Filter by status (ACTIVE, EXPIRED, etc.)
```

Response:
```json
{
    "properties": [
        {
            "folioNumber": "NSW-123",
            "owner": "0x...",
            "status": "ACTIVE",
            "expiryDate": "2024-12-31",
            "documents": {
                "deed": "QmHash1",
                "survey": "QmHash2",
                "photos": ["QmHash3", "QmHash4"]
            }
        }
    ]
}
```

### Get Property Details
```http
GET /api/properties/:folioNumber
Authorization: Bearer jwt_token
```

Response:
```json
{
    "folioNumber": "NSW-123",
    "owner": "0x...",
    "status": "ACTIVE",
    "expiryDate": "2024-12-31",
    "documents": {
        "deed": "QmHash1",
        "survey": "QmHash2",
        "photos": ["QmHash3", "QmHash4"]
    },
    "authorizedAgents": ["0x...", "0x..."],
    "history": [
        {
            "type": "REGISTRATION",
            "timestamp": "2023-01-01T00:00:00Z",
            "actor": "0x..."
        }
    ]
}
```

### Register Property
```http
POST /api/properties
Authorization: Bearer jwt_token
Content-Type: application/json

{
    "folioNumber": "NSW-123",
    "owner": "0x...",
    "documents": {
        "deed": "QmHash1",
        "survey": "QmHash2",
        "photos": ["QmHash3", "QmHash4"]
    },
    "expiryDate": "2024-12-31"
}
```

Response:
```json
{
    "success": true,
    "property": {
        "folioNumber": "NSW-123",
        "owner": "0x...",
        "status": "ACTIVE",
        "expiryDate": "2024-12-31"
    },
    "transactionHash": "0x..."
}
```

## Agent Management

### Authorize Agent
```http
POST /api/properties/authorize
Authorization: Bearer jwt_token
Content-Type: application/json

{
    "folioNumber": "NSW-123",
    "agentAddress": "0x..."
}
```

Response:
```json
{
    "success": true,
    "authorization": {
        "folioNumber": "NSW-123",
        "agent": "0x...",
        "timestamp": "2023-01-01T00:00:00Z"
    },
    "transactionHash": "0x..."
}
```

### Revoke Agent
```http
DELETE /api/properties/:folioNumber/agents/:agentAddress
Authorization: Bearer jwt_token
```

Response:
```json
{
    "success": true,
    "transactionHash": "0x..."
}
```

## Renewal Management

### Create Renewal Request
```http
POST /api/renewals
Authorization: Bearer jwt_token
Content-Type: application/json

{
    "folioNumber": "NSW-123",
    "period": 12,
    "documents": {
        "application": "QmHash1",
        "supporting": ["QmHash2", "QmHash3"]
    }
}
```

Response:
```json
{
    "success": true,
    "request": {
        "id": 1,
        "folioNumber": "NSW-123",
        "status": "PENDING",
        "requestDate": "2023-01-01T00:00:00Z"
    },
    "transactionHash": "0x..."
}
```

### Get Renewal Requests
```http
GET /api/renewals
Authorization: Bearer jwt_token
Query Parameters:
- status: Filter by status (PENDING, APPROVED, REJECTED)
- agent: Filter by agent address
- property: Filter by folio number
```

Response:
```json
{
    "renewals": [
        {
            "id": 1,
            "folioNumber": "NSW-123",
            "status": "PENDING",
            "requestDate": "2023-01-01T00:00:00Z",
            "documents": {
                "application": "QmHash1",
                "supporting": ["QmHash2", "QmHash3"]
            }
        }
    ]
}
```

## Transfer Management

### Create Transfer Request
```http
POST /api/transfers
Authorization: Bearer jwt_token
Content-Type: application/json

{
    "folioNumber": "NSW-123",
    "newOwner": "0x...",
    "documents": {
        "agreement": "QmHash1",
        "supporting": ["QmHash2", "QmHash3"]
    }
}
```

Response:
```json
{
    "success": true,
    "request": {
        "id": 1,
        "folioNumber": "NSW-123",
        "status": "PENDING",
        "requestDate": "2023-01-01T00:00:00Z"
    },
    "transactionHash": "0x..."
}
```

### Get Transfer Requests
```http
GET /api/transfers
Authorization: Bearer jwt_token
Query Parameters:
- status: Filter by status (PENDING, APPROVED, REJECTED)
- agent: Filter by agent address
- property: Filter by folio number
```

Response:
```json
{
    "transfers": [
        {
            "id": 1,
            "folioNumber": "NSW-123",
            "currentOwner": "0x...",
            "newOwner": "0x...",
            "status": "PENDING",
            "requestDate": "2023-01-01T00:00:00Z",
            "documents": {
                "agreement": "QmHash1",
                "supporting": ["QmHash2", "QmHash3"]
            }
        }
    ]
}
```

## Admin Operations

### Get System Statistics
```http
GET /api/admin/stats
Authorization: Bearer jwt_token
```

Response:
```json
{
    "totalProperties": 100,
    "activeProperties": 95,
    "pendingRenewals": 5,
    "pendingTransfers": 3,
    "totalUsers": 50,
    "totalAgents": 10,
    "totalTransactions": 1000
}
```

### Get Activity Log
```http
GET /api/admin/activities
Authorization: Bearer jwt_token
Query Parameters:
- type: Filter by activity type
- from: Start date
- to: End date
- actor: Filter by actor address
```

Response:
```json
{
    "activities": [
        {
            "id": 1,
            "type": "PROPERTY_REGISTRATION",
            "folioNumber": "NSW-123",
            "actor": "0x...",
            "timestamp": "2023-01-01T00:00:00Z",
            "details": {
                "owner": "0x...",
                "documents": ["QmHash1", "QmHash2"]
            }
        }
    ]
}
```

## IPFS Operations

### Upload File
```http
POST /api/ipfs/upload
Authorization: Bearer jwt_token
Content-Type: multipart/form-data

file: <file_data>
```

Response:
```json
{
    "success": true,
    "cid": "QmHash",
    "size": 1234,
    "mimeType": "application/pdf"
}
```

### Get File
```http
GET /api/ipfs/:cid
Authorization: Bearer jwt_token
```

Response: File content with appropriate Content-Type header

### Get File Metadata
```http
GET /api/ipfs/:cid/metadata
Authorization: Bearer jwt_token
```

Response:
```json
{
    "cid": "QmHash",
    "size": 1234,
    "mimeType": "application/pdf",
    "created": "2023-01-01T00:00:00Z",
    "properties": {
        "folioNumber": "NSW-123",
        "documentType": "DEED"
    }
}
```

## Error Responses

### 400 Bad Request
```json
{
    "error": "Validation Error",
    "details": {
        "field": "error message"
    }
}
```

### 401 Unauthorized
```json
{
    "error": "Authentication Error",
    "message": "Invalid token"
}
```

### 403 Forbidden
```json
{
    "error": "Authorization Error",
    "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
    "error": "Not Found",
    "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
    "error": "Internal Server Error",
    "message": "An unexpected error occurred"
}
```

## Rate Limiting

- Rate limit: 100 requests per minute per IP
- Rate limit headers included in response:
  - X-RateLimit-Limit
  - X-RateLimit-Remaining
  - X-RateLimit-Reset

## Pagination

Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 10, max: 100)

Response Headers:
- X-Total-Count: Total number of items
- Link: Pagination links (first, prev, next, last)

## Versioning

- API version included in URL: `/api/v1/`
- Current version: v1
- Version header: `Accept: application/vnd.landregistry.v1+json` 