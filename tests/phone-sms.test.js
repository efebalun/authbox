const request = require('supertest');
const { app } = require('../src/app');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock SMS service
jest.mock('../src/services/sms.service', () => ({
    sendVerificationCode: jest.fn().mockResolvedValue(true)
}));

describe('Phone SMS Authentication Tests', () => {
    let app;
    let testTenant;
    let systemToken;
    let mongoServer;

    beforeAll(async () => {
        // Setup MongoDB Memory Server
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        // Get system token
        const systemRes = await request(app)
            .post('/system/token')
            .send({ secret: process.env.SYSTEM_API_SECRET || 'test-api-secret' });
        systemToken = systemRes.body.data.token;

        // Create test tenant
        const tenantRes = await request(app)
            .post('/system/tenants')
            .set('Authorization', `Bearer ${systemToken}`)
            .send({
                name: 'Test Tenant',
                slug: 'test-tenant'
            });
        testTenant = tenantRes.body.data.tenant;

        // Create validation schema for phone SMS
        await request(app)
            .post(`/system/tenants/${testTenant._id}/validation-schema`)
            .set('Authorization', `Bearer ${systemToken}`)
            .send({
                authMethods: {
                    phoneSMS: {
                        enabled: true,
                        codeExpiry: 5 * 60 * 1000, // 5 minutes
                        allowedCountries: ['US', 'GB']
                    }
                }
            });
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it('should request verification code with valid phone', async () => {
        const res = await request(app)
            .post('/auth/sms/request')
            .set('x-tenant-id', testTenant._id)
            .send({ phone: '+1234567890' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.message).toBe('Verification code sent to phone number');
        expect(res.body.data.user).toBeDefined();
        expect(res.body.data.user.phone).toBe('+1234567890');
    });

    it('should handle invalid phone format', async () => {
        const res = await request(app)
            .post('/auth/sms/request')
            .set('x-tenant-id', testTenant._id)
            .send({ phone: '123' });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('error');
        expect(res.body.message).toBe('phone must be a valid phone number');
    });

    it('should verify code and return tokens', async () => {
        // First request a code
        const requestRes = await request(app)
            .post('/auth/sms/request')
            .set('x-tenant-id', testTenant._id)
            .send({ phone: '+1234567890' });

        // Get the code from development environment
        const code = requestRes.body.data.code;

        // Verify the code
        const res = await request(app)
            .post('/auth/sms/verify')
            .set('x-tenant-id', testTenant._id)
            .send({ phone: '+1234567890', code });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data.user).toBeDefined();
        expect(res.body.data.tokens).toBeDefined();
        expect(res.body.data.tokens.accessToken).toBeDefined();
        expect(res.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should handle invalid verification code', async () => {
        const res = await request(app)
            .post('/auth/sms/verify')
            .set('x-tenant-id', testTenant._id)
            .send({ phone: '+1234567890', code: '111111' });

        expect(res.status).toBe(401);
        expect(res.body.status).toBe('error');
        expect(res.body.message).toBe('User not found');
    });

    it('should enforce rate limiting on verification requests', async () => {
        // Make multiple requests in quick succession
        for (let i = 0; i < 5; i++) {
            await request(app)
                .post('/auth/sms/request')
                .set('x-tenant-id', testTenant._id)
                .send({ phone: '+1987654321' });
        }

        // This request should be rate limited
        const res = await request(app)
            .post('/auth/sms/request')
            .set('x-tenant-id', testTenant._id)
            .send({ phone: '+1987654321' });

        expect(res.status).toBe(429);
        expect(res.body.status).toBe('error');
        expect(res.body.message).toBe('Too many requests, please try again later');
    });

    it('should validate phone number country', async () => {
        const res = await request(app)
            .post('/auth/sms/request')
            .set('x-tenant-id', testTenant._id)
            .send({ phone: '+911234567890' }); // Indian phone number

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('error');
        expect(res.body.message).toBe('Phone number country is not allowed');
    });
}); 