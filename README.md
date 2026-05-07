<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,50:00b4d8,100:0077b6&height=220&section=header&text=AURA-STETH%20AI&fontSize=75&fontColor=ffffff&fontAlignY=38&desc=%E2%9C%A8%20The%20Future%20of%20Digital%20Auscultation%20&descAlignY=58&descSize=20&animation=fadeIn" width="100%"/>

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![Espressif](https://img.shields.io/badge/ESP32--S3-E7352C?style=for-the-badge&logo=espressif&logoColor=white)](https://www.espressif.com/)

<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.demolab.com?font=Inter&weight=600&size=24&pause=1000&color=00B4D8&center=true&vCenter=true&width=800&lines=End-to-End+Medical+IoT+Ecosystem;AI-Powered+Heart+%2B+Lung+Analysis;Real-Time+Vitals+Streaming+%F0%9F%93%A1;Doctor-Patient+Collaboration+Hub;Next-Gen+Clinical+Reporting" alt="Typing SVG" />
</a>

<p align="center">
  <b>AURA-STETH AI</b> is a sophisticated medical IoT ecosystem bridging the gap between hardware and healthcare. It combines a custom-built <b>ESP32-S3 Smart Stethoscope</b> with <b>Deep Learning models</b> to provide real-time auscultation analysis, vital tracking, and digital clinical reporting.
</p>

[Explore Docs](#-system-architecture) • [View Demo](#-project-gallery) • [Report Bug](https://github.com/cosmomanish007-pixel/live-vitals-web/issues)

</div>

---

## ✨ Project Highlights

### 🫀 Intelligence at the Core
* **AURANet Architecture:** A custom-trained ResNet50 + Tabular Fusion model achieving an **AUC of 0.9578** for cardiac anomaly detection.
* **LungNet:** Specialized EfficientNet-B0 classifier for respiratory health (Normal/Crackle/Wheeze).
* **Intelligent Failsafe:** Built-in **Artifact Detection** to ensure medical-grade signal quality by filtering motion interference.

### 🌐 Seamless Ecosystem
* **Hybrid Connectivity:** Real-time data sync via Supabase with a low-latency fallback mechanism.
* **Clinical Integrity:** Auto-generated PDF reports with risk-scoring algorithms based on medical benchmarks.
* **Telehealth Ready:** Integrated Jitsi WebRTC for instant Video Consultation and digital prescriptions.

---

## 📸 Interactive Showcase

<div align="center">

| 🛰️ Edge Hardware | 📊 Clinical Intelligence |
| :---: | :---: |
| <img src="docs/images/hardware.jpg" width="420" style="border-radius:10px shadow: 5px 5px 15px rgba(0,0,0,0.3)"/> | <img src="docs/images/patient_dashboard.png" width="420" style="border-radius:10px"/> |
| *High-fidelity I2S capture on ESP32-S3* | *Real-time vital tracking & AI diagnostics* |

| 👨‍⚕️ Doctor Portal | 📄 Clinical Reports |
| :---: | :---: |
| <img src="docs/images/admin_dashboard.png" width="420" style="border-radius:10px"/> | <img src="docs/images/clinical_report.png" width="420" style="border-radius:10px"/> |
| *Session management & remote prescription* | *Automated risk assessment & history* |

</div>

---

## 🛠️ Tech Stack & Architecture

### **The "AURA" Blueprint**
The system is divided into three distinct layers ensuring high availability and medical accuracy.

```mermaid
graph LR
    A[ESP32-S3 Hardware] -- I2S/I2C --> B(Supabase Cloud)
    B -- WebSocket --> C[React Web App]
    C -- WAV Stream --> D[FastAPI AI Backend]
    D -- Inference --> C
    D -- Storage --> B
````

### **Hardware Layer**

| Component | Function | Interface |
| :--- | :--- | :--- |
| **INMP441** | 24-bit Digital Audio Capture | I2S |
| **MAX30105** | Photoplethysmogram (HR & SpO2) | I2C |
| **MAX30205** | Human Body Temperature (±0.1°C) | I2C |
| **SH1106** | HMI / User Guidance Display | I2C |

-----

## ⚙️ Quick Start

### 1️⃣ Clone & Dependencies

```bash
git clone [https://github.com/cosmomanish007-pixel/live-vitals-web.git](https://github.com/cosmomanish007-pixel/live-vitals-web.git)
cd live-vitals-web && npm install
```

### 2️⃣ Environment Configuration

Create a `.env.local` file:

```env
VITE_SUPABASE_URL=[https://your-id.supabase.co](https://your-id.supabase.co)
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_AI_BACKEND_URL=https://your-hf-space-url/predict/full
```

### 3️⃣ AI Backend (HuggingFace)

Deploy the contents of `/hf-space` to a Docker-enabled Space. The backend uses **FastAPI** to serve both `AURANet` and `LungNet` models concurrently.

-----

## 🚦 Health Scoring Logic

The system uses a weighted algorithm to categorize patient status:

> [\!IMPORTANT]
> **Status Logic:**
>
>   * **Green (Healthy):** Score \< 30. All vitals within clinical range.
>   * **Yellow (Warning):** Score 30-69. Slight deviation in vitals (Temp/SpO2).
>   * **Red (Critical):** Score 70+ OR **AI Anomaly Detected**. Triggered by heart murmur or lung wheeze.

-----

## 🗺️ Roadmap

  - [x] **Phase 1:** Core hardware integration & I2S Audio pipeline.
  - [x] **Phase 2:** AURANet Model training (95% AUC).
  - [x] **Phase 3:** Telemedicine & PDF Report automation.
  - [ ] **Phase 4:** Multi-lingual support (Hindi/Marathi/Spanish).
  - [ ] **Phase 5:** 3D Printed Ergonomic Enclosure.

-----

## 👥 The Team

**Final Year Engineering Capstone Project**

  * **Project Lead:** [Manish Dhatrak](https://github.com/cosmomanish007-pixel)
  * **Specialization:** Hardware Architecture, ML Pipelines, Full-Stack Development.

-----

\<div align="center"\>

**Found this project interesting? Give it a ⭐\!**

\<img src="https://www.google.com/search?q=https://capsule-render.vercel.app/api%3Ftype%3Dwaving%26color%3D0:0077b6,50:00b4d8,100:0d1117%26height%3D100%26section%3Dfooter" width="100%"/\>

*Built with ❤️ in Aurangabad, Maharashtra 🇮🇳*

\</div\>

```

### Key Improvements Made:

1.  **Call-to-Action (CTA):** Added links to docs, demo, and issues at the top to make it feel like a professional product.
2.  **Mermaid Diagram:** Swapped the text block for a Mermaid-style logic flow (GitHub renders this natively as a clean diagram).
3.  **Modern GitHub Blocks:** Used `> [!IMPORTANT]` syntax for the Health Scoring section to make it pop visually.
4.  **Premium Badges:** Used official colors and logos for the technology stack.
5.  **Refined Typography:** Used bolding and bullet points to reduce "wall of text" fatigue.
6.  **Image Styling:** Suggested border-radii and shadows for the gallery (though GitHub limits some CSS, the layout is much cleaner).
```
