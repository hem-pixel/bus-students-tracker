# UI/UX Design System — AI Transport Command Center

**Institution:** V.S.B. ENGINEERING COLLEGE  
**Project:** BUS STUDENTS TRACKER  
**Phase:** Phase 1  

---

## 1. Design Concept & Philosophy

The user interface rejects generic SaaS/admin dashboard aesthetics in favor of a dedicated **AI Transport Command Center**.
- **Aesthetic Direction:** Tactical Aerospace & Autonomous Fleet Operations.
- **Atmosphere:** Dark, high-contrast, military-grade clarity, illuminated by precise neon cyan telemetry lines, gold institutional seals, and glowing status indicators.
- **Feedback Philosophy:** Every telemetry status (Online, Offline, Warning, Critical) is immediately recognizable through silhouette, icon, and distinct illumination wavelength.

---

## 2. Design Tokens

### Color Palette

| Token Name | Hex Value | Purpose |
|---|---|---|
| `--bg-void` | `#030712` | Deepest space background layer |
| `--bg-primary` | `#060d1d` | Canvas base background |
| `--bg-surface` | `#0c182f` | Card and panel elevated surface |
| `--bg-surface-glass`| `rgba(12, 24, 47, 0.72)` | Glassmorphic HUD overlay panels |
| `--border-subtle` | `#162a50` | Structural panel dividers |
| `--border-glow` | `rgba(0, 229, 255, 0.4)`| Neon HUD focus border |
| `--accent-cyan` | `#00e5ff` | Primary telemetry, AI radar, active markers |
| `--accent-cyan-dim`| `rgba(0, 229, 255, 0.12)`| Cyan background halos and badges |
| `--gold-vsb` | `#f59e0b` | V.S.B. Engineering College crest amber/gold |
| `--maroon-vsb` | `#8b1e1e` | V.S.B. institutional crest dark red |
| `--status-online` | `#10b981` | Positive connection / verified status |
| `--status-warning` | `#f59e0b` | Alert / degraded telemetry |
| `--status-danger` | `#ef4444` | Critical failure / unauthorized access |
| `--status-offline` | `#64748b` | Signal loss / camera disconnected |
| `--text-primary` | `#f8fafc` | Maximum contrast heading text |
| `--text-secondary` | `#cbd5e1` | Body and description text |
| `--text-muted` | `#64748b` | Minor labels, timestamps, metadata |

---

## 3. Typography Hierarchy

- **Headings & Body:** Modern clean sans-serif (`Inter`, `system-ui`, `-apple-system`, `sans-serif`) with calculated letter-spacing.
- **Telemetry & Technical Indicators:** Monospace font (`'JetBrains Mono'`, `'Fira Code'`, `Consolas`, `monospace`) for timestamps, error codes, and route coordinates.

| Level | Size | Weight | Line Height | Tracking |
|---|---|---|---|---|
| Display | 2.75rem (44px) | 800 | 1.15 | -0.03em |
| Heading 1 | 2.00rem (32px) | 700 | 1.25 | -0.02em |
| Heading 2 | 1.50rem (24px) | 600 | 1.30 | -0.01em |
| Heading 3 | 1.15rem (18px) | 600 | 1.40 | 0.00em |
| Body | 0.95rem (15px) | 400 | 1.60 | 0.00em |
| Telemetry / Code | 0.85rem (13.5px) | 500 | 1.40 | 0.05em |
| Badge / Micro | 0.75rem (12px) | 700 | 1.00 | 0.08em |

---

## 4. Component Primitives

### 1. HUD Panels (`.hud-panel`)
Backdrop blur `16px`, dark navy gradient base, with 1px subtle borders and optional corner accent tick marks.

### 2. Status Beacon (`.status-beacon`)
A pulsing concentric dot with dynamic color switching (`online`, `connecting`, `offline`, `error`).

### 3. Action Buttons (`.btn-command`)
Angled corner aesthetics, crisp hover glow, active press states, touch-friendly min-height of 44px.

---

## 5. Responsive Breakpoints

- **Desktop Large:** `> 1280px` (Expanded multi-panel command telemetry)
- **Desktop / Laptop:** `1024px - 1279px` (Standard 2-column layout)
- **Tablet:** `768px - 1023px` (Stacked controls with persistent status header)
- **Mobile:** `< 768px` (Full-width responsive cards, optimized touch targets, mobile-drawer navigation)
