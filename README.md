# 🎓 GATE 2027 Study Tracker Pro

A **premium, data-driven preparation companion** built for **GATE 2027 aspirants**. Track study hours, manage your complete syllabus with confidence tiers, analyze productivity patterns, and stay on pace for exam day — all in a beautiful, responsive interface.

> **Why this exists:** GATE preparation isn't just about studying hard — it's about studying *smart*. This tracker gives you the analytics to identify weak areas, maintain consistency, and know exactly where you stand before the exam.

---

## 🔗 Live Demo

👉 **[https://study-tracker-pied.vercel.app/](https://study-tracker-pied.vercel.app/)**

---

## ✨ Features

### 📊 Analytics Dashboard

| Feature | What It Does |
|---|---|
| **Exam Countdown** | Animated countdown to **Feb 7, 2027** with days remaining |
| **Daily Target Ring** | Visual progress toward your daily study goal |
| **Current Streak** | Gamified consecutive-day streak tracker |
| **Weekly Velocity** | 7-day bar chart of study intensity |
| **Productivity Insights** | Peak study time & top subject identification |
| **Pace & Projection** | Projected completion date based on your study velocity (On Track / Falling Behind / Critical) |

### 🎯 Exam Readiness Score

A **composite 0–100 score** that tells you exactly how prepared you are:
- Syllabus completion (40%)
- Confidence quality (25%) — penalizes Weak topics
- Study consistency / streak (15%)
- Revision coverage (20%)

Color-coded arc gauge: 🟢 ≥70 → 🟡 ≥40 → 🔴 <40

### 🕸️ Subject Radar Chart

An SVG spider chart showing your **relative strength across all subjects**. Each axis represents a subject, plotted by % of topics marked Strong/Average. Instantly reveals imbalanced preparation — critical for GATE where every subject matters.

### 📅 365-Day Consistency Heatmap

A GitHub-style activity grid showing your study patterns over the past year. Four intensity levels from empty to target-met. Research shows **distributed practice beats cramming** — this makes your consistency (or lack of it) impossible to ignore.

### 🧠 Spaced Repetition Scheduler

Tracks when each topic was last studied and auto-flags topics due for review using scientific intervals (1 → 3 → 7 → 14 → 30 days). Shows urgency badges:
- 🔴 **High** — not reviewed in 14+ days
- 🟡 **Medium** — 7–14 days
- 🟢 **Low** — 1–7 days

### 🔄 4-Tier Confidence System

Replace the binary "done/not done" with nuanced mastery tracking:
- ⚪ **Unseen** — haven't touched it yet
- 🔴 **Weak** — studied but shaky
- 🟡 **Average** — decent understanding
- 🟢 **Strong** — confident, exam-ready

Click any topic circle to cycle through tiers. The **Smart Revision Engine** auto-lists all Weak topics for targeted study sessions.

---

### 📚 Multi-Stream Syllabus

Complete GATE syllabus pre-loaded for **6 engineering streams**:

| Stream | Full Name |
|---|---|
| DA | Data Science & AI |
| CS | Computer Science |
| EC | Electronics & Communication |
| EE | Electrical Engineering |
| ME | Mechanical Engineering |
| CE | Civil Engineering |

Each subject includes **mark weightage** so your progress reflects actual exam scoring, not just topic count.

---

### ⏱️ Focus Timer with Zen Mode

- **Pomodoro-style timer** with subject tagging
- **Zen Mode** — fullscreen immersive focus with animated dark space background
- **Lo-Fi Beats** — toggle ambient background music (YouTube lofi stream) while in Zen Mode
- Sessions auto-log to your study history with timestamps

---

### 📝 Session Logging

- **Multi-session per day** — log morning Math, afternoon Physics, evening Aptitude
- **Subject tagging** with notes
- **Time-of-day analysis** — see if you're a morning or night owl
- **History timeline** inside the day modal

---

### 📺 Video Integration

- Embed YouTube playlists per subject
- Videos stay mounted (no iframe refresh when switching tabs)

---

### 🎨 Design

| Feature | Details |
|---|---|
| **Dark Mode** | Deep blacks, zinc accents, amber highlights & glassmorphism |
| **Light Mode** | Warm cream palette with earth-toned borders & premium shadows |
| **Responsive** | Mobile-first — calendar shown first on phone, analytics first on desktop |
| **Hidden scrollbars** | Clean UI with invisible scroll |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 (Vite) |
| **Styling** | Tailwind CSS |
| **Icons** | Lucide React |
| **Backend** | Firebase Firestore |
| **Auth** | Firebase Auth (Google Sign-In) |
| **Deployment** | Vercel |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- Firebase account

### 1. Clone & Install

```bash
git clone https://github.com/vishnuwadkar/study-tracker.git
cd study-tracker
npm install
```

### 2. Configure Firebase

1. Go to **console.firebase.google.com** → Create project
2. Enable **Google Sign-In** (Build → Authentication → Sign-in method)
3. Enable **Firestore Database** (Start in Test Mode)
4. Register Web App → Copy your `firebaseConfig`

Replace the config in `src/App.jsx`:

```js
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  // ...
};
```

### 3. Run

```bash
npm run dev
```

### Mobile Access (Local Network)

```bash
npm run dev -- --host
# Open http://192.168.x.x:5173 on your phone
```

---

## 📖 Customizing Syllabus Data

Edit the `SYLLABUS_DATA` object in `src/App.jsx` to add/modify subjects, topics, or weightages for your stream.

---

## 📄 License

MIT License — see `LICENSE` for details.

---

## 👤 Author

**@vishnuwadkar**
GitHub: [https://github.com/vishnuwadkar](https://github.com/vishnuwadkar)

**Built with ❤️ for the GATE 2027 Community.**
