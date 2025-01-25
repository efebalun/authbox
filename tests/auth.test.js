const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../src/app');

// Mock email service
jest.mock('../src/services/email.service', () => ({
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendMagicLinkEmail: jest.fn().mockResolvedValue(true)
}));

let mongoServer;
let systemToken;

describe('Authentication API Tests', () => {
    let testTenant;
    let testUser;
    let accessToken;
    let refreshToken;

    beforeAll(async () => {
        // Setup MongoDB Memory Server
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        // Get system token
        const systemRes = await request(app)
            .post('/system/token')
            .send({ secret: 'your-system-api-secret-key' });

        systemToken = systemRes.body.data.token;

        // Create test tenant
        const tenantRes = await request(app)
            .post('/system/tenants')
            .set('Authorization', `Bearer ${systemToken}`)
            .send({
                name: 'Test Tenant',
                slug: `test-tenant-${Date.now()}`,
                domains: ['test.com']
            });

        testTenant = tenantRes.body.data.tenant;

        // Set validation schema
        await request(app)
            .post(`/system/tenants/${testTenant._id}/validation-schema`)
            .set('Authorization', `Bearer ${systemToken}`)
            .send({
                authMethods: {
                    emailPassword: {
                        enabled: true,
                        passwordPolicy: {
                            minLength: 8,
                            requireUppercase: true,
                            requireLowercase: true,
                            requireNumbers: true,
                            requireSpecialChars: true
                        },
                        emailVerification: {
                            required: false,
                            tokenExpiry: 3600
                        }
                    }
                }
            });
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    describe('Email Password Authentication', () => {
        const testEmail = 'test@example.com';
        const testPassword = 'Test123!@#';

        it('should register a new user', async () => {
            const res = await request(app)
                .post('/auth/register/email')
                .set('x-tenant-slug', testTenant.slug)
                .send({
                    email: testEmail,
                    password: testPassword
                });

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data.user).toHaveProperty('email', testEmail);
            testUser = res.body.data.user;
        });

        it('should not allow duplicate registration', async () => {
            const res = await request(app)
                .post('/auth/register/email')
                .set('x-tenant-slug', testTenant.slug)
                .send({
                    email: testEmail,
                    password: testPassword
                });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toBe('Email already registered');
        });

        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/auth/login/email')
                .set('x-tenant-slug', testTenant.slug)
                .send({
                    email: testEmail,
                    password: testPassword
                });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.tokens).toHaveProperty('accessToken');
            expect(res.body.data.tokens).toHaveProperty('refreshToken');
            expect(res.body.data.tokens).toHaveProperty('type', 'Bearer');
            expect(res.body.data.user).toHaveProperty('email', testEmail);

            accessToken = res.body.data.tokens.accessToken;
            refreshToken = res.body.data.tokens.refreshToken;
        });

        it('should not login with invalid credentials', async () => {
            const res = await request(app)
                .post('/auth/login/email')
                .set('x-tenant-slug', testTenant.slug)
                .send({
                    email: testEmail,
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(401);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toBe('Invalid credentials');
        });

        it('should refresh access token', async () => {
            const res = await request(app)
                .post('/auth/token/refresh')
                .set('x-tenant-slug', testTenant.slug)
                .send({ refreshToken });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.tokens).toHaveProperty('accessToken');
            expect(res.body.data.tokens).toHaveProperty('refreshToken');
            expect(res.body.data.tokens).toHaveProperty('type', 'Bearer');

            // Update tokens for subsequent tests
            accessToken = res.body.data.tokens.accessToken;
            refreshToken = res.body.data.tokens.refreshToken;
        });

        it('should get user profile with valid token', async () => {
            const res = await request(app)
                .get('/auth/profile')
                .set('x-tenant-slug', testTenant.slug)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toHaveProperty('email', testEmail);
        });

        it('should not get profile with invalid token', async () => {
            const res = await request(app)
                .get('/auth/profile')
                .set('x-tenant-slug', testTenant.slug)
                .set('Authorization', 'Bearer invalid-token');

            expect(res.status).toBe(401);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toBe('Invalid token');
        });

        it('should initiate password reset', async () => {
            const res = await request(app)
                .post('/auth/reset-password/request')
                .set('x-tenant-slug', testTenant.slug)
                .send({ email: testUser.email });

            expect(res.status).toBe(200);
            expect(res.body.data.message).toBe('Password reset email sent');
        }, 15000);

        it('should logout user', async () => {
            const res = await request(app)
                .post('/auth/logout')
                .set('x-tenant-slug', testTenant.slug)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    refreshToken: refreshToken
                });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
        });

        it('should enforce rate limiting on login attempts', async () => {
            // Make multiple failed login attempts
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/auth/login/email')
                    .set('x-tenant-slug', testTenant.slug)
                    .send({
                        email: testEmail,
                        password: 'wrongpassword'
                    });
            }

            // Next attempt should be rate limited
            const res = await request(app)
                .post('/auth/login/email')
                .set('x-tenant-slug', testTenant.slug)
                .send({
                    email: testEmail,
                    password: testPassword
                });

            expect(res.status).toBe(429);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toBe('Too many requests, please try again later');
        });

        it('should validate email format', async () => {
            const res = await request(app)
                .post('/auth/register/email')
                .set('x-tenant-slug', testTenant.slug)
                .send({
                    email: 'invalid-email',
                    password: testPassword
                });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toBe('Invalid email format');
        });

        it('should require security headers', async () => {
            const res = await request(app)
                .post('/auth/login/email')
                .set('x-tenant-slug', testTenant.slug)
                .send({
                    email: testEmail,
                    password: testPassword
                });

            expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
            expect(res.headers).toHaveProperty('x-frame-options', 'DENY');
            expect(res.headers).toHaveProperty('x-xss-protection', '1; mode=block');
            expect(res.headers).toHaveProperty('strict-transport-security');
        });
    });
}); 