# CELLS — Test Plan & Viva Preparation Guide

## 1. Automated Test Execution & RBAC Verification Suite

The backend contains comprehensive automated integration tests executing against real MySQL test tables (`backend/tests/api.test.js`).

Run tests using:
```bash
cd backend
npm test
```

### Complete 12-Point RBAC Automated Test Matrix

| ID | Required Test Scenario | HTTP Endpoint | Expected Outcome | Result |
|---|---|---|---|---|
| **TC-01** | A Blood Bank user cannot create a blood request | `POST /api/requests` | HTTP 403 Forbidden | **PASS** |
| **TC-02** | A Hospital user cannot approve or reject a blood request | `PATCH /api/requests/:id/accept` | HTTP 403 Forbidden | **PASS** |
| **TC-03** | A Doctor cannot modify blood-bank inventory | `PATCH /api/inventory/:id` | HTTP 403 Forbidden | **PASS** |
| **TC-04** | A Requestor cannot approve their own request | `PATCH /api/requests/:id/accept` | HTTP 403 Forbidden | **PASS** |
| **TC-05** | A Donor cannot create a patient blood request | `POST /api/requests` | HTTP 403 Forbidden | **PASS** |
| **TC-06** | A Donor cannot approve a blood-bank request | `PATCH /api/requests/:id/accept` | HTTP 403 Forbidden | **PASS** |
| **TC-07** | A Blood Bank cannot modify another Blood Bank's inventory | `PATCH /api/inventory/:id` | HTTP 403 Forbidden (Ownership Isolation) | **PASS** |
| **TC-08** | A Hospital cannot access another Hospital's private requests | `GET /api/requests/:id` | HTTP 403 Forbidden (Privacy Isolation) | **PASS** |
| **TC-09** | A Requestor cannot access another Requestor's private information | `GET /api/requests/:id` | HTTP 403 Forbidden (Privacy Isolation) | **PASS** |
| **TC-10** | An unauthenticated user cannot access protected APIs | `POST /api/requests` (no token) | HTTP 401 Unauthorized | **PASS** |
| **TC-11** | A Super Admin can verify organization accounts | `PATCH /api/admin/verifications/blood-banks/:id` | HTTP 200 OK | **PASS** |
| **TC-12** | A normal user cannot assign themselves a Super Admin role | `POST /api/auth/register` (role: admin) | HTTP 403 Forbidden | **PASS** |

All 12 test assertions pass in CI/CD and local development execution.

---

## 2. Common Viva Examination Questions & Answers

### Q1: How did you ensure data consistency during simultaneous blood requests?
**Answer:** We implemented ACID database transactions in MySQL with `SELECT ... FOR UPDATE` row-level locking. When a blood bank officer issues units from a batch, the row is locked until the deduction, audit transaction log, and request fulfillment counter are committed. This prevents race-condition overbooking and negative stock balances.

### Q2: Why did you enforce Role-Based Access Control (RBAC) at three distinct technical levels?
**Answer:** 
1. **Frontend Level:** Conditional navigation bars and route guards prevent unauthorized URL access and declutter the user interface.
2. **Backend API Level:** Every endpoint passes through `authenticateToken` (JWT validation) and `authorizeRoles(...)` middleware. Sensitive resource access checks ownership in the database, guaranteeing HTTP 403 Forbidden even if an attacker uses Postman or cURL.
3. **Database Level:** Foreign key constraints, separate tables (`donor_interests`, `donations`, `audit_logs`), and transactional constraints enforce relational integrity and audit trails.

### Q3: Why is a Donor's "Willingness to Donate" kept separate from clinical Blood Requisitions?
**Answer:** A blood requisition is an emergency clinical order submitted by a verified hospital or doctor for a specific patient. A donor's response is an expression of voluntary willingness (a pledge). Under clinical transfusion safety regulations, voluntary pledges cannot directly fulfill an order without in-person viral screening, crossmatching, and official stock intake certified by authorized blood bank staff.

### Q4: How is the Super Administrator role isolated from clinical operations?
**Answer:** The Super Administrator manages platform governance (verifying hospital and blood bank credentials, reviewing immutable audit logs, suspending fraudulent accounts). The administrator is strictly prohibited from altering blood batch statuses, approving clinical requisitions, or overriding lab safety quarantine flags.
