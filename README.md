<div align="center">

<!-- Animated Header -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,50:00b4d8,100:0077b6&height=200&section=header&text=AURA-STETH%20AI&fontSize=60&fontColor=ffffff&fontAlignY=38&desc=AI-Powered%20Smart%20Stethoscope%20%7C%20ESP32%20%2B%20Cloud%20%2B%20ML&descAlignY=58&descSize=18&animation=fadeIn" width="100%"/>

<!-- Badges Row 1 -->
<p>
  <img src="https://img.shields.io/badge/ESP32-Firmware-blue?style=for-the-badge&logo=espressif&logoColor=white"/>
  <img src="https://img.shields.io/badge/Next.js-Frontend-black?style=for-the-badge&logo=next.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white"/>
  <img src="https://img.shields.io/badge/HuggingFace-AI%20Model-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black"/>
</p>

<!-- Badges Row 2 -->
<p>
  <img src="https://img.shields.io/badge/PyTorch-ML%20Pipeline-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white"/>
  <img src="https://img.shields.io/badge/Twilio-Emergency%20Alerts-F22F46?style=for-the-badge&logo=twilio&logoColor=white"/>
  <img src="https://img.shields.io/badge/INMP441-I2S%20Mic-00b4d8?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/MAX30105-HR%20%2B%20SpO2-e63946?style=for-the-badge"/>
</p>

<!-- Animated typing SVG -->
<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&pause=800&color=00B4D8&center=true&vCenter=true&width=700&lines=AI+Stethoscope+%F0%9F%AB%80+Heart+%2B+Lung+Analysis;Real-Time+Vitals+on+ESP32+%F0%9F%92%93;Cloud+Dashboard+%2B+Doctor+Consultation+%F0%9F%A9%BA;Emergency+SMS+%2B+Call+via+Twilio+%F0%9F%9A%A8;HC12+Failsafe+%E2%80%94+Works+Without+WiFi+%F0%9F%93%A1" alt="Typing SVG" />
</a>

<br/>

> 🏥 **AURA-STETH AI** is a complete end-to-end smart medical monitoring system — a custom-built ESP32 stethoscope that measures heart rate, SpO₂, skin temperature, and auscultation audio, then streams it to a cloud dashboard with AI-powered heart & lung diagnostics, real-time doctor consultation, and emergency alerting.

</div>

---

## 📸 Project Gallery

<div align="center">
<table>
  <tr>
    <td align="center"><b>🔩 Physical Hardware</b></td>
    <td align="center"><b>📐 Circuit Diagram</b></td>
  </tr>
  <tr>
    <td><img src="docs/images/hardware.jpg" width="400" alt="Hardware prototype with ESP32 box, stethoscope, LEDs"/></td>
    <td><img src="docs/images/circuit.png" width="400" alt="ESP32 with INMP441, MAX30105, MAX30205 wiring diagram"/></td>
  </tr>
  <tr>
    <td align="center"><b>📱 Patient Dashboard</b></td>
    <td align="center"><b>🖥️ Admin Dashboard</b></td>
  </tr>
  <tr>
    <td><img src="docs/images/patient_dashboard.png" width="400" alt="Session creation and live monitoring progress"/></td>
    <td><img src="docs/images/admin_dashboard.png" width="400" alt="All sessions management with health status"/></td>
  </tr>
  <tr>
    <td align="center"><b>📋 Clinical Report</b></td>
    <td align="center"><b>💊 Doctor Prescription</b></td>
  </tr>
  <tr>
    <td><img src="docs/images/clinical_report.png" width="400" alt="PDF clinical report with risk assessment"/></td>
    <td><img src="docs/images/prescription.png" width="400" alt="Digital prescription from doctor"/></td>
  </tr>
</table>
</div>

---

## 🌟 Key Features

<div align="center">

