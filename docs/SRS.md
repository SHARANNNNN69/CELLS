# CELLS — Software Requirements Specification (SRS)
## Blood Donation & Emergency Management Network

**Course Title:** Software Engineering (SE) & Web Technology (WT)  
**Project:** CELLS — Emergency Blood Coordination & Traceable Inventory Prototype  
**Date:** November 2026  
**Document Version:** 1.0.0  

---

## 1. Introduction

### 1.1 Purpose
The purpose of CELLS is to provide a reliable, full-stack digital network that bridges patients/requesters, certified regional blood banks, hospitals, and voluntary blood donors. The system accelerates blood dispatch during acute clinical emergencies, provides transparent inventory visibility, and strictly enforces laboratory safety boundaries.

### 1.2 Scope
- **Domain:** Healthcare logistics and emergency coordination.
- **Coverage:** Regional and pan-network prototype using verified synthetic demonstration data.
- **Key Boundary:** CELLS is a logistics coordination prototype and **not a medical device**. Physical crossmatching, infectious disease screening, and blood compatibility certifications remain under the sole jurisdiction of licensed transfusion laboratories.

---

## 2. Stakeholders & User Roles

| Role | Permissions & Responsibilities |
|---|---|
| **1. Public Visitor** | Search verified blood bank inventory by component and blood group; view potential donor leads (contact masked); locate certified blood banks on map. |
| **2. Voluntary Donor** | Manage donor profile, self-report availability status, view 90-day donation interval reminders, log donation history, configure privacy settings. |
| **3. Patient / Requester** | Create emergency or standard blood requisitions; track progress and responses; receive fulfillment notifications. |
| **4. Hospital Representative** | Submit institutional blood requisitions for admitted patients; verify incoming blood unit availability; coordinate dispatch. |
| **5. Blood Bank Staff** | Manage inventory batches (collection date, expiry, testing status); execute quarantine-to-release workflow; fulfill requisitions atomically with database transactions. |
| **6. Super Administrator** | Verify state blood bank & hospital licenses; suspend or activate user accounts; inspect platform security audit logs and aggregate analytics. |

---

## 3. Functional Requirements

### Module 1: Authentication & Authorization (FR-AUTH)
- **FR-AUTH-1:** The system shall authenticate users via JSON Web Tokens (JWT) with bcrypt-hashed passwords.
- **FR-AUTH-2:** Role-based access control (RBAC) must be enforced on both server endpoints and client routes.
- **FR-AUTH-3:** Onboarding workflows shall configure role-specific profiles upon registration (e.g., blood bank license numbers or donor ABO/Rh details).

### Module 2: Blood Requisition & Emergency Dispatch (FR-REQ)
- **FR-REQ-1:** Requesters may create blood requests categorized by urgency: Standard, Urgent (24h), and Emergency (0-6h).
- **FR-REQ-2:** Emergency requisitions must dispatch automated in-app notifications to all matching blood banks and registered voluntary donors within the same geographic region.
- **FR-REQ-3:** The system must maintain a status timeline for every request (`open`, `partially_fulfilled`, `fulfilled`, `cancelled`).

### Module 3: Inventory Management & Atomic Fulfillment (FR-INV)
- **FR-INV-1:** Stock is recorded by batch with fields: `batch_number`, `blood_group`, `component`, `units_available`, `collection_date`, `expiry_date`, and `status`.
- **FR-INV-2:** Expired, quarantined, or rejected batches shall **never** be counted as available stock for public or requisition fulfillment.
- **FR-INV-3:** Stock issuance must execute inside an ACID transaction (`FOR UPDATE` locking) to eliminate race conditions, duplicate reservations, or negative balances.
- **FR-INV-4:** Every inventory addition, deduction, or status adjustment must generate an immutable entry in the `inventory_transactions` audit log.

### Module 4: Privacy & Donor Safety (FR-SAFE)
- **FR-SAFE-1:** Donor contact details (phone and email) must be masked in public listings.
- **FR-SAFE-2:** Informational alerts shall flag donors whose last donation date was under 90 days ago.

---

## 4. Non-Functional Requirements

- **NFR-PERF:** API response times under 150ms for stock queries.
- **NFR-SEC:** Protection against SQL injection via parameterized queries, XSS protection, and salted bcrypt password hashing.
- **NFR-REL:** Database transaction rollback on stock fulfillment failures.
- **NFR-ACC:** Responsive user interface compliant with WCAG AA contrast standards.
