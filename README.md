<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,50:00b4d8,100:0077b6&height=200&section=header&text=AURA-STETH%20AI&fontSize=60&fontColor=ffffff&fontAlignY=38&desc=AI-Powered%20Smart%20Stethoscope%20%7C%20ESP32%20%2B%20Cloud%20%2B%20ML&descAlignY=58&descSize=18&animation=fadeIn" width="100%" />

<p>
  <img src="https://img.shields.io/badge/ESP32-Firmware-blue?style=for-the-badge&logo=espressif&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-Frontend-black?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/HuggingFace-AI%20Model-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black" />
</p>

<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&pause=800&color=00B4D8&center=true&vCenter=true&width=700&lines=AI+Stethoscope+%F0%9F%AB%80+Heart+%2B+Lung+Analysis;Real-Time+Vitals+on+ESP32+%F0%9F%92%93;Cloud+Dashboard+%2B+Doctor+Consultation+%F0%9F%A9%BA;Emergency+SMS+%2B+Call+via+Twilio+%F0%9F%9A%A8;HC12+Failsafe+%E2%80%94+Works+Without+WiFi+%F0%9F%93%A1" alt="Typing SVG" />
</a>

<br />

> 🏥 **AURA-STETH AI** is an advanced end-to-end medical monitoring ecosystem. It leverages a custom ESP32-based stethoscope to capture auscultation audio and vitals, processing them through ML models for real-time diagnostics and cloud-based patient management.

</div>

---

## 🚀 Key Features

* **🎙️ Smart Auscultation:** High-fidelity audio capture via INMP441 I2S microphone.
* **🧠 AI Diagnostics:** Pre-trained PyTorch models for detecting heart murmurs and lung abnormalities.
* **📡 Hybrid Connectivity:** Dual-mode data transmission via WiFi (Cloud) and HC12 (Long-range Radio) for failsafe monitoring.
* **⚡ Real-time Dashboard:** Built with Next.js and Supabase for instantaneous vital visualization.
* **🚨 Emergency Protocol:** Automatic Twilio-powered SMS/Call alerts based on anomalous vital detection.

---

## 🛠️ Tech Stack & Architecture

### **Hardware Layer**
* **MCU:** ESP32 (Dual-core)
* **Sensors:** * `INMP441` (Digital Mic)
    * `MAX30105` (Heart Rate & SpO2)
    * `MAX30205` (Medical Grade Body Temp)
* **Communication:** HC12 RF Module for offline transmission.

### **Software Layer**
* **Frontend:** [Next.js](https://nextjs.org/), Tailwind CSS, Shadcn UI
* **Backend/DB:** [Supabase](https://supabase.com/) (Auth, Real-time DB, Storage)
* **Machine Learning:** PyTorch models hosted/integrated via HuggingFace.
* **Deployment:** Bun / Vite environment.

---

## 📁 Repository Structure

```text
├── 📂 Arduino_Code      # ESP32 Firmware & Sensor Logic
├── 📂 TRAINED MODELS    # PyTorch/TFLite models for medical audio analysis
├── 📂 src               # Next.js Frontend source code
├── 📂 supabase          # Database schemas & Edge functions
├── 📂 public            # Assets & Documentation images
└── 📜 vitest.config.ts  # Testing configuration
