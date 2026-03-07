# FlashLearn (formerly FlashGenius) 🧠⚡

**Learn anything, faster.**

FlashLearn is an intelligent, AI-powered flashcard generation and studying platform built to supercharge your learning. Instead of spending hours manually creating study decks, FlashLearn leverages Google's Gemini AI to instantly generate high-quality flashcards from any source material.

## ✨ Key Features

- **🤖 AI-Powered Generation (Google Gemini)**
  Generate comprehensive flashcards instantly using four distinct input methods:
  - **Topic Search:** Simply type a topic (e.g., *Photosynthesis*, *Cold War*) and let Gemini build a comprehensive deck.
  - **Text Paste:** Copy and paste your lecture notes or study material directly.
  - **PDF Upload:** Upload your PDF documents or textbooks.
  - **Word Doc Upload:** Support for `.docx` files.

- **🎮 Intelligent Quiz Mode**
  Test your knowledge with an interactive study mode that automatically grades your performance. Includes a dynamic, animated Score Ring indicating your overall proficiency for a session.

- **🗂️ Collections & Deck Management**
  Keep your study materials organized. Group decks into logical collections (e.g., *Biology 101*, *History Finals*) for easy access.

- **🚀 Background Auto-Saving**
  Never lose your progress. Enable your auto-save preference in settings, and FlashLearn securely caches and syncs your decks and manual edits in the background as you create them.

- **⌨️ Keyboard Shortcuts**
  Power through your study sessions efficiently:
  - `Space` : Flip card
  - `Left Arrow` : Previous card
  - `Right Arrow` : Next card

- **🎨 Premium UI / UX**
  Built with a modern, glassmorphic aesthetic featuring an elegant Dark Mode setup, tailored CSS styling, responsive grid layouts, and smooth micro-animations.

---

## 🛠️ Tech Stack

**Frontend:**
- [React](https://reactjs.org/) (Vite Setup)
- [React Router DOM](https://reactrouter.com/) (Routing)
- Custom CSS (Tailwind reset + Native CSS Variables for custom theming)

**Backend:**
- [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) & Mongoose (Database & ORM)
- [Google Generative AI API (Gemini)](https://ai.google.dev/)
- [Multer](https://www.npmjs.com/package/multer) (File uploads)
- `pdf-parse` & `mammoth` (Document parsing)

---

## 🚀 Setup & Installation

Follow these steps to run the application locally on your machine.

### Prerequisites
Make sure you have the following installed:
- Node.js (v16+)
- MongoDB (Running locally or via MongoDB Atlas string)
- A Google Gemini API Key

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd FlashGenius
```

### 2. Install Dependencies
This project uses a concurrent setup. Install dependencies in the root project directory:
```bash
npm install
```

### 3. Environment Variables
You need to set up environment variables for the backend to function. Create a `.env` file in the **root** directory (or inside the `/server` directory depending on your specific setup) and add the following:

```env
# Application Settings
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/flashgenius

# Authentication (If enabled)
JWT_SECRET=your_jwt_secret_key_here

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run the Application

Now you can start both the Frontend & Backend development servers concurrently using the provided package scripts.

Open your terminal and run:
```bash
npm run dev      # Starts the Vite React frontend (usually on port 5173)
```

In a **separate** terminal window, run:
```bash
npm run server   # Starts the Node.js Express backend (usually on port 5000)
```

**Note:** The concurrent script allows you to run both from the root if configured: `npm start` (check `package.json` for customized run profiles).

---

## 📸 Usage

- **New Users:** Start directly on the homepage, input a topic into the hero search bar, and instantly generate your first deck!
- **Returning Users:** Access your previous work via the **Dashboard** or **Collections** tabs in the sidebar interface. Create new custom groupings or edit existing cards manually during your review sessions.

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change. 

**Happy Studying! ⚡**
