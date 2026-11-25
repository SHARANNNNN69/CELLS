# CELLS — Test Plan & Viva Preparation Guide

## 1. Automated Test Execution

The backend contains automated integration tests executing against real MySQL test tables (`backend/tests/api.test.js`).

Run tests using:
```bash
cd backend
npm test
```

### Automated Test Matrix
| ID | Test Scenario | Expected Outcome | Status |
|---|---|---|---|
| **TC-01** | Health check endpoint (`GET /api/health`) | HTTP 200, status `HEALTHY`, MySQL connection verified | PASS |
| **TC-02** | Login with incorrect password | HTTP 401, error message returned | PASS |
| **TC-03** | Valid login with correct credentials | HTTP 200, JWT token returned, correct role | PASS |
| **TC-04** | Role-Based Access Control (RBAC) denial | HTTP 403 when Donor attempts to access Blood Bank batch management | PASS |
| **TC-05** | Public blood bank discovery query | HTTP 200, only verified banks returned with tested stock counts | PASS |
| **TC-06** | Potential donor query privacy masking | HTTP 200, donor names masked with `***` | PASS |
| **TC-07** | Stock transaction safety (Quarantine check) | HTTP 400 rejection when attempting to issue from `quarantined` batch | PASS |

---

## 2. Common Viva Examination Questions & Answers

### Q1: How did you ensure data consistency during simultaneous blood requests?
**Answer:** We implemented ACID database transactions in MySQL with `SELECT ... FOR UPDATE` row-level locking. When a blood bank officer issues units from a batch, the row is locked until the deduction, audit transaction log, and request fulfillment counter are committed. This prevents race-condition overbooking and negative stock balances.

### Q2: Why did you separate `users` from `donor_profiles` and `hospital_staff`?
**Answer:** We normalized the database following 3NF (Third Normal Form). The `users` table handles central authentication, password hashing, and login credentials, while role-specific tables store domain-specific attributes (e.g. license numbers for institutions, ABO/Rh and last donation dates for donors) without storing sparse NULL columns.

### Q3: How is medical safety maintained in the application?
**Answer:** The system strictly labels all records as preliminary discovery and demonstrative. Quarantined or expired batches are programmatically blocked from stock calculations and cannot be issued. In accordance with clinical blood transfusion laws, physical crossmatching and laboratory screening remain mandatory before release.
