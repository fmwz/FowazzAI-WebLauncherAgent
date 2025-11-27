# 🏗️ Fowazz AI - Technical Architecture

Deep dive into the system architecture, design decisions, and data flow.

---

## 📐 System Overview

Fowazz AI is a **3-tier architecture** with frontend, backend services, and data layer:

```
┌─────────────────────────────────────────────────────────────┐
│                    USER LAYER                                │
│  Browser (Chrome, Safari, Firefox) - Desktop/Mobile         │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND (IONOS)                             │
│  • Vanilla JavaScript (no frameworks)                       │
│  • Tailwind CSS via CDN                                     │
│  • Supabase Client (auth, database)                         │
│  • Server-Sent Events (SSE) for streaming                   │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND SERVICES (Railway)                      │
│                                                              │
│  ┌──────────────────────────────────────────────┐           │
│  │  Service 1: Flask API (Python)               │           │
│  │  Port: 8080                                  │           │
│  │  • AI chat interface (GLM-4.6)               │           │
│  │  • Streaming responses (SSE)                 │           │
│  │  • Website generation                        │           │
│  │  • Stripe webhooks (disabled in GVH)         │           │
│  └──────────────────────────────────────────────┘           │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────┐           │
│  │  Service 2: Fayez API (Node.js/TS)           │           │
│  │  Port: 3000                                  │           │
│  │  • Deployment management                     │           │
│  │  • File upload handling                      │           │
│  │  • Job queue management (BullMQ)             │           │
│  │  • Domain validation                         │           │
│  └──────────────────────────────────────────────┘           │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────┐           │
│  │  Service 3: Fayez Worker (Node.js/TS)        │           │
│  │  Background Jobs                             │           │
│  │  • Cloudflare Pages deployment               │           │
│  │  • DNS record creation                       │           │
│  │  • Email notifications                       │           │
│  │  • Job retry logic                           │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              DATA & INFRASTRUCTURE                           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Supabase    │  │  Cloudflare  │  │  Redis       │      │
│  │  PostgreSQL  │  │  Pages + DNS │  │  (Upstash)   │      │
│  │  + Auth      │  │              │  │              │      │
│  │  + Storage   │  │  Global CDN  │  │  Job Queue   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### **1. User Creates Website**

```
User types in chat
     ↓
Frontend (app.js) sends POST to Flask API
     ↓
Flask API calls GLM-4.6 with streaming
     ↓
GLM-4.6 streams response (SSE)
     ↓
Frontend receives chunks in real-time
     ↓
AI generates HTML/CSS code
     ↓
Frontend renders live preview
     ↓
User confirms or continues editing
```

### **2. User Deploys Website**

```
User enters domain name
     ↓
Frontend packages HTML/CSS into ZIP
     ↓
Upload ZIP to Supabase Storage
     ↓
POST to Fayez API with file URL + domain
     ↓
Fayez API creates BullMQ job
     ↓
Fayez Worker picks up job
     ↓
Worker downloads ZIP from Supabase
     ↓
Worker deploys to Cloudflare Pages via Wrangler CLI
     ↓
Worker creates DNS CNAME record
     ↓
Worker sends email notification (Resend)
     ↓
Website is live at custom domain
```

---

## 🧩 Component Breakdown

### **Frontend (Vanilla JS)**

**File:** `app.js` (~2000 lines)

**Key Functions:**
- `sendMessage()` - Sends user messages to Flask API
- `handleStreamingResponse()` - Processes SSE chunks
- `renderWebsitePreview()` - Shows HTML in iframe
- `deployWebsite()` - Handles deployment flow
- `translateText()` - Bilingual support (English/Arabic)

**Why Vanilla JS?**
- No build process required
- Easy to understand and modify
- Fast load times
- No framework overhead
- Perfect for hackathon simplicity

**Libraries Used:**
- **Tailwind CSS** - Utility-first styling (CDN)
- **Supabase Client** - Auth + database (CDN)
- **hCaptcha** - Bot protection

**State Management:**
- Global variables (no Redux/Zustand)
- `currentLanguage` - EN or AR
- `isStreaming` - Controls input state
- `currentWebsiteHTML` - Stores generated code

### **Flask API (Python)**

**File:** `server.py` (~1200 lines)

**Key Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/chat` | POST | AI chat with streaming |
| `/webhook` | POST | Stripe payment webhooks |
| `/health` | GET | Health check |

**AI Integration:**
```python
from zai import ZhipuAiClient

client = ZhipuAiClient(api_key=GLM_API_KEY)

# Streaming response
stream = client.chat.completions.create(
    model="glm-4.6",
    messages=messages,
    temperature=0.95,
    stream=True,
    thinking={"type": "enabled"}  # Chain-of-thought reasoning
)

for chunk in stream:
    # Send to frontend via SSE
    yield f"data: {json.dumps({'chunk': text})}\n\n"
```

