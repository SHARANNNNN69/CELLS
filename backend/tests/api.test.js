import { test, describe } from 'node:test';
import assert from 'node:assert';

let baseUrl = process.env.BASE_URL || 'http://localhost:5000';

async function getToken(email, password) {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    return json.data?.token;
}

describe('CELLS – Strict Role-Based Access Control (RBAC) & Workflow Test Suite', () => {

    test('1. A Blood Bank user cannot create a blood request (HTTP 403)', async () => {
        const token = await getToken('staff@metroblood.org', 'Bank@1234');
        const res = await fetch(`${baseUrl}/api/requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                patient_name: 'Illegal BloodBank Request',
                blood_group: 'O+',
                component: 'Whole Blood',
                units_needed: 2,
                urgency: 'urgent',
                required_by: '2026-12-01T10:00:00',
                contact_phone: '+91-9876543210',
                delivery_address: 'Main St',
                city: 'Bangalore'
            })
        });
        const json = await res.json();
        assert.strictEqual(res.status, 403);
        assert.strictEqual(json.success, false);
    });

    test('2. A Hospital user cannot approve or reject a blood request (HTTP 403)', async () => {
        const token = await getToken('doctor@citycare.org', 'Hosp@1234');
        const res = await fetch(`${baseUrl}/api/requests/1/accept`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        assert.strictEqual(res.status, 403);
        assert.strictEqual(json.success, false);
    });

    test('3. A Doctor cannot modify inventory (HTTP 403)', async () => {
        const token = await getToken('doctor@citycare.org', 'Hosp@1234');
        const res = await fetch(`${baseUrl}/api/inventory/1`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'tested_safe' })
        });
        const json = await res.json();
        assert.strictEqual(res.status, 403);
        assert.strictEqual(json.success, false);
    });

    test('4. A Requestor cannot approve their own request (HTTP 403)', async () => {
        const token = await getToken('requester.amit@cells.sample', 'Req@1234');
        const res = await fetch(`${baseUrl}/api/requests/1/accept`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        assert.strictEqual(res.status, 403);
        assert.strictEqual(json.success, false);
    });

    test('5. A Donor cannot create a patient blood request (HTTP 403)', async () => {
        const token = await getToken('donor.rajesh@cells.sample', 'Donor@1234');
        const res = await fetch(`${baseUrl}/api/requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                patient_name: 'Donor Attempting Patient Request',
                blood_group: 'O+',
                units_needed: 1,
                required_by: '2026-12-01T10:00:00',
                contact_phone: '+91-9876543210',
                delivery_address: 'City Center',
                city: 'Bangalore'
            })
        });
        const json = await res.json();
        assert.strictEqual(res.status, 403);
        assert.strictEqual(json.success, false);
    });

    test('6. A Donor cannot approve a blood-bank request (HTTP 403)', async () => {
        const token = await getToken('donor.rajesh@cells.sample', 'Donor@1234');
        const res = await fetch(`${baseUrl}/api/requests/1/accept`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        assert.strictEqual(res.status, 403);
        assert.strictEqual(json.success, false);
    });

    test('7. A Blood Bank cannot modify another Blood Bank inventory (HTTP 403)', async () => {
        // Metro Bank staff (bank_id: 1) attempts to modify batch #7 (belongs to Apollo Bank, bank_id: 2)
        const token = await getToken('staff@metroblood.org', 'Bank@1234');
        const res = await fetch(`${baseUrl}/api/inventory/7`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'tested_safe' })
        });
        const json = await res.json();
        assert.strictEqual(res.status, 403);
        assert.match(json.message, /another blood bank/i);
    });

    test('8. A Hospital cannot access another Hospital private requests (HTTP 403)', async () => {
        // St. Jude Doctor (hospital_id: 2) attempts to view request #2 (belongs to CityCare Hospital, hospital_id: 1)
        const token = await getToken('doctor@stjude.org', 'Hosp@1234');
        const res = await fetch(`${baseUrl}/api/requests/2`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        assert.strictEqual(res.status, 403);
        assert.match(json.message, /another hospital/i);
    });

    test('9. A Requestor cannot access another Requestor private information (HTTP 403)', async () => {
        // Register a second requester
        const regRes = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: 'Sneha Requester',
                email: `sneha.${Date.now()}@sample.org`,
                password: 'Password@123',
                phone: '+91-9988776655',
                role: 'requester'
            })
        });
        const { data: { token: snehaToken } } = await regRes.json();

        // Sneha attempts to access private request #1 (created by requester Amit Sengupta, user_id: 6)
        const res = await fetch(`${baseUrl}/api/requests/1`, {
            headers: { 'Authorization': `Bearer ${snehaToken}` }
        });
        const json = await res.json();
        assert.strictEqual(res.status, 403);
        assert.match(json.message, /another requestor/i);
    });

    test('10. An unauthenticated user cannot access protected APIs (HTTP 401)', async () => {
        const res = await fetch(`${baseUrl}/api/inventory`);
        assert.strictEqual(res.status, 401);
    });

    test('11. A Super Admin can verify organization accounts (HTTP 200)', async () => {
        const token = await getToken('admin@cells.org', 'Admin@1234');
        // Verify pending hospital #3
        const res = await fetch(`${baseUrl}/api/admin/verifications/hospital/3`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'verified' })
        });
        const json = await res.json();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(json.success, true);
    });

    test('12. A normal user cannot assign themselves a Super Admin role (HTTP 403)', async () => {
        const res = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: 'Hacker Admin Candidate',
                email: `hacker.${Date.now()}@sample.org`,
                password: 'Password@123',
                phone: '+91-9999999999',
                role: 'admin'
            })
        });
        const json = await res.json();
        assert.strictEqual(res.status, 403);
        assert.strictEqual(json.success, false);
        assert.match(json.message, /prohibited/i);
    });
});
