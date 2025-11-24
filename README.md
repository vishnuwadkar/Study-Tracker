# 🎓 GATE 2026 Study Tracker Pro

A **premium, analytics-driven preparation platform** designed specifically for **GATE 2026 aspirants**.
Beyond basic time tracking, this application manages your full syllabus, revision cycles, study logs, and analytics — all wrapped in a clean, **Cursor AI–inspired dark UI**.

---

## 🔗 Live Demo

👉 **[https://study-tracker-pied.vercel.app/](https://study-tracker-pied.vercel.app/)**

---

## ✨ Key Features

### 📊 **Analytics Dashboard**

* **Countdown Timer**
  Pulsating real-time countdown to **February 15, 2026**.
* **Weighted Progress**
  Tracks completion based on **subject mark weightage**, not just topic count.
* **Weekly Velocity**
  Bar chart showing study intensity across the last 7 days.
* **Smart Streaks**
  Gamified daily streak system to help build consistency.

---

## 📚 **Syllabus & Revision Manager**

* **Multi-Stream Support**
  Pre-loaded syllabi for:

  * DA (Data Science & AI)
  * CS
  * EC
  * EE
  * ME
  * CE
* **Topic Tracking**
  Fine-grained checklist for every topic & subtopic.
* **Revision Counter**
  Track number of revisions per topic (e.g., *Rev: 3*).
* **Subject Breakdown**
  Compare time spent vs subject weightage.

---

## 📝 **Advanced Logging**

* **Multi-Session Logging**
  Log morning Math, evening Aptitude — all in one day.
* **Contextual Notes**
  Add subjects, tags, and notes to each session.
* **History Timeline**
  View your daily study history directly inside the logging modal.

---

## 🎨 **Pro UI/UX**

* **Cursor-Style Dark Mode**
  Deep blacks, zinc accents, emerald highlights & glassmorphism.
* **Responsive Layout**

  * Mobile → Calendar shown first
  * Desktop → Analytics shown first
* **Sticky Headers**
  Month navigation remains visible while scrolling.

---

## 🛠️ Tech Stack

| Layer              | Technology                                 |
| ------------------ | ------------------------------------------ |
| **Frontend**       | React 18 (Vite)                            |
| **Styling**        | Tailwind CSS (Custom Zinc/Emerald Palette) |
| **Icons**          | Lucide React                               |
| **Backend**        | Firebase Firestore                         |
| **Authentication** | Firebase Auth (Google Sign-In)             |

---

## 🚀 Installation & Setup (For Local Development)

### **Prerequisites**

* Node.js (v18+)
* Firebase account

---

### **1. Clone the Repository**

```bash
git clone https://github.com/vishnuwadkar/study-tracker.git
cd study-tracker
```

### **2. Install Dependencies**

```bash
npm install
```

---

### **3. Configure Firebase**

1. Open **console.firebase.google.com**
2. Create a new project
3. **Enable Google Sign-In**
   Build → Authentication → Sign-in method → Google
4. **Enable Firestore Database** (Start in Test Mode)
5. **Register Web App** → Copy your firebaseConfig

---

### **4. Add API Keys**

Inside `src/App.jsx`, replace:

```js
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  // ...
};
```

---

### **5. Run the App Locally**

```bash
npm run dev
```

---

## 📱 Mobile Access (Local Network)

To open on your phone while running on your PC:

```bash
npm run dev -- --host
```

Use the network IP shown in the terminal:

```
http://192.168.x.x:5173
```

---

## 📖 Syllabus Data

The app includes structured syllabus datasets for:

* DA: Data Science & AI
* CS: Computer Science
* EC: Electronics & Communication
* EE: Electrical Engineering
* ME: Mechanical Engineering
* CE: Civil Engineering

To modify or extend the data, edit:

```
src/App.jsx → SYLLABUS_DATA object
```

---

## 📄 License

Distributed under the **MIT License**.
See `LICENSE` for details.

---

## 👤 Author

**@vishnuwadkar**
GitHub: [https://github.com/vishnuwadkar](https://github.com/vishnuwadkar)

**Built with ❤️ for the GATE 2026 Community.**
