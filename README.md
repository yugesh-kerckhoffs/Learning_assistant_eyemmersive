<div align="center">

# 🧠 Eyemmersive® Binah - Learning Assistant

![Typing SVG](https://readme-typing-svg.demolab.com/?font=Fira+Code&weight=600&size=28&duration=3000&pause=1000&color=8B5CF6&center=true&vCenter=true&multiline=true&repeat=true&width=600&height=100&lines=AI-Powered+Learning+Assistant+%F0%9F%8C%9F;Learn+%E2%80%A2+Play+%E2%80%A2+Grow+%E2%80%A2+Explore)

<p align="center">
  <strong>An AI-powered, inclusive learning assistant designed for children with autism and special needs. Features interactive games, social stories, emotional support, and AI chat capabilities.</strong>
</p>

<p align="center">
  <a href="#-features"><strong>Features</strong></a> ·
  <a href="#-tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#-getting-started"><strong>Getting Started</strong></a> ·
  <a href="#-deployment"><strong>Deployment</strong></a> ·
  <a href="#-documentation"><strong>Documentation</strong></a>
</p>

<br/>

![GitHub repo size](https://img.shields.io/github/repo-size/yugesh-kerckhoffs/Learning_assistant_eyemmersive?style=for-the-badge&color=8B5CF6)
![GitHub stars](https://img.shields.io/github/stars/yugesh-kerckhoffs/Learning_assistant_eyemmersive?style=for-the-badge&color=8B5CF6)
![GitHub forks](https://img.shields.io/github/forks/yugesh-kerckhoffs/Learning_assistant_eyemmersive?style=for-the-badge&color=F59E0B)
![GitHub issues](https://img.shields.io/github/issues/yugesh-kerckhoffs/Learning_assistant_eyemmersive?style=for-the-badge&color=EF4444)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge&color=3B82F6)

<br/>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" alt="line" width="100%">

</div>

<br/>

## ✨ Features

<div align="center">

|             Feature              | Description                                                              |
| :------------------------------: | :----------------------------------------------------------------------- |
|     🤖 **AI Chat Assistant**      | Gemini-powered conversational AI tailored for children                   |
|     🎨 **Colors & Shapes Game**   | Interactive matching game for learning colors and shapes                 |
|     🧩 **Memory Game**            | Card-matching memory game with adjustable difficulty                     |
|     📖 **Social Stories**          | Visual social stories with AI image generation                           |
|     😊 **Feelings Helper**        | Emotional support companion with voice feedback                          |
|     🖼️ **AI Image Gallery**       | Gallery of AI-generated images saved per user                            |
|     🔐 **User Authentication**    | Email-based signup/signin with school & teacher assignment               |
|     👨‍💼 **Admin Dashboard**        | Secret-key admin access for managing the platform                        |
|     📱 **Mobile Optimized**        | Responsive design for all device sizes                                   |
|     🎵 **Calm Breathing**          | Guided breathing exercises with ambient sounds                           |

</div>

<br/>

## 🔧 Tech Stack

<div align="center">

### Frontend

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)

### Backend & Database

![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Deno](https://img.shields.io/badge/Deno-000000?style=for-the-badge&logo=deno&logoColor=white)

### AI & APIs

![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)

### Libraries

![React Query](https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![DOMPurify](https://img.shields.io/badge/DOMPurify-FF6B6B?style=for-the-badge&logo=javascript&logoColor=white)

### Deployment

![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

</div>

<br/>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" alt="line" width="100%">

<br/>

## 📁 Project Structure

```bash
learning-assistant/
├── 📂 public/
│   ├── 📂 audio/                  # Ambient sounds (forest, waterfalls)
│   ├── 📂 images/                 # Social story images
│   ├── favicon.png
│   ├── logo.png
│   ├── robots.txt
│   └── sitemap.xml
├── 📂 src/
│   ├── 📂 components/
│   │   ├── ChatArea.tsx           # Reusable AI chat component
│   │   ├── NavLink.tsx            # Navigation link component
│   │   ├── TermsModal.tsx         # Terms & conditions modal
│   │   └── 📂 ui/                 # shadcn/ui components
│   ├── 📂 contexts/
│   │   ├── AppContext.tsx         # App-wide state management
│   │   └── AuthContext.tsx        # Authentication state
│   ├── 📂 data/
│   │   └── gameData.ts           # Game configurations & data
│   ├── 📂 hooks/
│   │   ├── use-mobile.tsx         # Mobile detection hook
│   │   └── use-toast.ts          # Toast notification hook
│   ├── 📂 lib/
│   │   ├── api.ts                # API helper functions
│   │   ├── externalSupabase.ts   # External Supabase client
│   │   ├── markdown.ts           # Markdown processing
│   │   └── utils.ts              # Utility functions
│   ├── 📂 pages/
│   │   ├── AdminLoginPage.tsx    # Admin authentication
│   │   ├── ForgotPasswordPage.tsx # Password recovery
│   │   ├── Index.tsx             # Auth wrapper/router
│   │   ├── LandingPage.tsx       # Public landing page
│   │   ├── MainApp.tsx           # Main app layout
│   │   ├── ResetPasswordPage.tsx # Password reset form
│   │   ├── SignInPage.tsx        # User sign in
│   │   ├── SignUpPage.tsx        # User registration
│   │   └── 📂 app/
│   │       ├── AppLayout.tsx     # App shell layout
│   │       ├── CalmBreathingPage.tsx
│   │       ├── ChatPage.tsx      # General AI chat
│   │       ├── ColorsShapesPage.tsx
│   │       ├── FeelingsHelperPage.tsx
│   │       ├── GalleryPage.tsx   # AI image gallery
│   │       ├── MemoryGamePage.tsx
│   │       └── SocialStoriesPage.tsx
│   └── 📂 styles/
│       └── global.css            # Global styles
├── 📂 supabase/
│   └── 📂 functions/
│       ├── chat/                 # AI chat edge function
│       ├── contact/              # Contact form handler
│       ├── verify-admin/         # Admin verification
│       └── verify-session/       # Session verification
├── 📄 index.html
├── 📄 tailwind.config.ts
├── 📄 vite.config.ts
└── 📄 MIGRATION.md               # Complete migration guide
```

<br/>

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **bun**
- **Git**

### Installation

1️⃣ **Clone the repository**

```bash
git clone https://github.com/yugesh-kerckhoffs/Learning_assistant_eyemmersive.git
cd Learning_assistant_eyemmersive
```

2️⃣ **Install dependencies**

```bash
npm install
# or
bun install
```

3️⃣ **Set up environment variables**

```bash
create .env file
```

4️⃣ **Configure your `.env` file**

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

5️⃣ **Start the development server**

```bash
npm run dev
# or
bun dev
```

6️⃣ **Open your browser**

```
http://localhost:8080
```

<br/>

## ☁️ Deployment

### Deploy to Vercel

<a href="https://vercel.com/new/clone?repository-url=https://github.com/yugesh-kerckhoffs/Learning_assistant_eyemmersive" target="_blank">
  <img src="https://vercel.com/button" alt="Deploy with Vercel"/>
</a>

### Environment Variables (Vercel)

| Variable                          | Description                   |
| :-------------------------------- | :---------------------------- |
| `VITE_SUPABASE_URL`             | Your Supabase project URL     |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID`      | Your Supabase project ID      |

### Supabase Secrets

| Secret                        | Description                        |
| :---------------------------- | :--------------------------------- |
| `ADMIN_SECRET_KEY`           | Admin authentication key           |
| `GEMINI_API_KEY`             | Google Gemini AI API key           |
| `EXTERNAL_SUPABASE_URL`     | External Supabase project URL      |
| `EXTERNAL_SUPABASE_ANON_KEY`| External Supabase anon key         |

> 📖 For complete deployment instructions, see **[MIGRATION.md](./MIGRATION.md)**

<br/>

## 📚 Documentation

| Document                                    | Description                                        |
| :------------------------------------------ | :------------------------------------------------- |
| [MIGRATION.md](./MIGRATION.md)              | Complete guide for setting up the project           |
| [DB_STRUCTURE.txt](./DB_STRUCTURE.txt)      | Database schema and structure reference             |

<br/>

## 🎯 Roadmap

- [X] AI Chat Assistant (Gemini-powered)
- [X] Colors & Shapes Matching Game
- [X] Memory Card Game
- [X] Social Stories with Image Generation
- [X] Feelings Helper with Voice
- [X] Calm Breathing Exercises
- [X] AI Image Gallery
- [X] User Authentication (Email)
- [X] Admin Dashboard
- [X] School & Teacher Assignment
- [X] Terms & Conditions Flow
- [X] Password Reset Flow
- [X] Mobile-First Design
- [ ] Multi-language Support
- [ ] Parent Dashboard
- [ ] Progress Tracking & Reports
- [ ] Offline Mode

<br/>

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. **Fork the Project**

   ```bash
   # Click the 'Fork' button at the top right of this page
   ```
2. **Create your Feature Branch**

   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your Changes**

   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the Branch**

   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

<br/>

## 📬 Contact

<div align="center">

**Yugesh S** - Developer & Creator

[![Portfolio](https://img.shields.io/badge/Portfolio-000000?style=for-the-badge&logo=About.me&logoColor=white)](https://yugesh.me)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yugesh-kerckhoffs)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/yugeshsivakumar)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:contact@yugesh.me)

**Project Link:** [Learning_assistant_eyemmersive](https://github.com/yugesh-kerckhoffs/Learning_assistant_eyemmersive)

</div>

<br/>

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

<br/>

## 💖 Acknowledgments

- [Supabase](https://supabase.com/) - Backend Infrastructure
- [Vercel](https://vercel.com/) - Hosting Platform
- [shadcn/ui](https://ui.shadcn.com/) - UI Components
- [Google Gemini](https://ai.google.dev/) - AI Models
- [Lucide Icons](https://lucide.dev/) - Beautiful Icons
- [Lovable](https://lovable.dev/) - Development Platform

<br/>

<div align="center">

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" alt="line" width="100%">

<br/>

### ⭐ Star this repository if you found it helpful!

<br/>

![Wave](https://raw.githubusercontent.com/mayhemantt/mayhemantt/Update/svg/Bottom.svg)

**Made with ❤️ by [Yugesh S](https://yugesh.me)**

</div>
