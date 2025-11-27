import express from 'express';
import Stripe from 'stripe';

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

const PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_1SP1RWRwqmVW0cG8QajQei94';

/**
 * Create Stripe Checkout Session
 * POST /api/stripe/create-checkout-session
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { userId, userEmail, priceId, maxWebsites, planType } = req.body;

    if (!userId || !userEmail || !priceId || !maxWebsites || !planType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      metadata: {
        userId: userId,
        planType: planType,
        maxWebsites: maxWebsites.toString()
      },
      ui_mode: 'embedded',
      // Return URL for cases where redirect is needed (3D Secure, etc.)
      // Frontend handles this via URL parameter detection on load
      return_url: `${req.headers.origin || 'https://fowazz.fawzsites.com'}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    });

    res.json({ clientSecret: session.client_secret });
  } catch (error: any) {
    console.error('❌ Stripe checkout session error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stripe Webhook Handler
 * POST /api/stripe/webhook
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('❌ No webhook secret configured');
    return res.status(400).send('Webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('✅ Checkout session completed:', session.id);
        await handleCheckoutSessionCompleted(session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('✅ Subscription updated:', subscription.id);
        await handleSubscriptionUpdate(subscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log('⚠️ Subscription deleted:', deletedSubscription.id);
        await handleSubscriptionDeleted(deletedSubscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('❌ Error handling webhook:', error);
    res.status(500).send(`Webhook handler error: ${error.message}`);
  }
});

// Helper function to handle completed checkout session
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planType = session.metadata?.planType || 'pro';
  const maxWebsites = parseInt(session.metadata?.maxWebsites || '3');
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId || !customerId || !subscriptionId) {
    console.error('❌ Missing required data in checkout session');
    return;
  }

  // Import Supabase (you'll need to add this at the top of the file)
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Fetch subscription details from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Create or update subscription in database
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      status: 'active',
      plan_name: planType,
      max_websites: maxWebsites,
      websites_used: 0,
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
    }, {
      onConflict: 'user_id'
    });

  if (subError) {
    console.error('❌ Error creating subscription in database:', subError);
  } else {
    console.log(`✅ Subscription created: ${planType} plan (${maxWebsites} websites) for user:`, userId);
  }

  // Also update user_profiles with plan info (CRITICAL - frontend reads from this table)
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      plan_name: planType,
      max_websites: maxWebsites,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (profileError) {
    console.error('❌ Error updating user profile:', profileError);
  } else {
    console.log(`✅ User profile updated with plan: ${planType} (${maxWebsites} websites)`);
  }
}

// Helper function to handle subscription updates
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('❌ Error updating subscription:', error);
  } else {
    console.log('✅ Subscription updated for:', subscription.id);
  }
}

// Helper function to handle subscription deletion
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Get user_id from subscription
  const { data: subData } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (subError) {
    console.error('❌ Error canceling subscription:', subError);
  } else {
    console.log('✅ Subscription canceled for:', subscription.id);
  }

  // Reset user_profiles to lite plan (1 website) when subscription is canceled
  if (subData?.user_id) {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        plan_name: 'lite',
        max_websites: 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', subData.user_id);

    if (profileError) {
      console.error('❌ Error resetting user profile to lite plan:', profileError);
    } else {
      console.log(`✅ User ${subData.user_id} reset to lite plan (1 website)`);
    }
  }
}

export default router;
