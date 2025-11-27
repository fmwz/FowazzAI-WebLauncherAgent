import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import dotenv from 'dotenv';
import uploadRouter from './routes/upload';
import domainRouter from './routes/domain';
import checkoutRouter from './routes/checkout';
import webhookRouter from './routes/webhooks';
import stripeRouter from './routes/stripe';

dotenv.config();

const app = express();

// Configure CORS for production
// Set FRONTEND_URL in environment variables
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim().replace(/['"]/g, ''))
  : ['http://localhost:3000', 'http://localhost:5000'];

// Add localhost and production domain
allowedOrigins.push('https://fowazz.fawzsites.com');

console.log('🔒 CORS Allowed Origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    console.log('📥 Request from origin:', origin);
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ Origin allowed');
      callback(null, true);
    } else {
      console.log('❌ Origin blocked');
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static HTML files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/upload', uploadRouter);
app.use('/api/domain', domainRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/webhooks', webhookRouter);
app.use('/api/stripe', stripeRouter);

// Health check
app.get('/health', (_, res) => res.json({ ok: true }));

// Serve index.html for any non-API route
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public/index.html'));
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📄 Frontend: http://localhost:${port}`);
  console.log(`🔌 API: http://localhost:${port}/api`);
});