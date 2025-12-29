# Contributing to NexusHub

First off, thank you for considering contributing to NexusHub! It's people like you that make NexusHub such a great platform.

## Code of Conduct

This project and everyone participating in it is governed by our commitment to fostering an open and welcoming environment. We pledge to make participation in our project a harassment-free experience for everyone.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues list as you might find that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps to reproduce the problem**
* **Provide specific examples**
* **Describe the behavior you observed and what behavior you expected**
* **Include screenshots if possible**
* **Include your environment details** (OS, Node.js version, PostgreSQL version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a detailed description of the suggested enhancement**
* **Explain why this enhancement would be useful**
* **List any examples of how this enhancement is implemented elsewhere**

### Pull Requests

* Fill in the required template
* Follow the coding style used throughout the project
* Include appropriate test cases
* Update documentation as needed
* Ensure your code passes all tests

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/NexusHub.git`
3. Add upstream remote: `git remote add upstream https://github.com/muhammadmusammil01-byte/NexusHub.git`
4. Create a branch: `git checkout -b feature/your-feature-name`
5. Follow the setup instructions in SETUP.md

## Coding Standards

### JavaScript Style Guide

* Use 4 spaces for indentation
* Use semicolons
* Use single quotes for strings
* Use camelCase for variables and functions
* Use PascalCase for classes and constructors
* Always use `const` or `let`, never `var`
* Add comments for complex logic

#### Example:
```javascript
// Good
const fetchUserData = async (userId) => {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    return result.rows[0];
};

// Avoid
var fetch_user_data = function(user_id) {
    var result = db.query("SELECT * FROM users WHERE id = " + user_id)
    return result.rows[0]
}
```

### SQL Style Guide

* Use uppercase for SQL keywords
* Use snake_case for table and column names
* Always use parameterized queries
* Add comments for complex queries

#### Example:
```sql
-- Good
SELECT u.full_name, COUNT(p.id) as project_count
FROM users u
LEFT JOIN projects p ON u.id = p.created_by
WHERE u.role = 'Mentor'
GROUP BY u.id;
```

### API Design

* Use RESTful conventions
* Use plural nouns for endpoints (`/api/users`, not `/api/user`)
* Use HTTP status codes appropriately
* Return consistent error responses
* Version your API if making breaking changes

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests after the first line

#### Example:
```
Add escrow refund functionality

- Implement refund endpoint
- Add database transaction handling
- Update API documentation
- Add security checks for admin-only access

Fixes #123
```

## Testing Guidelines

### Before Submitting a Pull Request

1. Test your changes manually
2. Ensure all existing features still work
3. Test with different user roles (SysAdmin, CenterAdmin, Mentor, Student)
4. Test error cases and edge cases
5. Verify security measures are not bypassed

### Testing Checklist

- [ ] Authentication flows (login, register, logout)
- [ ] Authorization (RBAC for different roles)
- [ ] Marketplace functionality (create, view, search, purchase)
- [ ] Escrow system (create, release, refund)
- [ ] Certificate generation and verification
- [ ] Virtual Lab (join, code mirroring, AI debugging)
- [ ] Content protection features
- [ ] Error handling and validation

### Manual Testing Example

```bash
# Test API endpoints
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","full_name":"Test User","role":"Student"}'

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## Areas That Need Contribution

### High Priority

1. **Testing Framework**
   - Unit tests for backend routes
   - Integration tests for API endpoints
   - Frontend testing with Jest or similar

2. **Security Enhancements**
   - Rate limiting implementation
   - Better token management (httpOnly cookies)
   - Enhanced input validation
   - Security audit

3. **Code Execution Sandbox**
   - Docker-based code execution
   - Resource limiting
   - Language support expansion

4. **Payment Integration**
   - Stripe integration
   - PayPal integration
   - Payment webhooks

5. **Mobile App**
   - React Native or Flutter app
   - Mobile-optimized UI

### Medium Priority

1. **Advanced Features**
   - Project version control
   - Collaborative editing
   - Video conferencing in Virtual Lab
   - Advanced analytics dashboard

2. **Performance**
   - Database query optimization
   - Caching strategy (Redis)
   - CDN integration
   - Load balancing

3. **Documentation**
   - API documentation improvements
   - Video tutorials
   - Architecture diagrams
   - Deployment guides for different platforms

### Low Priority

1. **UI/UX Improvements**
   - Dark/light mode toggle
   - Accessibility improvements
   - Internationalization (i18n)
   - Custom themes

2. **Additional Features**
   - Email notifications
   - Push notifications
   - Social features (forums, chat)
   - Gamification elements

## Project Structure Guidelines

When adding new features, follow these conventions:

### Backend (Server)

```
server/
├── config/          # Configuration files
├── controllers/     # Business logic (to be added)
├── middleware/      # Express middleware
├── models/          # Database models (to be added)
├── routes/          # API route handlers
├── utils/           # Helper functions
├── services/        # External service integrations (to be added)
└── server.js        # Main server file
```

### Frontend (Public)

```
public/
├── css/             # Stylesheets
├── js/              # JavaScript files
│   ├── app.js       # Main application
│   ├── *-shield.js  # Security features
│   └── *.js         # Feature-specific modules
├── assets/          # Images, fonts, etc.
└── index.html       # Single-page application
```

### Database

```
database/
├── schema.sql       # Main schema
├── migrations/      # Database migrations (to be added)
└── seeds/           # Sample data (to be added)
```

## Documentation Guidelines

* Keep documentation up to date with code changes
* Use clear, concise language
* Include code examples where appropriate
* Add diagrams for complex systems
* Maintain consistent formatting

### Documentation Files

* `README.md` - Project overview and quick start
* `SETUP.md` - Detailed setup instructions
* `API.md` - API documentation
* `SECURITY.md` - Security considerations
* `CONTRIBUTING.md` - This file

## Review Process

1. **Code Review**: At least one maintainer will review your PR
2. **Testing**: Automated tests (when available) must pass
3. **Documentation**: Documentation must be updated if needed
4. **Security**: Security implications will be reviewed
5. **Approval**: PR needs approval from a maintainer

## Getting Help

* Join our discussions in GitHub Discussions
* Ask questions in issues (use the "question" label)
* Check existing documentation
* Review closed issues and PRs

## Recognition

Contributors will be:
* Listed in the project's contributors page
* Mentioned in release notes for significant contributions
* Credited in the README for major features

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

## Questions?

Feel free to contact the maintainers if you have any questions or need clarification on anything.

Thank you for contributing to NexusHub! 🚀
