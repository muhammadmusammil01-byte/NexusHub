# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe",
  "role": "Student",
  "center_id": "uuid-optional"
}
```

**Roles:** `SysAdmin`, `CenterAdmin`, `Mentor`, `Student`

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "Student",
    "center_id": null
  },
  "token": "jwt-token"
}
```

---

### Login
**POST** `/auth/login`

Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "Student",
    "center_id": null
  },
  "token": "jwt-token"
}
```

---

### Get Current User
**GET** `/auth/me`

Get currently authenticated user details.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "Student",
    "center_id": null
  }
}
```

---

## Marketplace Endpoints

### List Projects
**GET** `/marketplace`

Get all published projects with optional filters.

**Query Parameters:**
- `search` (string): Search in title and description
- `technology` (string): Filter by technology stack
- `min_price` (number): Minimum price
- `max_price` (number): Maximum price

**Example:**
```
GET /api/marketplace?search=react&technology=React&min_price=100
```

**Response (200):**
```json
{
  "projects": [
    {
      "id": "uuid",
      "title": "E-commerce Platform",
      "description": "Full-featured online store",
      "technology_stack": ["React", "Node.js", "MongoDB"],
      "price": "499.99",
      "center_name": "Demo Training Center",
      "views_count": 42,
      "review_count": "5",
      "avg_rating": "4.5"
    }
  ]
}
```

---

### Get Project Details
**GET** `/marketplace/:projectId`

Get detailed information about a specific project.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "project": {
    "id": "uuid",
    "title": "E-commerce Platform",
    "description": "Full-featured online store",
    "technology_stack": ["React", "Node.js", "MongoDB"],
    "price": "499.99",
    "center_name": "Demo Training Center",
    "views_count": 43,
    "dynamic_watermark": "John Doe - 2024-12-29T12:00:00.000Z - abc123"
  }
}
```

---

### Create Project
**POST** `/marketplace`

Create a new project (CenterAdmin/Mentor only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "E-commerce Platform",
  "description": "Full-featured online store with cart, checkout, and payment",
  "technology_stack": ["React", "Node.js", "MongoDB"],
  "price": 499.99,
  "thumbnail_url": "https://example.com/thumb.jpg",
  "demo_video_url": "https://example.com/demo.mp4"
}
```

**Response (201):**
```json
{
  "message": "Project created successfully",
  "project": {
    "id": "uuid",
    "title": "E-commerce Platform",
    "is_published": false,
    ...
  }
}
```

---

### Publish Project
**PATCH** `/marketplace/:projectId/publish`

Publish a project to marketplace (CenterAdmin only).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Project published successfully",
  "project": {
    "id": "uuid",
    "is_published": true,
    ...
  }
}
```

---

### Add Review
**POST** `/marketplace/:projectId/reviews`

Add a review to a project.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excellent project with great documentation!"
}
```

**Response (201):**
```json
{
  "message": "Review added successfully",
  "review": {
    "id": "uuid",
    "rating": 5,
    "comment": "Excellent project with great documentation!",
    "created_at": "2024-12-29T12:00:00.000Z"
  }
}
```

---

## Escrow Endpoints

### Create Escrow Transaction
**POST** `/escrow/create`

Purchase a project (Student only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "project_id": "uuid",
  "payment_method": "card",
  "transaction_ref": "TXN-123456"
}
```

**Response (201):**
```json
{
  "message": "Escrow transaction created. Funds are held until certificate is issued.",
  "transaction": {
    "id": "uuid",
    "project_id": "uuid",
    "buyer_id": "uuid",
    "amount": "499.99",
    "status": "held",
    "created_at": "2024-12-29T12:00:00.000Z"
  }
}
```

---

### Get My Transactions
**GET** `/escrow/my-transactions`

Get all transactions for current user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "project_title": "E-commerce Platform",
      "amount": "499.99",
      "status": "held",
      "center_name": "Demo Training Center",
      "created_at": "2024-12-29T12:00:00.000Z"
    }
  ]
}
```

---

### Release Funds
**POST** `/escrow/:transactionId/release`

Release escrow funds and issue certificate (CenterAdmin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "certificate_code": "CERT-2024-ABC123",
  "qr_data": "{\"code\":\"CERT-2024-ABC123\"}"
}
```

**Response (200):**
```json
{
  "message": "Funds released successfully. Certificate issued.",
  "certificate": {
    "id": "uuid",
    "certificate_code": "CERT-2024-ABC123",
    "issue_date": "2024-12-29T12:00:00.000Z"
  }
}
```

---

### Refund Transaction
**POST** `/escrow/:transactionId/refund`

Refund an escrow transaction (SysAdmin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "notes": "Refund requested by student"
}
```

**Response (200):**
```json
{
  "message": "Transaction refunded successfully",
  "transaction": {
    "id": "uuid",
    "status": "refunded",
    "notes": "Refund requested by student"
  }
}
```

---

## Certificate Endpoints

