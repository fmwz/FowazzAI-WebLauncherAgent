import dotenv from 'dotenv';
dotenv.config();
// apps/api/src/routes/domain.ts
import { Router } from 'express';
import axios from 'axios';

const router = Router();

const BASE_URL = 'https://api.dnsimple.com/v2';
const HEADERS = {
  'Authorization': `Bearer ${process.env.DNSIMPLE_API_TOKEN}`,
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

router.get('/check', async (req, res) => {
  const domain = String(req.query.domain || '').toLowerCase().trim();
  
  if (!domain) {
    return res.status(400).json({ error: 'Missing domain parameter' });
  }

  const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return res.status(400).json({ error: 'Invalid domain format' });
  }

  try {
    console.log(`🔍 Checking availability: ${domain}`);

    // 1. Check availability
    const checkUrl = `${BASE_URL}/${process.env.DNSIMPLE_ACCOUNT_ID}/registrar/domains/${domain}/check`;
    const checkRes = await axios.get(checkUrl, { headers: HEADERS });
    
    if (checkRes.status !== 200) {
      return res.status(500).json({ error: 'DNSimple API request failed' });
    }

    const available = checkRes.data?.data?.available || false;

    // 2. Get price if available
    let price = null;
    if (available) {
      const priceUrl = `${BASE_URL}/${process.env.DNSIMPLE_ACCOUNT_ID}/registrar/domains/${domain}/prices`;
      const priceRes = await axios.get(priceUrl, { headers: HEADERS });
      
      if (priceRes.status === 200) {
        price = parseFloat(priceRes.data?.data?.registration_price) || 12.99;
      }
    }

    console.log(`${available ? '✅' : '❌'} ${domain} - ${available ? 'Available' : 'Taken'} ${price ? `($${price})` : ''}`);

    res.json({ 
      domain, 
      available,
      price: price || 12.99
    });
  } catch (e: any) {
    console.error('❌ Domain check error:', e.response?.data || e.message);
    res.status(500).json({ 
      error: 'Domain check failed', 
      details: e.message 
    });
  }
});

export default router;