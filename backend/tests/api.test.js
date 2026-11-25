import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import app from '../src/server.js';
import pool from '../src/config/db.js';

let server;
let baseUrl;

before(async () => {
    await new Promise((resolve) => {
        server = http.createServer(app);
        server.listen(5099, () => {
            baseUrl = 'http://localhost:5099';
            resolve();
        });
    });
});

after(async () => {
    if (server) {
        await new Promise((resolve) => server.close(resolve));
    }
    await pool.end();
});

describe('CELLS System Integration Tests', () => {

    test('1. Health Check returns 200 OK and database status', async () => {
        const res = await fetch(`${baseUrl}/api/health`);
        const json = await res.json();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(json.success, true);
        assert.strictEqual(json.data.status, 'HEALTHY');
    });

    test('2. Authentication: Reject login with incorrect password', async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'donor.rajesh@cells.sample',
                password: 'WrongPassword999'
            })
        });
        const json = await res.json();
        assert.strictEqual(res.status, 401);
        assert.strictEqual(json.success, false);
    });

    test('3. Authentication: Successful login returns JWT and user role', async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'staff@metroblood.org',
                password: 'Bank@1234'
            })
        });
        const json = await res.json();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(json.success, true);
        assert.ok(json.data.token);
        assert.strictEqual(json.data.user.role, 'blood_bank');
    });

    test('4. RBAC Authorization: Donor cannot access Blood Bank inventory batches directly', async () => {
        // Login as Donor
        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'donor.rajesh@cells.sample',
                password: 'Donor@1234'
            })
        });
        const loginJson = await loginRes.json();
        const donorToken = loginJson.data.token;

        // Attempt to access restricted blood bank inventory
        const invRes = await fetch(`${baseUrl}/api/inventory`, {
            headers: { 'Authorization': `Bearer ${donorToken}` }
        });
        const invJson = await invRes.json();
        assert.strictEqual(invRes.status, 403);
        assert.strictEqual(invJson.success, false);
    });

    test('5. Public Blood Bank Search returns verified banks and stock count', async () => {
        const res = await fetch(`${baseUrl}/api/bloodbanks?city=Bangalore`);
        const json = await res.json();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(json.success, true);
        assert.ok(Array.isArray(json.data.banks));
        assert.ok(json.data.banks.length > 0);
    });

    test('6. Potential Donor Leads with Privacy Masking', async () => {
        const res = await fetch(`${baseUrl}/api/donors?blood_group=O%2B`);
        const json = await res.json();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(json.success, true);
        assert.ok(json.data.donors.length > 0);
        // Verify privacy masking is active
        const donor = json.data.donors[0];
        assert.ok(donor.masked_name.includes('***'));
    });

    test('7. Inventory Transaction Safety: Prevent deduction from Quarantined batch', async () => {
        // Login as Blood Bank Staff
        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'staff@metroblood.org',
                password: 'Bank@1234'
            })
        });
        const { data: { token } } = await loginRes.json();

        // Batch 6 in seed data is quarantined ('MCBB-2026-A106')
        const fulfillRes = await fetch(`${baseUrl}/api/requests/1/fulfill`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                batch_id: 6,
                units_to_deduct: 1
            })
        });
        const fulfillJson = await fulfillRes.json();
        assert.strictEqual(fulfillRes.status, 400);
        assert.match(fulfillJson.message, /quarantined/i);
    });
});
