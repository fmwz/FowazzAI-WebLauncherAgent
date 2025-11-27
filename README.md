# 🚀 Fowazz AI - AI Web Launcher

**🎓 Built for Good Vibes Hackathon (GVH) - November 27th, 2025**

> Transform your ideas into live websites through natural conversation. No coding required.

Fowazz AI is an conversational AI web builder that creates, deploys, and manages professional websites in minutes. Chat naturally in English or Arabic, describe your business, and watch as a complete multi-page website comes to life—ready to deploy with one click.

**Live Demo:** [fowazz.fawzsites.com](https://fowazz.fawzsites.com)

---

## 📺 What It Does

1. **💬 Chat with AI** - Describe your business or website idea in plain language (English/Arabic)
2. **🎨 AI Builds It** - Fowazz creates a multi-page, production-ready website with real features
3. **🚀 Deploy Instantly** - Get a live preview immediately, custom domain within hours

---

## ✨ Key Features

### 🤖 AI-Powered Website Generation
- **Conversational UI** - Chat naturally like you're talking to a designer
- **Bilingual** - Full English and Saudi Arabic support with RTL
- **Smart Design** - Industry-appropriate designs (not generic AI templates)
- **Multi-Page Sites** - Creates complete websites (3-7 pages: home, about, services, contact, etc.)
- **Real Features** - Payments (Stripe), forms (Formspree), analytics, webhooks, booking systems

### 🧠 Advanced AI (GLM-4.6)
- **Thinking Mode** - Hidden chain-of-thought reasoning for better quality
- **Context Awareness** - Understands your business and target audience
- **File Upload Support** - Send images, PDFs, menus, logos
- **Streaming Responses** - Real-time generation with progress updates

### 🌐 One-Click Deployment
- **Instant Preview** - Live link in seconds via Cloudflare Pages
- **Custom Domains** - Automatic DNS configuration
- **CDN Distribution** - Global edge network
- **Auto-Updates** - Edit and redeploy with one click

### 🎨 Professional Quality
- Industry-appropriate color palettes
- Mobile-responsive layouts
- Clean, modern designs (no trendy patterns)
- Real content (no Lorem Ipsum)
- Accessibility best practices

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (IONOS)                          │
│         Vanilla JS + HTML + Tailwind CSS                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Chat UI     │  │  Auth Modal  │  │  Settings    │      │
│  │  (app.js)    │  │  (Supabase)  │  │  Page        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND SERVICES (Railway)                   │
│                                                              │
│  ┌──────────────────────────────────────────────┐           │
│  │  Flask API (Python)                          │           │
│  │  • GLM-4.6 AI Integration                    │           │
│  │  • Streaming Responses (SSE)                 │           │
│  │  • Multi-user Concurrency (16 users)         │           │
│  │  • Payments (Stripe - disabled for GVH)      │           │
│  └──────────────────────────────────────────────┘           │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────┐           │
│  │  Fayez API (Node.js/TypeScript)              │           │
│  │  • Deployment Management                     │           │
│  │  • File Upload (Multer)                      │           │
│  │  • Job Queue (BullMQ + Redis)                │           │
│  └──────────────────────────────────────────────┘           │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────┐           │
│  │  Fayez Worker (Node.js/TypeScript)           │           │
│  │  • Background Job Processing                 │           │
│  │  • Cloudflare Pages Deployment               │           │
│  │  • DNS Configuration (Cloudflare API)        │           │
│  │  • Email Notifications (Resend)              │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              DATA & INFRASTRUCTURE                           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Supabase    │  │  Cloudflare  │  │  Redis       │      │
│  │  PostgreSQL  │  │  Pages + DNS │  │  (BullMQ)    │      │
│  │  + Auth      │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose | Hosting |
|-----------|---------|---------|
| **Vanilla JavaScript** | Core logic (no frameworks) | IONOS |
| **HTML5/CSS3** | Markup & styling | IONOS |
| **Tailwind CSS** | Utility-first CSS (via CDN) | CDN |
| **Supabase Client** | Auth & database | Supabase |

**Why no React/Vue?**
Kept it simple for hackathon—pure vanilla JS makes it easy to understand, modify, and deploy. No build process, no bundling, just upload and go.

### Backend - Flask API
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Python** | 3.11+ | Runtime |
| **Flask** | 3.0.0 | Web framework |
| **GLM-4.6** | Latest | AI model (ZhipuAI) |
| **zai-sdk** | Latest | Official GLM SDK |
| **Gevent** | 24.2.1 | Async/concurrency |
| **Stripe** | 11.2.0 | Payments (disabled) |
| **Railway** | - | Hosting platform |

**Why GLM-4.6?**
Cost-effective (~90% cheaper than Claude/GPT-4) while maintaining quality. Supports thinking mode for better reasoning.

### Backend - Deployment System (Fayez)
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 20+ | Runtime |
| **TypeScript** | 5.2+ | Type safety |
| **Express.js** | 4.18 | API server |
| **BullMQ** | 4.12 | Job queue |
| **Redis** | 5.3 | Queue backend |
| **Multer** | 1.4 | File uploads |
| **Wrangler** | 4.45 | CF Pages CLI |
| **Resend** | 3.0 | Email service |
| **Railway** | - | Hosting platform |

### Database & Auth
| Service | Purpose |
|---------|---------|
| **Supabase PostgreSQL** | User data, projects, subscriptions |
| **Supabase Auth** | Authentication (email/password) |
| **Supabase Storage** | File uploads |
| **Row-Level Security** | Database security |

### Deployment & Hosting
| Service | Purpose | Why? |
|---------|---------|------|
| **IONOS** | Frontend hosting | Reliable, affordable |
| **Railway** | Backend (3 services) | Auto-deploy from GitHub |
| **Cloudflare Pages** | Website CDN | Fast global distribution |
| **Cloudflare DNS** | Domain management | Automated via API |
| **Resend** | Transactional emails | Simple, developer-friendly |

---

## 🎯 How It Works

### **Phase 1: Create** _(2-3 minutes)_
1. User chats with Fowazz AI in English or Arabic
2. AI asks clarifying questions about the business
3. User can upload files (logos, menus, PDFs, images)
4. AI generates multi-page HTML/CSS website with real features
5. Live preview shows in-app with tab navigation

### **Phase 2: Domain** _(30 seconds)_
1. User enters desired domain name
2. System checks availability
3. User confirms and proceeds

### **Phase 3: Deploy** _(1-2 minutes)_
1. Frontend packages HTML files into ZIP
2. Uploads to Supabase storage
3. Queues deployment job in BullMQ
4. Worker deploys to Cloudflare Pages
5. Configures DNS (CNAME record)
6. Sends email when live

**Total time:** 3-6 minutes from idea to live website

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- Redis (for BullMQ)
- Supabase account
- GLM API key (ZhipuAI)
- Cloudflare account

### Quick Start

**1. Clone the repository**
```bash
git clone https://github.com/fmwz/FowazzAI-WebLauncherAgent.git
cd FowazzAI-WebLauncherAgent
```

**2. Install dependencies**
```bash
# Python (Flask backend)
pip install -r requirements.txt

# Node.js (Fayez API)
cd fayez/api && npm install

# Node.js (Fayez Worker)
cd ../worker && npm install
```

**3. Configure environment variables**
```bash
# Root .env
GLM_API_KEY=your_glm_key

# fayez/api/.env
SUPABASE_URL=your_url
SUPABASE_SERVICE_KEY=your_key
CLOUDFLARE_API_TOKEN=your_token

# fayez/worker/.env
(same as api/.env)
```

**4. Run services**
```bash
# Terminal 1: Flask API
python server.py

# Terminal 2: Fayez API
cd fayez/api && npm run dev

# Terminal 3: Fayez Worker
cd fayez/worker && npm run dev

# Terminal 4: Frontend (or just open index.html)
python -m http.server 8000
```

**5. Open in browser**
```
http://localhost:8000
```

See [SETUP.md](./SETUP.md) for detailed instructions.

---

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture
- **[API.md](./API.md)** - API documentation
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide
- **[HACKATHON_MODE.md](./HACKATHON_MODE.md)** - Free mode toggle

---

## 🎓 Hackathon Version (GVH)

This version is specially configured for Good Vibes Hackathon:

✅ **All features FREE** - No payment required
✅ **Unlimited websites** - No creation limits
✅ **GVH branding** - Beautiful badges throughout
✅ **No subscriptions** - Clean demo experience

**To revert to commercial:** Set `HACKATHON_MODE = false` in `app.js` (line 28)

---

## 💡 Key Features Explained

### 1. Bilingual AI (English + Arabic)
- Saudi dialect Arabic support
- RTL interface
- Translates 150+ UI elements
- AI responds in chosen language
- Cultural adaptation (phrases, tone)

### 2. Smart Website Generation
- Analyzes business type
- Industry-appropriate design
- 3-7 pages by default
- Real content (no placeholders)
- Integrated features (payments, forms, analytics)

### 3. Thinking Mode (GLM-4.6)
- Hidden chain-of-thought reasoning
- Better design decisions
- More coherent multi-page structure
- Improved planning

### 4. Deployment Automation
- Zero-config deployment
- Automatic DNS setup
- Edge network distribution
- Email notifications

---

## 🎯 Use Cases

- **Small Businesses** - Plumbers, electricians, consultants
- **Restaurants** - Menus, online ordering, reservations
- **Portfolios** - Photographers, designers, developers
- **Landing Pages** - Product launches, events, campaigns
- **Personal Sites** - Blogs, resumes, portfolios
- **Service Businesses** - Lawyers, accountants, agencies

---

## 🏆 Why Fowazz AI for GVH?

### 1. **Accessibility**
Makes web development accessible to non-technical users. No coding, no design skills needed.

### 2. **Language Barrier Breaking**
First AI web builder with full Saudi Arabic support. Opens web development to Arabic-speaking entrepreneurs.

### 3. **Speed**
From idea to live website in 3-6 minutes. Traditional process takes days/weeks.

### 4. **Quality**
Production-ready output with real business features, not just prototypes.

### 5. **Cost-Effective**
Uses affordable GLM-4.6 model (~90% cheaper than alternatives) without sacrificing quality.

---

## 📊 Project Stats

- **Lines of Code:** ~15,000
- **Development Time:** 2 weeks
- **Languages:** Python, TypeScript, JavaScript
- **API Calls:** Streaming (SSE)
- **Deployment Target:** Cloudflare Pages
- **Database:** PostgreSQL (Supabase)
- **Concurrency:** Up to 16 simultaneous users

---

## 🛣️ Roadmap

- [ ] Voice input support
- [ ] More language support (French, Spanish)
- [ ] AI-powered SEO optimization
- [ ] Custom code injection
- [ ] Template marketplace
- [ ] Collaborative editing
- [ ] A/B testing integration

---

## 🤝 Contributing

Contributions welcome! This is a hackathon project that we're continuing to develop.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🏆 Hackathon Submission

**Event:** Good Vibes Hackathon (GVH)
**Date:** November 27th, 2025
**Category:** AI / Web Development
**Team:** Solo (Fawaz)

**Built With:**
- 🤖 GLM-4.6 AI (ZhipuAI)
- 🗄️ Supabase (Database + Auth)
- ☁️ Railway (Backend Hosting)
- 🌐 IONOS (Frontend Hosting)
- 📡 Cloudflare (CDN + DNS)

---

## 📧 Contact

**Developer:** Fawaz
**Website:** [fowazz.fawzsites.com](https://fowazz.fawzsites.com)
**GitHub:** [@fmwz](https://github.com/fmwz)

---

## 🙏 Acknowledgments

- **Good Vibes Hackathon** - For the incredible event and opportunity
- **ZhipuAI** - For GLM-4.6 API access
- **Supabase** - For database and auth infrastructure
- **Railway** - For seamless backend hosting
- **Cloudflare** - For CDN and DNS services
- **IONOS** - For reliable frontend hosting

---

**✨ Built with ❤️ for Good Vibes Hackathon 🚀**

> "Making web development accessible to everyone, in every language."
