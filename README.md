<div align="center">

<!-- Animated Header -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,50:00b4d8,100:0077b6&height=200&section=header&text=AURA-STETH%20AI&fontSize=60&fontColor=ffffff&fontAlignY=38&desc=AI-Powered%20Smart%20Stethoscope%20%7C%20ESP32%20%2B%20Cloud%20%2B%20ML&descAlignY=58&descSize=18&animation=fadeIn" width="100%"/>

<!-- Badges Row 1 -->
<p>
  <img src="https://img.shields.io/badge/ESP32-Firmware-blue?style=for-the-badge&logo=espressif&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white"/>
  <img src="https://img.shields.io/badge/HuggingFace-AI%20Model-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black"/>
</p>

<!-- Badges Row 2 -->
<p>
  <img src="https://img.shields.io/badge/PyTorch-ML%20Pipeline-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white"/>
  <img src="https://img.shields.io/badge/FastAPI-AI%20Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/INMP441-I2S%20Mic-00b4d8?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/MAX30105-HR%20%2B%20SpO2-e63946?style=for-the-badge"/>
</p>

<!-- Animated typing SVG -->
<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&pause=800&color=00B4D8&center=true&vCenter=true&width=700&lines=AI+Stethoscope+%F0%9F%AB%80+Heart+%2B+Lung+Analysis;Real-Time+Vitals+on+ESP32+%F0%9F%92%93;Cloud+Dashboard+%2B+Doctor+Consultation+%F0%9F%A9%BA;Artifact+Detection+%E2%80%94+Smart+Signal+Quality+%F0%9F%94%8D;Works+Online+%2B+Offline+Failsafe+Mode+%F0%9F%93%A1" alt="Typing SVG" />
</a>

<br/>

> 🏥 **AURA-STETH AI** is a complete end-to-end smart medical monitoring system — a custom-built ESP32 stethoscope that measures heart rate, SpO₂, skin temperature, and auscultation audio, then streams it to a cloud dashboard with AI-powered heart & lung diagnostics, real-time doctor consultation, and artifact detection.

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
| 🚨 **Artifact Detection** | Detects motion/tapping during recording and prompts retry |
| 🌡️ **Skin Temperature** | MAX30205 I2C sensor with exponential smoothing filter |
| 💓 **Heart Rate + SpO₂** | MAX30105 optical sensor |
| 🎙️ **INMP441 I2S Mic** | 10-second WAV capture at 16kHz for AI auscultation analysis |
| 🖥️ **OLED Display** | Real-time vitals, step instructions, and countdown on SH1106 128×64 |
| 🔴🟡🟢 **Traffic Light LEDs** | Visual health status indicator on device |
| 🩺 **Doctor Consultation** | Live video consultation + digital prescription generation |
| 📄 **Clinical PDF Report** | Auto-generated downloadable report with risk scoring |

