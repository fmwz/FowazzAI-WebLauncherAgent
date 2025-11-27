# 🛠️ Fowazz AI - Complete Setup Guide

This guide will walk you through setting up Fowazz AI locally for development.

---

## 📋 Prerequisites

### Required Software
- **Python 3.11+** - Backend runtime
- **Node.js 20+** - Deployment system runtime
- **Redis** - Job queue (BullMQ)
- **Git** - Version control

### Required Accounts
- **Supabase** - Database, auth, storage ([supabase.com](https://supabase.com))
- **ZhipuAI** - GLM-4.6 API access ([bigmodel.cn](https://bigmodel.cn))
- **Cloudflare** - Pages deployment + DNS ([cloudflare.com](https://cloudflare.com))
- **Railway** - Backend hosting ([railway.app](https://railway.app)) _(optional for local dev)_
- **Resend** - Email service ([resend.com](https://resend.com)) _(optional)_

---

## 🚀 Quick Start (5 Minutes)

### 1. Clone Repository

```bash
git clone https://github.com/fmwz/FowazzAI-WebLauncherAgent.git
cd FowazzAI-WebLauncherAgent
```

### 2. Install Dependencies

**Python (Flask Backend):**
```bash
pip install -r requirements.txt
```

**Node.js (Fayez API):**
```bash
cd fayez/api
npm install
```

**Node.js (Fayez Worker):**
```bash
cd ../worker
npm install
cd ../..
```

### 3. Configure Environment Variables

**Root `.env`** (Flask backend):
```bash
# AI - GLM-4.6 API
GLM_API_KEY=your_glm_api_key_here

# Stripe (optional - disabled in hackathon mode)
STRIPE_SECRET_KEY=your_stripe_key_here
STRIPE_WEBHOOK_SECRET=your_webhook_secret_here
```

**`fayez/api/.env`** (Deployment API):
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Cloudflare
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Resend Email (optional)
RESEND_API_KEY=your_resend_api_key_here
```

**`fayez/worker/.env`** (same as API):
```bash
# Copy the same variables from fayez/api/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
RESEND_API_KEY=your_resend_api_key_here
```

### 4. Start Services

Open **4 separate terminal windows**:

**Terminal 1 - Flask API:**
```bash
python server.py
```
Runs on: `http://localhost:8080`

**Terminal 2 - Fayez API:**
```bash
cd fayez/api
npm run dev
```
Runs on: `http://localhost:3000`

**Terminal 3 - Fayez Worker:**
```bash
cd fayez/worker
npm run dev
```
Background worker (no HTTP server)

**Terminal 4 - Frontend:**
```bash
python -m http.server 8000
```
Runs on: `http://localhost:8000`

### 5. Open in Browser

Navigate to: **http://localhost:8000**

---

## 🔑 Getting API Keys

### GLM-4.6 API Key (ZhipuAI)

1. Visit [bigmodel.cn](https://bigmodel.cn)
2. Sign up for an account (Chinese phone number required)
3. Navigate to API Keys section
4. Create new API key
5. Copy key to `.env` as `GLM_API_KEY`

**Cost:** ~$0.001 per 1K tokens (very affordable)

### Supabase Setup

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to **Project Settings → API**
4. Copy:
   - Project URL → `SUPABASE_URL`
   - Service Role Key → `SUPABASE_SERVICE_KEY`

### Cloudflare Setup

1. Sign up at [cloudflare.com](https://cloudflare.com)
2. Go to **My Profile → API Tokens**
3. Create token with permissions:
   - **Cloudflare Pages:** Edit
   - **DNS:** Edit
4. Copy:
   - API Token → `CLOUDFLARE_API_TOKEN`
   - Account ID (from dashboard) → `CLOUDFLARE_ACCOUNT_ID`

### Redis Installation

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
```

**Windows (WSL recommended):**
```bash
# Use WSL Ubuntu then:
sudo apt install redis-server
sudo service redis-server start
```

**Docker (all platforms):**
```bash
docker run -d -p 6379:6379 redis:latest
```

---

## 📦 Supabase Database Schema

Run these SQL commands in Supabase SQL Editor:

```sql
-- Users table (handled by Supabase Auth)

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  html_content TEXT,
  css_content TEXT,
  deployed_url TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for subscriptions and chat_messages
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own chat messages" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## 🧪 Testing the Setup

### Test 1: Flask API
```bash
curl http://localhost:8080/health
```
Expected: `{"status": "healthy", "model": "glm-4.6"}`

### Test 2: Fayez API
```bash
curl http://localhost:3000/health
```
Expected: `{"status": "healthy"}`

### Test 3: Redis Connection
```bash
redis-cli ping
```
Expected: `PONG`

### Test 4: Frontend
Open browser to `http://localhost:8000`
- Should see Fowazz AI chat interface
- Try creating an account
- Start a chat with the AI

---

## 🐛 Troubleshooting

### "Server missing GLM_API_KEY" Error
**Solution:** Make sure `.env` file exists in root with `GLM_API_KEY=your_key_here`

### "Redis connection refused"
**Solution:** Start Redis server:
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:latest
```

### "Supabase connection error"
**Solution:** Check that `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct in `fayez/api/.env`

### "Port already in use"
**Solution:** Kill the process or change the port:
```bash
# Find process on port 8080
lsof -i :8080

# Kill it
kill -9 <PID>
```

### Frontend shows blank page
**Solution:** Check browser console for errors. Make sure all services are running.

---

## 🚀 Production Deployment

### Frontend (IONOS)
1. Upload these files to IONOS:
   - `Index.html`
   - `app.js`
   - `translations.js`
   - `settings.html`
   - `plugin-configs.js`

### Backend (Railway)
1. Create Railway account
2. Create 3 new projects:
   - **Flask API:** Connect to GitHub, auto-deploy from `server.py`
   - **Fayez API:** Connect to GitHub, auto-deploy from `fayez/api`
   - **Fayez Worker:** Connect to GitHub, auto-deploy from `fayez/worker`
3. Add environment variables to each project
4. Railway will auto-deploy on every git push

---

## 📝 Next Steps

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system design
- Read [API.md](./API.md) for API endpoint documentation
- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment guide
- Read [HACKATHON_MODE.md](./HACKATHON_MODE.md) to toggle free mode

---

## 💡 Tips

- **Development:** Use `npm run dev` for hot-reload
- **Production:** Use `npm start` for optimized builds
- **Debugging:** Check Railway logs for backend errors
- **Testing:** Use Postman to test API endpoints directly

---

## 🆘 Getting Help

- **Issues:** [GitHub Issues](https://github.com/fmwz/FowazzAI-WebLauncherAgent/issues)
- **Documentation:** This guide + other MD files
- **Contact:** [fowazz.fawzsites.com](https://fowazz.fawzsites.com)

---

**Happy building! 🚀**
