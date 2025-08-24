![Labor-Delivery-Pro](https://github.com/user-attachments/assets/a667bb73-4ff1-411f-a406-c58aff15001b)

# Labor_Tracker

<div align="center">
  <h3>Labor_Tracker</h3>
  <p>
    A smart delivery tracking system designed for contractors, dispatchers, and logistics teams. Labor_Tracker enables real-time logging of job starts, delivery times, and travel hours, with full support for QR-based SmartBoxes or traditional carrier tracking systems.
    <br /><br />
    The app supports flexible operation modes: use integrated SmartBox hardware for secure drop-offs, or manually track deliveries using carrier APIs like FedEx and UPS.
  </p>
</div>

---

## 🧠 Overview & Architecture

Labor_Tracker is one of the first platforms to integrate **Artificial Intelligence as a Service (AIaaS)** for mobile workforce tracking with a complementary **SmartBox-as-a-Service (SBaaS)** solution — empowering teams to manage both personnel and physical assets through one unified, intelligent system.

The platform features:

- 📍 Real-time GPS crew tracking  
- 🕒 Shift logs  
- 🤖 AI-generated productivity insights powered by **Marven**  
- 📱 Intuitive mobile interface for contractors, logistics operators, and mobile teams  

SmartBox is an optional hardware add-on — a **secure, 3D-printed, sensor-equipped delivery unit** that syncs with Labor_Tracker to provide:

- Route validation  
- Tool protection  
- Package accountability  

---

## 🧱 Tech Stack Design

| Layer            | Service / Tool                             | Why                                                                 |
|------------------|---------------------------------------------|----------------------------------------------------------------------|
| Mobile app       | React Native + Expo Router (TypeScript)     | Cross-platform support with OTA updates                             |
| Web dashboard    | React on Firebase Hosting                   | SSR, SEO-ready, easy auth integration                               |
| Auth             | Firebase Authentication                     | Email/password, social logins, role-based access (custom claims)    |
| Primary DB       | Firestore                                    | Real-time sync (clock-ins, shifts, chats)                           |
| Object storage   | Firebase Storage                            | Photo proofs, signatures                                            |
| Cloud functions  | Firebase Functions (Node.js)                | Serverless logic, secure role-based APIs                            |
| AI Engine        | Ollama-hosted Marven (GCP Compute Engine)   | Local LLM fallback to OpenAI API when scaling required              |
| Predictive AI    | FastAPI (Python) on Cloud Run               | Traffic/ETA, overtime forecasting, Pub/Sub-triggered                |
| Data warehouse   | BigQuery                                     | Business Intelligence and ML training                               |
| Vector store     | Pinecone or Firestore collections           | Embedding store for chat memory / semantic search                   |
| Maps & Traffic   | Google Maps Platform                         | Directions, distance matrix, geofencing                             |
| CI/CD            | GitHub Actions → Firebase & Cloud Run       | Zero-downtime deploys, PR previews                                  |
| Observability    | Google Cloud Monitoring + Sentry            | Logs, metrics, error tracking                                       |
| Infra as Code    | Terraform                                    | Reproducible infra, clean staging/prod separation                   |

---

## 🚛 Two-Path System for LaborTracker Tracking

### 🔐 1. With SmartBox (Hardware Integration)

Each SmartBox acts as a secure, trackable unit using a QR tag (your passive transponder) or optional RFID/NFC chip.

- **Box is packed → QR code is scanned → delivery entry is created in Labor_Tracker.**
- SmartBox ID is tied to real-time GPS and status updates.
- Customers can scan the QR to confirm receipt.

**Benefits:**
- Seamless, tamper-proof tracking.
- “Wow factor” from physical hardware.
- Reduces lost packages and misdelivery risk.

### 💻 2. Without SmartBox (Software-Only Mode)

No SmartBox? No problem. Companies can use Labor_Tracker entirely through manual or synced tracking numbers.

- Staff enters or pastes a third-party tracking number (FedEx, UPS, USPS, etc.).
- Labor_Tracker can poll the carrier’s tracking API or store status updates manually.
- Status flows through your dashboard like any SmartBox delivery.

**Benefits:**
- No hardware required.
- Fast onboarding for new companies.
- Compatible with existing shipping tools.

---

## 🌍 Use Cases: Labor_Tracker + Marven AI + SmartBox

- **E-commerce Delivery:** Last-mile delivery with SmartBox proof-of-delivery, ETAs, and alerts.
- **Fleet Management:** Track vehicles, log hours, AI route suggestions, and SmartBox security.
- **Supply Chain:** Secure handoffs, multi-operator transfers, AI bottleneck detection.
- **Field Services:** Tool locking, delay prediction, shift reporting.
- **Food & Beverage:** Temp logs, voice updates, spoilage alerts.
- **Construction:** Secure job site tools, shift summaries, equipment logs.
- **Events:** Crew check-in, equipment handoffs, schedule control.
- **Healthcare:** AI-logged visits, SmartBox for secure medical supply drops.
- **Non-Profits:** Rotating volunteer coordination, secure aid storage in the field.

---

## 💰 Pricing & Commercial Models

**Per User Cost:**  
- Firebase + Hosting: $0.50–$1  
- AI Inference: $2–$4  
- Notifications/Maps: $0.20–$0.50  
- Infra + Support: $1–$2  
= Total: $4–$7 / mo (est.)

**Plan Pricing:**

| Plan                      | Price              | Details |
|---------------------------|--------------------|---------|
| Labor Tracker (Free)      | $0                 | Full app access, basic AI |
| Labor Tracker Pro         | $49 / mo           | Up to 10 workers, Marven upgrades |
| Enterprise (Non-profit)   | $499 / year        | 1 month free, full support |
| Enterprise Annual         | $3,000 / year      | 5 teams, 10 SmartBoxes, support |
| Add-on User               | $5 / user          | Scales team size easily |

**SmartBox:**

| Option           | Price                  |
|------------------|------------------------|
| Rental           | $15 / mo / box         |
| Purchase         | $199 one-time          |
| LTE Upgrade      | +$5 / mo               |

**AI Upgrades:**

| AI Tier              | Price      |
|----------------------|------------|
| Core (Included)      | ✅ Yes     |
| Marven Pro           | +$25 / mo  |
| Vision Pack          | +$15 / mo  |
| AutoPilot            | +$35 / mo  |
| Full Marven Suite    | +$59 / mo  |

---

## 👥 Role-Based User Experience

### 👷‍♂️ User (Truck Driver)

| Feature                  | Description                        |
|--------------------------|------------------------------------|
| 📦 Start Delivery         | Begin new delivery assignment      |
| ✅ Mark as Delivered      | Complete delivery and submit proof |
| ⏱️ Log Labor Time         | Track job/shift time               |
| 📝 Report Delivery Issue  | Notify blocked dock or delay       |
| 📍 Live Map / Route       | Navigation and real-time updates   |
| 📷 Upload Delivery Proof  | Photos, signatures, damage logs    |
| 🛠️ Request Maintenance    | Report vehicle/tool issue          |
| 🗺️ Geofence Check-In      | Auto check-in or QR scan           |
| 📤 Send Message to Lead   | Ask questions or send status       |

### 👨‍💼 Lead (Dispatcher)

| Feature                  | Description                        |
|--------------------------|------------------------------------|
| 📋 View Driver Activity   | Live location and logs             |
| 📍 Track Live Deliveries  | Monitor jobs in real time          |
| 🔁 Reassign Delivery      | Move tasks between users           |
| 🚨 File Incident Report   | Report accidents or issues         |
| 👷‍♂️ Approve Labor Logs   | Confirm/reject hours               |
| 🧾 Daily Summary / Reports| Export work logs                   |
| ✏️ Edit Assignments       | Modify or reissue tasks            |
| 🗂️ Upload Compliance Docs| Safety and inspection uploads      |
| 🔍 Verify AI Alerts       | Review AI-detected behaviors       |
| 📬 Broadcast Message      | Send announcements to all drivers  |

### 🛠️ Admin (Compliance)

| Feature                  | Description                        |
|--------------------------|------------------------------------|
| 🧑‍💼 Manage Users & Roles  | Set access and user roles          |
| 📊 Dashboard Analytics   | View full KPIs and data trends     |
| 📁 Audit Trail Logs      | See submission history             |
| 🚧 View Incidents        | Review reported violations         |
| ⚙️ System Config / Alerts | Modify global settings             |
| 🧾 Export Reports         | DOT/OSHA or monthly exports         |
| 🔐 Manage Access Controls| Secure feature permissions         |
| 🛡️ Compliance Mode       | Run monthly audits                 |
| 📣 Send System Notice    | Push policy or emergency updates   |

### 📦 NonUser (Customer/Client)

| Feature              | Description                       |
|----------------------|-----------------------------------|
| 📍 Track My Delivery  | Live tracking of shipment         |
| 🧾 View Proof         | See delivery signature/photos     |
| 📥 Submit Feedback    | Share satisfaction or issues      |
| 📜 Order History      | View past orders                  |
| 📬 Request Callback   | Ask dispatch a follow-up question |

---

## 📥 Flow Diagram

![Two-Path System for LaborTracker Tracking](./diagram.png)