</div>

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AURA-STETH AI SYSTEM                     │
├──────────────┬──────────────────────────┬───────────────────────┤
│   HARDWARE   │        CLOUD LAYER       │      AI BACKEND       │
│  (ESP32-S3)  │                          │  (HuggingFace Space)  │
│              │   ┌─────────────────┐    │                       │
│  ┌─────────┐ │   │  Supabase DB    │    │  ┌─────────────────┐  │
│  │INMP441  │─┼──▶│  - sessions     │    │  │  Heart Model    │  │
│  │I2S Mic  │ │   │  - vitals       │◀───┼──│  AURANet        │  │
│  └─────────┘ │   │  - statuses     │    │  │  AUC: 0.9578    │  │
│  ┌─────────┐ │   │  - doctors      │    │  └─────────────────┘  │
│  │MAX30105 │─┼──▶│  - prescriptions│    │  ┌─────────────────┐  │
│  │HR+SpO2  │ │   └─────────────────┘    │  │  Lung Model     │  │
│  └─────────┘ │            │              │  │  LungNet        │  │
│  ┌─────────┐ │   ┌────────▼────────┐    │  │  Acc: 70.47%    │  │
│  │MAX30205 │─┼──▶│  React Web App  │    │  └─────────────────┘  │
│  │Temp     │ │   │  - Patient View │    │         ▲             │
│  └─────────┘ │   │  - Doctor View  │    │         │             │
│  ┌─────────┐ │   │  - Admin View   │────┼─────────┘             │
│  │SH1106   │ │   └─────────────────┘    │  /predict/full        │
│  │OLED     │ │                          │  WAV → JSON response  │
│  └─────────┘ │                          │                       │
└──────────────┴──────────────────────────┴───────────────────────┘
```

---

## 📁 Repository Structure

```
live-vitals-web/
│
├── 📱 src/pages/                    # React Pages
│   ├── Index.tsx                    # Landing / Session start
│   ├── Monitor.tsx                  # Live monitoring view
│   ├── Report.tsx                   # Clinical report + PDF
│   ├── DoctorDashboard.tsx          # Doctor portal
│   ├── AdminDashboard.tsx           # Admin dashboard
│   └── History.tsx                  # Session history
│
├── 🧩 src/components/               # Reusable UI components
│   ├── ui/                          # shadcn/ui components
│   └── VideoCall.tsx                # Video consultation
│
├── 🔌 src/hooks/                    # Custom React hooks
│   ├── useAuth.ts
│   ├── useWifiSession.ts
│   └── useSession.ts
│
├── 📐 src/types/
│   └── database.ts                  # Vital, Session, Profile types
│
├── 🤖 hf-space/                     # AI Backend (HuggingFace Space)
│   ├── main.py                      # FastAPI + /predict/full endpoint
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── aura_heart_FINAL.pth         # Trained heart sound model
│   ├── heart_config_FINAL.json      # Heart model config + threshold
│   ├── aura_lung_FINAL.pth          # Trained lung sound model
│   └── lung_config_FINAL.json       # Lung model config
│
├── 🔧 firmware/
│   └── AURA_FINAL.ino               # ESP32 Arduino firmware
│
├── 📄 docs/
│   └── images/                      # Screenshots for README
│
├── .env.local.example               # Template — never commit .env.local!
├── package.json
└── README.md
```

---

## 🔧 Hardware Components

<div align="center">

| Component | Role | Interface |
|---|---|---|
| **ESP32-S3** | Main MCU | — |
| **INMP441** | Digital MEMS Microphone (auscultation audio) | I2S |
| **MAX30105** | Heart Rate + SpO₂ sensor | I2C |
| **MAX30205** | Skin Temperature sensor | I2C |
| **SH1106 OLED** | 128×64 display | I2C |
| **Red/Yellow/Green LEDs** | Traffic-light health indicator | GPIO |
| **Buzzer** | Alert tone on abnormal result | GPIO |

</div>

### Pin Mapping

```cpp
// I2C Bus
SDA_PIN  = 8     SCL_PIN = 9

// I2S Microphone (INMP441) — L/R pin to GND = LEFT channel
I2S_WS   = 13    I2S_SCK = 14    I2S_SD = 15

// Indicators
LED_RED    = 2    LED_YELLOW = 21    LED_GREEN = 41    BUZZER = 42
```

---

## 🤖 AI Models

### Heart Sound Model — AURANet
- **Architecture:** ResNet50 backbone + tabular feature branch (dual-input fusion)
- **Training Data:** PhysioNet / custom dataset
- **AUC:** 0.9578
- **Input:** 10-second WAV @ 16kHz → Mel spectrogram (128×128) + 89 tabular features
- **Output:**
  - `label` → Normal / Abnormal
  - `abnormal_pct` → confidence %
  - `bpm` → model-estimated BPM
  - `sqi` → Signal Quality Index
  - `systole_ms` / `diastole_ms` → cardiac timing
  - `sys_murmur` / `dia_murmur` → murmur detection
  - `valve_risk` → None / Possible Aortic Stenosis / etc.

### Lung Sound Model — LungNet
- **Architecture:** EfficientNet-B0
- **Training Data:** ICBHI 2017 dataset
- **Accuracy:** 70.47%
- **Input:** Same 10-second WAV → Mel spectrogram @ 22050Hz
- **Output:**
  - `label` → Normal / Crackle / Wheeze
  - `confidence` %
  - `Normal_pct` / `Crackle_pct` / `Wheeze_pct`

### Artifact Detection
If the device moves during recording (motion/tapping), backend returns `"artifact": true`. The UI shows a warning card and prompts the user to keep still and retry.

---

## 🚦 Health Scoring Logic

```
Score = 0

Temperature abnormal  (< 31°C or > 37.5°C)  → +35
Heart Rate abnormal   (< 60 or > 100 BPM)   → +35
SpO₂ abnormal         (< 80%)               → +30
AI Alert triggered                           → override to RED

Score  0–29  → 🟢 GREEN  (Normal)
Score 30–69  → 🟡 YELLOW (Attention)
Score  70+   → 🔴 RED    (Alert → Immediate attention needed)
```

---

## 📡 AI Backend API

The AI backend runs as a Docker container on HuggingFace Spaces.

**Endpoint:** `POST /predict/full`

**Request:** `multipart/form-data` with `file` field (WAV audio)

**Response:**
```json
{
  "artifact": false,
  "heart": {
    "label": "Abnormal",
    "abnormal_pct": 99.9,
    "bpm": 72.0,
    "sqi": 85.3,
    "systole_ms": 310.0,
    "diastole_ms": 480.0,
    "sys_murmur": false,
    "dia_murmur": false,
    "valve_risk": "None"
  },
  "lung": {
    "label": "Wheeze",
    "confidence": 67.4,
    "Normal_pct": 25.3,
    "Crackle_pct": 7.3,
    "Wheeze_pct": 67.4
  },
  "alert": true,
  "warning": null
}
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
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 3. Install & run frontend

