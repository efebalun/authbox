# AuthBox - Multi-tenant Authentication System

A flexible, secure, and feature-rich authentication system that can be integrated into various applications while supporting multiple tenants.

## Features

### Core Authentication
- Multiple authentication methods:
  - Email + Password
  - Magic Link (passwordless)
  - Phone + SMS
  - Social Authentication
- JWT-based authentication with refresh tokens
- Secure password hashing and validation
- Email verification
- Password reset functionality

### Multi-tenancy Support
- Domain-based tenant resolution
- Tenant-specific configurations:
  - Custom JWT secrets
  - Authentication method selection
  - Email templates
  - Social OAuth credentials

### User Management
- Flexible user profiles with custom fields
- Field templates for common use cases
- Role-based access control
- User status management
- Session tracking

### Field Templates
- Pre-built templates for common scenarios:
  - Personal Information
  - Address Information
  - Social Media Profiles
  - Business Information
- Industry-specific templates:
  - Healthcare
  - Education
- Compliance templates:
  - GDPR Compliance
  - KYC Verification

### Security Features
- Rate limiting
- Input validation
- CORS configuration
- Request sanitization
- Suspicious activity detection

## Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/authbox.git
cd authbox
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create a .env file:
\`\`\`env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/authbox

# JWT Configuration
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
JWT_VERIFICATION_TOKEN_EXPIRY=24h

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
EMAIL_FROM=noreply@example.com

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=*

# Redis (optional)
REDIS_URI=redis://localhost:6379
\`\`\`

4. Start the server:
\`\`\`bash
npm start
\`\`\`

## API Documentation

For detailed API documentation including request/response examples, please see [API Documentation](docs/API.md).

### Authentication Endpoints

#### Email + Password Authentication
\`\`\`
POST /auth/register
POST /auth/login
POST /auth/verify-email
POST /auth/resend-verification
POST /auth/forgot-password
POST /auth/reset-password
\`\`\`

#### Magic Link Authentication
\`\`\`
POST /auth/magic-link/request
POST /auth/magic-link/verify
\`\`\`

#### Phone Authentication
\`\`\`
POST /auth/phone/request-code
POST /auth/phone/verify-code
\`\`\`

#### Social Authentication
\`\`\`
GET /auth/social/:provider
GET /auth/social/:provider/callback
\`\`\`

#### Common Endpoints
\`\`\`
POST /auth/logout
POST /auth/refresh-token
GET /auth/me
\`\`\`

### Admin Endpoints

#### User Management
\`\`\`
GET /admin/users
GET /admin/users/:userId
PUT /admin/users/:userId
PUT /admin/users/:userId/status
DELETE /admin/users/:userId
\`\`\`

#### Validation Schema Management
\`\`\`
GET /admin/validation
POST /admin/validation/fields
PUT /admin/validation/fields/:fieldId
DELETE /admin/validation/fields/:fieldId
PUT /admin/validation/fields/order
PUT /admin/validation/auth-methods
\`\`\`

#### Field Templates
\`\`\`
GET /admin/templates
GET /admin/templates/:templateId
POST /admin/templates
PUT /admin/templates/:templateId
DELETE /admin/templates/:templateId
POST /admin/templates/:templateId/apply
\`\`\`

### System Endpoints

#### Tenant Management
\`\`\`
POST /system/tenants
GET /system/tenants
GET /system/tenants/:tenantId
PUT /system/tenants/:tenantId
DELETE /system/tenants/:tenantId
\`\`\`

## Models

### User Model
- Core authentication fields (email, phone, password hash)
- Verification states
- Custom fields (from tenant configuration)
- Social connections
- Security tracking (login attempts, IP history)

### Tenant Model
- Basic information (name, domains)
- Authentication settings
- JWT configuration
- Email templates
- Social OAuth credentials

### Validation Schema
- Custom field definitions
- Field groups and sections
- Validation rules
- Dependencies and conditions

### Field Templates
- Predefined field sets
- Industry-specific templates
- Compliance templates
- Metadata and versioning

## Security Considerations

1. **Password Security**
   - Passwords are hashed using bcrypt
   - Minimum password requirements are configurable
   - Failed login attempts are tracked

2. **Token Security**
   - Short-lived access tokens
   - Secure refresh token rotation
   - Token blacklisting support

3. **Rate Limiting**
   - Configurable rate limits per endpoint
   - IP-based and user-based limiting
   - Burst protection

4. **Input Validation**
   - Request sanitization
   - Schema validation
   - XSS protection

5. **Multi-tenancy Security**
   - Tenant isolation
   - Tenant-specific encryption keys
   - Domain validation

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 