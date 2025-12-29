# NexusHub - AI-Powered Project Incubation & Escrow Marketplace

## Overview
NexusHub is a multi-tenant platform connecting students with verified training centers for high-quality project incubation. The platform features secure escrow payments, real-time virtual lab collaboration, and AI-powered debugging.

## Tech Stack
- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Real-time**: Socket.io
- **AI Integration**: Gemini API
- **Authentication**: JWT

## Core Features

### 1. Role-Based Access Control (RBAC)
Four-tier hierarchy:
- **System Admin**: Approves centers, manages escrow vault
- **Center Admin**: Uploads projects, manages mentors
- **Mentor**: Conducts shadow coding sessions, approves milestones
- **Student**: Forms groups of 3, collaborates in virtual lab

### 2. Marketplace with Content Shield
- Browse verified training center projects
- **Content Shield Security**:
  - Disable right-click and copy-paste
  - Prevent screenshots
  - Dynamic watermarking with user email/IP
  - Protected content viewing

### 3. Escrow System
- Secure payment handling
- Funds held by System Admin
- Released only after Smart QR Certificate is issued
- Full transaction tracking

### 4. Virtual Lab
- Real-time code mirroring via Socket.io
- Mentor's code automatically mirrored to students
- AI Debugger powered by Gemini API
- Integrated video call and chat
- Collaborative workspace

### 5. Smart QR Certificates
- Issued by Center Admin upon project completion
- QR code verification
- Triggers escrow fund release

## Project Structure

