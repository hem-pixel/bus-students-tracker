# Bus Students Tracker — Native Mobile Application (iOS & Android)

> **Phase 13 Enterprise Mobile Ecosystem**  
> Native cross-platform application for **Parents**, **Drivers**, and **Fleet Administrators** with real-time GPS radar tracking, student boarding rosters, emergency SOS dispatch, turn-by-turn HUD, and offline sync.

---

## 📱 Mobile Architecture & Overview

The mobile application is built using **React Native 0.74+** with a decoupled service-driven state layer (**Redux Toolkit**), biometric authentication (**Face ID / Touch ID / Android BiometricPrompt**), local offline storage (**AsyncStorage & SQLite Cache**), and real-time push notifications (**Firebase Cloud Messaging / APNs**).

```
bus-students-tracker-mobile/
├── App.js                          # Root application component with Redux & Theme Providers
├── index.js                        # AppRegistry entry point
├── package.json                    # Native dependencies & build scripts
├── app.json                        # Expo/React Native app descriptor
├── babel.config.js                 # Babel module resolver configuration
├── metro.config.js                 # Metro bundler assets & SVG support
└── src/
    ├── navigation/                 # Navigation graphs (React Navigation 6)
    │   ├── RootNavigator.js        # Auth state listener & multi-role router
    │   ├── ParentTabNavigator.js   # Bottom tabs for Parent/Student role
    │   ├── DriverNavigator.js      # Bottom tabs for Driver HUD
    │   └── AdminNavigator.js       # Bottom tabs for Command & Dispatch
    ├── screens/
    │   ├── auth/
    │   │   └── LoginScreen.js      # Multi-role authentication & biometric fast-login
    │   ├── parent/
    │   │   ├── LiveMapScreen.js    # GPS radar map, ETA countdown, driver contact, SOS
    │   │   ├── BoardingStatusScreen.js # Digital QR bus pass, boarding history & schedule
    │   │   ├── NotificationsScreen.js  # Push alert center with category filters
    │   │   └── SettingsScreen.js   # Geofence radius, biometric toggles, cache cleanup
    │   ├── driver/
    │   │   ├── RouteGuidanceScreen.js # Turn-by-turn navigation HUD, passenger gauge, speed
    │   │   ├── StopChecklistScreen.js # Student attendance roster & NFC tap verification
    │   │   └── VehicleStatusScreen.js # Engine diagnostics, OBD-II telemetry & pre-trip check
    │   └── admin/
    │       ├── FleetOverviewScreen.js # Fleet live radar, capacity gauges, broadcast dispatch
    │       └── AlertManagementScreen.js # Emergency SOS dispatch, geofence breaches, escort deployment
    ├── services/
    │   ├── apiClient.js            # Axios client with auth interceptors & offline fallback
    │   ├── offlineStorage.js       # AsyncStorage sync queue with SQLite schemas
    │   ├── pushNotificationService.js # FCM & APNs device token registration & alert channels
    │   └── biometricService.js     # Face ID & Fingerprint biometric authentication
    ├── store/                      # Redux Toolkit centralized stores
    │   ├── index.js                # Root store configuration
    │   ├── authSlice.js            # User tokens, active role, profile
    │   ├── trackingSlice.js        # Bus coordinates, ETA, speed, geofence status
    │   ├── notificationsSlice.js   # Push notifications inbox & badge counts
    │   └── driverSlice.js          # Student roster checklist & route checkpoints
    └── theme/
        ├── colors.js               # Dark institutional palette (Amber #F59E0B / Slate #05070A)
        └── typography.js           # Responsive typography scale
```

---

## 🎯 Role-Based Screen Capabilities

### 1. Parent / Student Experience
- **Live Map Radar (`LiveMapScreen.js`)**: Real-time vehicle marker with heading orientation, 250m safety geofence radius visualizer, current speed gauge, remaining distance, dynamic ETA countdown, and one-tap emergency SOS distress beacon.
- **Boarding Pass & Roster (`BoardingStatusScreen.js`)**: Real-time scan confirmation, student cryptographic QR pass for physical bus scanner, morning pickup / afternoon drop-off schedules, and verified scan event logs.
- **Notification Inbox (`NotificationsScreen.js`)**: Filterable category feeds (`[Boarding]`, `[Alerts]`, `[Delays]`, `[System]`) with unread badge indicators and direct alert dismissal.
- **Safety Preferences (`SettingsScreen.js`)**: Adjustable geofence perimeter (100m – 1000m), biometric Face ID login toggle, automated departure audio chime, and instant hotline connection to campus security.

