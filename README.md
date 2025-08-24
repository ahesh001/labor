![Labor-Delivery-Pro](https://github.com/user-attachments/assets/a667bb73-4ff1-411f-a406-c58aff15001b)

# LaborTracker

<div align="center">
  <h3>LaborTracker</h3>
  <p>
    A smart delivery tracking system designed for contractors, dispatchers, and logistics teams. LaborTracker enables real-time logging of job starts, delivery times, and travel hours, with full support for QR-based SmartBoxes or traditional carrier tracking systems.
    <br /><br />
    The app supports flexible operation modes: use integrated SmartBox hardware for secure drop-offs, or manually track deliveries using carrier APIs like FedEx and UPS.
  </p>
</div>

---

## 🧠 Overview & Architecture

LaborTracker is one of the first platforms to integrate **Artificial Intelligence as a Service (AIaaS)** for mobile workforce tracking with a complementary **SmartBox-as-a-Service (SBaaS)** solution — empowering teams to manage both personnel and physical assets through one unified, intelligent system.

The platform features:

- 📍 Real-time GPS crew tracking  
- 🕒 Shift logs  
- 🤖 AI-generated productivity insights powered by **Marven-L** (Marven Logistics)
- 📱 Intuitive mobile interface for contractors, logistics operators, and mobile teams
  

SmartBox is an optional hardware add-on — a **secure, 3D-printed, sensor-equipped delivery unit** that syncs with LaborTracker to provide:

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

## 🧠 SmartBox Features

### 📦 SmartBox (In Development)

The **SmartBox** is a rugged, sensor-enabled, AI-integrated delivery locker designed to bring physical asset tracking into the LaborTracker ecosystem. Mounted on-site or vehicle-equipped, it enables secure deliveries, hands-free check-ins, and verifiable chain-of-custody for high-value assets or tools.

Each SmartBox connects to the LaborTracker platform via QR code, BLE, or optional LTE. This allows contractors, drivers, or field technicians to scan, unlock, drop off, and verify deliveries without paper forms or key management.

When paired with **Marven-L**, SmartBox can intelligently:
- Recommend optimized delivery/drop-off windows  
- Detect access anomalies or unauthorized openings  
- Trigger incident alerts or missed-scan warnings  
- Analyze usage patterns for better route planning

#### 🔐 Core Features Include:
- ✅ QR-scanned delivery completion (auto-logs proof of delivery)
- ✅ Guest delivery support (no login required)
- ✅ AI-powered dispatch timing and predictions
- ✅ Secure digital handoff logs (time, GPS, signature, photo)
- ✅ Tamper detection via sensors (reed switch, weight pad, accelerometer)
- ✅ Optional weather-resistant + solar-powered casing

> 📸 *SmartBox photos will be added here once available.*

---


## 🌍 Use Cases: LaborTracker + Marven-L AI + SmartBox

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

LaborTracker combines flexible software subscriptions, modular AI upgrades, and SmartBox hardware rentals to give teams what they need—without overpaying for what they don’t.

### 💸 Cost Per User (Baseline)

| Component                             | Est. Monthly Cost per User |
|---------------------------------------|-----------------------------|
| Firebase Hosting & Firestore          | ~$0.50–$1                  |
| AI Inference (Ollama + OpenAI Fallback) | ~$2–$4 (10–20 Qs/month)   |
| Push Notifications, Maps, APIs        | ~$0.20–$0.50               |
| Support, Infra, Margin                | ~$1–$2                     |

**📊 Total Estimated Cost: ~$4–$7 per user/month**

---

### 📈 ROI for Contractors & Teams

With LaborTracker you can:
- Save **1–3 hours per worker/week** (~$25–$75/month value)
- Prevent overtime via **AI alerts**
- Eliminate **paper timesheets & HR bottlenecks**
- Gain **real-time visibility** across mobile teams
- Replace a **junior analyst** with AI-powered insights

---

### 🧪 Competitor Comparison

| Competitor        | Price                   | AI Features?       |
|-------------------|--------------------------|---------------------|
| ClockShark        | $40 base + $8/user       | ❌ No AI            |
| Homebase          | $24–99 + $6/user         | ⚠️ Light automation |
| Hubstaff          | $7–10/user               | ✅ Some analytics   |
| Workyard          | ~$9–15/user              | ✅ GPS + analytics  |
| QuickBooks Time   | $20 base + $8/user       | ⚠️ Basic time tools |

---

## 📦 LaborTracker Software Plans

| Plan                     | Price             | Details |
|--------------------------|------------------|---------|
| **LaborTracker (Free)** | $0               | Basic chat, time insights, usage tracking |
| **LaborTracker Pro**    | $49 / mo         | Up to 10 workers + AI upgrade options |
| **Enterprise (Nonprofit)** | $499 / year   | 1 month free, full features, support |
| **Enterprise (Full)**    | $3,000 / year    | Up to 5 teams, SmartBox bundle, extended data retention |
| **Add-on User**          | $5 / user        | Expand your team flexibly |

---

## 📦 SmartBox Hardware Pricing

| Option           | Price                  | Details |
|------------------|------------------------|---------|
| Monthly Rental   | $15 / box / mo         | OTA updates, LTE fallback, warranty included |
| Buy Outright     | $199 / box             | One-time cost, firmware updates via app |
| LTE Upgrade      | +$5 / mo               | Optional cellular backup for remote use |

### 📏 SmartBox Sizes

| Size (inches)    | Material Cost | Total Cost (w/ hardware) |
|------------------|---------------|---------------------------|
| 24 x 16 x 14     | ~$167.82      | ~$263.82                  |
| 10 x 7 x 5       | ~$10.93       | ~$106.93                  |
| 7 x 5 x 4        | ~$4.37        | ~$100.37                  |
| 4 x 4 x 4        | ~$2.00        | ~$98.00                   |

---

## 🤖 Marven-L Tier Pricing

| Tier              | Included in Pro? | Description |
|-------------------|------------------|-------------|
| Core Marven-L    | ✅ Yes           | Basic chat, time insights, Q&A |
| Marven-L Pro        | ❌ +$25 / mo     | Multi-turn queries, voice input, analytics |
| Marven-L Vision Pack| ❌ +$15 / mo     | OCR/photo scan integration |
| Marven-L AutoPilot  | ❌ +$35 / mo     | Auto-scheduling, route optimization |
| Full Suite Bundle | ❌ +$59 / mo     | All Marven packs combined |

🧠 *Marven-L features are modular — pick what you need, scale as you grow.*

---


## 🎯 Growth Goals

| Milestone            | Target Revenue                        |
|----------------------|----------------------------------------|
| **First 6 Months**   | 100 paying teams → $4,900 MRR          |
| **Year 1**           | 500 teams, 1,000 SmartBoxes → $30K MRR |
| **Year 3**           | 5,000+ teams, 10,000 SmartBoxes        |
| **Year 4 Goal**      | $5M ARR, 40% net margin                |

📦 Designed for sustainable SaaS + Hardware-as-a-Service growth

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

## 🚛 Two-Path System for LaborTracker Tracking + Flow Diagram

### 🔐 1. With SmartBox (Hardware Integration)

Each SmartBox acts as a secure, trackable unit using a QR tag (your passive transponder) or optional RFID/NFC chip.

- **Box is packed → QR code is scanned → delivery entry is created in LaborTracker.**
- SmartBox ID is tied to real-time GPS and status updates.
- Customers can scan the QR to confirm receipt.

**Benefits:**
- Seamless, tamper-proof tracking.
- “Wow factor” from physical hardware.
- Reduces lost packages and misdelivery risk.

### 💻 2. Without SmartBox (Software-Only Mode)

No SmartBox? No problem. Companies can use LaborTracker entirely through manual or synced tracking numbers.

- Staff enters or pastes a third-party tracking number (FedEx, UPS, USPS, etc.).
- LaborTracker can poll the carrier’s tracking API or store status updates manually.
- Status flows through your dashboard like any SmartBox delivery.

**Benefits:**
- No hardware required.
- Fast onboarding for new companies.
- Compatible with existing shipping tools.

<img width="1536" height="1024" alt="Two_Path_Sys_LaborTracker" src="https://github.com/user-attachments/assets/e9c30517-b0fa-4140-826e-1107168f69ce" />

---

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Usage

Use this space to show useful examples of how a project can be used. Additional screenshots, code examples and demos work well in this space. You may also link to more resources.

_For more examples, please refer to the [Documentation](https://example.com)_

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contact

Project Link: [https://github.com/ahesh001/Labor_Tracker](https://github.com/ahesh001/Labor_Tracker)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
