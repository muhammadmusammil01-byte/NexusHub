# NexusHub Setup Guide

## Quick Setup (Development)

### 1. Database Setup

First, install PostgreSQL if you haven't already:

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**On macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**On Windows:**
Download and install from: https://www.postgresql.org/download/windows/

### 2. Create Database

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE nexushub;

# Create user (optional)
CREATE USER nexushub_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE nexushub TO nexushub_user;

# Exit
\q
```

### 3. Initialize Schema

```bash
# Navigate to project root
cd NexusHub

# Run schema file
psql -U postgres -d nexushub -f database/schema.sql

# Or if you created a specific user:
psql -U nexushub_user -d nexushub -f database/schema.sql
```

### 4. Server Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env  # or use your preferred editor
```

### 5. Configure Environment Variables

Edit the `.env` file with your settings:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexushub
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=generate-a-random-secret-key-here
JWT_EXPIRES_IN=24h

# Gemini AI Configuration (Get key from: https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Note:** To generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 6. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

### 7. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## Default Credentials

After running the schema, you'll have a default admin account:

- **Email:** admin@nexushub.com
- **Password:** admin123

⚠️ **Important:** Change this password immediately after first login!

## Testing the Features

### 1. Test Authentication
1. Register a new student account
2. Register a mentor account (you'll need to assign a center_id)
3. Login with different roles to test RBAC

### 2. Test Marketplace
1. Login as CenterAdmin or Mentor
2. Create a new project
3. Publish the project
4. Login as Student
5. Browse and view projects
6. Notice the content protection features

### 3. Test Escrow System
1. As Student, purchase a project
2. Verify transaction appears in "My Transactions"
3. As CenterAdmin, release funds and issue certificate
4. Check certificates page

### 4. Test Virtual Lab
1. As Mentor, start a new lab session (or use existing session code)
2. As Student, join the same session
3. Type in the code editor and watch real-time sync
4. Test AI debugging feature
5. Try different programming languages

## Troubleshooting

### Database Connection Issues

**Error:** "password authentication failed"
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list  # macOS

# Check pg_hba.conf for authentication method
sudo nano /etc/postgresql/[version]/main/pg_hba.conf
```

**Error:** "database does not exist"
```bash
# Verify database exists
psql -U postgres -l

# If not, create it
psql -U postgres -c "CREATE DATABASE nexushub;"
```

### Node.js Issues

**Error:** "Cannot find module"
```bash
# Reinstall dependencies
cd server
rm -rf node_modules package-lock.json
npm install
```

**Error:** "Port already in use"
```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or change PORT in .env
```

### Socket.io Connection Issues

**Error:** "WebSocket connection failed"
- Check firewall settings
- Ensure CORS is configured correctly
- Verify FRONTEND_URL in .env matches your actual URL

### Gemini API Issues

**Error:** "Failed to connect to AI debugger"
- Verify GEMINI_API_KEY is set correctly
- Check API key is active at https://makersuite.google.com/
- Ensure you have API quota remaining
- The app will work without AI, but debugging features will be limited

## Production Deployment

### 1. Environment Setup

```bash
# Set production environment
NODE_ENV=production

# Use strong secrets
JWT_SECRET=<generate-strong-secret>

# Configure production database
DB_HOST=<production-db-host>
DB_PASSWORD=<strong-password>
```

### 2. Security Checklist

- [ ] Change default admin password
- [ ] Use HTTPS (configure reverse proxy)
- [ ] Set strong JWT secret
- [ ] Enable rate limiting
- [ ] Configure CORS for production domains
- [ ] Use environment variables for all secrets
- [ ] Enable PostgreSQL SSL
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Use process manager (PM2)

### 3. Nginx Configuration (Example)

```nginx
server {
    listen 80;
    server_name nexushub.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Using PM2 for Process Management

```bash
# Install PM2
npm install -g pm2

# Start application
cd server
pm2 start server.js --name nexushub

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
```

## Database Maintenance

### Backup Database

```bash
# Create backup
pg_dump -U postgres nexushub > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U postgres nexushub < backup_20241229.sql
```

### Common SQL Queries

```sql
-- Check user count
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Check active lab sessions
SELECT * FROM lab_sessions WHERE status = 'active';

-- View recent transactions
SELECT * FROM escrow_transactions ORDER BY created_at DESC LIMIT 10;

-- Check content protection logs
SELECT action_type, COUNT(*) FROM content_protection_logs GROUP BY action_type;
```

## Performance Optimization

### Database Indexing

The schema includes indexes on frequently queried columns. Monitor query performance:

```sql
-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

-- Analyze table statistics
ANALYZE projects;
ANALYZE users;
```

### Node.js Optimization

```bash
# Use cluster mode for better CPU utilization
# Install cluster module or use PM2 cluster mode
pm2 start server.js -i max --name nexushub
```

## Monitoring and Logging

### Enable Logging

Add to server.js:
```javascript
const morgan = require('morgan');
app.use(morgan('combined'));
```

### Health Check

Test the health endpoint:
```bash
curl http://localhost:3000/api/health
```

## Support and Resources

- **Documentation:** README.md in project root
- **API Reference:** Check route files in `server/routes/`
- **Database Schema:** `database/schema.sql`
- **Issues:** GitHub Issues tab

## Next Steps

After successful setup:

1. Explore the codebase
2. Customize the UI/UX
3. Add additional features
4. Set up automated testing
5. Configure CI/CD pipeline
6. Deploy to production

Happy coding! 🚀
