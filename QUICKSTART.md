# NexusHub Quick Reference

## Quick Commands

### Server
```bash
cd server
npm install           # Install dependencies
npm start            # Start server (production)
npm run dev          # Start with auto-reload (development)
```

### Database
```bash
createdb nexushub                              # Create database
psql -d nexushub -f database/schema.sql       # Initialize schema
psql -d nexushub                               # Connect to database
```

### Git
```bash
git status                    # Check status
git add .                     # Stage all changes
git commit -m "message"       # Commit changes
git push origin main          # Push to remote
```

---

## Default Credentials

**Admin Account:**
- Email: `admin@nexushub.com`
- Password: `admin123`

⚠️ **Change immediately after first login!**

---

## API Endpoints Quick Reference

### Authentication
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get profile

### Marketplace
- `GET /api/marketplace` - List projects
- `GET /api/marketplace/:id` - Get project
- `POST /api/marketplace` - Create project
- `PATCH /api/marketplace/:id/publish` - Publish

### Escrow
- `POST /api/escrow/create` - Purchase
- `GET /api/escrow/my-transactions` - List
- `POST /api/escrow/:id/release` - Release

### Certificates
- `GET /api/certificates/verify/:code` - Verify
- `GET /api/certificates/my-certificates` - List

### Virtual Lab
- `POST /api/lab/start` - Start session
- `POST /api/lab/:id/end` - End session

---

## Socket.io Events

### Emit (Client → Server)
- `join-lab` - Join session
- `code-update` - Sync code
- `debug-request` - AI debug
- `leave-lab` - Leave session

### Listen (Server → Client)
- `joined-lab` - Joined confirmation
- `code-mirrored` - Code sync
- `debug-response` - AI response
- `error` - Error message

---

## User Roles

| Role | Access |
|------|--------|
| **SysAdmin** | Full system access |
| **CenterAdmin** | Center management, publish projects, release escrow |
| **Mentor** | Create projects, run lab sessions |
| **Student** | Purchase projects, join labs, receive certificates |

---

## Project Structure

```
NexusHub/
├── database/schema.sql          # PostgreSQL schema
├── server/
│   ├── config/database.js       # DB connection
│   ├── middleware/auth.js       # Auth & RBAC
│   ├── routes/                  # API endpoints
│   ├── utils/gemini-debugger.js # AI integration
│   └── server.js                # Main server
└── public/
    ├── css/glassmorphic.css     # Styles
    ├── js/
    │   ├── app.js               # Main app
    │   ├── content-shield.js    # Anti-theft
    │   └── lab.js               # Virtual Lab
    └── index.html               # SPA
```

---

## Environment Variables

```env
# Required
PORT=3000
DB_NAME=nexushub
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret

# Optional
GEMINI_API_KEY=your_key      # For AI features
FRONTEND_URL=http://localhost:3000
```

---

## Common Issues

### "Port already in use"
```bash
# Find process
lsof -i :3000
# Kill process
kill -9 <PID>
```

### "Database connection failed"
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql
# Start PostgreSQL
sudo systemctl start postgresql
```

### "Cannot find module"
```bash
cd server
rm -rf node_modules
npm install
```

### "JWT token expired"
- Login again to get new token
- Check JWT_EXPIRES_IN in .env

---

## Security Features

✅ **Content Shield**
- Right-click disabled
- DevTools detection
- Screenshot monitoring
- Dynamic watermarks
- Access logging

✅ **Authentication**
- JWT tokens
- bcrypt password hashing
- Role-based access (RBAC)

✅ **Database**
- Parameterized queries
- SQL injection prevention
- Access control

---

## Testing Workflow

1. **Register** as Student
2. **Login** with credentials
3. **Browse** marketplace
4. **View** project (notice watermark)
5. **Purchase** project (creates escrow)
6. **Login** as CenterAdmin
7. **Release** funds (issues certificate)
8. **Check** certificates page
9. **Join** Virtual Lab session
10. **Test** real-time code sync
11. **Try** AI debugging

---

## Database Tables

### Core Tables
- `users` - User accounts
- `centers` - Training centers
- `projects` - Marketplace projects
- `escrow_transactions` - Payment escrow
- `certificates` - Smart certificates
- `lab_sessions` - Virtual lab sessions

### Support Tables
- `project_content` - Protected content
- `code_snapshots` - Code history
- `debug_logs` - AI debugging logs
- `reviews` - Project reviews
- `content_protection_logs` - Security logs

---

## Useful SQL Queries

```sql
-- Count users by role
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Active lab sessions
SELECT * FROM lab_sessions WHERE status = 'active';

-- Recent transactions
SELECT * FROM escrow_transactions 
ORDER BY created_at DESC LIMIT 10;

-- Content access by user
SELECT u.full_name, COUNT(*) as access_count
FROM content_protection_logs cl
JOIN users u ON cl.user_id = u.id
GROUP BY u.id;
```

---

## URLs

- **Application:** http://localhost:3000
- **API Base:** http://localhost:3000/api
- **Health Check:** http://localhost:3000/api/health

---

## Documentation Files

- `README.md` - Main documentation
- `SETUP.md` - Setup instructions
- `API.md` - API reference
- `SECURITY.md` - Security guide
- `CONTRIBUTING.md` - Contribution guide

---

## Support

- **GitHub Issues:** Report bugs
- **Discussions:** Ask questions
- **Email:** support@nexushub.com

---

## Next Steps

1. ✅ Complete setup
2. ✅ Test all features
3. 🔲 Customize for your needs
4. 🔲 Add real payment gateway
5. 🔲 Deploy to production
6. 🔲 Set up monitoring

---

## Tips

💡 **Development:**
- Use `npm run dev` for auto-reload
- Check logs for debugging
- Test with different roles

💡 **Production:**
- Use HTTPS
- Set strong secrets
- Enable rate limiting
- Configure backups
- Monitor logs

💡 **Security:**
- Change default passwords
- Review SECURITY.md
- Regular updates
- Security audits

---

## Key Features Summary

🛡️ **Content Shield** - Anti-theft protection  
🔐 **JWT Auth** - Secure authentication  
🎨 **Glassmorphic UI** - Modern design  
💰 **Escrow System** - Secure payments  
📜 **Smart Certificates** - QR verification  
💻 **Virtual Lab** - Real-time collaboration  
🤖 **AI Debugger** - Gemini-powered assistance  
👥 **Multi-tenant** - Role-based access

---

**Version:** 1.0.0  
**Last Updated:** 2024-12-29  
**License:** MIT
