# 📡 Fowazz AI - API Documentation

Complete reference for all API endpoints in the Fowazz AI system.

---

## 🌐 Base URLs

| Service | Environment | URL |
|---------|-------------|-----|
| **Flask API** | Production | `https://your-flask-app.railway.app` |
| **Flask API** | Local | `http://localhost:8080` |
| **Fayez API** | Production | `https://your-fayez-api.railway.app` |
| **Fayez API** | Local | `http://localhost:3000` |

---

## 🔐 Authentication

### **Supabase JWT Tokens**

All requests require authentication via Supabase JWT token (except health checks).

**Header:**
```
Authorization: Bearer <supabase_jwt_token>
```

**Getting Token (Frontend):**
```javascript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

---

## 🤖 Flask API Endpoints

### **1. Chat with AI**
`POST /chat`

Stream AI responses for website generation.

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Create a website for my coffee shop"
    }
  ],
  "user_id": "uuid-here",
  "language": "en"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messages` | Array | Yes | Chat history (OpenAI format) |
| `messages[].role` | String | Yes | `user` or `assistant` |
| `messages[].content` | String | Yes | Message text |
| `user_id` | String | Yes | Supabase user UUID |
| `language` | String | No | `en` or `ar` (default: `en`) |

**Response:**

Server-Sent Events (SSE) stream:

```
data: {"chunk": "I'll create ", "done": false}

data: {"chunk": "a beautiful ", "done": false}

data: {"chunk": "website for ", "done": false}

data: {"chunk": "your coffee shop!", "done": false}

data: {"done": true}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `chunk` | String | Text chunk from AI |
| `done` | Boolean | `true` when stream complete |

**Error Response:**
```json
{
  "error": "Error message here",
  "status": 500
}
```

**Status Codes:**
- `200` - Success (streaming)
- `400` - Invalid request body
- `401` - Missing/invalid token
- `500` - Server error

**Example (JavaScript):**
```javascript
const eventSource = new EventSource('/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Create a website' }],
    user_id: userId,
    language: 'en'
  })
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.done) {
    eventSource.close();
  } else {
    console.log(data.chunk);
  }
};
```

**AI System Prompt:**

The AI is instructed to:
- Generate complete HTML/CSS websites
- Use Tailwind CSS via CDN
- Create 3-7 pages (home, about, services, contact, etc.)
- Include real content (no Lorem Ipsum)
- Integrate features (Stripe, Formspree, analytics)
- Respond in English or Arabic based on `language` parameter

**Thinking Mode:**

GLM-4.6's thinking mode is enabled, providing:
- Hidden chain-of-thought reasoning
- Better design decisions
- More coherent multi-page structure

---

### **2. Stripe Webhook**
`POST /webhook`

Handle Stripe payment events (disabled in hackathon mode).

**Request Headers:**
```
Content-Type: application/json
Stripe-Signature: <stripe_signature>
```

**Request Body:**
```json
{
  "type": "customer.subscription.created",
  "data": {
    "object": {
      "id": "sub_xxx",
      "customer": "cus_xxx",
      "status": "active"
    }
  }
}
```

**Response:**
```json
{
  "received": true
}
```

**Supported Events:**
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_succeeded` - Payment succeeded
- `invoice.payment_failed` - Payment failed

**Status Codes:**
- `200` - Webhook processed
- `400` - Invalid signature
- `500` - Processing error

---

### **3. Health Check**
`GET /health`

Check API health status.

**Request:**
```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "model": "glm-4.6",
  "timestamp": "2025-11-27T12:00:00Z"
}
```

**Status Codes:**
- `200` - Healthy
- `503` - Unhealthy

---

## 🚀 Fayez API Endpoints

### **1. Deploy Website**
`POST /api/deploy`

Queue a website deployment job.

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "zipUrl": "https://supabase.co/storage/file.zip",
  "domain": "example",
  "userId": "uuid-here",
  "customDomain": "example.com"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `zipUrl` | String | Yes | Supabase storage URL of ZIP file |
| `domain` | String | Yes | Subdomain (e.g., "example" for example.fowazz.com) |
| `userId` | String | Yes | Supabase user UUID |
| `customDomain` | String | No | Custom domain (e.g., "example.com") |

**Response:**
```json
{
  "jobId": "12345",
  "status": "queued",
  "estimatedTime": "2-3 minutes"
}
```

**Status Codes:**
- `200` - Job queued
- `400` - Invalid parameters
- `401` - Unauthorized
- `409` - Domain already taken
- `500` - Server error

---

### **2. Upload File**
`POST /api/upload`

Upload files (images, PDFs, etc.) for AI context.

**Request Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Request Body:**
```
FormData:
  - file: <binary file>
  - userId: <uuid>
```

**Response:**
```json
{
  "url": "https://supabase.co/storage/uploads/file.jpg",
  "fileType": "image/jpeg",
  "size": 245678
}
```

**Supported File Types:**
- Images: `.jpg`, `.png`, `.gif`, `.webp`
- Documents: `.pdf`, `.docx`
- Other: `.txt`, `.csv`

**Max File Size:** 10MB

**Status Codes:**
- `200` - Upload successful
- `400` - Invalid file type or size
- `401` - Unauthorized
- `500` - Upload failed

---