### 2. Driver Turn-by-Turn HUD
- **Route Guidance Cockpit (`RouteGuidanceScreen.js`)**: High-contrast turn indicator with upcoming street maneuvers, live vehicle speed vs zone limit (40 km/h), passenger occupancy gauge (42/54 seats), next stop ETA, and driver distress signal.
- **Stop Checklist & NFC Roster (`StopChecklistScreen.js`)**: Progressive stop timeline with expandable passenger lists. Attendance toggle per student (Boarded / Absent / Offboarded), with simulated NFC card tap validation.
- **Vehicle Health Telemetry (`VehicleStatusScreen.js`)**: Live diesel fuel level (72%), coolant temperature gauge (88°C), 6-wheel tyre pressure monitoring (TPMS), electrical system voltage (24.2V), digital pre-trip inspection checklist, and instant mechanical defect dispatcher.

### 3. Admin & Command Dispatch
- **Fleet Radar (`FleetOverviewScreen.js`)**: Birds-eye view of all deployed campus transit buses with operational KPIs (Active buses, Total passengers aboard, On-time percentage), status filter chips, direct telephone link to cockpit, and fleet bulletin dispatch.
- **Incident & SOS Management (`AlertManagementScreen.js`)**: Prioritized incident feed for geofence breaches, student wrong-stop de-boardings, vehicle mechanical warnings, and parent SOS alerts. Full incident workflow: *Acknowledge*, *Deploy Security Escort*, and *Log Resolution*.

---

## 🛠️ Prerequisites & Installation

### Requirements
- **Node.js**: `v18.0.0` or higher
- **Package Manager**: `npm` or `yarn`
- **JDK**: Java Development Kit 17
- **Android Development**: Android Studio, Android SDK Platform 34, Google Play Services
- **iOS Development (macOS only)**: macOS Sonoma / Sequoia, Xcode 15+, CocoaPods (`gem install cocoapods`)

### Step 1: Install Dependencies
```bash
cd bus-students-tracker-mobile
npm install
```

### Step 2: iOS Setup (macOS only)
```bash
cd ios
pod install
cd ..
npm run ios
```

### Step 3: Android Setup
Ensure an Android Emulator is running or an Android device with USB Debugging enabled is attached:
```bash
npm run android
```

### Step 4: Start Metro Bundler
```bash
npm start -- --reset-cache
```

---

## 📡 Offline Synchronization & SQLite Schema

When a bus traverses low-connectivity zones, the application queues GPS telemetry and attendance scan events locally:

```sql
-- Local SQLite Offline Cache Schema
CREATE TABLE IF NOT EXISTS offline_telemetry (
  id TEXT PRIMARY KEY,
  bus_id TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  speed REAL NOT NULL,
  heading REAL NOT NULL,
  recorded_at INTEGER NOT NULL,
  synced INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS attendance_events (
  event_id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  stop_id TEXT NOT NULL,
  scan_type TEXT CHECK(scan_type IN ('BOARD', 'DEBOARD', 'ABSENT')),
  rfid_card_uid TEXT,
  timestamp INTEGER NOT NULL,
  synced INTEGER DEFAULT 0
);
```

When network connectivity resumes (`NetInfo.isConnected === true`), `offlineStorage.js` flushes queued telemetry payloads to the backend API (`/api/v1/telemetry/bulk-sync`) in batches of 50 records.

---

## 🔔 Push Notifications (FCM / APNs)

### Sample High-Priority Geofence Payload
```json
{
  "to": "device_fcm_token_here",
  "priority": "high",
  "notification": {
    "title": "Bus Approaching Stop",
    "body": "Bus #14 has crossed the 500m geofence for Sector 62 Stop. Estimated arrival: 3 mins.",
    "sound": "bus_alert_chime.wav"
  },
  "data": {
    "type": "GEOFENCE_PROXIMITY",
    "busId": "BUS-14",
    "stopId": "STOP-05",
    "etaMinutes": 3,
    "screen": "LiveMap"
  }
}
```

---

## 🖥️ Web App Native Simulator

For administrative testing and demonstrations, the companion web application features a **Hardware Device Simulator**:
- Accessible from the main sidebar: **Mobile Ecosystem → Mobile Simulator**
- URL: `http://localhost:5173/admin/mobile-simulator`
- Features **Apple iPhone 16 Pro**, **Google Pixel 9**, and **iPad Pro 11"** chassis with interactive touch navigation, push notification injector, biometric authentication simulations, and offline network toggles.