**Concurrency:**
- **Gevent** for async I/O
- Supports 16 concurrent users
- Non-blocking streaming

**Security:**
- CORS enabled for frontend domain
- API key stored in environment variables
- No sensitive data in responses

### **Fayez API (Node.js/TypeScript)**

**File:** `fayez/api/src/index.ts` (~800 lines)

**Key Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/deploy` | POST | Queue deployment job |
| `/api/upload` | POST | Upload files (Multer) |
| `/api/status/:jobId` | GET | Check deployment status |
| `/health` | GET | Health check |

**Tech Stack:**
- **Express.js** - Web framework
- **BullMQ** - Job queue
- **Multer** - File uploads
- **Supabase Client** - Database access

**Deployment Flow:**
```typescript
// 1. Receive deployment request
app.post('/api/deploy', async (req, res) => {
  const { zipUrl, domain, userId } = req.body;

  // 2. Create BullMQ job
  const job = await deploymentQueue.add('deploy', {
    zipUrl,
    domain,
    userId,
    timestamp: Date.now()
  });

  // 3. Return job ID
  res.json({ jobId: job.id });
});
```

**Job Queue (BullMQ):**
- **Redis backend** - Fast, reliable
- **Retry logic** - 3 attempts with backoff
- **Job priority** - FIFO queue
- **Status tracking** - Active, completed, failed

### **Fayez Worker (Node.js/TypeScript)**

**File:** `fayez/worker/src/index.ts` (~600 lines)

**Responsibilities:**
1. **Listen to BullMQ queue**
2. **Download ZIP from Supabase**
3. **Deploy to Cloudflare Pages**
4. **Configure DNS**
5. **Send email notification**

**Deployment Logic:**
```typescript
// Process deployment job
deploymentQueue.process('deploy', async (job) => {
  const { zipUrl, domain } = job.data;

  // 1. Download ZIP
  const zipPath = await downloadZip(zipUrl);

  // 2. Extract to temp directory
  const extractPath = await extractZip(zipPath);

  // 3. Deploy to Cloudflare Pages
  const deploymentUrl = await deployToCloudflare(extractPath, domain);

  // 4. Create DNS CNAME record
  await createDNSRecord(domain, deploymentUrl);

  // 5. Send email
  await sendDeploymentEmail(userId, domain);

  return { success: true, url: deploymentUrl };
});
```

**Cloudflare Integration:**
```typescript
import { exec } from 'child_process';

// Use Wrangler CLI for deployment
exec(`wrangler pages deploy ${extractPath} --project-name=${projectName}`,
  (error, stdout) => {
    // Parse deployment URL from output
    const url = parseDeploymentUrl(stdout);
    resolve(url);
  }
);
```

---

## 🗄️ Database Schema (Supabase)

### **Tables:**

#### **users** (Supabase Auth - managed)
```sql
id UUID PRIMARY KEY
email TEXT
created_at TIMESTAMP
```

#### **projects**
```sql
id UUID PRIMARY KEY
user_id UUID FOREIGN KEY → users.id
name TEXT
domain TEXT
html_content TEXT
css_content TEXT
deployed_url TEXT
status TEXT (draft | deployed | failed)
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### **subscriptions**
```sql
id UUID PRIMARY KEY
user_id UUID FOREIGN KEY → users.id
stripe_customer_id TEXT
stripe_subscription_id TEXT
plan TEXT (free | pro | premium)
status TEXT (active | canceled | past_due)
current_period_end TIMESTAMP
created_at TIMESTAMP
```

#### **chat_messages**
```sql
id UUID PRIMARY KEY
user_id UUID FOREIGN KEY → users.id
role TEXT (user | assistant)
content TEXT
created_at TIMESTAMP
```

### **Row-Level Security (RLS):**
```sql
-- Users can only access their own data
CREATE POLICY "Users can view own projects"
ON projects FOR SELECT
USING (auth.uid() = user_id);

-- Similar policies for all tables
```

---

## 🔐 Security

### **Authentication:**
- **Supabase Auth** - Email/password
- **JWT tokens** - Stored in localStorage
- **Auto-refresh** - Tokens refresh before expiry

### **Authorization:**
- **Row-Level Security** - Database-level access control
- **Service Role Key** - Backend services only
- **API key protection** - Environment variables

### **Data Protection:**
- **HTTPS everywhere** - TLS 1.3
- **CORS restrictions** - Specific origins only
- **Input validation** - All user inputs sanitized
- **hCaptcha** - Bot protection on signup