| Feature | Description |
|---|---|
| 🫀 **AI Heart Analysis** | Detects Normal / Abnormal, murmurs, systole & diastole timing, valve risk |
| 🫁 **AI Lung Analysis** | Classifies Normal / Crackle / Wheeze with confidence scores |
| 🌡️ **Skin Temperature** | MAX30205 I2C sensor with exponential smoothing filter |
| 💓 **Heart Rate + SpO₂** | MAX30105 with lookup-table SpO₂ algorithm |
| 📡 **HC12 Failsafe Mode** | Operates fully offline via 433MHz radio when WiFi unavailable |
| 🚨 **Emergency Alerts** | Auto SMS + silent call via Twilio on RED status |
| 🩺 **Doctor Consultation** | Live video consultation + digital prescription generation |
| 📄 **Clinical PDF Report** | Auto-generated downloadable report with risk scoring |
| 🔴🟡🟢 **Traffic Light LEDs** | Visual alert system + buzzer on device |
| 🖥️ **OLED Display** | Real-time vitals and countdown on 128×64 SH1106 display |

</div>

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AURA-STETH AI SYSTEM                      │
├──────────────┬──────────────────────────┬───────────────────────┤
│   HARDWARE   │        CLOUD LAYER        │      AI BACKEND       │
│  (ESP32 S3)  │                           │   (HuggingFace Space) │
│              │   ┌─────────────────┐     │                       │
│  ┌─────────┐ │   │  Supabase DB    │     │  ┌─────────────────┐  │
│  │INMP441  │─┼──▶│  - sessions     │     │  │  Heart Model    │  │
│  │I2S Mic  │ │   │  - vitals       │◀────┼──│  (CNN/LSTM)     │  │
│  └─────────┘ │   │  - statuses     │     │  │  .pth weights   │  │
│  ┌─────────┐ │   │  - doctors      │     │  └─────────────────┘  │
│  │MAX30105 │─┼──▶│  - prescriptions│     │  ┌─────────────────┐  │
│  │HR+SpO2  │ │   └─────────────────┘     │  │  Lung Model     │  │
│  └─────────┘ │            │               │  │  (ResNet/CNN)   │  │
│  ┌─────────┐ │   ┌────────▼────────┐     │  │  .pth weights   │  │
│  │MAX30205 │─┼──▶│  Next.js Web    │     │  └─────────────────┘  │
│  │Temp     │ │   │  - Patient View │     │          ▲            │
│  └─────────┘ │   │  - Doctor View  │     │          │            │
│  ┌─────────┐ │   │  - Admin View   │─────┼──────────┘            │
│  │HC12     │ │   └─────────────────┘     │   /predict/full       │
│  │Failsafe │ │                           │   (WAV → JSON)        │
│  └─────────┘ │   ┌─────────────────┐     │                       │
│  ┌─────────┐ │   │  Twilio         │     │                       │
│  │SH1106   │ │   │  SMS + Call     │     │                       │
│  │OLED     │ │   └─────────────────┘     │                       │
│  └─────────┘ │                           │                       │
└──────────────┴──────────────────────────┴───────────────────────┘
```

---

## 📁 Repository Structure

```
live-vitals-web/
│
├── 📱 app/                          # Next.js 14 App Router
│   ├── page.tsx                     # Landing / Session start
│   ├── monitor/[id]/page.tsx        # Live monitoring view
│   ├── report/[id]/page.tsx         # Clinical report + PDF
│   ├── doctor/                      # Doctor portal
│   │   ├── dashboard/page.tsx
│   │   ├── consultation/[id]/page.tsx
│   │   └── prescription/page.tsx
│   └── admin/                       # Admin dashboard
│       ├── page.tsx                 # Overview + analytics
│       ├── sessions/page.tsx
│       └── doctors/page.tsx
│
├── 🧩 components/                   # Reusable UI components
│   ├── VitalsCard.tsx
│   ├── RiskBadge.tsx
│   ├── LiveProgress.tsx
│   └── PDFReport.tsx
│
├── 🔌 lib/                          # Supabase client + helpers
│   ├── supabase.ts
│   └── twilio.ts
│
├── 🤖 trained_model/                # AI Backend (HuggingFace Space)
│   ├── app.py                       # FastAPI entry point
│   ├── predict.py                   # /predict/full endpoint
│   ├── heart_model.pth              # Trained heart sound model
│   ├── lung_model.pth               # Trained lung sound model
│   ├── requirements.txt
│   └── README.md                    # HF Space README (YAML header)
│
├── 🔧 firmware/
│   └── aura_firmware.ino            # ESP32 Arduino firmware
│
├── 📄 docs/
│   └── images/                      # Screenshots for README
│
├── .env.local.example               # Template — never commit .env.local!
├── package.json
└── README.md                        ← You are here
```

---

## 🔧 Hardware Components

<div align="center">

| Component | Role | Interface |
|---|---|---|
| **ESP32-S3** | Main MCU | — |
| **INMP441** | Digital MEMS Microphone (auscultation) | I2S |
| **MAX30105** | Heart Rate + SpO₂ sensor | I2C |
| **MAX30205** | Skin Temperature sensor | I2C |
| **SH1106 OLED** | 128×64 display | I2C |
| **HC12** | 433MHz radio (failsafe comms) | UART |
| **Red/Yellow/Green LEDs** | Traffic-light health indicator | GPIO |
| **Buzzer** | Alert tone | GPIO |

</div>

### Pin Mapping

```cpp
// I2C Bus
SDA_PIN  = 8    SCL_PIN = 9

