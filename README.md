🎓 GATE 2026 Study Tracker Pro

A specialized, analytics-driven productivity application designed for GATE Data Science & AI (DA) aspirants. This application helps students track study hours, visualize consistency through heatmaps, and analyze subject-wise distribution to ensure comprehensive preparation for the 2026 exam.

✨ Features

🎯 Exam Countdown: Real-time countdown to February 15, 2026, keeping the goal in sight.

📅 Interactive Calendar: A GitHub-style heatmap calendar to visualize daily consistency.

📊 Advanced Analytics:

Subject Breakdown: Track hours spent on specific GATE DA subjects (Probability, ML, AI, etc.).

Weekly Velocity: Bar chart showing study hours over the last 7 days.

Completion Rate: Visual progress towards the daily target (default: 8 hours).

🔥 Smart Streak System: Keeps track of consecutive study days to gamify discipline.

📝 Multi-Session Logging: Log multiple study sessions per day with specific notes and subjects.

🌓 Aesthetic UI: Fully responsive design with a "Cursor AI"-inspired Dark Mode (Glassmorphism, Zinc/Emerald palette).

☁️ Cloud Sync: Google Authentication via Firebase ensures data is saved across devices.

🛠️ Tech Stack

Frontend: React (Vite)

Styling: Tailwind CSS (with Glassmorphism effects)

Icons: Lucide React

Backend: Firebase (Firestore Database)

Authentication: Firebase Auth (Google Sign-In)

🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

Prerequisites

Node.js (v18 or higher)

npm (Node Package Manager)

A Google Firebase account

Installation

Clone the repository

git clone [https://github.com/vishnuwadkar/study-tracker.git](https://github.com/vishnuwadkar/study-tracker.git)
cd study-tracker


Install dependencies

npm install


Configure Firebase

Go to the Firebase Console.

Create a new project (e.g., gate-tracker).

Register a web app (</>) to get your firebaseConfig object.

Enable Authentication: Go to Build > Authentication > Sign-in method > Enable Google.

Enable Firestore: Go to Build > Firestore Database > Create Database > Start in Test Mode.

Update Credentials

Open src/App.jsx.

Replace the firebaseConfig object at the top of the file with your own keys:

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};


Run the application

npm run dev


Open http://localhost:5173 to view it in the browser.

Mobile Access (Local Network)

To access the app on your phone while running it on your PC (connected via Hotspot/Wi-Fi):

npm run dev -- --host


Then enter the Network IP shown in the terminal (e.g., http://192.168.x.x:5173) into your phone's browser.

📂 Project Structure

study-tracker/
├── src/
│   ├── App.jsx          # Main application logic and UI
│   ├── main.jsx         # React entry point
│   ├── index.css        # Tailwind imports
│   └── ...
├── public/              # Static assets
├── tailwind.config.js   # Tailwind configuration (Dark mode enabled)
├── package.json         # Dependencies
└── README.md            # Documentation


🎨 Subjects Included (GATE DA)

The application comes pre-loaded with the syllabus for GATE Data Science & AI:

Probability & Statistics

Linear Algebra

Calculus

Programming, Data Structures & Algorithms

Database Management & Warehousing

Machine Learning

Artificial Intelligence

General Aptitude

🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

📄 License

Distributed under the MIT License. See LICENSE for more information.

👤 Author

@vishnuwadkar

GitHub: @vishnuwadkar

Built with ❤️ for the GATE 2026 Community.