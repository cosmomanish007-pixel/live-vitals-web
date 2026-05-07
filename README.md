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