---

## ⚡ Performance Optimizations

### **Frontend:**
- **CDN delivery** - Tailwind, Supabase from CDN
- **Code splitting** - Minimal initial load
- **Lazy loading** - Images, iframe content
- **Caching** - localStorage for translations

### **Backend:**
- **Gevent async** - Non-blocking I/O
- **Connection pooling** - Supabase connections
- **Redis caching** - Job queue, session data
- **Streaming responses** - Reduced latency

### **Deployment:**
- **Cloudflare CDN** - Global edge network
- **HTTP/2** - Multiplexed connections
- **Brotli compression** - Smaller payloads
- **Edge caching** - Static assets

---

## 🌐 Deployment Architecture

### **Frontend Hosting (IONOS):**
- **Static files** - HTML, JS, CSS
- **Custom domain** - fowazz.com
- **SSL certificate** - Auto-managed
- **CDN** - IONOS edge network

### **Backend Hosting (Railway):**
- **3 separate services:**
  1. Flask API (Python)
  2. Fayez API (Node.js)
  3. Fayez Worker (Node.js)
- **Auto-deploy** - Git push triggers deploy
- **Environment variables** - Secure config
- **Health checks** - Auto-restart on failure

### **Database (Supabase):**
- **PostgreSQL 15** - Managed instance
- **Automatic backups** - Daily snapshots
- **Connection pooling** - PgBouncer
- **Global availability** - AWS multi-region

### **CDN (Cloudflare):**
- **Edge locations** - 200+ cities
- **DDoS protection** - Built-in
- **Caching rules** - Custom TTLs
- **DNS management** - Automated via API

---

## 🔄 CI/CD Pipeline

### **Git Workflow:**
```
Local Development
     ↓
Git commit + push to GitHub
     ↓
Railway detects changes
     ↓
Automatic build + deploy
     ↓
Health check passes
     ↓
Live in production
```

### **Deployment Triggers:**
- **Main branch push** - Auto-deploy all services
- **Environment change** - Manual redeploy
- **Rollback** - One-click previous version

---

## 📊 Monitoring & Logging

### **Railway Logs:**
- **Real-time streaming** - View live logs
- **Error tracking** - Automatic alerts
- **Performance metrics** - CPU, memory, requests

### **Supabase Dashboard:**
- **Database queries** - Slow query detection
- **API usage** - Request counts
- **Auth logs** - Login attempts

### **Cloudflare Analytics:**
- **Traffic stats** - Requests, bandwidth
- **Edge performance** - Cache hit rate
- **Security events** - Blocked requests

---

## 🧪 Testing Strategy

### **Manual Testing:**
- **Chat flow** - End-to-end conversation
- **Deployment** - Full deployment cycle
- **Multi-language** - English + Arabic

### **Error Handling:**
- **API failures** - Retry with exponential backoff
- **Network errors** - User-friendly messages
- **Validation errors** - Inline feedback

---

## 🚀 Scalability Considerations

### **Current Capacity:**
- **Concurrent users:** 16 (Flask gevent)
- **Deployments/hour:** ~100 (BullMQ)
- **Storage:** Unlimited (Supabase)

### **Scaling Strategy:**
- **Horizontal scaling** - Add more Railway instances
- **Redis cluster** - Distributed queue
- **CDN expansion** - More edge locations
- **Database replicas** - Read replicas

---

## 💡 Design Decisions

### **Why GLM-4.6 instead of Claude/GPT-4?**
- **Cost:** ~90% cheaper ($0.001 vs $0.015 per 1K tokens)
- **Quality:** Comparable output with thinking mode
- **Features:** Chain-of-thought reasoning
- **Budget:** Better for hackathon/early users

### **Why Vanilla JS instead of React?**
- **Simplicity:** No build process, no bundling
- **Performance:** Faster initial load
- **Hackathon speed:** Rapid iteration
- **Accessibility:** Easy for others to understand

### **Why Railway instead of AWS/GCP?**
- **Developer experience:** Simple, fast deployment
- **Cost:** Affordable for startups
- **Integration:** GitHub auto-deploy
- **Monitoring:** Built-in logging

### **Why Supabase instead of custom backend?**
- **Auth:** Built-in, secure
- **Database:** PostgreSQL with GUI
- **Storage:** File upload handling
- **RLS:** Database-level security

---

## 📚 Related Documentation

- [SETUP.md](./SETUP.md) - Setup instructions
- [API.md](./API.md) - API reference
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [README.md](./README.md) - Project overview

---

**Built with ❤️ for Good Vibes Hackathon 🚀**
