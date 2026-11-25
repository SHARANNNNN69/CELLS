# CELLS — Data Flow & Sequence Diagrams

## 1. Context Diagram (Level 0 DFD)

```mermaid
flowchart TD
    Requester["Patient / Hospital Requester"]
    Donor["Voluntary Blood Donor"]
    Bank["Blood Bank Transfusion Staff"]
    Admin["System Administrator"]
    CELLS["(( CELLS Emergency Blood System ))"]

    Requester -->|"Submit blood requisition / Urgency classification"| CELLS
    CELLS -->|"Requisition status, response offers, dispatch details"| CELLS
    CELLS -->|"Real-time emergency alerts & matching requests"| Donor
    Donor -->|"Donor availability & voluntary contact consent"| CELLS
    Bank -->|"Inventory batch data & tested units release"| CELLS
    CELLS -->|"Requisition notifications & atomic deduction order"| Bank
    Admin -->|"License approvals & account controls"| CELLS
    CELLS -->|"Platform audit logs & inventory telemetry"| Admin
```

---

## 2. Sequence Diagram: Emergency Blood Request Dispatch

```mermaid
sequenceDiagram
    autonumber
    actor R as Requester
    participant Client as Frontend (React)
    participant Server as Backend API (Express)
    participant DB as MySQL Database
    actor B as Blood Bank Staff
    actor D as Nearby Donor

    R->>Client: Fills Emergency Request (e.g. 2 units O+ PRBC)
    Client->>Server: POST /api/requests (JWT + Payload)
    Server->>DB: INSERT INTO blood_requests
    Note over Server,DB: Urgency = 'emergency' detected
    Server->>DB: Query nearby blood banks & matching donors in city
    Server->>DB: INSERT INTO notifications (Bulk in-app alerts)
    Server-->>Client: 201 Created (Request #ID)
    Client-->>R: Displays Requisition Status & Tracking Timeline
    DB-->>B: In-app Notification: "🚨 Emergency Blood Alert"
    DB-->>D: In-app Notification: "Urgent Donor Need Near You"
```

---

## 3. Sequence Diagram: Atomic Stock Deduction & Requisition Fulfillment

```mermaid
sequenceDiagram
    autonumber
    actor B as Blood Bank Officer
    participant Server as Backend API
    participant DB as MySQL Database (InnoDB)

    B->>Server: PATCH /api/requests/:id/fulfill { batch_id, units_to_deduct }
    Server->>DB: START TRANSACTION
    Server->>DB: SELECT * FROM inventory_batches WHERE id = ? FOR UPDATE
    Note over Server,DB: Row-level lock acquired on batch
    Server->>Server: Verify status == 'tested_safe' AND expiry >= CURDATE() AND available >= units
    Server->>DB: UPDATE inventory_batches SET units_available = units_available - ?
    Server->>DB: INSERT INTO inventory_transactions (change: -units, type: 'fulfillment')
    Server->>DB: UPDATE blood_requests SET units_fulfilled = units_fulfilled + ?
    Server->>DB: COMMIT TRANSACTION
    Server-->>B: 200 OK (Units successfully issued and deducted)
```
