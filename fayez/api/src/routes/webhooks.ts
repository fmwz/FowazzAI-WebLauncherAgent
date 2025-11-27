import dotenv from 'dotenv';
dotenv.config();
// apps/api/src/routes/webhooks.ts
import { Router } from 'express';
import Stripe from 'stripe';
import { Queue } from 'bullmq';
import bodyParser from 'body-parser';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { 
  apiVersion: '2024-06-20' as any 
});

// BullMQ queue for provisioning jobs
const queue = new Queue('provision', { 
  connection: { 
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  } 
});

// Stripe webhook needs raw body
router.post(
  '/stripe', 
  bodyParser.raw({ type: 'application/json' }), 
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;

    try {
      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      console.log(`📨 Webhook received: ${event.type}`);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const domain = session.metadata?.domain!;
        const uploadKey = session.metadata?.uploadKey!;

        console.log(`✅ Payment confirmed for ${domain}`);
        console.log(`🔄 Queueing provisioning job...`);

        // Add job to queue
        const job = await queue.add('ProvisionSite', {
          domain,
          uploadKey,
          sessionId: session.id,
          customerEmail: session.customer_details?.email,
        });

        console.log(`✅ Job queued: ${job.id}`);
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error('❌ Webhook error:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

export default router;