### Generate Certificate
**POST** `/certificates/generate`

Generate a new certificate with QR code.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "transaction_id": "uuid",
  "student_id": "uuid",
  "project_id": "uuid"
}
```

**Response (201):**
```json
{
  "message": "Certificate generated successfully",
  "certificate": {
    "id": "uuid",
    "certificate_code": "CERT-2024-ABC123",
    "qr_data": "{...}",
    "issue_date": "2024-12-29T12:00:00.000Z"
  },
  "qr_code": "data:image/png;base64,..."
}
```

---

### Verify Certificate
**GET** `/certificates/verify/:code`

Verify a certificate by its code (public endpoint).

**Response (200):**
```json
{
  "verified": true,
  "certificate": {
    "certificate_code": "CERT-2024-ABC123",
    "student_name": "John Doe",
    "project_title": "E-commerce Platform",
    "center_name": "Demo Training Center",
    "issue_date": "2024-12-29T12:00:00.000Z"
  }
}
```

---

### Get My Certificates
**GET** `/certificates/my-certificates`

Get all certificates for current user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "certificates": [
    {
      "id": "uuid",
      "certificate_code": "CERT-2024-ABC123",
      "project_title": "E-commerce Platform",
      "center_name": "Demo Training Center",
      "issue_date": "2024-12-29T12:00:00.000Z"
    }
  ]
}
```

---

## Virtual Lab Endpoints

### Start Lab Session
**POST** `/lab/start`

Start a new virtual lab session (Mentor/CenterAdmin).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "mentor_id": "uuid",
  "student_id": "uuid",
  "project_id": "uuid-optional"
}
```

**Response (201):**
```json
{
  "message": "Lab session started",
  "session": {
    "id": "uuid",
    "session_code": "LAB-2024-ABC123",
    "status": "active",
    "started_at": "2024-12-29T12:00:00.000Z"
  }
}
```

---

### End Lab Session
**POST** `/lab/:sessionId/end`

End an active lab session.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Lab session ended",
  "session": {
    "id": "uuid",
    "status": "completed",
    "ended_at": "2024-12-29T13:00:00.000Z"
  }
}
```

---

## Socket.io Events

### Client → Server Events

#### `join-lab`
Join a virtual lab session.
```javascript
socket.emit('join-lab', {
  sessionCode: 'LAB-2024-ABC123',
  userRole: 'Student',
  userId: 'uuid'
});
```

#### `code-update`
Sync code changes.
```javascript
socket.emit('code-update', {
  sessionCode: 'LAB-2024-ABC123',
  code: 'console.log("Hello");',
  language: 'javascript',
  userId: 'uuid'
});
```

#### `debug-request`
Request AI debugging assistance.
```javascript
socket.emit('debug-request', {
  sessionCode: 'LAB-2024-ABC123',
  errorMessage: 'TypeError: undefined is not a function',
  codeSnippet: 'code...',
  language: 'javascript',
  userId: 'uuid'
});
```

#### `code-suggestion-request`
Request AI code generation.
```javascript
socket.emit('code-suggestion-request', {
  description: 'Create a function to sort array',
  language: 'javascript'
});
```

#### `leave-lab`
Leave the lab session.
```javascript
socket.emit('leave-lab', {
  sessionCode: 'LAB-2024-ABC123'
});
```

---

### Server → Client Events

#### `joined-lab`
Confirmation of joining lab session.
```javascript
socket.on('joined-lab', (data) => {
  // data: { sessionCode, currentCode, language }
});
```

#### `code-mirrored`
Real-time code sync from other participants.
```javascript
socket.on('code-mirrored', (data) => {
  // data: { code, language }
});
```

#### `debug-response`
AI debugging results.
```javascript
socket.on('debug-response', (data) => {
  // data: { cause, fix, bestPractices }
});
```

#### `code-suggestion-response`
AI code generation results.
```javascript
socket.on('code-suggestion-response', (data) => {
  // data: { suggestion }
});
```

#### `participant-joined`
Notification of new participant.
```javascript
socket.on('participant-joined', (data) => {
  // data: { userRole }
});
```

#### `participant-left`
Notification of participant leaving.
```javascript
socket.on('participant-left', () => {});
```

#### `error`
Error notification.
```javascript
socket.on('error', (data) => {
  // data: { message }
});
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied. Insufficient permissions."
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

---

## Rate Limiting

Currently not implemented but recommended for production:
- 100 requests per 15 minutes per IP
- 1000 requests per hour per authenticated user

---

## Best Practices

1. **Always validate JWT tokens** on the client side before making requests
2. **Handle token expiration** gracefully and refresh or re-login
3. **Use HTTPS** in production
4. **Don't expose sensitive data** in error messages
5. **Implement request timeouts** on the client side
6. **Cache responses** where appropriate
7. **Use pagination** for large datasets (to be implemented)

---

## Support

For API questions or issues:
- Email: support@nexushub.com
- GitHub Issues: [Project Repository]