// I2S Microphone (INMP441)
I2S_WS   = 13   I2S_SCK = 14   I2S_SD = 15

// Indicators
LED_RED    = 2   LED_YELLOW = 21   LED_GREEN = 41   BUZZER = 42

// HC12 Failsafe Radio
HC12_RX = 4   HC12_TX = 5
```

---

## 🤖 AI Models

### Heart Sound Model
- **Input:** 10-second WAV @ 16kHz from INMP441 (placed on chest like stethoscope)
- **Output:**
  - `label` → Normal / Abnormal
  - `abnormal_pct` → confidence %
  - `bpm` → model-estimated BPM
  - `sqi` → Signal Quality Index
  - `systole_ms` / `diastole_ms` → cardiac timing
  - `sys_murmur` / `dia_murmur` → murmur detection
  - `valve_risk` → None / Low / Medium / High

### Lung Sound Model
- **Input:** Same 10-second WAV file
- **Output:**
  - `label` → Normal / Crackle / Wheeze
  - `confidence` %
  - `Normal_pct` / `Crackle_pct` / `Wheeze_pct`

### Artifact Detection
If the device moves during recording, the API returns `"artifact": true` and the system prompts the user to keep still and retry.

---

## 🚦 Health Scoring Logic

```
Score = 0

Temperature abnormal  (< 31°C or > 37.5°C)  → +35
Heart Rate abnormal   (< 60 or > 100 BPM)   → +35
SpO₂ abnormal         (< 80%)                → +30
AI Alert triggered                           → override to RED

Score  0–29  → 🟢 GREEN  (Normal)
Score 30–69  → 🟡 YELLOW (Attention)
Score  70+   → 🔴 RED    (Alert → SMS + Call)
```

---

## 🚨 Failsafe Mode

When WiFi is unavailable (e.g. rural/remote use), the device automatically switches to **HC12 433MHz radio** mode:

```
No WiFi detected at boot
         │
         ▼
   FAILSAFE MODE active
         │
    ┌────┴─────┐
    │ Measure  │  Temperature (30s) → HR + SpO₂ (30s)
    └────┬─────┘
         │
    ┌────▼─────────────────────────────────────┐
    │  HC12 sends: AURA|T:36.5|HR:72|SPO2:98  │
    │              |STATUS:GREEN               │
    └──────────────────────────────────────────┘
         │
    Local LED + Buzzer alert
         │
    Retry WiFi every 30 seconds → auto-reconnect to normal mode