```bash
npm install
npm run dev
# Open http://localhost:5173
```

### 4. Deploy AI backend (HuggingFace Space)

```
1. Go to huggingface.co → New Space → SDK: Docker
2. Upload hf-space/ folder contents
3. Add Secrets: HF_TOKEN + HF_MODEL_REPO
4. Space auto-builds and serves /predict/full
5. Copy your Space URL into firmware
```

### 5. Flash ESP32 firmware

```
1. Open firmware/AURA_FINAL.ino in Arduino IDE
2. Fill in WiFi credentials + Supabase URL + HF Space URL
3. Board: ESP32S3 Dev Module
4. Flash via USB-C
```

### 6. Supabase Setup

Run this SQL in your Supabase SQL editor to add AI columns:

```sql
ALTER TABLE vitals
  ADD COLUMN IF NOT EXISTS ai_heart_label  TEXT,
  ADD COLUMN IF NOT EXISTS ai_heart_prob   FLOAT,
  ADD COLUMN IF NOT EXISTS ai_bpm          FLOAT,
  ADD COLUMN IF NOT EXISTS ai_sqi          FLOAT,
  ADD COLUMN IF NOT EXISTS ai_systole_ms   FLOAT,
  ADD COLUMN IF NOT EXISTS ai_diastole_ms  FLOAT,
  ADD COLUMN IF NOT EXISTS ai_sys_murmur   BOOLEAN,
  ADD COLUMN IF NOT EXISTS ai_dia_murmur   BOOLEAN,
  ADD COLUMN IF NOT EXISTS ai_valve_risk   TEXT,
  ADD COLUMN IF NOT EXISTS ai_lung_label   TEXT,
  ADD COLUMN IF NOT EXISTS ai_lung_conf    FLOAT,
  ADD COLUMN IF NOT EXISTS ai_normal_pct   FLOAT,
  ADD COLUMN IF NOT EXISTS ai_crackle_pct  FLOAT,
  ADD COLUMN IF NOT EXISTS ai_wheeze_pct   FLOAT,
  ADD COLUMN IF NOT EXISTS ai_alert        BOOLEAN,
  ADD COLUMN IF NOT EXISTS ai_artifact     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS warning         TEXT;
```

---

## 📊 Dashboard Features

<div align="center">

| View | Features |
|---|---|
| **Patient** | Start session, live step tracking, final report, AI results, download PDF, join video consult |
| **Doctor** | View patient vitals + AI diagnostics, write prescription, start video call |
| **Admin** | All sessions table, health status filter, analytics, manage doctors |

</div>

---

## 🔐 Security

- **Never commit `.env.local`** — it is in `.gitignore`
- **Never commit WiFi credentials** — fill them only in the local `.ino` file
- All Supabase keys in frontend use **anon/public** key only (Row Level Security enforced)
- HF Token stored only as HuggingFace Space Secret

---

## 📦 Tech Stack

<div align="center">

| Layer | Technology |
|---|---|
| **Firmware** | Arduino C++ on ESP32-S3 |
| **Frontend** | React + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| **Database** | Supabase (PostgreSQL + Realtime subscriptions) |
| **AI Backend** | FastAPI + PyTorch on HuggingFace Spaces (Docker) |
| **PDF Reports** | jsPDF + jspdf-autotable (client-side) |
| **Video Consult** | Jitsi Meet WebRTC |
| **Deployment** | Lovable / Vercel (frontend) + HuggingFace (AI) |

</div>

---

## 🗺️ Roadmap

- [x] ESP32 firmware with I2S audio recording (INMP441)
- [x] Heart AI model (AURANet) — AUC 0.9578
- [x] Lung AI model (LungNet) — ICBHI 70.47%
- [x] Artifact detection + warning UI
- [x] Real-time Supabase session tracking
- [x] Patient / Doctor / Admin dashboards
- [x] PDF clinical report generation
- [x] Doctor video consultation + prescription
- [x] OLED step-by-step instructions
- [x] Traffic light LED health indicator
- [ ] Mobile app (React Native)
- [ ] Multi-language support (Hindi, Marathi)
- [ ] Bluetooth mode (no WiFi)
- [ ] 3D printed enclosure (wearable form factor)

---

## 👥 Team

<div align="center">

**AURA-STETH AI** — Final Year Engineering Project

| Role | Name |
|---|---|
| Hardware + Firmware | Manish Dhatrak |
| AI / ML Model Training | Manish Dhatrak |
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
