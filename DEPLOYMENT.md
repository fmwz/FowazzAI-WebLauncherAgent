# 🚀 Fowazz AI - Production Deployment Guide

Complete guide for deploying Fowazz AI to production.

---

## 📋 Prerequisites

### **Required Accounts:**
- ✅ **IONOS** - Frontend hosting
- ✅ **Railway** - Backend hosting
- ✅ **Supabase** - Database + Auth
- ✅ **Cloudflare** - CDN + DNS
- ✅ **ZhipuAI** - GLM-4.6 API
- ✅ **GitHub** - Code repository
- ✅ **Resend** - Email service (optional)

### **Domain Requirements:**
- Custom domain (e.g., `fowazz.com`)
- Access to DNS settings

---

## 🌐 Part 1: Frontend Deployment (IONOS)

### **Step 1: Prepare Files**

Ensure these files are ready:
- `Index.html` - Main application
- `app.js` - Frontend logic
- `translations.js` - Bilingual support
- `settings.html` - Settings page
- `plugin-configs.js` - Configuration

### **Step 2: Update Configuration**

**File:** `app.js` (Lines 1-10)

Update API URLs:
```javascript
const FLASK_API_URL = 'https://your-flask-app.railway.app';
const FAYEZ_API_URL = 'https://your-fayez-api.railway.app';
```

**File:** `plugin-configs.js`

Update Supabase credentials:
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your_anon_key_here';
```

### **Step 3: Upload to IONOS**

**Via FTP:**
1. Connect to IONOS FTP server
2. Upload all files to `/htdocs/` or root directory
3. Ensure `Index.html` is the main file

**Via IONOS File Manager:**
1. Log in to IONOS control panel
2. Navigate to **Hosting → File Manager**
3. Upload files directly
4. Set `Index.html` as default document

### **Step 4: Configure SSL**

1. In IONOS panel, go to **SSL Certificates**
2. Enable **Let's Encrypt** (free SSL)
3. Force HTTPS redirect:
   - Create `.htaccess` file:
   ```apache
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

### **Step 5: Test Frontend**

Visit your domain: `https://fowazz.fawzsites.com` (or your custom domain)

**Checklist:**
- [ ] Page loads correctly
- [ ] Tailwind CSS styling works
- [ ] Chat interface appears
- [ ] No console errors

---

## 🐍 Part 2: Flask API Deployment (Railway)

### **Step 1: Create Railway Project**

