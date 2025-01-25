# AuthBox API Documentation

This document provides detailed request/response examples for all API endpoints.

## Authentication Endpoints

### Email + Password Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json
x-tenant-id: {tenant-id}

{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "displayName": "John Doe"
}
```

Response (201 Created):
```json
{
    "status": "success",
    "data": {
        "user": {
            "id": "user-id",
            "email": "user@example.com",
            "displayName": "John Doe",
            "emailVerified": false,
            "createdAt": "2023-05-01T12:00:00Z"
        },
        "tokens": {
            "accessToken": "eyJhbG...",
            "refreshToken": "eyJhbG..."
        }
    }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json
x-tenant-id: {tenant-id}

{
    "email": "user@example.com",
    "password": "SecurePass123!"
}
```

Response (200 OK):
```json
{
    "status": "success",
    "data": {
        "user": {
            "id": "user-id",
            "email": "user@example.com",
            "displayName": "John Doe"
        },
        "tokens": {
            "accessToken": "eyJhbG...",
            "refreshToken": "eyJhbG..."
        }
    }
}
```

### Magic Link Authentication

#### Request Magic Link
```http
POST /auth/magic-link/request
Content-Type: application/json
x-tenant-id: {tenant-id}

{
    "email": "user@example.com"
}
```

Response (200 OK):
```json
{
    "status": "success",
    "message": "Magic link sent successfully"
}
```

### Phone Authentication

#### Request SMS Code
```http
POST /auth/phone/request-code
Content-Type: application/json
x-tenant-id: {tenant-id}

{
    "phoneNumber": "+1234567890"
}
```

Response (200 OK):
```json
{
    "status": "success",
    "message": "Verification code sent successfully"
}
```

## Admin Endpoints

### User Management

#### List Users
```http
GET /admin/users?page=1&limit=10
Authorization: Bearer {access-token}
x-tenant-id: {tenant-id}
```

Response (200 OK):
```json
{
    "status": "success",
    "data": {
        "users": [
            {
                "id": "user-id",
                "email": "user@example.com",
                "displayName": "John Doe",
                "status": "active",
                "createdAt": "2023-05-01T12:00:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 10,
            "total": 1
        }
    }
}
```

### Field Templates

#### List Templates
```http
GET /admin/templates?category=general
Authorization: Bearer {access-token}
x-tenant-id: {tenant-id}
```

Response (200 OK):
```json
{
    "status": "success",
    "data": [
        {
            "id": "template-id",
            "name": "Personal Information",
            "description": "Basic personal information fields",
            "category": "general",
            "fields": [
                {
                    "field": "dateOfBirth",
                    "type": "date",
                    "label": "Date of Birth",
                    "required": true
                }
            ]
        }
    ]
}
```

#### Apply Template
```http
POST /admin/templates/{template-id}/apply
Content-Type: application/json
Authorization: Bearer {access-token}
x-tenant-id: {tenant-id}

{
    "merge": true
}
```

Response (200 OK):
```json
{
    "status": "success",
    "data": {
        "customFields": [
            {
                "field": "dateOfBirth",
                "type": "date",
                "label": "Date of Birth",
                "required": true
            }
        ]
    }
}
```

## System Endpoints

### Tenant Management

#### Create Tenant
```http
POST /system/tenants
Content-Type: application/json
Authorization: Bearer {system-token}

{
    "name": "Example Corp",
    "domains": ["example.com"],
    "features": {
        "emailVerification": true,
        "socialAuth": true
    }
}
```

Response (201 Created):
```json
{
    "status": "success",
    "data": {
        "tenant": {
            "id": "tenant-id",
            "name": "Example Corp",
            "domains": ["example.com"],
            "features": {
                "emailVerification": true,
                "socialAuth": true
            },
            "createdAt": "2023-05-01T12:00:00Z"
        }
    }
}
```

## Error Responses

All endpoints follow a consistent error response format:

```json
{
    "status": "error",
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid input data",
        "details": [
            {
                "field": "email",
                "message": "Invalid email format"
            }
        ]
    }
}
```

Common error codes:
- `VALIDATION_ERROR`: Invalid input data
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Rate Limiting

All endpoints are rate-limited. The response headers include:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1683000000
```

## Authentication

Most endpoints require authentication via JWT tokens in the Authorization header:
```http
Authorization: Bearer eyJhbG...
```

Tenant-specific endpoints require the tenant ID:
```http
x-tenant-id: tenant-id
``` 