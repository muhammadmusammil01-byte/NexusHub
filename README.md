# NexusHub

NexusHub is a high-trust, multi-tenant project incubation marketplace designed to bridge the gap between students looking for high-quality final-year projects and professional training centers.

## 🚀 Features

### 1. **Multi-tenant Architecture with RBAC**
- Four role types: SysAdmin, CenterAdmin, Mentor, Student
- PostgreSQL-based data isolation
- JWT authentication and authorization

### 2. **Marketplace with Content Shield**
- Anti-theft JavaScript protection
- Dynamic watermarking system
- Content access logging
- DevTools detection
- Screenshot monitoring

### 3. **Escrow System**
- Secure payment holding
- Admin-controlled fund release
- Smart QR Certificate generation
- Transaction tracking and management

### 4. **Virtual Lab**
- Real-time code mirroring via Socket.io
- AI Debugger powered by Gemini API
- Multi-language support (JavaScript, Python, Java, C++)
- Live collaboration between mentors and students

### 5. **Smart QR Certificates**
- Automated certificate generation
- QR code verification system
- Blockchain-like integrity checks
- Public verification portal

## 🛠️ Technology Stack

### Backend
- **Framework**: Express.js (Node.js)
- **Database**: PostgreSQL with uuid-ossp extension
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io for WebSocket communication
- **AI Integration**: Google Gemini API for code debugging

### Frontend
- **UI Framework**: Vanilla JavaScript
- **Styling**: Tailwind CSS with glassmorphic design
- **Real-time**: Socket.io client
- **Security**: Content Shield anti-theft protection

### Security Features
- bcryptjs for password hashing
- CORS configuration
- Rate limiting ready
- SQL injection prevention via parameterized queries
- XSS protection via HTML escaping

## 📁 Project Structure

```
NexusHub/
├── database/
│   └── schema.sql              # PostgreSQL database schema
├── server/
│   ├── config/
│   │   └── database.js         # Database connection
│   ├── middleware/
│   │   └── auth.js             # Authentication & RBAC
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── marketplace.js      # Marketplace API
│   │   ├── escrow.js           # Escrow system API
│   │   └── certificates.js     # Certificate management
│   ├── utils/
│   │   └── gemini-debugger.js  # AI debugging integration
│   ├── server.js               # Main server with Socket.io
│   ├── package.json            # Dependencies
│   └── .env.example            # Environment variables template
└── public/
    ├── css/
    │   └── glassmorphic.css    # Glassmorphic UI styles
    ├── js/
    │   ├── app.js              # Main application logic
    │   ├── content-shield.js   # Anti-theft protection
    │   └── lab.js              # Virtual Lab functionality
    └── index.html              # Single-page application
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Google Gemini API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/muhammadmusammil01-byte/NexusHub.git
   cd NexusHub
   ```

2. **Setup Database**
   ```bash
   # Create PostgreSQL database
   createdb nexushub
   
   # Run schema
   psql -d nexushub -f database/schema.sql
   ```

3. **Install Server Dependencies**
   ```bash
   cd server
   npm install
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start the Server**
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

6. **Access the Application**
   - Open browser to `http://localhost:3000`
   - Default admin credentials:
     - Email: admin@nexushub.com
     - Password: admin123

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexushub
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

## 🎯 User Roles & Permissions

### SysAdmin
- Full system access
- Manage all centers and users
- Refund escrow transactions
- View all analytics

### CenterAdmin
- Manage own training center
- Create and publish projects
- Release escrow funds
- Issue certificates

### Mentor
- Create project content
- Conduct virtual lab sessions
- Provide AI-assisted debugging support
- Monitor student progress

### Student
- Browse marketplace
- Purchase projects
- Participate in virtual labs
- Receive certificates

## 🔐 Security Features

### Content Shield
- Right-click disabled on protected content
- Keyboard shortcut blocking (F12, Ctrl+U, Ctrl+S)
- DevTools detection
- Screenshot monitoring
- Dynamic watermarking
- Access logging

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Token expiration handling

### Data Protection
- SQL injection prevention
- XSS protection
- CORS configuration
- HTTPS ready (configure reverse proxy)

## 🧪 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Marketplace
- `GET /api/marketplace` - List projects
- `GET /api/marketplace/:id` - Get project details
- `POST /api/marketplace` - Create project (CenterAdmin/Mentor)
- `PATCH /api/marketplace/:id/publish` - Publish project

### Escrow
- `POST /api/escrow/create` - Create transaction
- `GET /api/escrow/my-transactions` - Get user transactions
- `POST /api/escrow/:id/release` - Release funds & issue certificate
- `POST /api/escrow/:id/refund` - Refund transaction (SysAdmin)

### Certificates
- `POST /api/certificates/generate` - Generate certificate
- `GET /api/certificates/verify/:code` - Verify certificate
- `GET /api/certificates/my-certificates` - Get user certificates

### Virtual Lab
- `POST /api/lab/start` - Start lab session
- `POST /api/lab/:id/end` - End lab session

### Socket.io Events
- `join-lab` - Join virtual lab session
- `code-update` - Sync code changes
- `debug-request` - Request AI debugging
- `code-suggestion-request` - Get AI code suggestions

## 📊 Database Schema

The system uses a normalized PostgreSQL schema with the following main tables:
- `users` - User accounts with role-based access
- `centers` - Training center information
- `projects` - Marketplace projects
- `project_content` - Protected project files
- `escrow_transactions` - Payment escrow system
- `certificates` - Smart QR certificates
- `lab_sessions` - Virtual lab sessions
- `code_snapshots` - Code history
- `debug_logs` - AI debugging logs
- `reviews` - Project reviews
- `content_protection_logs` - Anti-theft tracking

## 🎨 UI/UX Features

### Glassmorphic Design
- Backdrop blur effects
- Semi-transparent panels
- Smooth transitions
- Gradient accents
- Modern, clean interface

### Responsive Design
- Mobile-friendly layout
- Adaptive navigation
- Touch-optimized controls

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Tailwind CSS for the styling framework
- Socket.io for real-time communication
- Google Gemini API for AI capabilities
- PostgreSQL for robust data management

## 📧 Support

For support, email support@nexushub.com or open an issue in the GitHub repository.

## 🔮 Future Enhancements

- Video conferencing integration
- Advanced analytics dashboard
- Mobile applications (iOS/Android)
- Blockchain-based certificates
- Advanced code execution sandbox
- Multi-language support for UI
- Payment gateway integration (Stripe, PayPal)
- Automated testing suite
- CI/CD pipeline
