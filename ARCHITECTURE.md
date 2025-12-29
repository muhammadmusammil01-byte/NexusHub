# NexusHub Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Browser (Vanilla JS + Tailwind CSS)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   UI Layer   │  │ Content      │  │  Socket.io   │          │
│  │ (Glassmorphic)│ │ Shield       │  │  Client      │          │
│  │              │  │ (Anti-theft) │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS & WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Server                          │
├─────────────────────────────────────────────────────────────────┤
│  Express.js + Socket.io Server                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     Auth     │  │  Middleware  │  │   Routes     │          │
│  │  (JWT)       │  │  (RBAC)      │  │  (REST API)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────────────────────────────────────────┐          │
│  │          Socket.io Event Handler                  │          │
│  │  - Real-time code mirroring                       │          │
│  │  - Virtual Lab sessions                           │          │
│  │  - Participant management                         │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   PostgreSQL Database    │  │   Gemini AI API          │
├──────────────────────────┤  ├──────────────────────────┤
│  Multi-tenant Schema     │  │  Code Analysis           │
│  ┌──────────────────┐   │  │  Error Debugging         │
│  │ Users & Centers  │   │  │  Code Suggestions        │
│  │ Projects         │   │  └──────────────────────────┘
│  │ Escrow           │   │
│  │ Certificates     │   │
│  │ Lab Sessions     │   │
│  │ Audit Logs       │   │
│  └──────────────────┘   │
└──────────────────────────┘
```

## Component Flow

### 1. Authentication Flow
```
User → Login Page → POST /api/auth/login → JWT Token
                                          ↓
                              Store in localStorage
                                          ↓
                    Use in Authorization Header for API calls
```

### 2. Marketplace Flow
```
Student → Browse Projects → View Details → Purchase
                                              ↓
                              Create Escrow Transaction
                                              ↓
                                      Funds Held
                                              ↓
CenterAdmin → Complete Work → Issue Certificate
                                              ↓
                              Release Escrow Funds
                                              ↓
                        Student Receives Certificate
```

### 3. Virtual Lab Flow
```
Mentor → Start Session → Generate Session Code
                                ↓
Student → Join Session (Code) → Connect via Socket.io
                                              ↓
                         Real-time Code Sync
                                              ↓
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
            Code Changes                   AI Debugging
        (Mirrored to all)              (Gemini API)
```

### 4. Content Protection Flow
```
User → Access Protected Content → Log Access
                                      ↓
                          Apply Dynamic Watermark
                                      ↓
                            Monitor User Actions
                                      ↓
                    ┌─────────────────┴──────────────┐
                    ▼                                 ▼
            Block Copy/Save                  Detect DevTools
                    ↓                                 ↓
            Log Violation                      Show Warning
```

## Data Flow Architecture

### Request/Response Cycle

```
Client Request
      │
      ▼
┌─────────────┐
│   CORS      │  Allow configured origins
│  Middleware │
└─────────────┘
      │
      ▼
┌─────────────┐
│   Body      │  Parse JSON
│   Parser    │
└─────────────┘
      │
      ▼
┌─────────────┐
│    Auth     │  Verify JWT (if required)
│  Middleware │
└─────────────┘
      │
      ▼
┌─────────────┐
│    RBAC     │  Check role permissions
│  Middleware │
└─────────────┘
      │
      ▼
┌─────────────┐
│   Route     │  Execute business logic
│  Handler    │
└─────────────┘
      │
      ▼
┌─────────────┐
│  Database   │  Query PostgreSQL
│   Access    │
└─────────────┘
      │
      ▼
┌─────────────┐
│  Response   │  Return JSON
│  Formation  │
└─────────────┘
      │
      ▼
Client Response
```

## Database Schema Relationships

```
users ──┬── created_by ──→ projects
        │
        ├── buyer_id ───→ escrow_transactions
        │
        ├── student_id ─→ certificates
        │
        ├── mentor_id ──→ lab_sessions
        │
        └── student_id ─→ lab_sessions

centers ─┬── center_id ──→ projects
         │
         ├── seller_center_id ─→ escrow_transactions
         │
         └── center_id ─→ certificates

projects ─┬── project_id ─→ escrow_transactions
          │
          ├── project_id ─→ certificates
          │
          ├── project_id ─→ reviews
          │
          └── project_id ─→ content_protection_logs

