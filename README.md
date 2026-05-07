<div align="center">

<!-- Animated Header Banner -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,50:00d4ff,100:00ff88&height=200&section=header&text=AURA-STETH%20AI&fontSize=60&fontColor=ffffff&fontAlignY=38&desc=Intelligent%20AI-Powered%20Smart%20Stethoscope%20%7C%20Telemedicine%20for%20Rural%20India&descAlignY=58&descSize=16&animation=fadeIn" width="100%"/>

<!-- Badges Row 1 -->
<p>
  <img src="https://img.shields.io/badge/Heart%20AI%20AUC-0.9578-ff4757?style=for-the-badge&logo=heart&logoColor=white"/>
  <img src="https://img.shields.io/badge/Lung%20AI%20Acc-70.47%25-00d4ff?style=for-the-badge&logo=lungs&logoColor=white"/>
  <img src="https://img.shields.io/badge/Platform-ESP32--S3-orange?style=for-the-badge&logo=espressif&logoColor=white"/>
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb?style=for-the-badge&logo=react&logoColor=black"/>
</p>

<!-- Badges Row 2 -->
<p>
  <img src="https://img.shields.io/badge/Database-Supabase-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white"/>
  <img src="https://img.shields.io/badge/AI%20Backend-HuggingFace%20Spaces-ffd21e?style=for-the-badge&logo=huggingface&logoColor=black"/>
  <img src="https://img.shields.io/badge/Offline%20Mode-HC12%20RF%20FailSafe-ff6b35?style=for-the-badge&logo=radio&logoColor=white"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge"/>
</p>

<!-- Badges Row 3 -->
<p>
  <img src="https://img.shields.io/badge/Sessions-92%2B-blueviolet?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Telemedicine-Live%20Video%20%2B%20Rx-00ff88?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Status-🟢%20Operational-00d4ff?style=for-the-badge"/>
  <img src="https://img.shields.io/github/stars/cosmomanish007-pixel/live-vitals-web?style=for-the-badge&color=ffd700"/>
</p>

<br/>

> **🏆 Built for Rural India — Bringing Cardiopulmonary AI Diagnostics Where Doctors Cannot Reach**

<br/>

<!-- Live Demo Button -->
<a href="https://live-vitals-web.lovable.app">
  <img src="https://img.shields.io/badge/🌐%20LIVE%20DEMO-live--vitals--web.lovable.app-00d4ff?style=for-the-badge&labelColor=0d1117"/>
</a>
&nbsp;&nbsp;
<a href="https://github.com/cosmomanish007-pixel/live-vitals-web">
  <img src="https://img.shields.io/badge/📁%20GitHub%20Repo-live--vitals--web-white?style=for-the-badge&logo=github&labelColor=0d1117"/>
</a>
&nbsp;&nbsp;
<a href="mailto:manishdhatrak1121@gmail.com">
  <img src="https://img.shields.io/badge/📧%20Contact-manishdhatrak1121@gmail.com-red?style=for-the-badge&logo=gmail&labelColor=0d1117"/>
</a>

</div>

---

## 📋 Table of Contents

