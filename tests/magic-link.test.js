const request = require('supertest');
const { app } = require('../src/app');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock email service
jest.mock('../src/services/email.service', () => ({
    sendMagicLinkEmail: jest.fn().mockResolvedValue(true)
}));

describe('Magic Link Authentication Tests', () => {
    let mongoServer;
    let testTenant;
    let testUser;
    let magicLinkToken;

    beforeAll(async () => {
        // Setup MongoDB Memory Server
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());

        // Create system token
        const systemRes = await request(app)
            .post('/system/token')
            .send({
                apiKey: process.env.SYSTEM_API_KEY || 'test-api-key'
            });

        const systemToken = systemRes.body.data.accessToken;

        // Create test tenant
        const tenantRes = await request(app)
            .post('/system/tenants')
            .set('Authorization', `Bearer ${systemToken}`)
            .send({
                name: 'Test Tenant',
                slug: 'test-tenant'
            });

        testTenant = tenantRes.body.data;

        // Create validation schema
        await request(app)
            .post(`/system/tenants/${testTenant._id}/validation-schema`)
            .set('Authorization', `Bearer ${systemToken}`)
            .send({
                authMethods: {
                    magicLink: {
                        enabled: true,
                        tokenExpiry: '15m'
                    }
                }
            });
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    describe('Magic Link Flow', () => {
        it('should request magic link with valid email', async () => {
            const res = await request(app)
                .post('/auth/magic-link/request')
                .set('x-tenant-slug', testTenant.slug)
                .send({ email: 'test@example.com' });

            expect(res.status).toBe(200);
            expect(res.body.data.message).toBe('Magic link email sent');
            magicLinkToken = res.body.data.token;
        });

        it('should not request magic link with invalid email format', async () => {
            const res = await request(app)
                .post('/auth/magic-link/request')
                .set('x-tenant-slug', testTenant.slug)
                .send({ email: 'invalid-email' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid email format');
        });

        it('should verify magic link token and login', async () => {
            const res = await request(app)
                .post('/auth/magic-link/verify')
                .set('x-tenant-slug', testTenant.slug)
                .send({ token: magicLinkToken });

            expect(res.status).toBe(200);
            expect(res.body.data.tokens).toBeDefined();
            expect(res.body.data.tokens.accessToken).toBeDefined();
            expect(res.body.data.tokens.refreshToken).toBeDefined();
            expect(res.body.data.user).toBeDefined();
            expect(res.body.data.user.email).toBe('test@example.com');
        });

        it('should not verify with invalid token', async () => {
            const res = await request(app)
                .post('/auth/magic-link/verify')
                .set('x-tenant-slug', testTenant.slug)
                .send({ token: 'invalid-token' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid or expired magic link token');
        });

        it('should enforce rate limiting on magic link requests', async () => {
            // Make multiple requests to trigger rate limiting
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/auth/magic-link/request')
                    .set('x-tenant-slug', testTenant.slug)
                    .send({ email: 'test@example.com' });
            }

            const res = await request(app)
                .post('/auth/magic-link/request')
                .set('x-tenant-slug', testTenant.slug)
                .send({ email: 'test@example.com' });

            expect(res.status).toBe(429);
            expect(res.body.message).toBe('Too many requests, please try again later');
        });

        it('should require security headers', async () => {
            const res = await request(app)
                .post('/auth/magic-link/request')
                .send({ email: 'test@example.com' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Tenant slug is required');
        });
    });
}); 