```
NexusHub/
├── database/
│   └── schema.sql              # PostgreSQL database schema with escrow_transactions & user_roles
├── server/
│   ├── app.js                  # Main Express server with Socket.io initialization
│   ├── config/
│   │   └── database.js         # Database connection pool
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication
│   │   └── rbac.js             # Role-based access control
│   └── routes/
│       ├── auth.js             # Authentication endpoints
│       ├── projects.js         # Project management
│       ├── escrow.js           # Escrow transactions
│       ├── certifications.js   # Smart QR certificates
│       ├── lab.js              # Virtual lab sessions
│       ├── dashboard.js        # Dashboard stats
│       └── users.js            # User management
├── public/
│   ├── index.html              # Landing page with dual journey
│   ├── login.html              # Unified login page
│   ├── register.html           # Registration with role selection
│   ├── marketplace.html        # Project marketplace gallery
│   ├── project-view.html       # High-security project details with Content Shield
│   ├── center-directory.html   # Verified centers directory
│   ├── virtual-lab.html        # Virtual lab with real-time mirroring
│   ├── dashboards/
│   │   ├── admin.html          # System admin dashboard
│   │   ├── student.html        # Student dashboard
│   │   ├── center.html         # Center admin dashboard (to be added)
│   │   └── mentor.html         # Mentor dashboard (to be added)
│   └── js/
│       └── security.js         # Content Shield with contextmenu & keydown listeners
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/muhammadmusammil01-byte/NexusHub.git
   cd NexusHub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb nexushub
   
   # Run schema
   psql -d nexushub -f database/schema.sql
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration:
   # - Database credentials
   # - JWT secret
   # - Gemini API key
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   ```
   http://localhost:3000
   ```

## Environment Variables

```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexushub
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Application
CLIENT_URL=http://localhost:3000
```

## Verification Checklist

✅ **Database Schema (database/schema.sql)**
- Contains `escrow_transactions` table for payment handling
- Contains `user_roles` table for RBAC with 4 roles (SysAdmin, CenterAdmin, Mentor, Student)
- Complete multi-tenant structure with centers, projects, certifications

✅ **Content Shield (public/js/security.js)**
- `contextmenu` event listener to disable right-click
- `keydown` event listeners to prevent copy/paste/print
- Dynamic watermarking with user email/IP
- Text selection prevention

✅ **Server Setup (server/app.js)**
- Socket.io initialized for Virtual Lab real-time mirroring
- Role-based routing logic
- JWT authentication middleware
- Escrow and certification endpoints

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login (returns role-based redirect)
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List all published projects
- `GET /api/projects/:id` - Get project details (with watermark info)
- `POST /api/projects` - Create project (Center Admin)
- `PATCH /api/projects/:id/publish` - Publish project

### Escrow
- `GET /api/escrow` - List escrow transactions
- `POST /api/escrow` - Create escrow transaction (Student)
- `POST /api/escrow/:id/release` - Release funds after certificate (SysAdmin)

### Certifications
- `POST /api/certifications` - Issue Smart QR certificate (Center Admin)
- `GET /api/certifications/student/:id` - Get student certificates

### Dashboard
- `GET /api/dashboard/stats` - Get role-specific statistics

## Security Features

### Content Shield
The `public/js/security.js` file implements comprehensive content protection:
- Context menu (right-click) blocking
- Keyboard shortcut disabling (Ctrl+C, Ctrl+X, Ctrl+P, Ctrl+S, Ctrl+U, F12, etc.)
- Text selection prevention
- Dynamic watermarking with user identification
- Screenshot detection and notifications
- DevTools detection

### Escrow Protection
- Multi-step verification process
- Funds held until Smart QR Certificate issuance
- Transparent transaction tracking
- Admin-controlled release mechanism

## Real-Time Features (Socket.io)

### Virtual Lab Events
- `join-lab` - Join lab session with role
- `mentor-code-update` - Mirror mentor's code to all students
- `student-code-submit` - Submit code for mentor review
- `ai-debug-result` - AI debugging feedback from Gemini API
- `lab-chat` - Real-time chat messages
- `cursor-position` - Collaborative cursor tracking

## Database Schema

Key tables:
- `users` - User accounts
- `roles` - RBAC roles (SysAdmin, CenterAdmin, Mentor, Student)
- `user_roles` - User-role assignments (many-to-many)
- `centers` - Training centers (multi-tenancy)
- `projects` - Project listings with watermark support
- `escrow_transactions` - Payment tracking (held/released/refunded)
- `certifications` - Smart QR certificates with verification
- `lab_sessions` - Virtual lab sessions with AI interaction tracking

See `database/schema.sql` for complete schema with indexes and triggers.

## Pages Overview

### Public Pages
- **Landing (index.html)**: Dual-journey homepage for students vs centers
- **Login (login.html)**: Unified login with role-based redirection
- **Register (register.html)**: Registration with role selection
- **Marketplace (marketplace.html)**: Browse projects from verified centers
- **Center Directory (center-directory.html)**: List of verified training centers
- **Project View (project-view.html)**: High-security detail page with Content Shield active

### Student Pages
- **Dashboard (dashboards/student.html)**: Progress tracking, active projects, roadmap
- **Group Manager**: Form and manage 3-person teams (to be added)
- **Certificates**: View and download Smart QR certificates (to be added)

### Center Admin Pages
- **Dashboard (dashboards/center.html)**: Revenue, projects, mentors (to be added)
- **Project Upload**: Create showcase projects (to be added)
- **Mentor Management**: Assign mentors to groups (to be added)

### Mentor Pages
- **Dashboard (dashboards/mentor.html)**: Sessions schedule, assigned groups (to be added)
- **Milestone Review**: Approve phases to trigger escrow (to be added)

### System Admin Pages
- **Dashboard (dashboards/admin.html)**: Global analytics, escrow vault overview
- **Approval Queue**: Approve/reject training centers (to be added)
- **Escrow Vault**: Financial ledger of held vs released funds (to be added)

### Collaborative Lab
- **Virtual Lab (virtual-lab.html)**: Dual code editors, AI debug console, video call, chat

## Development Workflow

1. Backend changes: Modify files in `server/`
2. Frontend changes: Modify files in `public/`
3. Database changes: Update `database/schema.sql`
4. Test locally before committing
5. Follow existing code patterns

## License

MIT License

## Support

For issues and questions:
- Create an issue on GitHub
- Email: support@nexushub.com

---

Built with ❤️ by the NexusHub Team
