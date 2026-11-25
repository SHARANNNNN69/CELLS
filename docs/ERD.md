# CELLS — Entity-Relationship Diagram & Data Dictionary

```mermaid
erDiagram
    USERS ||--o| DONOR_PROFILES : "has"
    USERS ||--o| HOSPITAL_STAFF : "works_at"
    USERS ||--o| BLOOD_BANK_STAFF : "manages"
    USERS ||--o{ BLOOD_REQUESTS : "creates"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ AUDIT_LOGS : "triggers"
    USERS ||--o{ DONATIONS : "donates"

    HOSPITALS ||--o{ HOSPITAL_STAFF : "employs"
    HOSPITALS ||--o{ BLOOD_REQUESTS : "receives_delivery"

    BLOOD_BANKS ||--o{ BLOOD_BANK_STAFF : "employs"
    BLOOD_BANKS ||--o{ INVENTORY_BATCHES : "stores"
    BLOOD_BANKS ||--o{ DONATIONS : "collects"
    BLOOD_BANKS ||--o{ INVENTORY_TRANSACTIONS : "logs"

    INVENTORY_BATCHES ||--o{ INVENTORY_TRANSACTIONS : "tracked_by"

    BLOOD_REQUESTS ||--o{ REQUEST_RESPONSES : "receives"
    BLOOD_REQUESTS ||--o{ INVENTORY_TRANSACTIONS : "references"

    USERS {
        int id PK
        string full_name
        string email UK
        string password_hash
        string phone
        string role
        boolean is_active
        timestamp created_at
    }

    DONOR_PROFILES {
        int id PK
        int user_id FK
        string blood_group
        string city
        string state
        string pincode
        date last_donation_date
        string availability_status
        string contact_preference
    }

    BLOOD_BANKS {
        int id PK
        string name
        string license_number UK
        string city
        decimal latitude
        decimal longitude
        string contact_phone
        string verification_status
    }

    INVENTORY_BATCHES {
        int id PK
        int blood_bank_id FK
        string batch_number
        string blood_group
        string component
        int units_available
        date collection_date
        date expiry_date
        string status
    }

    INVENTORY_TRANSACTIONS {
        int id PK
        int batch_id FK
        int blood_bank_id FK
        int change_units
        string transaction_type
        int reference_request_id FK
        string reason
        int performed_by_user_id FK
        timestamp created_at
    }

    BLOOD_REQUESTS {
        int id PK
        int requester_id FK
        string patient_name
        string blood_group
        string component
        int units_needed
        int units_fulfilled
        string urgency
        datetime required_by
        string status
    }
```

---

## Data Dictionary Highlights

### `users`
- Primary authentication store. Roles: `public_visitor`, `donor`, `requester`, `hospital`, `blood_bank`, `admin`.

### `inventory_batches`
- Tracks stock units by batch with collection date, expiration, and quality status (`quarantined`, `tested_safe`, `rejected`, `expired`, `depleted`).
- Constraint: Unique pair `(blood_bank_id, batch_number)`.

### `inventory_transactions`
- Immutable audit ledger recording every delta (+ or - units), linking batch alterations to emergency requisitions and the responsible staff member.
