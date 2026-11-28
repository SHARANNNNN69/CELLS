# CELLS — Data Flow, Sequence Diagrams & Operational Lifecycle

## 1. Context Diagram (Level 0 DFD) — 5 Distinct Platform Roles

```mermaid
flowchart TD
    Hospital["Hospital / Doctor (Requisition-Only)"]
    Requester["Patient / Requestor (Requisition-Only)"]
    Donor["Voluntary Blood Donor (Pledge & Profile)"]
    Bank["Blood Bank Transfusion Staff (Inventory & Fulfillment)"]
    Admin["Super Administrator (Platform Governance)"]
    CELLS["(( CELLS Emergency Blood Network ))"]

    Hospital -->|"Submit Clinical Blood Order"| CELLS
    Requester -->|"Submit Emergency Request"| CELLS
    CELLS -->|"Live Tracking & Dispatch Updates"| Hospital
    CELLS -->|"Status Notifications"| Requester

    Donor -->|"Express Willingness to Donate"| CELLS
    CELLS -->|"Eligible Blood Alert Feeds"| Donor

    Bank -->|"Manage Inventory & Issue Units"| CELLS
    CELLS -->|"Incoming Requisitions & Donor Leads"| Bank

    Admin -->|"Verify Facilities & Audit System"| CELLS
    CELLS -->|"System Metrics & Audit Ledger"| Admin
```

---

## 2. Requisition Lifecycle & Role State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING: Hospital or Requestor creates Requisition
    PENDING --> CANCELLED: Requestor cancels (Pending only)
    PENDING --> REJECTED: Blood Bank Rejects (Stock unavailable)
    PENDING --> ACCEPTED: Blood Bank Accepts
    ACCEPTED --> PROCESSING: Blood Bank Reserves Stock & Crossmatches
    PROCESSING --> DISPATCHED: Blood Bank Dispatches via Cold-Chain
    DISPATCHED --> COMPLETED: Atomic Stock Fulfillment Certified
    COMPLETED --> [*]
    CANCELLED --> [*]
    REJECTED --> [*]
```

---

## 3. Separate Voluntary Donor Workflow

```mermaid
sequenceDiagram
    autonumber
    actor D as Voluntary Donor
    participant Client as Frontend Portal
    participant Server as Backend API
    participant DB as MySQL Database
    actor B as Blood Bank Officer

    D->>Client: Views active requisition matching blood group
    D->>Client: Clicks "Express Willingness to Donate"
    Client->>Server: POST /api/requests/:id/donor-interest (JWT strictly donor)
    Server->>DB: INSERT INTO donor_interests (donor_user_id, request_id, notes)
    Server-->>Client: 201 Created (Pledge logged)
    Client-->>D: "Willingness Pledged — Screening Required"
    DB-->>B: Notification of willing donor contact lead
    Note over B,D: Physical Camp / Center intake & lab testing
    B->>Server: POST /api/donations/record (Certified intake by Blood Bank)
    Server->>DB: INSERT INTO donations (units_donated, recorded_by_user_id)
```

---

## 4. Sequence Diagram: Emergency Blood Request Dispatch

```mermaid
sequenceDiagram
    autonumber
    actor R as Hospital Doctor / Requester
    participant Client as Frontend (React)
    participant Server as Backend API (Express)
    participant DB as MySQL Database
    actor B as Blood Bank Staff
    actor D as Nearby Donor

    R->>Client: Fills Emergency Request (e.g. 2 units O+ PRBC)
    Client->>Server: POST /api/requests (Role checked: hospital/requester)
    Server->>DB: INSERT INTO blood_requests (status = 'pending')
    Note over Server,DB: Urgency = 'emergency' detected
    Server->>DB: Query nearby blood banks & matching donors in city
    Server->>DB: INSERT INTO notifications (Bulk in-app alerts)
    Server-->>Client: 201 Created (Request #ID)
    Client-->>R: Displays Requisition Status & Tracking Timeline
    DB-->>B: In-app Notification: "🚨 Emergency Blood Alert"
    DB-->>D: In-app Notification: "Urgent Donor Need Near You"
```

---

## 5. Sequence Diagram: Atomic Stock Deduction & Requisition Fulfillment

```mermaid
sequenceDiagram
    autonumber
    actor B as Blood Bank Officer
    participant Server as Backend API
    participant DB as MySQL Database (InnoDB)

    B->>Server: PATCH /api/requests/:id/fulfill { batch_id, units_to_deduct }
    Note over Server: Role checked: strictly blood_bank or admin
    Server->>DB: START TRANSACTION
    Server->>DB: SELECT * FROM inventory_batches WHERE id = ? FOR UPDATE
    Note over Server,DB: Row-level lock acquired on batch
    Server->>Server: Verify ownership + status == 'tested_safe' AND expiry >= CURDATE() AND available >= units
    Server->>DB: UPDATE inventory_batches SET units_available = units_available - ?
    Server->>DB: INSERT INTO inventory_transactions (change: -units, type: 'fulfillment')
    Server->>DB: UPDATE blood_requests SET units_fulfilled = units_fulfilled + ?, status = 'completed'
    Server->>DB: COMMIT TRANSACTION
    Server-->>B: 200 OK (Units successfully issued and deducted)
```
