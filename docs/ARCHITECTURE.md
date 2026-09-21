# System Architecture — BUS STUDENTS TRACKER

**Institution:** V.S.B. ENGINEERING COLLEGE  
**Department:** Department of Artificial Intelligence & Data Science (AI & DS)  
**Phase:** Phase 1 — Project Foundation, System Identity & Core UI  

---

## 1. Executive Architecture Summary

BUS STUDENTS TRACKER is architected as a high-reliability **AI Transport Command Center** designed for institution-wide transport tracking, safety compliance, computer vision validation, and operational governance.

```
+-------------------------------------------------------------------------------+
|                         V.S.B. ENGINEERING COLLEGE                            |
|                 AI TRANSPORT COMMAND CENTER (BUS STUDENTS TRACKER)            |
+-------------------------------------------------------------------------------+
                                        |
       +--------------------------------+-------------------------------+
       |                                                                |
       v                                                                v
[ WEB COMMAND INTERFACE ]                                      [ FUTURE EDGE / FLEET ]
- React 18 SPA (Vite)                                         - Vehicle IoT Telemetry
- AI Command Center Design System                             - Edge Vision Units
- Role-Aware Routing Guard                                    - GPS / OBD Gateway
- Resilient Error & Offline Layer                                       |
       |                                                                |
       +--------------------------------+-------------------------------+
                                        |
                                        v
                            [ FUTURE API GATEWAY ]
                            - Node.js / Express Server
                            - JWT Verification & Role Claims
                            - Telemetry Ingestion (WebSockets)
                                        |
                                        v
                          [ FUTURE PERSISTENCE ENGINE ]
                          - PostgreSQL 16 + PostGIS
                          - Spatial Route Mapping
                          - Audit & Boarding Logs
```

---

## 2. Role-Based Access Architecture

The system enforces strict boundary isolation among the 5 confirmed roles:

```
[ ADMIN ]           ---> Full System Control & Fleet Orchestration
[ TRANSPORT STAFF ] ---> Fleet-wide Route, Camera & Boarding Monitoring
[ BUS IN-CHARGE ]   ---> Single Bus Boarding Verification & Cabin Supervision
[ DRIVER ]          ---> Route Progress, Assigned Bus Run & Stop Sequence
[ STUDENT ]         ---> Personal Bus Allocation, ETA & Boarding Notifications
```

### Role Security Principles:
1. **URL Guessing Immunity:** Navigating to an unpermitted path triggers the dedicated `403 Forbidden` Command Center screen without leaking route hierarchy.
2. **Session Validity Guard:** Missing or expired bearer tokens redirect directly to `401 Unauthorized`.
3. **Graceful Fault Tolerance:** Unreachable services trigger `503 Service Unavailable`, while unexpected runtime failures trigger `500 Server Error` with zero leakage of internals, secrets, or database structures.

---

## 3. Database Architecture (Future Direction)

While Phase 1 strictly implements NO active database tables or dummy data, the architectural entity relationship has been defined for seamless integration in Phase 2+:

```
+-------------------+       +-------------------+       +-------------------+
|     Students      |       |      Routes       |       |       Buses       |
|-------------------|       |-------------------|       |-------------------|
| id (UUID)         |       | id (UUID)         |       | id (UUID)         |
| roll_number       |<----->| route_code        |<----->| bus_number        |
| name              |       | name              |       | registration_no   |
| department        |       | start_point       |       | total_capacity    |
| assigned_bus_id   |       | end_point         |       | in_charge_id      |
| boarding_stop_id  |       | stops (GeoJSON)   |       | driver_id         |
+-------------------+       +-------------------+       +-------------------+
          |                                                       |
          +---------------------------+---------------------------+
                                      |
                                      v
                        +---------------------------+
                        |     Boarding Logs         |
                        |---------------------------|
                        | id (UUID)                 |
                        | student_id                |
                        | bus_id                    |
                        | timestamp                 |
                        | verification_status       |  (VERIFIED / WRONG_BUS / ANOMALY)
                        | camera_slot_id            |
                        +---------------------------+
```

