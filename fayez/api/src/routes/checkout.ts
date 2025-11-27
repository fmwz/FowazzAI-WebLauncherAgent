import dotenv from 'dotenv';
dotenv.config();
// apps/api/src/routes/checkout.ts
import { Router } from 'express';
import { Queue } from 'bullmq';

const router = Router();

// BullMQ queue with Upstash support
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
  ...(process.env.REDIS_TLS === 'true' && {
    tls: {
      rejectUnauthorized: false
    }
  }),
};

const queue = new Queue('provision', {
  connection: redisConfig
});

router.post('/create-session', async (req, res) => {
  const { domain, uploadKey, customerEmail, customerName } = req.body || {};

  if (!domain || !uploadKey) {
    return res.status(400).json({
      error: 'Missing required fields: domain and uploadKey'
    });
  }

  try {
    console.log(`🧪 TEST MODE: Skipping Stripe payment for ${domain}`);
    console.log(`👤 Customer: ${customerName} (${customerEmail})`);

    // Skip Stripe, directly queue the provisioning job
    const job = await queue.add('ProvisionSite', {
      domain,
      uploadKey,
      sessionId: `test_${Date.now()}`,
      customerEmail: customerEmail || 'no-email@example.com',
      customerName: customerName || 'Unknown User',
    });

    console.log(`✅ Job queued directly: ${job.id}`);

    // Return job ID so frontend can poll for status
    res.json({
      jobId: job.id,
      domain,
      testMode: true
    });
  } catch (e: any) {
    console.error('❌ Queue error:', e);
    res.status(500).json({
      error: 'Failed to queue job',
      details: e.message
    });
  }
});

// New endpoint to check job status
router.get('/job-status/:jobId', async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    const state = await job.getState();
    const progress = job.progress;
    const returnValue = job.returnvalue;

    let status = 'pending';
    if (state === 'completed') status = 'completed';
    else if (state === 'failed') status = 'failed';
    else if (state === 'active') status = 'active';

    res.json({
      jobId,
      status,
      state,
      progress: typeof progress === 'number' ? progress : 0,
      result: returnValue,
      failedReason: job.failedReason
    });
  } catch (e: any) {
    console.error('❌ Error checking job status:', e);
    res.status(500).json({
      error: 'Failed to check job status',
      details: e.message
    });
  }
});

export default router;