```

---

## 🛠️ Setup & Deployment

### 1. Clone the repo

```bash
git clone https://github.com/cosmomanish007-pixel/live-vitals-web.git
cd live-vitals-web
```

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
EMERGENCY_PHONE_NUMBER=+91XXXXXXXXXX

NEXT_PUBLIC_AI_BACKEND_URL=https://YOUR_HF_USERNAME-YOUR_SPACE_NAME.hf.space
```

### 3. Install & run frontend

```bash
npm install
npm run dev
# Open http://localhost:3000
```

### 4. Deploy AI backend (HuggingFace Space)

```
1. Go to huggingface.co → New Space → SDK: Docker or Gradio
2. Upload trained_model/ folder contents
3. HF will auto-build and serve /predict/full endpoint
4. Copy your Space URL into .env.local and firmware
```

### 5. Flash ESP32 firmware

```
1. Open firmware/aura_firmware.ino in Arduino IDE
2. Fill in credentials at the top of the file (marked 🔐)
3. Board: ESP32S3 Dev Module
4. Flash via USB
```

---

## 📊 Dashboard Features

<div align="center">

| View | Features |
|---|---|
| **Patient** | Start session, live step tracking, final report, download PDF, join video consult |
| **Doctor** | View patient vitals, AI diagnostics, write prescription, start video call |
| **Admin** | All sessions table, health status filter, analytics charts, manage doctors |

</div>

---

## 🔐 Security

- **Never commit `.env.local`** — it is in `.gitignore`
- **Never commit `secrets.h`** — use the placeholder firmware version
- All Supabase keys in frontend use **anon/public** key only (Row Level Security enforced)
- Service role key used only server-side in Next.js API routes
- Twilio credentials stored only as environment variables

---

## 📦 Tech Stack

<div align="center">

| Layer | Technology |
|---|---|
| **Firmware** | Arduino C++ on ESP32-S3 |
| **Frontend** | Next.js 14, React, Tailwind CSS |
| **Database** | Supabase (PostgreSQL + Realtime) |
| **AI Backend** | FastAPI + PyTorch on HuggingFace Spaces |
| **Emergency** | Twilio SMS + Voice API |
| **PDF Reports** | Client-side PDF generation |
| **Video Consult** | WebRTC / Video SDK |
| **Deployment** | Vercel (frontend) + HuggingFace (AI) |

</div>

---

## 🗺️ Roadmap

- [x] ESP32 firmware with I2S audio recording
- [x] Heart + Lung AI model training & deployment
- [x] Real-time Supabase session tracking
- [x] Patient / Doctor / Admin dashboards
- [x] Emergency Twilio alerts
- [x] HC12 failsafe offline mode
- [x] PDF clinical report generation
- [x] Doctor prescription writing
- [ ] Mobile app (React Native)
- [ ] Multi-language support (Hindi, Marathi)
- [ ] Bluetooth mode (no WiFi, no HC12)
- [ ] Wearable form factor (3D printed enclosure)

---

## 👥 Team

<div align="center">

**AURA-STETH AI** — Final Year Engineering Project

| Role | Name |
|---|---|
| Hardware + Firmware | Manish Dhatrak |
| AI / ML Model | Manish Dhatrak |
| Frontend + Dashboard | Manish Dhatrak |
| Cloud + Backend | Manish Dhatrak |

</div>

---

## 📜 License

This project is for academic and research purposes.  
© 2026 AURA-STETH AI Team. All rights reserved.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0077b6,50:00b4d8,100:0d1117&height=120&section=footer" width="100%"/>

**⭐ Star this repo if AURA helped you! ⭐**

<img src="https://img.shields.io/github/stars/cosmomanish007-pixel/live-vitals-web?style=social"/>
&nbsp;
<img src="https://img.shields.io/github/forks/cosmomanish007-pixel/live-vitals-web?style=social"/>

*Built with ❤️ in Aurangabad, Maharashtra 🇮🇳*

</div>