---

## 4. Camera Telemetry Foundation

The computer vision architecture is abstracted into 4 standard operational states across all bus camera slots:
- **`ONLINE`**: Stream active, nominal frame rate, synchronized with fleet gateway.
- **`CONNECTING`**: RTSP/WebRTC handshake in progress, video buffer initializing.
- **`OFFLINE`**: Signal dropped, camera feed offline banner displayed with auto-reconnect trigger.
- **`ERROR`**: Device hardware fault or protocol parsing error displayed with safe diagnostic code.

---

## 5. Phase 2 — Authentication, Session & RBAC Architecture

Phase 2 introduces a client-side authentication engine, session manager, and role-based route guard without violating the requirement to leave full dashboards for Phase 3.

```
+-----------------------------------------------------------------------------------------+
|                                     USER ACCESS ATTEMPT                                 |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
                             +-------------------------------+
                             |    ProtectedRoute Interceptor |
                             +-------------------------------+
                                             |
                     +-----------------------+-----------------------+
                     | Is Authenticated?                             |
                    YES                                              NO
                     |                                               |
                     v                                               v
     +-------------------------------+               +-------------------------------+
     | Role Matches Route Clearance? |               |  SESSION NOT DETECTED (Gate)  |
     +-------------------------------+               |  Prompt login with redirect   |
          |                     |                    +-------------------------------+
         YES                    NO                                   |
          |                     |                                    v
          v                     v                            [ /login Terminal ]
   [ Granted Area ]    [ Error 403 Screen ]                          |
   (RoleLandingPage)   - Safe rejection reason                       v
                       - Direct return to clearance          [ Auth Validation ]
                       - RBAC isolation preserved                    |
                                                                     v
                                                             [ Store Session ]
                                                             - 60 min sliding expiry
                                                             - Token: BST-AUTH-SESSION-*
                                                             - User Context Broadcast
```

### 5.1 Session Token Lifecycle & Governance
- **Format:** `BST-AUTH-SESSION-{ROLE}-{RANDOM_HEX}` (e.g., `BST-AUTH-SESSION-ADMIN-3A8F4...`)
- **Duration:** 60-Minute strict sliding window, tracked via Unix timestamp in localStorage.
- **Auto-Invalidation:** Any session older than 3600 seconds is automatically purged upon route evaluation, restoring unauthenticated state cleanly without crashing.
- **Signout:** Complete atomic purge of `bst_auth_user` and `bst_auth_session` keys.

### 5.2 RBAC Tier Clearance Matrix
| Role | Clearance Level | Dedicated Route Prefix | Permitted Boundary |
| :--- | :--- | :--- | :--- |
| **`ADMIN`** | Tier 1 (Apex) | `/admin/*` | Fleet-wide configuration, institutional audits, driver & bus orchestration |
| **`TRANSPORT STAFF`** | Tier 2 | `/staff/*` | Multi-bus route operations, camera status monitoring, boarding oversight |
| **`BUS IN-CHARGE`** | Tier 3 | `/incharge/*` | Single bus roster verification, cabin supervision, real-time headcounts |
| **`DRIVER`** | Tier 4 | `/driver/*` | Route stop sequence, vehicle status check, run initiation |
| **`STUDENT`** | Tier 5 | `/student/*` | Personal bus assignment, boarding status, pickup point notification |

### 5.3 Institutional Self-Registration Rules
- Allowed Roles: **`STUDENT`** and **`TRANSPORT STAFF`**.
- Institutional Domain: Must match `@vsb.ac.in`.
- Password Policy: Minimum 6 characters with mandatory confirmation matching.
- Immediate Sign-in: Upon successful validation, the new user is automatically issued an active session token and transitioned to their assigned role area.

