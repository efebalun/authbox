const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../src/app');

let mongoServer;

describe('System API Tests', () => {
    let systemToken;

    beforeAll(async () => {
        // Setup MongoDB Memory Server
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        // Set required environment variables for testing
        process.env.SYSTEM_API_SECRET = 'your-system-api-secret-key';
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    describe('System Authentication', () => {
        it('should generate system token with valid secret', async () => {
            const res = await request(app)
                .post('/system/token')
                .send({
                    secret: process.env.SYSTEM_API_SECRET
                });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toHaveProperty('token');
            
            // Save token for other tests
            systemToken = res.body.data.token;
        });

        it('should reject invalid system secret', async () => {
            const res = await request(app)
                .post('/system/token')
                .send({
                    secret: 'invalid-secret'
                });

            expect(res.status).toBe(401);
            expect(res.body.status).toBe('error');
        });
    });

    describe('System Core Management', () => {
        beforeEach(() => {
            expect(systemToken).toBeDefined();
        });

        it('should get system settings', async () => {
            const res = await request(app)
                .get('/system/settings')
                .set('Authorization', `Bearer ${systemToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.settings).toHaveProperty('maintenance');
        });

        it('should update system settings', async () => {
            const res = await request(app)
                .put('/system/settings')
                .set('Authorization', `Bearer ${systemToken}`)
                .send({
                    maintenance: {
                        isEnabled: false,
                        message: 'System is operational'
                    }
                });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.settings.maintenance.isEnabled).toBe(false);
        });

        it('should get email templates', async () => {
            const res = await request(app)
                .get('/system/email-templates')
                .set('Authorization', `Bearer ${systemToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toHaveProperty('templates');
        });

        it('should update email templates', async () => {
            const res = await request(app)
                .put('/system/email-templates')
                .set('Authorization', `Bearer ${systemToken}`)
                .send({
                    welcome: {
                        subject: 'Welcome to our platform',
                        body: 'Welcome {{name}}!'
                    },
                    resetPassword: {
                        subject: 'Reset your password',
                        body: 'Click here to reset: {{resetLink}}'
                    },
                    emailVerification: {
                        subject: 'Verify your email',
                        body: 'Click here to verify: {{verificationLink}}'
                    }
                });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
        });

        it('should get system statistics', async () => {
            const res = await request(app)
                .get('/system/stats')
                .set('Authorization', `Bearer ${systemToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toHaveProperty('stats');
        });

        it('should get system logs', async () => {
            const res = await request(app)
                .get('/system/logs')
                .set('Authorization', `Bearer ${systemToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toHaveProperty('logs');
        });

        it('should trigger system backup', async () => {
            const res = await request(app)
                .post('/system/backup')
                .set('Authorization', `Bearer ${systemToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
        });
    });

    describe('Tenant Management', () => {
        let testTenantId;
        const testTenant = {
            name: 'Test Tenant',
            slug: `test-tenant-${Date.now()}`,
            domains: ['test.com'],
            jwtSecret: 'test-secret'
        };

        beforeEach(() => {
            expect(systemToken).toBeDefined();
        });

        it('should create new tenant', async () => {
            const res = await request(app)
                .post('/system/tenants')
                .set('Authorization', `Bearer ${systemToken}`)
                .send(testTenant);

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data.tenant).toMatchObject({
                name: testTenant.name,
                domains: testTenant.domains
            });

            testTenantId = res.body.data.tenant._id;
        });

        it('should get all tenants', async () => {
            const res = await request(app)
                .get('/system/tenants')
                .set('Authorization', `Bearer ${systemToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.data.tenants)).toBe(true);
        });

        it('should get tenant users', async () => {
            expect(testTenantId).toBeDefined();
            
            const res = await request(app)
                .get(`/system/tenants/${testTenantId}/users`)
                .set('Authorization', `Bearer ${systemToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.data.users)).toBe(true);
        });

        it('should get tenant validation schema', async () => {
            expect(testTenantId).toBeDefined();

            const res = await request(app)
                .get(`/system/tenants/${testTenantId}/validation-schema`)
                .set('Authorization', `Bearer ${systemToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
        });

        it('should create tenant validation schema', async () => {
            expect(testTenantId).toBeDefined();

            const res = await request(app)
                .post(`/system/tenants/${testTenantId}/validation-schema`)
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
                                required: true,
                                tokenExpiry: 3600
                            }
                        }
                    }
                });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
        });

        it('should update tenant validation schema', async () => {
            expect(testTenantId).toBeDefined();

            const res = await request(app)
                .put(`/system/tenants/${testTenantId}/validation-schema`)
                .set('Authorization', `Bearer ${systemToken}`)
                .send({
                    authMethods: {
                        emailPassword: {
                            enabled: true,
                            passwordPolicy: {
                                minLength: 10
                            }
                        }
                    }
                });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
        });

        it('should deactivate tenant', async () => {
            expect(testTenantId).toBeDefined();

            const res = await request(app)
                .delete(`/system/tenants/${testTenantId}`)
                .set('Authorization', `Bearer ${systemToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.message).toBe('Tenant deactivated successfully');

            // Get the tenant and verify it's deactivated
            const getRes = await request(app)
                .get(`/system/tenants/${testTenantId}`)
                .set('Authorization', `Bearer ${systemToken}`);

            expect(getRes.status).toBe(200);
            expect(getRes.body.data.tenant.active).toBe(false);
        });
    });
}); 