# 🛡️ DropOut Defenders 3.0 (Scholar Notify)

> An Early Warning System (EWS) and multi-vector intervention platform designed to identify, analyze, and prevent school dropouts in real time. Built for Smart India Hackathon (SIH).

---

## 📌 Overview

**DropOut Defenders 3.0** is an interactive web-based portal tailored for Teachers, District Education Officers (DEO), and Government Administrators. It combines multi-vector risk diagnostics, automated welfare scheme matching, peer mentorship tracking, and emergency field dispatch workflows to protect at-risk students and boost school retention rates.

---

## ✨ Key Features

- 📊 **VSK Dashboard Overview** – Real-time analytics, risk distributions, and district-level metrics powered by Chart.js.
- ⚠️ **Early Warning System (EWS)** – Student-level risk scoring categorizing students into Severe, High, Moderate, and Low risk brackets.
- 🎯 **Multi-Vector Diagnostic Engine** – Deep breakdown of dropout risk across Academic, Economic, Health & Nutrition, Behavioral, and Environmental factors.
- ⚡ **Universal Smart Intake** – Instant student record intake using Excel (`.xlsx`/`.csv`) file parsing via SheetJS, OCR document scanning via Tesseract.js, or voice input.
- 🤝 **Govt Schemes Matcher** – Auto-matches student socio-economic profiles with active welfare schemes (PM-POSHAN, transport subsidies, scholarships).
- 🎛️ **Support Plan Simulator** – Interactive "what-if" playground to project attendance improvements based on planned interventions.
- 👥 **Sathi Peer Mentorship** – Connects high-performing senior student mentors with at-risk students for academic and social support.
- 🚨 **Emergency Home Visit (SOS Dispatch)** – Escalation matrix and field visit dispatch workflow for severe absenteeism cases.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | HTML5, Tailwind CSS, Custom CSS, JavaScript (ES6+) |
| **Data Visualization** | Chart.js |
| **Data & Document Processing** | SheetJS (`xlsx`), Tesseract.js (OCR) |
| **Icons & Typography** | FontAwesome 6, Plus Jakarta Sans |
| **Backend / Web Server** | Python 3 (`http.server`) |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.x installed on your system.
- Modern Web Browser (Chrome, Firefox, Edge, Safari).

### Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/sih-dropout-defenders.git
   cd sih-dropout-defenders
   ```

2. **Start the local server:**
   ```bash
   python3 server.py
   ```

3. **Open the web portal:**
   Open your browser and navigate to `http://localhost:8080`.

---

## 🔑 Demo Credentials

Use any of the pre-configured accounts below to log in and test different portal roles:

| Role | Username | Password |
| :--- | :--- | :--- |
| 👩‍🏫 **Teacher (Anand Cluster)** | `teacher.anand` | `teacher@2026` |
| 🏛️ **District Education Officer (DEO)** | `deo.gujarat` | `deo@2026` |
| ⚙️ **System Administrator (VSK Portal)** | `admin.vsk` | `admin@2026` |

---

## 📜 License

This project is developed for educational and hackathon submission purposes for **Smart India Hackathon (SIH)**.
