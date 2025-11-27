// Plugin configuration definitions
const PLUGIN_CONFIGS = {
  stripe: {
    name: 'Stripe Payments',
    icon: '💳',
    desc: 'Accept credit cards, online payments',
    fields: [
      {
        id: 'paymentLinks',
        label: 'Payment Links',
        type: 'array',
        placeholder: 'https://buy.stripe.com/...',
        help: 'Get these from stripe.com → Payment Links',
        addMoreText: 'Add Another Payment Link'
      }
    ],
    instructions: `
1. Go to stripe.com and create an account
2. Go to Products → Payment Links
3. Create a payment link for your product/service
4. Copy the link and paste it here
5. Click + to add more payment links for different products
    `.trim()
  },

  cart: {
    name: 'Shopping Cart',
    icon: '🛒',
    desc: 'Add to cart, checkout system',
    fields: [],
    instructions: 'No configuration needed. Fowazz will build a cart system with localStorage.'
  },

  orders: {
    name: 'Order System',
    icon: '📋',
    desc: 'Online ordering with notifications',
    fields: [
      {
        id: 'notificationEmail',
        label: 'Your Email',
        type: 'text',
        placeholder: 'your@email.com',
        help: 'Where to send order notifications'
      }
    ],
    instructions: 'Orders will be sent to your email via Formspree (free).'
  },

  contact: {
    name: 'Contact Form',
    icon: '📧',
    desc: 'Get emails when people contact you',
    fields: [
      {
        id: 'formspreeId',
        label: 'Formspree Form ID',
        type: 'text',
        placeholder: 'YOUR_FORM_ID',
        help: 'Get this from formspree.io (free account)'
      }
    ],
    instructions: `
1. Go to formspree.io and create free account
2. Create a new form
3. Copy the form ID (looks like: mvoeqjxx)
4. Paste it here
    `.trim()
  },

  newsletter: {
    name: 'Newsletter Signup',
    icon: '📰',
    desc: 'Collect email subscribers',
    fields: [
      {
        id: 'formspreeId',
        label: 'Formspree Form ID',
        type: 'text',
        placeholder: 'YOUR_FORM_ID',
        help: 'Same as contact form - formspree.io'
      }
    ],
    instructions: 'Create a separate Formspree form for newsletter signups.'
  },

  booking: {
    name: 'Booking/Appointments',
    icon: '📅',
    desc: 'Let people schedule appointments',
    fields: [
      {
        id: 'calendlyUrl',
        label: 'Calendly Link (optional)',
        type: 'text',
        placeholder: 'https://calendly.com/yourname',
        help: 'Use Calendly for advanced scheduling features'
      },
      {
        id: 'formspreeId',
        label: 'Formspree Form ID (if not using Calendly)',
        type: 'text',
        placeholder: 'YOUR_FORM_ID',
        help: 'For custom booking form - get from formspree.io'
      }
    ],
    instructions: `
Option 1: Use Calendly link for professional scheduling (recommended)
Option 2: Leave Calendly blank and add Formspree ID - Fowazz will build a custom booking form with Name, Email, Date/Time, Service, and Message fields
    `.trim()
  },

  webhooks: {
    name: 'Webhooks',
    icon: '⚡',
    desc: 'Get instant notifications for any action',
    fields: [
      {
        id: 'webhookUrls',
        label: 'Webhook URLs',
        type: 'array',
        placeholder: 'https://discord.com/api/webhooks/...',
        help: 'Discord webhook, Zapier, Make.com, etc.',
        addMoreText: 'Add Another Webhook'
      }
    ],
    instructions: `
Discord: Server Settings → Integrations → Webhooks → New Webhook
Zapier/Make: Create a webhook trigger and copy the URL
    `.trim()
  },

  whatsapp: {
    name: 'WhatsApp Contact',
    icon: '💬',
    desc: 'Click to chat button',
    fields: [
      {
        id: 'phoneNumber',
        label: 'WhatsApp Number',
        type: 'text',
        placeholder: '+1234567890',
        help: 'Include country code (e.g., +1 for US)'
      }
    ],
    instructions: 'Use your WhatsApp Business number with country code.'
  },

  analytics: {
    name: 'Google Analytics',
    icon: '📈',
    desc: 'Track visitors and behavior',
    fields: [
      {
        id: 'trackingId',
        label: 'Tracking ID',
        type: 'text',
        placeholder: 'G-XXXXXXXXXX or UA-XXXXXXXXX',
        help: 'From analytics.google.com'
      }
    ],
    instructions: `
1. Go to analytics.google.com
2. Create a property for your website
3. Copy the Measurement ID (G-XXXXXXXXXX)
4. Paste it here
    `.trim()
  },

  cookies: {
    name: 'Cookie Consent',
    icon: '🍪',
    desc: 'GDPR-compliant cookie banner',
    fields: [],
    instructions: 'No config needed. Fowazz will add a compliant cookie banner.'
  },

  socials: {
    name: 'Social Media Links',
    icon: '📱',
    desc: 'Link to your social profiles',
    fields: [
      {
        id: 'socialLinks',
        label: 'Add Social Media Links',
        type: 'socials-array',
        help: 'Add links to Instagram, TikTok, YouTube, Twitter, Facebook, etc.'
      }
    ],
    instructions: `
Add your social media profiles. Fowazz will create beautiful social media buttons/icons that link to your profiles.
Supports: Instagram, TikTok, YouTube, Twitter/X, Facebook, Snapchat, LinkedIn, Pinterest, and more.
    `.trim()
  },

  reviews: {
    name: 'Reviews/Testimonials',
    icon: '⭐',
    desc: 'Display reviews + accept new ones',
    fields: [
      {
        id: 'existingReviews',
        label: 'Add Reviews to Display',
        type: 'reviews-array',
        help: 'Add reviews from people you know (Name, Rating, Review Text)'
      },
      {
        id: 'formspreeId',
        label: 'Formspree Form ID (for new reviews)',
        type: 'text',
        placeholder: 'YOUR_FORM_ID',
        help: 'Visitors can submit reviews via "Leave a Review" button'
      }
    ],
    instructions: `
1. Add existing reviews to display on your site (from customers you know)
2. Get Formspree ID from formspree.io for new review submissions
3. Fowazz will show your reviews + add a "Leave a Review" button/page
    `.trim()
  },

  blog: {
    name: 'Blog/Articles',
    icon: '📝',
    desc: 'Add a blog section',
    fields: [],
    instructions: 'Fowazz will build a simple blog structure with article pages.'
  },

  faq: {
    name: 'FAQ Section',
    icon: '❓',
    desc: 'Frequently asked questions',
    fields: [],
    instructions: 'Fowazz will add an accordion-style FAQ section.'
  },

  map: {
    name: 'Google Maps',
    icon: '🗺️',
    desc: 'Show your location',
    fields: [
      {
        id: 'address',
        label: 'Address or Embed Code',
        type: 'textarea',
        placeholder: '123 Main St, City, State or <iframe src="...">',
        help: 'Your address OR Google Maps embed code'
      }
    ],
    instructions: 'Provide your address, or get embed code from Google Maps → Share → Embed.'
  },

  search: {
    name: 'Search',
    icon: '🔍',
    desc: 'Let visitors search your site',
    fields: [],
    instructions: 'Fowazz will build a JavaScript search function.'
  },

  livechat: {
    name: 'Live Chat',
    icon: '💭',
    desc: 'Real-time chat widget (Tawk.to)',
    fields: [
      {
        id: 'tawkPropertyId',
        label: 'Tawk.to Property ID',
        type: 'text',
        placeholder: '5xxxxxxxxxxxxx/1xxxxxxxx',
        help: 'From tawk.to dashboard'
      }
    ],
    instructions: `
1. Go to tawk.to and create free account
2. Add a property for your website
3. Go to Administration → Property ID
4. Copy the ID and paste here
    `.trim()
  }
};