### **3. Check Deployment Status**
`GET /api/status/:jobId`

Check the status of a deployment job.

**Request:**
```
GET /api/status/12345
Authorization: Bearer <token>
```

**Response:**
```json
{
  "jobId": "12345",
  "status": "completed",
  "progress": 100,
  "url": "https://example.fowazz.com",
  "logs": [
    "Downloading ZIP...",
    "Extracting files...",
    "Deploying to Cloudflare...",
    "Configuring DNS...",
    "Deployment complete!"
  ]
}
```

**Status Values:**
- `queued` - Waiting in queue
- `active` - Currently processing
- `completed` - Successfully deployed
- `failed` - Deployment failed

**Status Codes:**
- `200` - Job found
- `404` - Job not found
- `401` - Unauthorized

---

### **4. Get User Projects**
`GET /api/projects`

Retrieve all projects for the authenticated user.

**Request:**
```
GET /api/projects
Authorization: Bearer <token>
```

**Response:**
```json
{
  "projects": [
    {
      "id": "uuid-1",
      "name": "Coffee Shop Website",
      "domain": "coffeeshop",
      "deployed_url": "https://coffeeshop.fowazz.com",
      "status": "deployed",
      "created_at": "2025-11-27T10:00:00Z"
    },
    {
      "id": "uuid-2",
      "name": "Portfolio",
      "domain": "portfolio",
      "deployed_url": null,
      "status": "draft",
      "created_at": "2025-11-27T11:00:00Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized

---

### **5. Delete Project**
`DELETE /api/projects/:id`

Delete a project and its deployed website.

**Request:**
```
DELETE /api/projects/uuid-1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Status Codes:**
- `200` - Deleted
- `401` - Unauthorized
- `403` - Not project owner
- `404` - Project not found

---

### **6. Validate Domain**
`GET /api/validate-domain/:domain`

Check if a domain is available.

**Request:**
```
GET /api/validate-domain/example
```

**Response:**
```json
{
  "available": true,
  "domain": "example.fowazz.com"
}
```

**Response (Taken):**
```json
{
  "available": false,
  "domain": "example.fowazz.com",
  "suggestion": "example2"
}
```

**Status Codes:**
- `200` - Checked
- `400` - Invalid domain format

---

### **7. Health Check**
`GET /health`

Check Fayez API health.

**Response:**
```json
{
  "status": "healthy",
  "queue": {
    "waiting": 3,
    "active": 1,
    "completed": 245
  }
}
```

---

## 📊 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/chat` | 20 requests | 1 minute |
| `/api/deploy` | 5 requests | 1 hour |
| `/api/upload` | 10 requests | 1 minute |
| Other | 100 requests | 1 minute |

**Rate Limit Response:**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

**Status Code:** `429`

---

## 🔄 Webhooks

### **Deployment Status Webhook**

Fayez Worker can send deployment status updates to a custom webhook URL.

**Configure in `.env`:**
```
WEBHOOK_URL=https://your-app.com/webhook
```

**Payload (Success):**
```json
{
  "event": "deployment.completed",
  "jobId": "12345",
  "domain": "example.fowazz.com",
  "url": "https://example.fowazz.com",
  "timestamp": "2025-11-27T12:00:00Z"
}
```

**Payload (Failure):**
```json
{
  "event": "deployment.failed",
  "jobId": "12345",
  "domain": "example.fowazz.com",
  "error": "DNS configuration failed",
  "timestamp": "2025-11-27T12:00:00Z"
}
```

---

## 🧪 Testing with cURL

### **Chat with AI:**
```bash
curl -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "messages": [{"role": "user", "content": "Create a website"}],
    "user_id": "user-uuid",
    "language": "en"
  }'
```

### **Deploy Website:**
```bash
curl -X POST http://localhost:3000/api/deploy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "zipUrl": "https://supabase.co/storage/file.zip",
    "domain": "example",
    "userId": "user-uuid"
  }'
```

### **Upload File:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@image.jpg" \
  -F "userId=user-uuid"
```

---

## 📚 SDK Examples

### **JavaScript (Frontend):**

```javascript
// Chat with AI
async function chatWithAI(message) {
  const response = await fetch('/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: message }],
      user_id: userId,
      language: 'en'
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (!data.done) {
          console.log(data.chunk);
        }
      }
    }
  }
}

// Deploy website
async function deployWebsite(zipUrl, domain) {
  const response = await fetch('/api/deploy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ zipUrl, domain, userId })
  });

  const data = await response.json();
  return data.jobId;
}
```

---

## 🐛 Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `400` | Bad Request | Check request parameters |
| `401` | Unauthorized | Provide valid JWT token |
| `403` | Forbidden | Check user permissions |
| `404` | Not Found | Check endpoint URL |
| `409` | Conflict | Domain already taken |
| `429` | Rate Limited | Wait before retrying |
| `500` | Server Error | Check server logs |
| `503` | Unavailable | Service temporarily down |

---

## 📧 Support

For API support:
- **Documentation:** This guide
- **Issues:** [GitHub Issues](https://github.com/fmwz/FowazzAI-WebLauncherAgent/issues)
- **Contact:** [fowazz.fawzsites.com](https://fowazz.fawzsites.com)

---

**Built with ❤️ for Good Vibes Hackathon 🚀**