| # | Section |
|---|---------|
| 1 | [🔥 Problem Statement](#-problem-statement) |
| 2 | [💡 What is AURA-STETH AI?](#-what-is-aura-steth-ai) |
| 3 | [🏗️ System Architecture](#️-system-architecture) |
| 4 | [⚙️ Hardware Components](#️-hardware-components) |
| 5 | [🧠 AI Models & Metrics](#-ai-models--metrics) |
| 6 | [🗄️ Database Schema](#️-database-schema) |
| 7 | [🌐 Feature Showcase](#-feature-showcase) |
| 8 | [📡 Offline Fail-Safe (HC12)](#-offline-fail-safe--hc12-rf-module) |
| 9 | [📊 Data Flow Diagrams](#-data-flow-diagrams) |
| 10 | [🚀 Getting Started](#-getting-started) |
| 11 | [📁 Repository Structure](#-repository-structure) |
| 12 | [🛣️ Roadmap](#️-roadmap) |
| 13 | [📈 Achievements](#-achievements) |
| 14 | [📬 Contact](#-contact) |

---

## 🔥 Problem Statement

<div align="center">

> *"India has **1 doctor per 1,511 people** — far below the WHO recommended ratio of 1:1,000. In rural areas, this gap widens dramatically. Cardiovascular and respiratory diseases are the **#1 and #3 leading causes of death** in India — yet early-stage auscultation diagnosis is nearly inaccessible outside urban hospitals."*

</div>

**The Core Challenges:**

| Challenge | Impact |
|-----------|--------|
| 🏥 Doctor shortage in rural PHCs | Patients travel 50–100 km for basic cardiac/lung screening |
| 🩺 Stethoscope skill barrier | Auscultation requires years of training — not scalable |
| 📡 Connectivity issues | Traditional telemedicine fails without stable internet |
| 💰 High cost of diagnostics | ECG, spirometry, CT scans cost thousands per visit |
| ⏱️ Delayed diagnosis | Murmurs and crackles go undetected until a critical stage |

**AURA-STETH AI** solves this by putting a **ResNet50-powered AI cardiologist and EfficientNet-B0 pulmonologist** into a ₹2,000 ESP32 device that any health worker can operate with a guided 5-step workflow.

---

## 💡 What is AURA-STETH AI?

**AURA-STETH AI** is a complete end-to-end smart medical monitoring system — a custom-built ESP32 stethoscope that measures **heart rate, SpO₂, skin temperature, and auscultation audio**, streams it to a cloud dashboard with **AI-powered heart & lung diagnostics**, **real-time doctor consultation**, and **offline HC12 RF fail-safe transmission**.

```
🎙️ Record Audio  →  🧠 AI Analysis  →  📊 Clinical Report  →  👨‍⚕️ Doctor Review  →  💊 Digital Prescription
     10s WAV           < 30 sec          Risk Score + Labels      Live Video Call        PDF Download
```

### ✨ Feature Matrix

| Feature | Description | Status |
|---------|-------------|--------|
| 🫀 **AI Heart Analysis** | Normal/Abnormal, murmurs, systole & diastole timing, valve risk | ✅ Live |
| 🫁 **AI Lung Analysis** | Normal / Crackle / Wheeze with confidence scores | ✅ Live |
| 🚨 **Artifact Detection** | Motion/tapping detection during recording, retry prompt | ✅ Live |
| 🌡️ **Skin Temperature** | MAX30205 I2C with exponential smoothing filter | ✅ Live |
| 💓 **Heart Rate + SpO₂** | MAX30105 optical PPG sensor | ✅ Live |
| 🎙️ **I2S Microphone** | INMP441 — 10s WAV capture at 16kHz | ✅ Live |
| 🖥️ **OLED Display** | SH1106 128×64 — real-time vitals + step instructions | ✅ Live |
| 🔴🟡🟢 **Traffic Light LEDs** | Visual on-device health status indicator | ✅ Live |
| 🩺 **Doctor Consultation** | Live video call + digital prescription generation | ✅ Live |
| 📄 **Clinical PDF Report** | Auto-generated with risk scoring per session | ✅ Live |
| 📡 **HC12 Offline Fail-Safe** | RF alert transmission with no WiFi needed | ✅ Live |
| 📲 **SMS + Call Alerts** | Auto-triggered on HIGH risk when online | ✅ Live |
| 🌍 **Multi-language** | Hindi, Marathi support | 🔄 Planned |
| 📱 **Mobile App** | React Native companion app | 🔄 Planned |
| 🖨️ **3D Printed Enclosure** | Wearable form factor | 🔄 Planned |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AURA-STETH AI SYSTEM                               │
├──────────────────┬───────────────────────────┬─────────────────────────────┤
│   HARDWARE LAYER │        CLOUD LAYER        │         AI BACKEND           │
│   (ESP32-S3)     │                           │   (HuggingFace Spaces)       │
│                  │  ┌─────────────────────┐  │                             │
│  ┌─────────────┐ │  │    Supabase DB      │  │  ┌─────────────────────┐   │
│  │  INMP441    │─┼─▶│  ├─ sessions        │  │  │   AURANet (Heart)   │   │
│  │  I2S Mic    │ │  │  ├─ vitals          │◀─┼──│   ResNet50 + Fusion │   │
│  └─────────────┘ │  │  ├─ profiles        │  │  │   AUC: 0.9578       │   │
│  ┌─────────────┐ │  │  ├─ consultation_   │  │  └─────────────────────┘   │
│  │  MAX30105   │─┼─▶│  │  requests        │  │  ┌─────────────────────┐   │
│  │  HR + SpO₂  │ │  │  ├─ consultation_   │  │  │   LungNet (Lung)    │   │
│  └─────────────┘ │  │  │  medicines       │  │  │   EfficientNet-B0   │   │
│  ┌─────────────┐ │  │  └─ statuses        │  │  │   Acc: 70.47%       │   │
│  │  MAX30205   │─┼─▶└─────────────────────┘  │  └─────────────────────┘   │
│  │  Temp Sensor│ │             │              │          ▲                  │
│  └─────────────┘ │  ┌──────────▼──────────┐  │          │                  │
│  ┌─────────────┐ │  │   React Web App     │  │  POST /predict/full         │
│  │  SH1106     │ │  │  ├─ Patient View    │──┼──────────┘                  │
│  │  OLED 128×64│ │  │  ├─ Doctor View     │  │  WAV → JSON response        │
│  └─────────────┘ │  │  └─ Admin View      │  │                             │
│  ┌─────────────┐ │  └─────────────────────┘  │                             │
│  │  HC12 RF    │─┼──── OFFLINE FAIL-SAFE ─────────────────────────────▶   │
│  │  TX / RX    │ │        433 MHz, 1 km       Even WITHOUT WiFi!           │
│  └─────────────┘ │                           │                             │
│  🔴🟡🟢 LEDs     │                           │                             │
└──────────────────┴───────────────────────────┴─────────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **MCU Firmware** | ESP32-S3, Arduino C++, FreeRTOS |
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS, shadcn/ui |
| **Backend / DB** | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| **AI Inference Host** | HuggingFace Spaces (Render backend) |
| **Heart Model** | ResNet50 + multi-scale fusion — AURANet |
| **Lung Model** | EfficientNet-B0 → 3-class softmax — LungNet |
| **Audio Processing** | DWT + Bandpass Filter + Z-norm + Mel-Spectrogram + MFCC |
| **Video Consult** | WebRTC integration |
| **PDF Generation** | In-browser jsPDF / html2canvas |
| **Offline RF** | HC12 433MHz RF module (TX/RX pair), UART |

---

## ⚙️ Hardware Components

| Component | Role | Specs |
|-----------|------|-------|
| **ESP32-S3** | Main MCU | Dual-core 240MHz, WiFi + BT, 8MB PSRAM |
| **INMP441** | I2S Digital Microphone | 16kHz, 10s WAV for auscultation |
| **MAX30105** | PPG Optical Sensor | Heart rate + SpO₂ via photoplethysmography |
| **MAX30205** | Temperature Sensor | I2C, ±0.1°C accuracy, exponential smoothing |
| **SH1106 OLED** | Display | 128×64px, I2C, guided step-by-step UI |
| **HC12 RF Module** | Wireless (Offline Mode) | 433MHz, ~1km range, UART, fail-safe alerts |
| **RGB LEDs** | Status Indicator | 🔴 Alert / 🟡 Attention / 🟢 Normal |
| **Custom Enclosure** | Housing | Hand-built (3D print planned), pink acoustic cup |

### ESP32 Pin Map (Key Connections)

```
INMP441  →  I2S   (GPIO 6=WS,  GPIO 7=SCK, GPIO 8=SD)
MAX30105 →  I2C   (GPIO 21=SDA, GPIO 22=SCL)
MAX30205 →  I2C   (shared bus with MAX30105)
SH1106   →  I2C   (shared bus, addr 0x3C)
HC12     →  UART  (GPIO 17=TX, GPIO 18=RX)
LED RED  →  GPIO 2
LED YELLOW → GPIO 3
LED GREEN → GPIO 4
```

---

## 🧠 AI Models & Metrics

### 🫀 AURANet — Heart Sound Classifier

> **Architecture:** ResNet50 backbone + multi-scale temporal fusion + clinical feature injection

| Metric | Value |
|--------|-------|
| **Best AUC (5-fold CV)** | **0.9578** |
| **Best Single Fold AUC** | 0.9367 |
| **Global Decision Threshold** | 0.2807 |
| **Optimal Decision Threshold** | 0.3416 |
| **Sensitivity Target** | 0.85 (recall-optimised) |
| **PW Floor / PW Cap** | 1.5 / 2.5 |

**Training Datasets:** PhysioNet Challenge 2016 + CirCor DigiScope 2022

**Fold-wise AUC Breakdown:**

| Fold | Threshold | AUC |
|------|-----------|-----|
| Fold 1 | 0.2807 | 0.9367 |
| Fold 2 | 0.1739 | 0.8739 |
| Fold 3 | 0.6916 | **0.9578** ⭐ |
| Fold 4 | 0.2773 | 0.9273 |
| Fold 5 | 0.3804 | 0.9380 |

**Outputs per Inference:**

```
heart_label    → Normal / Abnormal
abnormal_prob  → 0.0 – 1.0  (probability score)
ai_bpm         → AI-derived heart rate (beats/min)
systole_ms     → Systolic phase duration (ms)
diastole_ms    → Diastolic phase duration (ms)
sqi            → Signal Quality Index (0–100)
valve_risk     → None / Low / Medium / High
sys_murmur     → YES / NO
dia_murmur     → YES / NO
```

---

### 🫁 LungNet — Respiratory Sound Classifier

> **Architecture:** EfficientNet-B0 on Mel-Spectrogram → 3-class softmax

| Metric | Value |
|--------|-------|
| **ICBHI 2017 Score** | **70.47%** |
| **Best AUC (multiclass OvR)** | **0.8495** |
| **Overall AUC** | 0.8078 |
| **Input Sample Rate** | 22,050 Hz |
| **Breathing Cycle Window** | 5 seconds |
| **Mel Frequency Bands** | 128 |
| **FFT Size (n_fft)** | 1024 |
| **Hop Length** | 512 |
| **Max Frequency (fmax)** | 2,000 Hz |

**Training Datasets:** ICBHI 2017 + SPRSound BioCAS 2022

**Output Classes:**

```
🟢 Normal   →  Clear breath sounds — no pathology detected
🟡 Crackle  →  Discontinuous adventitious sounds (pneumonia, fibrosis, fluid)
🔴 Wheeze   →  Continuous high-pitched sounds (asthma, COPD, bronchospasm)
```

**Example Full AI Inference Output:**

```json
{
  "heart": {
    "label": "Normal",
    "abnormal_prob": 0.071,
    "ai_bpm": 44.4,
    "systole_ms": 272,
    "diastole_ms": 335,
    "sqi": 91,
    "valve_risk": "None",
    "sys_murmur": false,
    "dia_murmur": false
  },
  "lung": {
    "label": "Crackle",
    "normal_pct": 22.7,
    "crackle_pct": 58.2,
    "wheeze_pct": 19.1,
    "confidence": 0.582
  },
  "artifact": false,
  "alert": "AI Alert: Abnormality Detected"
}
```

---

### 🚨 Artifact Detection Engine

```
During 10s auscultation recording:
   Audio RMS  >  threshold  →  artifact_flag = TRUE
                             →  OLED: "Keep device steady"
                             →  Dashboard: ⚠️ Artifact Detected — Motion/Tapping
                             →  AI analysis skipped — User prompted to retry
```

---

## 🗄️ Database Schema

> Powered by **Supabase PostgreSQL** with Row-Level Security (RLS)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPABASE SCHEMA                              │
│                                                                     │
│  sessions                            profiles                       │
│  ├─ id (uuid PK)                     ├─ id (FK → auth.users)       │
│  ├─ state (text)                     ├─ role (patient/doctor/admin) │
│  ├─ mode (text)                      ├─ doctor_status               │
│  ├─ user_name (text)                 ├─ license_number              │
│  ├─ age (int)                        ├─ specialization              │
│  ├─ gender (text)                    ├─ hospital                    │
│  ├─ user_id (FK → auth.users)        ├─ is_available (bool)         │
│  ├─ created_at (timestamp)           └─ full_name                   │
│  └─ consultation_completed (bool)                                   │
│                                                                     │
│  vitals                              statuses                       │
│  ├─ id, session_id (FK)              ├─ id, session_id (FK)         │
│  ├─ temp, hr, spo2, audio            ├─ message (text)              │
│  ├─ ai_heart_label, ai_heart_prob    └─ created_at (timestamp)      │
│  ├─ ai_lung_label, ai_lung_conf                                     │
│  ├─ ai_sqi, ai_bpm                   consultation_requests          │
│  ├─ ai_systole_ms, ai_diastole_ms    ├─ id, session_id (FK)         │
│  ├─ ai_sys_murmur, ai_dia_murmur     ├─ doctor_id (FK)              │
│  ├─ ai_valve_risk                    ├─ risk_level, status          │
│  ├─ ai_normal_pct, ai_crackle_pct    ├─ doctor_notes, prescription  │
│  ├─ ai_wheeze_pct                    ├─ diagnosis, chief_complaints  │
│  ├─ ai_alert (text)                  ├─ advice, follow_up_date      │
│  ├─ ai_artifact (bool)               ├─ video_channel               │
│  └─ warning (text)                   ├─ call_started_at             │
│                                      └─ call_ended_at               │
│  consultation_medicines                                             │
│  ├─ id, consultation_id (FK)                                        │
│  ├─ medicine_name, dosage                                           │
│  ├─ frequency, duration                                             │
│  └─ total_quantity                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🌐 Feature Showcase

### 👤 Patient Monitoring Flow

```
1. Splash Screen  ──▶  2. Sign In / Sign Up  ──▶  3. Enter Patient Details
                                                          │
                                   ┌──────────────────────▼──────────────────────┐
                                   │           Monitoring Live                   │
                                   │  ✅ System Initialised                      │
                                   │  ✅ Measuring Skin Temperature (MAX30205)   │
                                   │  ✅ Auscultation Started (10s INMP441)      │
                                   │  ✅ Measuring HR & SpO₂ (MAX30105)          │
                                   │  ⏳ Final Analysis — AI inference...        │
                                   └─────────────────────────────────────────────┘
                                                          │
                                   ┌──────────────────────▼──────────────────────┐
                                   │           Clinical Report                   │
                                   │  Risk: 🟢 Normal / 🟡 Attention / 🔴 HIGH  │
                                   │  Vitals: Temp | HR | SpO₂ | Audio Peak     │
                                   │  🫀 Heart AI: label, BPM, systole, SQI...  │
                                   │  🫁 Lung AI: Normal/Crackle/Wheeze %...    │
                                   │  ⚠️  Artifact warning (if detected)        │
                                   │  📄 Download Clinical PDF                  │
                                   │  🩺 Request Doctor Consultation            │
                                   └─────────────────────────────────────────────┘
                                                          │
                               ┌───────────────────────────▼──────────────────────────┐
                               │  Video Consultation  ──▶  Doctor Prescription PDF   │
                               └──────────────────────────────────────────────────────┘
```

### 👨‍⚕️ Doctor Dashboard

```
Doctor Panel
├── Online / Offline availability toggle
├── Active / Pending Consultations
│   ├── Session ID + Risk Level Badge (HIGH / MEDIUM / LOW)
│   ├── View Patient AI Report
│   └── Join Video Call button
├── Completed Consultations
│   ├── Doctor notes, completion timestamp
│   └── View / Download records
└── Write Prescription Modal
    ├── Doctor Notes (free text)
    ├── Chief Complaints (dynamic fields)
    ├── Diagnosis (dynamic fields)
    ├── Advice text
    ├── Medicines Table (Name | Dosage | Frequency | Duration)
    └── Finalize & Complete → PDF auto-generated & saved
```

### 🔧 Admin Dashboard

```
Admin Panel
├── Overview
│   ├── Total Sessions: 92+   Total Users: 14+
│   ├── Green Vitals: 12      Red Alerts: 60
│   ├── Health Status Pie Chart (Red / Yellow / Green)
│   ├── Sessions by State Bar Chart (Created / Completed / Monitoring)
│   └── Session Activity by Hour (00-06 / 06-12 / 12-18 / 18-24)
├── Sessions Tab (all sessions with search/filter)
├── Doctors Tab (approval, availability management)
└── Analytics Tab (trends, risk distribution over time)
```

---

## 📡 Offline Fail-Safe — HC12 RF Module

> **Because rural India doesn't always have WiFi. AURA-STETH AI never leaves a patient unmonitored.**

```
┌──────────────────────────────────────────────────────────────┐
│                HC12 OFFLINE FAIL-SAFE SYSTEM                 │
│                                                              │
│  ESP32 — Patient Device          Receiver Station            │
│  ┌──────────────────────┐       ┌──────────────────────┐    │
│  │  Capture Vitals      │       │  HC12 RX Module      │    │
│  │  Temp, HR, SpO₂      │       │  Connected to:       │    │
│  │         │            │       │  ├─ Laptop / PC      │    │
│  │  WiFi Available?     │       │  ├─ Raspberry Pi     │    │
│  │  YES → Supabase ✅   │       │  └─ Another ESP32    │    │
│  │  NO  → HC12 TX 📡   │──────▶│                      │    │
│  └──────────────────────┘       └──────────────────────┘    │
│                                          │                   │
│  433 MHz  |  ~1 km range         Alert decoded              │
│  UART Serial Protocol             Notification triggered     │
│                                                              │
│  RF Packet format:                                           │
│  { name, age, hr, spo2, temp, alert_level }                 │
└──────────────────────────────────────────────────────────────┘
```

**Offline Capabilities (no internet required):**

| Capability | Details |
|-----------|---------|
| ✅ Full vitals capture | Temp, HR, SpO₂ measured and displayed |
| ✅ OLED local display | Results shown on-device instantly |
| ✅ LED health status | 🔴🟡🟢 on-device risk indicator |
| ✅ HC12 RF alert | Transmits patient alert to receiver within ~1km |
| ✅ Multi-patient support | Separate RF channels per device |
| ✅ OLED status | Shows "OFFLINE MODE — HC12 ACTIVE" |

**Online Capabilities (with WiFi):**

| Capability | Details |
|-----------|---------|
| ✅ Full AI analysis | AURANet + LungNet heart & lung diagnostics |
| ✅ Cloud session storage | Supabase real-time sync |
| ✅ Doctor video consultation | WebRTC live call |
| ✅ SMS alerts | Auto-sent to guardian on HIGH risk |
| ✅ Phone call escalation | Auto-triggered for critical alerts |
| ✅ Digital prescription PDF | Doctor-signed, downloadable |

---

## 📊 Data Flow Diagrams

### DFD Level 0 — System Context

```
                    PhysioNet 2016 + CirCor 2022
                    ICBHI 2017 + SPRSound 2022
                           (Offline Training)
                                  │
         Patient Demographics     │
         Audio Recording ─────────┼──────────────────────────────┐
         Vital Signs              ▼                               │
                        ╔════════════════════╗             Doctor │
         Patient ──────▶║   AURA-STETH AI   ║◀── Consultation ──┘
                 ◀──────║    System (P0)     ║    Notes, Rx
         Session Status ╚════════════════════╝──▶ Patient List
         AI Report               │                 AI Reports
         Prescription            │
                        Session Data, Audio Files
                        AI Reports, User Records
                                 ▼
                  ╔══════════════════════════════╗
                  ║     Cloud Infrastructure     ║
                  ║    (Supabase + HF Spaces)    ║
                  ╚══════════════════════════════╝
```

### DFD Level 1 — System Internals

```
Patient ─create_session──▶ [P1 Session Manager — Supabase]
                                      │ session_config
                                      ▼
                           [P2 ESP32 Sensor Acquisition]
                            │ temp, spo2, bpm ──▶ [D4 Vitals Table]
                            │ audio_uri
                            ▼
                      [P3 AI Inference Engine — HuggingFace]
                            │ classification_results
                            ▼
                      [P4 Report Generator — Render]
                            │ write_report ──▶ [D2 AI Reports Table]
                            ▼
                      [P5 Frontend Display — React]
                      ▲                   ▲
                user_action          doctor_action
```

### DFD Level 2 — AI Inference Pipeline

```
[D1: Sessions DB]
  audio_url ──▶ [P3.1 Audio Loader — Fetch WAV from Supabase Storage]
                         │ raw_audio
                         ▼
               [P3.2 Signal Preprocessor]
               DWT + Bandpass Filter + Z-normalization
                         │ clean_signal
                         ▼
               [P3.3 Feature Extractor]
               Mel-Spectrogram + MFCC + Clinical Features
               ├── features ──────────▶ [P3.4 AURANet Heart Classifier]
               │                         ResNet50 + Fusion → P(abnormal)
               └── mel_spectrogram ──▶ [P3.5 LungNet Classifier]
                                        EfficientNet-B0 → 3-class probs
                                               │ class_probabilities
                                               ▼
                                        [P3.6 Report Assembler]
                                        Combine heart + lung → JSON
                                               │ diagnostic_report_json
                                               ▼
                                       [D2: AI Reports Table]
```

---

## 🚀 Getting Started

### Prerequisites

```bash
Node.js  >= 18.0.0
Bun      >= 1.0  (or npm)
Arduino IDE 2.x  with ESP32-S3 board support
Python   >= 3.10  (for AI backend development)
Supabase account (free tier sufficient)
```

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/cosmomanish007-pixel/live-vitals-web.git
cd live-vitals-web
```

### 2️⃣ Install Frontend Dependencies

```bash
bun install
# or
npm install
```

### 3️⃣ Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_AI_BACKEND_URL=https://your-huggingface-space.hf.space
```

### 4️⃣ Apply Supabase Migrations

```bash
supabase db push
# Or manually run SQL files in /supabase/migrations/
```

### 5️⃣ Start the Frontend

```bash
bun run dev
# Opens at http://localhost:5173
```

### 6️⃣ Flash ESP32 Firmware

```
1. Open  Arduino_Code/aura_firmware.ino  in Arduino IDE 2.x
2. Install required libraries via Library Manager:
   - Adafruit GFX Library
   - Adafruit SH110x (OLED)
   - SparkFun MAX3010x Pulse + Oximeter
   - Protocentral MAX30205 Temperature
   - ESP32 I2S (built-in with ESP32 board package)
3. Board Settings:
   - Board: ESP32S3 Dev Module
   - Upload Speed: 921600
   - USB CDC On Boot: Enabled
4. Update in firmware:
   - WiFi SSID + Password
   - Supabase URL + API Key
   - AI Backend endpoint URL
5. Upload → Open Serial Monitor at 115200 baud
```

### 7️⃣ AI Backend (HuggingFace Spaces)

```
The AI backend is deployed on HuggingFace Spaces.

Loaded Models:
├── AURANet.pt   (~150 MB)  — Heart sound classifier
└── LungNet.pt   (~80 MB)   — Lung sound classifier

API Endpoint:
  POST /predict/full
  Content-Type: multipart/form-data
  Body: WAV file (16kHz, 10 seconds, mono)
  Returns: JSON with full heart + lung analysis
```

---

## 📁 Repository Structure

```
live-vitals-web/
├── 📁 Arduino_Code/
│   └── aura_firmware.ino              # Complete ESP32-S3 firmware
│
├── 📁 TRAINED MODELS/
│   ├── AURANet.pt                     # Heart AI model weights (~150MB)
│   ├── LungNet.pt                     # Lung AI model weights (~80MB)
│   ├── heart_config_FINAL.json        # AURANet hyperparameters & thresholds
│   └── lung_config_FINAL.json         # LungNet hyperparameters & class config
│
├── 📁 src/
│   ├── 📁 components/
│   │   ├── PatientDashboard.tsx       # Patient session + monitoring UI
│   │   ├── DoctorPanel.tsx            # Doctor consultation interface
│   │   ├── AdminDashboard.tsx         # Analytics + management
│   │   ├── ClinicalReport.tsx         # AI report display
│   │   ├── MonitoringView.tsx         # Real-time step tracking
│   │   └── Report.tsx                 # PDF generation component
│   ├── 📁 hooks/
│   │   ├── useWifiSession.ts          # Session management hook
│   │   └── useSupabaseRealtime.ts     # Live DB subscription
│   ├── 📁 lib/
│   │   └── supabaseClient.ts          # Supabase client config
│   └── App.tsx                        # Root component + routing
│
├── 📁 supabase/
│   └── 📁 migrations/                 # PostgreSQL schema migrations
│
├── 📁 public/                         # Static assets
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

---

## 🛣️ Roadmap

```
✅ Phase 1 — Core System (COMPLETE)
   ├─ ESP32-S3 firmware with all sensors
   ├─ AI Heart model (AURANet) — AUC 0.9578
   ├─ AI Lung model (LungNet) — ICBHI 70.47%
   ├─ React web app with patient/doctor/admin views
   ├─ Supabase cloud backend
   ├─ Doctor video consultation + digital prescription
   └─ Clinical PDF auto-generation

✅ Phase 2 — Reliability (COMPLETE)
   ├─ Artifact detection + retry prompting
   ├─ HC12 RF offline fail-safe mechanism
   ├─ SMS + call alerts on HIGH risk (online)
   └─ Admin analytics dashboard

🔄 Phase 3 — Scale (IN PROGRESS)
   ├─ React Native mobile app
   ├─ Hindi + Marathi multilingual UI
   ├─ 3D printed wearable enclosure
   └─ Bluetooth mode (fully offline, no WiFi required)

📋 Phase 4 — Clinical Validation (PLANNED)
   ├─ IRB ethics board approval
   ├─ Clinical trial with PHC / rural hospital partners
   ├─ CDSCO regulatory compliance (India medical device)
   └─ Research paper publication
```

---

## 📈 Achievements

<div align="center">

| Achievement | Value |
|-------------|-------|
| 🫀 Heart AI (AURANet) — Best AUC | **0.9578** |
| 🫁 Lung AI (LungNet) — ICBHI Score | **70.47%** |
| 📊 Lung AI — Best Multiclass AUC | **0.8495** |
| 🔬 Training datasets used | **4** (PhysioNet 2016, CirCor 2022, ICBHI 2017, SPRSound 2022) |
| 🧪 Total monitoring sessions | **92+** real sessions |
| 👤 Total registered users | **14+** |
| ⚡ End-to-end AI inference time | **< 30 seconds** |
| 📡 Offline RF range (HC12) | **~1 km** |
| 📄 Clinical PDFs auto-generated | Per session |
| 💊 Doctor prescriptions issued | Digital signed PDF |
| 🌐 Live deployment | **live-vitals-web.lovable.app** |
| 🏥 Target impact | Rural Primary Health Centres across India |

</div>

---

## 📬 Contact

<div align="center">

**For questions, collaboration, research partnerships, clinical pilots, or demo requests:**

<br/>

<a href="mailto:manishdhatrak1121@gmail.com">
  <img src="https://img.shields.io/badge/Email-manishdhatrak1121%40gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white"/>
</a>

<br/><br/>

<a href="https://github.com/cosmomanish007-pixel/live-vitals-web">
  <img src="https://img.shields.io/badge/GitHub-cosmomanish007--pixel-181717?style=for-the-badge&logo=github&logoColor=white"/>
</a>

<br/><br/>

<a href="https://live-vitals-web.lovable.app">
  <img src="https://img.shields.io/badge/Live%20Demo-live--vitals--web.lovable.app-00d4ff?style=for-the-badge"/>
</a>

<br/><br/>

---

*Built with ❤️ for rural India — making world-class AI diagnostics accessible to every village.*

</div>

---

<div align="center">

<!-- Footer Wave -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00ff88,50:00d4ff,100:0d1117&height=120&section=footer&animation=fadeIn" width="100%"/>

**AURA-STETH AI** — *Auscultation + Unified Remote Analytics*

`ESP32-S3` • `React` • `Supabase` • `HuggingFace Spaces` • `PyTorch` • `ResNet50` • `EfficientNet-B0` • `HC12 RF`

*© 2026 AURA-STETH AI Project — MIT License*

</div>