escrow_transactions ─→ transaction_id ─→ certificates

lab_sessions ─┬── session_id ─→ code_snapshots
              │
              └── session_id ─→ debug_logs
```

## Security Layers

```
┌─────────────────────────────────────────────┐
│         Layer 1: Client-Side Security        │
│  - Content Shield (Anti-theft JS)           │
│  - Dynamic Watermarking                      │
│  - DevTools Detection                        │
│  - Input Validation                          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Layer 2: Transport Security          │
│  - HTTPS (Production)                        │
│  - CORS Configuration                        │
│  - WebSocket Security                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│       Layer 3: Application Security          │
│  - JWT Authentication                        │
│  - Role-Based Access Control (RBAC)         │
│  - Input Sanitization                        │
│  - XSS Prevention                            │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Layer 4: Database Security           │
│  - Parameterized Queries                    │
│  - SQL Injection Prevention                 │
│  - Access Control                            │
│  - Audit Logging                             │
└─────────────────────────────────────────────┘
```

## Deployment Architecture (Production)

```
┌─────────────────────────────────────────────────────┐
│                    Load Balancer                     │
│                   (Nginx/HAProxy)                    │
└─────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   App Node 1 │  │   App Node 2 │  │   App Node 3 │
│  (Express +  │  │  (Express +  │  │  (Express +  │
│  Socket.io)  │  │  Socket.io)  │  │  Socket.io)  │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ▼
        ┌──────────────────────────────────┐
        │    PostgreSQL Primary/Replica    │
        │      (with connection pool)      │
        └──────────────────────────────────┘
                          │
                          ▼
        ┌──────────────────────────────────┐
        │         Redis (optional)          │
        │    - Session storage              │
        │    - Cache                        │
        │    - Socket.io adapter            │
        └──────────────────────────────────┘
```

## Technology Stack Overview

```
Frontend:
├── Vanilla JavaScript (ES6+)
├── Tailwind CSS
├── Socket.io Client
└── Glassmorphic Design

Backend:
├── Node.js
├── Express.js
├── Socket.io Server
├── bcryptjs (Password hashing)
├── jsonwebtoken (JWT)
├── qrcode (Certificate QR)
└── axios (API calls)

Database:
├── PostgreSQL 12+
├── uuid-ossp extension
└── Normalized schema

External Services:
├── Google Gemini API (AI)
└── Payment Gateway (to be integrated)

Development:
├── nodemon (Auto-reload)
├── dotenv (Environment)
└── Git (Version control)
```

## Key Design Patterns

1. **MVC Architecture**
   - Routes → Controllers → Models → Database
   - Separation of concerns

2. **Middleware Pattern**
   - Authentication
   - Authorization
   - Error handling
   - Request validation

3. **Real-time Communication**
   - Event-driven architecture
   - Socket.io pub/sub pattern
   - Room-based sessions

4. **Repository Pattern** (recommended)
   - Database abstraction layer
   - Testable data access

5. **Service Layer** (to be added)
   - Business logic separation
   - Reusable services

## Scalability Considerations

### Horizontal Scaling
- Multiple Node.js instances
- Load balancer distribution
- Shared session storage (Redis)
- Database connection pooling

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching
- CDN for static assets

### Performance Optimization
- Database indexing
- Query optimization
- Code minification
- Asset compression
- Lazy loading

## Monitoring & Logging

```
Application Logs
      │
      ├─→ Access Logs (HTTP requests)
      ├─→ Error Logs (Exceptions)
      ├─→ Security Logs (Auth failures)
      ├─→ Business Logs (Transactions)
      └─→ Audit Logs (User actions)
      
      ↓
Log Aggregation (e.g., ELK Stack)
      ↓
Monitoring Dashboard
      ↓
Alerts & Notifications
```

## Future Enhancements

1. **Microservices Architecture**
   - Separate services for marketplace, escrow, lab
   - API Gateway
   - Service mesh

2. **Container Orchestration**
   - Docker containers
   - Kubernetes deployment
   - Auto-scaling

3. **Advanced Features**
   - GraphQL API
   - Message queue (RabbitMQ/Kafka)
   - Elasticsearch for search
   - ML-based recommendations

---

**Document Version:** 1.0  
**Last Updated:** 2024-12-29
