# Security Considerations

## Overview
NexusHub implements multiple layers of security to protect intellectual property, user data, and system integrity.

---

## 1. Content Protection (Content Shield)

### Anti-Theft JavaScript
The platform implements comprehensive client-side content protection:

#### Features:
- **Right-click prevention** on protected content
- **Keyboard shortcut blocking:**
  - F12 (DevTools)
  - Ctrl+Shift+I (DevTools)
  - Ctrl+Shift+J (Console)
  - Ctrl+U (View Source)
  - Ctrl+S (Save)
  - Ctrl+C (Copy) on protected elements
- **Drag-and-drop prevention** for images and protected content
- **DevTools detection** with console warnings
- **Screenshot monitoring** (Print Screen detection)

#### Dynamic Watermarking:
```javascript
// Watermark format
`${user.full_name} - ${timestamp} - ${unique_id}`
```

- Updates every minute
- Visible on all protected content
- Tied to user session
- Logged in database

#### Content Access Logging:
All interactions with protected content are logged:
- View actions
- Copy attempts
- Screenshot attempts
- Suspicious blur activity (tab switching)

**Database Table:** `content_protection_logs`

---

## 2. Authentication & Authorization

### JWT Implementation

#### Token Structure:
```javascript
{
  userId: "uuid",
  email: "user@example.com",
  role: "Student",
  iat: timestamp,
  exp: timestamp
}
```

#### Security Measures:
- **Password Hashing:** bcrypt with salt rounds = 10
- **Token Expiration:** 24 hours (configurable)
- **HTTPS Only:** Tokens should only be transmitted over HTTPS in production
- **Storage:** localStorage (consider httpOnly cookies for better security)

### Role-Based Access Control (RBAC)

#### Permission Matrix:

| Action | SysAdmin | CenterAdmin | Mentor | Student |
|--------|----------|-------------|--------|---------|
| View Marketplace | ✓ | ✓ | ✓ | ✓ |
| Create Project | ✓ | ✓ | ✓ | ✗ |
| Publish Project | ✓ | ✓ | ✗ | ✗ |
| Purchase Project | ✗ | ✗ | ✗ | ✓ |
| Release Escrow | ✓ | ✓ | ✗ | ✗ |
| Refund Transaction | ✓ | ✗ | ✗ | ✗ |
| Start Lab Session | ✓ | ✓ | ✓ | ✗ |
| Join Lab Session | ✓ | ✓ | ✓ | ✓ |
| Issue Certificate | ✓ | ✓ | ✗ | ✗ |

#### Implementation:
```javascript
// Middleware checks
authenticateToken()  // Verify JWT
authorize('SysAdmin', 'CenterAdmin')  // Check roles
checkCenterAccess()  // Verify center ownership
```

---

## 3. Database Security

### SQL Injection Prevention
- **Parameterized queries** for all database operations
- **Input validation** on all user inputs
- **No dynamic SQL** construction with user input

#### Example:
```javascript
// ✓ SAFE - Parameterized query
db.query('SELECT * FROM users WHERE email = $1', [email])

// ✗ UNSAFE - String concatenation
db.query(`SELECT * FROM users WHERE email = '${email}'`)
```

### Data Encryption
- **Password Hashing:** bcrypt (one-way)
- **Sensitive Data:** Consider encrypting `project_content.encrypted_content`
- **Transit Encryption:** Use SSL/TLS for database connections in production

### Database Access Control
```sql
-- Create limited privilege user
CREATE USER nexushub_app WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE nexushub TO nexushub_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO nexushub_app;
-- Do NOT grant DELETE or DROP permissions to application user
```

---

## 4. API Security

### CORS Configuration
```javascript
cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
})
```

**Production:** Whitelist specific domains only

### Rate Limiting (Recommended)
```javascript
// Install: npm install express-rate-limit
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Input Validation
**Always validate:**
- Email formats
- UUID formats
- Numeric ranges
- String lengths
- Enum values (roles, statuses)

#### Example:
```javascript
// Validate role
const validRoles = ['SysAdmin', 'CenterAdmin', 'Mentor', 'Student'];
if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
}
```

### XSS Prevention
- **HTML Escaping** in frontend
- **Content-Security-Policy** headers (recommended)
- **Input sanitization** on server

```javascript
// Frontend escaping
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

---

## 5. WebSocket Security

### Socket.io Authentication
```javascript
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (verifyToken(token)) {
        next();
    } else {
        next(new Error('Authentication error'));
    }
});
```

**Note:** Current implementation doesn't enforce this - recommended for production

### Session Validation
- Verify lab session exists in database
- Check user has permission to join
- Validate session is active

