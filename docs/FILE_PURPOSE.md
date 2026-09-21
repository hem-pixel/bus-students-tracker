# File Purpose Registry — BUS STUDENTS TRACKER

**Institution:** V.S.B. ENGINEERING COLLEGE  
**Department:** AI & DS  
**Phase:** Phase 1 — Project Foundation  

Every file created in the project repository is documented below with its definitive architectural justification, requirement mapping, and lifecycle ownership.

---

## 1. Documentation & Configuration Files

### `docs/PROJECT_CONFIG.json`
- **Why it exists:** Centralized machine-readable configuration storing confirmed college identity, branding colors, stack parameters, and user roles.
- **Requirement Implemented:** Section 3 (Save Confirmed Project Information).
- **Phase Ownership:** Phase 1 (Foundation); permanently referenced by all future phases.
- **Future Reuse:** Every future phase will read this file instead of re-asking user requirements.
- **Duplication Check:** Single source of truth.

### `docs/ARCHITECTURE.md`
- **Why it exists:** Provides system architecture diagram, role security isolation, and database entity relationships.
- **Requirement Implemented:** Section 10 & 11 (Role & Database Foundation Documentation).
- **Phase Ownership:** Phase 1.
- **Future Reuse:** Guides backend API modeling and PostgreSQL schema migration in Phase 2+.

### `docs/ROLES.md`
- **Why it exists:** Formally documents the 5 confirmed roles (`ADMIN`, `TRANSPORT STAFF`, `BUS IN-CHARGE`, `DRIVER`, `STUDENT`), their clearance tiers, and access boundaries.
- **Requirement Implemented:** Section 2 & 10 (User Roles Architecture).
- **Phase Ownership:** Phase 1.
- **Future Reuse:** Direct blueprint for JWT claims and route guards in future authentication phases.

### `docs/DESIGN_SYSTEM.md`
- **Why it exists:** Codifies design tokens, typography, color palettes, and UI component standards.
- **Requirement Implemented:** Section 6 (UI/UX Direction) & Section 16 (Documentation).
- **Phase Ownership:** Phase 1.
- **Future Reuse:** Enforces design uniformity across all future dashboard pages.

### `docs/FILE_PURPOSE.md`
- **Why it exists:** Maintains strict compliance with the File Purpose Rule by cataloging every created file.
- **Requirement Implemented:** Section 12 & 13 (File Purpose Rule).
- **Phase Ownership:** Phase 1; actively maintained in each phase.
- **Future Reuse:** Continuous architectural audit trail.

### `README.md`
- **Why it exists:** Project entry documentation for developers and stakeholders.
- **Requirement Implemented:** Section 16 (Project Overview & Phase Roadmap).
- **Phase Ownership:** Phase 1.

---

## 2. Core Application Infrastructure

### `package.json`
- **Why it exists:** Defines project dependencies (React 18, Vite, Lucide Icons) and build scripts.
- **Requirement Implemented:** Section 5 & 14 (Application Structure & Code Quality).
- **Phase Ownership:** Phase 1.

### `vite.config.js`
- **Why it exists:** Configures Vite build tool, React plugin, and local development server ports.
- **Requirement Implemented:** Section 5 (Application Structure).
- **Phase Ownership:** Phase 1.

### `index.html`
- **Why it exists:** Main HTML entry point containing metadata, viewport configuration, and root DOM node.
- **Requirement Implemented:** Section 5 & SEO Best Practices.
- **Phase Ownership:** Phase 1.

### `src/main.jsx`
- **Why it exists:** Boots the React root into the DOM.
- **Requirement Implemented:** Section 5 (Application Structure).
- **Phase Ownership:** Phase 1.

### `src/App.jsx`
- **Why it exists:** Root routing coordinator that provides state navigation across all Phase 1 screens and foundation states.
- **Requirement Implemented:** Section 9 (Routing Foundation).
- **Phase Ownership:** Phase 1; becomes the parent route shell in Phase 2.

### `src/styles/index.css`
- **Why it exists:** Houses the entire AI Transport Command Center design system tokens, layout grids, HUD panels, and responsive media queries.
- **Requirement Implemented:** Section 6 & 7 (UI/UX Direction & Responsive Design).
- **Phase Ownership:** Phase 1.

### `src/assets/college-logo.jpg`
- **Why it exists:** Official crest image asset of V.S.B. Engineering College as provided by the institution.
- **Requirement Implemented:** Section 2 & 8 (College Identity & Opening Page).
- **Phase Ownership:** Phase 1.

---

## 3. Reusable Component Primitives

### `src/components/CommandCenterHeader.jsx`
- **Why it exists:** Institutional header with V.S.B. logo, project title, system heartbeat, active status indicators, and screen switcher.
- **Requirement Implemented:** Section 8 (System Identity Header).
- **Phase Ownership:** Phase 1; persistent header in future dashboards.

### `src/components/CameraOfflineState.jsx`
- **Why it exists:** Reusable camera viewport component handling the 4 required hardware telemetry states (`Online`, `Connecting`, `Offline`, `Error`).
- **Requirement Implemented:** Section 8 (Page/State 9 — Camera Offline Foundation).
- **Phase Ownership:** Phase 1; direct host for real camera video feeds in future vision phases.

### `src/components/NetworkErrorBanner.jsx`
- **Why it exists:** Non-intrusive, reusable notification and modal for network drops with connection ping retry.
- **Requirement Implemented:** Section 8 (Page 8 — Network Error State).
- **Phase Ownership:** Phase 1; used globally by all future API calls.