1. Sign up at [railway.app](https://railway.app)
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Choose your repository
5. Select **Root directory** (where `server.py` is located)

### **Step 2: Configure Build Settings**

Railway should auto-detect Python. If not:

**Railway Settings:**
- **Builder:** Nixpacks (auto)
- **Start Command:** `python server.py`
- **Root Directory:** `/` (or wherever `server.py` is)

### **Step 3: Set Environment Variables**

In Railway dashboard, go to **Variables** tab:

```bash
# AI API
GLM_API_KEY=your_glm_api_key_here

# Stripe (optional - disabled in hackathon mode)
STRIPE_SECRET_KEY=your_stripe_key_here
STRIPE_WEBHOOK_SECRET=your_webhook_secret_here

# Python environment
PYTHONUNBUFFERED=1
```

### **Step 4: Deploy**

1. Railway auto-deploys on git push
2. Watch build logs in Railway dashboard
3. Wait for deployment to complete (~2-3 minutes)

### **Step 5: Get Public URL**

1. Go to **Settings → Networking**
2. Click **Generate Domain**
3. Copy URL (e.g., `https://fowazz-flask.railway.app`)
4. Update this URL in frontend `app.js`

### **Step 6: Test API**

```bash
curl https://your-flask-app.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "model": "glm-4.6"
}
```

---

## 🟢 Part 3: Fayez API Deployment (Railway)

### **Step 1: Create Railway Project**

1. Create **New Project** in Railway
2. Deploy from **same GitHub repo**
3. Set **Root Directory:** `/fayez/api`

### **Step 2: Configure Build**

**Railway Settings:**
- **Builder:** Nixpacks
- **Start Command:** `npm start`
- **Root Directory:** `/fayez/api`

### **Step 3: Set Environment Variables**

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Cloudflare
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here

# Redis (use Railway Redis plugin)
REDIS_HOST=redis_hostname
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# Resend Email (optional)
RESEND_API_KEY=your_resend_api_key_here

# Node environment
NODE_ENV=production
PORT=3000
```

### **Step 4: Add Redis Service**

1. In Railway project, click **+ New**
2. Select **Database → Redis**
3. Railway creates Redis instance
4. Copy connection details to Fayez API variables

### **Step 5: Deploy**

1. Push to GitHub
2. Railway auto-deploys
3. Check logs for errors

### **Step 6: Get Public URL**

1. Generate domain in **Settings → Networking**
2. Copy URL (e.g., `https://fayez-api.railway.app`)
3. Update in frontend `app.js`

---

## ⚙️ Part 4: Fayez Worker Deployment (Railway)

### **Step 1: Create Railway Project**

1. Create **New Project**
2. Deploy from **same GitHub repo**
3. Set **Root Directory:** `/fayez/worker`

### **Step 2: Configure Build**

**Railway Settings:**
- **Builder:** Nixpacks
- **Start Command:** `npm start`
- **Root Directory:** `/fayez/worker`

### **Step 3: Set Environment Variables**

```bash
# Same as Fayez API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here
REDIS_HOST=redis_hostname
REDIS_PORT=6379
REDIS_PASSWORD=redis_password
RESEND_API_KEY=your_resend_api_key_here

# Worker-specific
NODE_ENV=production
CONCURRENCY=5
```

**Note:** Worker shares Redis with Fayez API. Use the same Redis credentials.

### **Step 4: Install Wrangler**

Worker needs Cloudflare Wrangler CLI for deployments.

**In `fayez/worker/package.json`**, ensure:
```json
{
  "dependencies": {
    "wrangler": "^4.45.0"
  }
}
```

Railway will install it during build.

### **Step 5: Deploy**

1. Push to GitHub
2. Railway auto-deploys
3. Worker starts processing queue

**No public URL needed** - Worker runs in background.

---

## 🗄️ Part 5: Database Setup (Supabase)

### **Step 1: Create Project**

1. Sign up at [supabase.com](https://supabase.com)
2. Create new project
3. Choose region (closest to users)
4. Set database password

### **Step 2: Run SQL Schema**

Go to **SQL Editor** and run:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for chat messages
CREATE POLICY "Users can view own chat messages" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_projects_status ON projects(status);
```

### **Step 3: Configure Storage**

1. Go to **Storage** in Supabase dashboard
2. Create bucket: `deployments`
3. Set bucket to **Private**
4. Add policy:
```sql
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'deployments' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### **Step 4: Get API Keys**

1. Go to **Settings → API**
2. Copy:
   - **Project URL** → Frontend config
   - **Anon Key** → Frontend config
   - **Service Role Key** → Backend services

---

## ☁️ Part 6: Cloudflare Setup

### **Step 1: Add Domain**

1. Log in to Cloudflare
2. Click **Add Site**
3. Enter your domain (e.g., `fowazz.com`)
4. Choose **Free plan**
5. Update nameservers at your domain registrar

### **Step 2: Create API Token**

1. Go to **My Profile → API Tokens**
2. Click **Create Token**
3. Use template: **Edit Cloudflare Workers**
4. Add permissions:
   - **Cloudflare Pages:** Edit
   - **DNS:** Edit
   - **Account Settings:** Read
5. Set **Account Resources:**
   - Include → Your account
6. Set **Zone Resources:**
   - Include → Specific zone → Your domain
7. Create token and save it

### **Step 3: Get Account ID**

1. Go to **Workers & Pages**
2. Copy **Account ID** from right sidebar
3. Add to Fayez API/Worker environment variables

### **Step 4: Configure DNS**

No manual DNS needed - Fayez Worker creates CNAME records automatically.

**Manual DNS (if needed):**
- **Type:** CNAME
- **Name:** `subdomain`
- **Target:** `[hash].pages.dev`
- **Proxy status:** Proxied (orange cloud)

---

## 📧 Part 7: Email Setup (Resend)

### **Step 1: Create Account**

1. Sign up at [resend.com](https://resend.com)
2. Verify email address

### **Step 2: Add Domain**

1. Click **Domains → Add Domain**
2. Enter your domain (e.g., `fowazz.com`)
3. Add DNS records to Cloudflare:
   - **TXT record** for verification
   - **MX records** for email
   - **CNAME records** for DKIM

### **Step 3: Get API Key**

1. Go to **API Keys**
2. Create new key
3. Copy to Fayez Worker environment

### **Step 4: Test Email**

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@fowazz.com",
    "to": "your@email.com",
    "subject": "Test",
    "html": "<p>It works!</p>"
  }'
```

---

## ✅ Part 8: Final Checks

### **Frontend Checklist:**
- [ ] Domain resolves to IONOS
- [ ] SSL certificate active (HTTPS)
- [ ] API URLs updated in `app.js`
- [ ] Supabase config correct
- [ ] All pages load correctly
- [ ] No console errors

### **Flask API Checklist:**
- [ ] Railway deployment successful
- [ ] `/health` endpoint responds
- [ ] GLM_API_KEY set correctly
- [ ] CORS allows frontend domain
- [ ] Streaming works

### **Fayez API Checklist:**
- [ ] Railway deployment successful
- [ ] `/health` endpoint responds
- [ ] Supabase connection works
- [ ] Redis connection works
- [ ] File uploads work

### **Fayez Worker Checklist:**
- [ ] Worker running (check Railway logs)
- [ ] Processes jobs from queue
- [ ] Cloudflare deployments work
- [ ] DNS records created correctly
- [ ] Emails sent successfully

### **Database Checklist:**
- [ ] Tables created
- [ ] RLS policies active
- [ ] Storage bucket configured
- [ ] Indexes created

---

## 🔄 CI/CD Workflow

### **Automatic Deployment:**

```
Developer pushes to GitHub
         ↓
GitHub webhook triggers Railway
         ↓
Railway builds all services
         ↓
Railway runs tests (if configured)
         ↓
Railway deploys to production
         ↓
Health checks pass
         ↓
Live in production ✅
```

### **Manual Rollback:**

1. Go to Railway dashboard
2. Select service
3. Click **Deployments**
4. Click **Rollback** on previous working deployment

---

## 📊 Monitoring

### **Railway Logs:**
```bash
# View logs
railway logs

# Follow logs
railway logs -f
```

### **Supabase Logs:**
- Go to **Logs → Postgres Logs**
- Filter by query, error, etc.

### **Cloudflare Analytics:**
- Dashboard → Analytics & Logs
- View traffic, cache hit rate, etc.

---

## 🐛 Troubleshooting

### **Frontend shows "API Error"**
- Check API URLs in `app.js`
- Verify Railway services are running
- Check CORS configuration

### **Chat not streaming**
- Verify GLM_API_KEY is set
- Check Flask API logs
- Test `/health` endpoint

### **Deployment fails**
- Check Cloudflare API token permissions
- Verify Redis connection
- Check Worker logs in Railway

### **Email not sending**
- Verify Resend API key
- Check domain DNS records
- Test API key with cURL

---

## 🚀 Scaling

### **Current Capacity:**
- **Concurrent users:** 16 (Flask)
- **Deployments/hour:** ~100 (BullMQ)

### **To Scale:**

**Horizontal Scaling:**
1. Railway: Add more instances (scale up)
2. Redis: Use Redis cluster
3. Database: Add read replicas

**Vertical Scaling:**
1. Railway: Upgrade plan for more resources
2. Supabase: Upgrade plan for more connections

---

## 💰 Cost Estimate

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| **IONOS** | Basic | $5-10 |
| **Railway** | Hobby (3 services) | $15-30 |
| **Supabase** | Free | $0 |
| **Cloudflare** | Free | $0 |
| **Resend** | Free (100 emails/day) | $0 |
| **GLM-4.6** | Pay-as-you-go | $5-20 |
| **Total** | | **$25-60/month** |

---

## 📚 Related Documentation

- [SETUP.md](./SETUP.md) - Local development setup
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [API.md](./API.md) - API documentation
- [README.md](./README.md) - Project overview

---

**🎉 Congratulations! Your Fowazz AI deployment is live! 🚀**

**Built with ❤️ for Good Vibes Hackathon**
