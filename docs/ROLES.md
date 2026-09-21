# Role Architecture & Responsibility Matrix

**Institution:** V.S.B. ENGINEERING COLLEGE  
**Project:** BUS STUDENTS TRACKER  
**Phase:** Phase 1 — Project Foundation  

---

## Confirmed User Roles

The system is partitioned into 5 operational tiers:

```
+---------------+------------------------+-------------------------------------------------------------+
| Role ID       | Clearance Tier         | Primary Responsibilities                                    |
+---------------+------------------------+-------------------------------------------------------------+
| ADMIN         | Tier 1 - Full Ops      | System parameters, user registration, fleet mapping         |
| TRANSPORT_STAFF| Tier 2 - Ops Center   | Real-time alerts, cross-bus tracking, fleet dispatch        |
| BUS_IN_CHARGE | Tier 3 - Cabin Lead    | Boarding verification, cabin headcount, student discipline  |
| DRIVER        | Tier 4 - Vehicle Lead  | Route waypoints, departure trigger, trip status reporting    |
| STUDENT       | Tier 5 - Passenger     | Personal bus schedule, boarding stop, arrival notifications  |
+---------------+------------------------+-------------------------------------------------------------+
```

---

### Detailed Responsibility Specifications

### 1. `ADMIN`
- **Identity Scope:** Transport Officer / System Administrator.
- **Responsibilities:**
  - Create and manage routes, vehicle registry, driver assignments, and student rosters.
  - Configure AI vision detection thresholds and camera endpoint assignments.
  - Review comprehensive audit logs and generate institutional transport compliance reports.
- **Access Guard:** Full access to all telemetry, analytics, and administrative views.

### 2. `TRANSPORT STAFF`
- **Identity Scope:** Central Transport Office Operations Team.
- **Responsibilities:**
  - Monitor all buses simultaneously on the master transport grid.
  - Receive real-time anomaly alerts (e.g., student boarded incorrect bus, off-route deviation).
  - Communicate with bus in-charges and dispatch replacement buses if mechanical failures occur.
- **Access Guard:** Access to fleet-level live feeds, route maps, and operational error queues.

### 3. `BUS IN-CHARGE`
- **Identity Scope:** Faculty / Designated Staff Member traveling on an assigned bus.
- **Responsibilities:**
  - Verify student count inside the assigned bus.
  - Acknowledge or manually resolve wrong-bus and wrong-stop alerts on-board.
  - Ensure safety protocols during morning pickup and evening departure from campus.
- **Access Guard:** Strictly restricted to their assigned bus's live telemetry and student manifest.

### 4. `DRIVER`
- **Identity Scope:** Licensed Commercial Vehicle Operator.
- **Responsibilities:**
  - View designated route stops and scheduled arrival timings.
  - Mark trip departure and trip completion milestones.
  - Receive urgent operational messages from central transport staff.
- **Access Guard:** Restricted to navigation and trip status interface; no access to student personal records.

### 5. `STUDENT`
- **Identity Scope:** Enrolled student commuting via college transportation.
- **Responsibilities:**
  - Check assigned bus number, route code, and designated boarding/drop stop.
  - View estimated time of arrival (ETA) at their stop.
  - Access transport helpline in case of boarding issues.
- **Access Guard:** Strictly restricted to their own commuter profile and assigned bus status.