---

## 4. Phase 1 Required Pages / Screen Implementations

### `src/pages/OpeningPage.jsx`
- **Why it exists:** Initial gateway screen welcoming users with college branding, mission text, and smooth entrance transition.
- **Requirement Implemented:** Section 8 (Page 1 — Opening / College Branding Page).
- **Phase Ownership:** Phase 1.

### `src/pages/LoadingPage.jsx`
- **Why it exists:** Handles authentic system diagnostics, session checking, and initialization transitions without fake percentages.
- **Requirement Implemented:** Section 8 (Page 2 — Loading Page).
- **Phase Ownership:** Phase 1.

### `src/pages/Error401Page.jsx`
- **Why it exists:** Displays clean unauthorized session state and re-authentication trigger.
- **Requirement Implemented:** Section 8 (Page 3 — 401 Unauthorized).
- **Phase Ownership:** Phase 1.

### `src/pages/Error403Page.jsx`
- **Why it exists:** Displays role permission restriction with clear tier guidance without leaking internal resources.
- **Requirement Implemented:** Section 8 (Page 4 — 403 Forbidden).
- **Phase Ownership:** Phase 1.

### `src/pages/Error404Page.jsx`
- **Why it exists:** Transportation-themed off-grid / route not found recovery screen.
- **Requirement Implemented:** Section 8 (Page 5 — 404 Not Found).
- **Phase Ownership:** Phase 1.

### `src/pages/Error500Page.jsx`
- **Why it exists:** Handles unexpected application errors securely without exposing stack traces, paths, or credentials.
- **Requirement Implemented:** Section 8 (Page 6 — 500 Server Error).
- **Phase Ownership:** Phase 1.

### `src/pages/Error503Page.jsx`
- **Why it exists:** Displays service outage with live retry timer and connectivity heartbeat.
- **Requirement Implemented:** Section 8 (Page 7 — 503 Service Unavailable).
- **Phase Ownership:** Phase 1.

### `src/pages/NetworkErrorDemoPage.jsx`
- **Why it exists:** Demonstrates and tests the network communication failure and auto-reconnect layer.
- **Requirement Implemented:** Section 8 (Page 8 — Network Error State).
- **Phase Ownership:** Phase 1.

### `src/pages/CameraStateDemoPage.jsx`
- **Why it exists:** Interactive showcase verifying all 4 camera telemetry states (`Online`, `Connecting`, `Offline`, `Error`) across front/cabin slots.
- **Requirement Implemented:** Section 8 (Page/State 9 — Camera Offline Foundation).
- **Phase Ownership:** Phase 1.

---

## 5. Phase 2 Authentication & RBAC Infrastructure

### `src/services/authService.js`
- **Why it exists:** Core client-side authentication engine managing user validation, simulated asynchronous network delay, session creation, 60-minute token expiry, pre-seeded institutional accounts for all 5 roles, and local account persistence.
- **Requirement Implemented:** Phase 2 Sections 5, 6, 7, 8, 9, 10, 11, 14 (Authentication Architecture, Pre-seeded Credentials, Session Token, Self-Registration).
- **Phase Ownership:** Phase 2.
- **Future Reuse:** Will bridge directly to backend REST/JWT APIs in Phase 3+ without changing consumer contracts.

### `src/context/AuthContext.jsx`
- **Why it exists:** Global React context provider exposing authentication state (`user`, `role`, `sessionToken`, `isAuthenticated`, `isLoading`) and lifecycle methods (`login`, `register`, `logout`) across the component tree.
- **Requirement Implemented:** Phase 2 Sections 12 & 13 (Global Auth State Management).
- **Phase Ownership:** Phase 2.
- **Future Reuse:** Permanent root auth provider for all subsequent dashboard and telemetry components.

### `src/components/ProtectedRoute.jsx`
- **Why it exists:** Route-level authorization gate component that intercepts unauthenticated access (prompting a security gate with login redirection) and unauthorized role access (delegating directly to Phase 1 `Error403Page` with clearance diagnostic).
- **Requirement Implemented:** Phase 2 Sections 17, 18, 19, 20 (Route Protection, RBAC Enforcement, 403 Reuse).
- **Phase Ownership:** Phase 2.
- **Future Reuse:** Will guard all Phase 3+ subroutes and dashboard views.

### `src/pages/LoginPage.jsx`
- **Why it exists:** Dedicated Dark Monochrome AI Transport Command Center authentication terminal with Sign-In and Registration tabs, strict institutional input validation, show/hide password toggles, clear security alerts, and 1-click test credential autofill buttons.
- **Requirement Implemented:** Phase 2 Sections 14, 15, 16 (Login Interface, Self-Registration, Visual Design).
- **Phase Ownership:** Phase 2.
- **Future Reuse:** Primary authentication entrypoint for production users.

### `src/pages/protected/RoleLandingPage.jsx`
- **Why it exists:** Unified, minimal protected landing view showing user identity, clearance badge, active session token snippet, operational boundary, secure logout, and interactive RBAC cross-access testbed. Demonstrates role enforcement without violating Phase 2 dashboard boundaries.
- **Requirement Implemented:** Phase 2 Sections 21, 22, 23, 24, 28 (Protected Role Landing & Scope Boundaries).
- **Phase Ownership:** Phase 2.
- **Future Reuse:** Transitional baseline until dedicated Phase 3 dashboards are built.

