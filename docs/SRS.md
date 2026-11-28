# CELLS — Software Requirements Specification (SRS)
## Blood Donation & Emergency Management Network

**Course Title:** Software Engineering (SE) & Web Technology (WT)  
**Project:** CELLS — Emergency Blood Coordination & Traceable Inventory Network  
**Date:** November 2026  
**Document Version:** 2.0.0 (Strict RBAC & Operational Workflow Edition)  

---

## 1. Introduction

### 1.1 Purpose
The purpose of CELLS is to provide a reliable, full-stack digital network that bridges patients/requesters, certified regional blood banks, hospitals/doctors, and voluntary blood donors. The system coordinates emergency blood requisitions, enforces strict role-based access control (RBAC), provides transparent inventory visibility, and strictly enforces clinical laboratory safety boundaries.

### 1.2 Scope & Clinical Boundary
- **Domain:** Healthcare logistics and emergency blood coordination.
- **Key Boundary:** CELLS is a logistics coordination and inventory management platform and **not a diagnostic medical device**. Physical crossmatching, infectious disease screening (HIV, HBV, HCV, Syphilis, Malaria), and blood compatibility certifications remain under the sole jurisdiction of authorized blood bank staff.

---

## 2. Role-Based Access Control (RBAC) Specifications

CELLS strictly defines 5 primary operational user roles:

### 2.1 Blood Bank User
- **Responsibilities:** Exclusive blood-bank inventory management, collection batch tracking, expiry & quarantine surveillance, incoming clinical requisition review, operational acceptance/rejection, stock allocation/reservation, cold-chain dispatch, and certified donation intake recording.
- **Strict Restrictions:** Cannot create blood requests, cannot request blood from other banks, cannot access patient-only portals, cannot donate blood through the donor portal, cannot touch other blood banks' inventories.

### 2.2 Hospital / Doctor User
- **Responsibilities:** Request-only institutional account. Submits emergency and standard clinical blood requisitions for admitted patients, specifies patient name, component, units, and urgency, tracks requisition lifecycle, reviews blood bank responses, and cancels eligible pending requisitions.
- **Strict Restrictions:** Cannot approve or reject blood requests, cannot modify inventory or add stock, cannot mark blood as dispatched or issued, cannot access blood bank administrative dashboards.

### 2.3 Patient / Requestor User
- **Responsibilities:** Request-only individual account. Searches blood bank stock by component and city, submits emergency blood requests, specifies delivery hospital/ward, tracks progress through the lifecycle, receives status notifications, and cancels pending requests.
- **Strict Restrictions:** Cannot approve requests, cannot alter blood bank stock, cannot dispatch units, cannot access hospital or bank administration.

### 2.4 Voluntary Donor User
- **Responsibilities:** Limited donor account. Registers donor profile (ABO/Rh group, city, availability), views active donation opportunities, expresses willingness to donate (pledge), views certified donation history, and receives 90-day interval reminders.
- **Strict Restrictions:** Cannot create patient blood requests, cannot approve or reject blood requests, cannot modify inventory, cannot self-certify a donation. (Willingness to donate ≠ confirmed donation).

### 2.5 Super Administrator
- **Responsibilities:** Platform governance. Verifies hospital and blood bank facility licenses, approves/rejects institutional credentials, suspends or deactivates accounts, monitors platform-wide telemetry, and inspects immutable security audit logs.
- **Strict Restrictions:** Cannot make clinical blood compatibility decisions, cannot override lab safety tests, cannot approve clinical requisitions.

---

## 3. Role Permission Matrix

| Operation | Blood Bank | Hospital/Doctor | Requestor | Donor | Super Admin |
|---|---|---|---|---|---|
| Create blood request | ❌ NO | ✅ YES | ✅ YES | ❌ NO | ❌ NO |
| View incoming requests | ✅ YES | ❌ NO | ❌ NO | Donation alerts only | Monitoring only |
| Approve/reject blood request | ✅ YES | ❌ NO | ❌ NO | ❌ NO | ❌ NO |
| Manage inventory stock | ✅ Own bank only | ❌ NO | ❌ NO | ❌ NO | ❌ NO |
| View reported public stock | ✅ YES | ✅ YES | ✅ YES | ❌ NO | ✅ YES |
| Express donation interest | ❌ NO | ❌ NO | ❌ NO | ✅ YES | ❌ NO |
| Record completed donation | ✅ Authorized staff | ❌ NO | ❌ NO | ❌ NO | ❌ NO |
| Issue / dispatch blood | ✅ Authorized staff | ❌ NO | ❌ NO | ❌ NO | ❌ NO |
| Verify organizations | ❌ NO | ❌ NO | ❌ NO | ❌ NO | ✅ YES |
| Manage platform users | ❌ NO | ❌ NO | ❌ NO | ❌ NO | ✅ YES |

---

## 4. Operational Requisition Lifecycle & Workflow

A clinical blood requisition progresses strictly through the following state pipeline:

1. **PENDING:** A Hospital/Doctor or Patient/Requestor submits a blood request. Status is initialized as `pending`.
2. **ACCEPTED or REJECTED:** Authorized blood bank personnel review incoming requests. If the blood bank can supply the units, they ACCEPT; otherwise, they REJECT with an authorized reason.
3. **PROCESSING:** If accepted, the blood bank sets the fulfillment status to `processing`, reserving units from non-quarantined batches and initiating crossmatching.
4. **DISPATCHED:** The blood bank marks the requisition as `dispatched` once packed in temperature-controlled cold-chain containers.
5. **COMPLETED:** The units are atomically deducted from inventory and the requisition is marked `completed`.
6. **CANCELLED:** A pending requisition can only be cancelled by its original requester prior to blood bank processing.

---

## 5. Technical Enforcement at Three Levels

1. **Frontend Level:** Conditional navigation and route guards redirect unauthorized roles to their respective dashboards. Role-restricted buttons and actions are hidden or disabled.
2. **Backend API Level:** Every endpoint validates JWT tokens (`authenticateToken`) and enforces role whitelist middleware (`authorizeRoles(...)`). Resource ownership checks guarantee that a blood bank cannot alter another bank's batches, and users cannot access private records of others (HTTP 403 Forbidden).
3. **Database Level:** Foreign key relationships, dedicated tables (`donor_interests`, `donations`, `inventory_transactions`), and `SELECT ... FOR UPDATE` row locks guarantee ACID compliance and complete auditability.