### Data Validation
- Validate all incoming Socket.io events
- Sanitize code snippets before storing
- Limit message size and frequency

---

## 6. Escrow Security

### Transaction Integrity
- **Atomic operations** for fund transfers
- **Status validation** before state changes
- **Audit trail** of all transactions

### Certificate Verification
- **Unique codes** for each certificate
- **QR data validation** for authenticity
- **Public verification** endpoint without authentication

### Payment Security
**Note:** Current implementation uses simulated payments

**Production Requirements:**
- Integrate with PCI-compliant payment gateway (Stripe, PayPal)
- Never store credit card details
- Use tokenization for payment methods
- Implement 3D Secure for card payments
- Log all payment attempts

---

## 7. Virtual Lab Security

### Code Execution
**CRITICAL:** Current implementation does NOT execute user code

**For Production Code Execution:**
- Use **sandboxed environment** (Docker containers)
- **Resource limits** (CPU, memory, time)
- **Network isolation** (no external access)
- **File system restrictions** (read-only or limited)
- **Process monitoring** and termination

### AI Integration Security
- **API key protection** (environment variables)
- **Rate limiting** on AI requests
- **Input sanitization** before sending to AI
- **Output validation** from AI responses
- **Cost monitoring** for API usage

---

## 8. Deployment Security Checklist

### Environment Variables
- [ ] Change default admin password
- [ ] Generate strong JWT secret
- [ ] Use strong database password
- [ ] Set valid Gemini API key
- [ ] Configure production URLs

### Server Configuration
- [ ] Enable HTTPS (SSL/TLS certificates)
- [ ] Configure firewall rules
- [ ] Disable directory listing
- [ ] Remove development headers
- [ ] Enable security headers:
  ```javascript
  app.use(helmet()); // npm install helmet
  ```

### Database Security
- [ ] Enable SSL connections
- [ ] Use limited privilege user
- [ ] Set up regular backups
- [ ] Enable audit logging
- [ ] Restrict network access

### Application Security
- [ ] Enable rate limiting
- [ ] Implement request validation
- [ ] Set up error logging (without exposing sensitive data)
- [ ] Configure CORS properly
- [ ] Implement CSRF protection for state-changing operations

### Monitoring
- [ ] Set up intrusion detection
- [ ] Monitor failed login attempts
- [ ] Track suspicious activity
- [ ] Alert on unusual patterns
- [ ] Regular security audits

---

## 9. Known Limitations

### Current Implementation
1. **Client-side protection** can be bypassed by determined attackers
   - Watermarking helps with attribution
   - Access logging provides audit trail
   
2. **No code execution sandbox** for Virtual Lab
   - Security risk if implemented without proper isolation
   - Requires separate sandboxed environment
   
3. **Simulated payment system**
   - Real payment gateway needed for production
   
4. **No rate limiting** implemented yet
   - Could be vulnerable to DoS attacks
   
5. **localStorage for JWT** tokens
   - Consider httpOnly cookies for better security

### Recommendations
1. Implement server-side rendering for sensitive pages
2. Add API rate limiting
3. Set up Web Application Firewall (WAF)
4. Implement comprehensive logging and monitoring
5. Regular security assessments and penetration testing
6. Bug bounty program for production deployment

---

## 10. Incident Response

### In Case of Security Breach:

1. **Immediate Actions:**
   - Identify affected systems
   - Isolate compromised components
   - Preserve logs and evidence

2. **Mitigation:**
   - Revoke compromised credentials
   - Force password resets if needed
   - Update JWT secret and invalidate all tokens
   - Apply security patches

3. **Investigation:**
   - Review access logs
   - Check content_protection_logs table
   - Analyze suspicious patterns
   - Determine breach scope

4. **Communication:**
   - Notify affected users
   - Report to authorities if required
   - Document incident details

5. **Prevention:**
   - Implement additional security measures
   - Update security policies
   - Conduct security training

---

## 11. Regular Maintenance

### Weekly
- Review access logs
- Check for failed login attempts
- Monitor content protection alerts

### Monthly
- Update dependencies (`npm audit`)
- Review security advisories
- Rotate API keys
- Backup verification

### Quarterly
- Security assessment
- Penetration testing
- Policy review
- Training updates

---

## 12. Compliance

### Data Privacy
- GDPR compliance for EU users
- CCPA compliance for California users
- Data retention policies
- Right to deletion implementation

### Intellectual Property
- Copyright notices
- Terms of service
- User agreements
- DMCA compliance

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

---

## Contact

For security concerns or to report vulnerabilities:
- Email: security@nexushub.com
- Do NOT post security issues publicly on GitHub
