import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import { Worker, Job } from 'bullmq';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import fs from 'fs';
import crypto from 'crypto';
import AdmZip from 'adm-zip';
import { exec } from 'child_process';
import { promisify } from 'util';

dotenv.config();

const execAsync = promisify(exec);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY!);

// Download ZIP from Supabase
async function downloadZip(key: string): Promise<string> {
  const tempDir = os.tmpdir();
  const outputPath = path.join(tempDir, `${crypto.randomUUID()}.zip`);
  
  console.log(`📥 Downloading ${key} from Supabase...`);
  console.log(`💾 Temp folder: ${tempDir}`);
  
  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET!)
    .download(key);

  if (error) {
    throw new Error(`Failed to download: ${error.message}`);
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);

  console.log(`✅ Downloaded to ${outputPath}`);
  return outputPath;
}

// Extract ZIP to folder
function extractZip(zipPath: string): string {
  const tempDir = os.tmpdir();
  const extractPath = path.join(tempDir, crypto.randomUUID());
  fs.mkdirSync(extractPath, { recursive: true });
  
  console.log(`📂 Extracting ZIP...`);
  console.log(`📁 Extract to: ${extractPath}`);
  
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(extractPath, true);
  
  const files = fs.readdirSync(extractPath);
  console.log(`✅ Extracted ${files.length} files/folders`);
  
  return extractPath;
}

// Deploy to Cloudflare Pages using Wrangler
async function deployToCloudflarePages(extractPath: string, domain: string): Promise<string> {
  console.log(`🚀 Deploying to Cloudflare Pages with Wrangler...`);
  
  const projectName = domain
    .replace(/\./g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .toLowerCase()
    .substring(0, 58);
  
  console.log(`📦 Project name: ${projectName}`);
  
  const wranglerEnv = {
    ...process.env,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    WRANGLER_SEND_METRICS: 'false'
  };
  
  try {
    // Step 1: Try to create project (might already exist)
    console.log(`📦 Creating project if needed...`);
    try {
      await execAsync(`npx wrangler pages project create "${projectName}" --production-branch=main`, {
        env: wranglerEnv
      });
      console.log(`✅ Project created`);
    } catch (e) {
      console.log(`📦 Project already exists, continuing...`);
    }

    // Step 2: Deploy files
    const cmd = `npx wrangler pages deploy "${extractPath}" --project-name="${projectName}" --branch=main`;
    
    console.log(`🔧 Deploying files...`);
    
    const { stdout, stderr } = await execAsync(cmd, {
      cwd: process.cwd(),
      env: wranglerEnv,
      maxBuffer: 10 * 1024 * 1024
    });
    
    console.log(`📄 Deployment output:\n${stdout}`);
    
    if (stderr && !stderr.includes('warning')) {
      console.log(`⚠️ Warnings:\n${stderr}`);
    }
    
    // Extract URL from output
    const urlMatch = stdout.match(/https:\/\/[a-z0-9-]+\.pages\.dev/);
    const deploymentUrl = urlMatch ? urlMatch[0] : `https://${projectName}.pages.dev`;
    
    console.log(`✅ Deployed successfully!`);
    console.log(`🌐 Live at: ${deploymentUrl}`);
    
    return deploymentUrl.replace('https://', '');
    
  } catch (error: any) {
    console.error(`❌ Wrangler deployment failed:`);
    console.error(error.stdout || error.message);
    console.error(error.stderr);
    throw new Error(`Deployment failed: ${error.message}`);
  }
}

// Generate signed URL for ZIP download
async function getZipDownloadUrl(uploadKey: string): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .createSignedUrl(uploadKey, 604800); // 7 days expiry

    if (error) {
      console.error('Failed to create signed URL:', error);
      return 'Download link unavailable';
    }

    return data.signedUrl;
  } catch (e) {
    console.error('Error generating download URL:', e);
    return 'Download link unavailable';
  }
}

// Send email notification to admin
async function notifyAdmin(
  requestedDomain: string,
  pagesUrl: string,
  customerEmail: string,
  customerName: string,
  uploadKey: string
) {
  // Generate download URL for the website files
  const downloadUrl = await getZipDownloadUrl(uploadKey);

  const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Deployment - ${requestedDomain}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b35; }
    .info-box h3 { margin-top: 0; color: #ff6b35; }
    .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #eee; }
    .info-label { font-weight: 600; width: 150px; color: #666; }
    .info-value { flex: 1; color: #333; }
    .button { display: inline-block; background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 10px 10px 0; }
    .button:hover { background: #ff8c5a; }
    .steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .step { padding: 15px; margin: 10px 0; background: #f5f5f5; border-radius: 6px; border-left: 3px solid #ff6b35; }
    .footer { text-align: center; padding: 20px; color: #999; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 New Site Deployed!</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Action Required: Domain Setup</p>
    </div>

    <div class="content">
      <div class="info-box">
        <h3>👤 Customer Information</h3>
        <div class="info-row">
          <div class="info-label">Name:</div>
          <div class="info-value"><strong>${customerName}</strong></div>
        </div>
        <div class="info-row">
          <div class="info-label">Email:</div>
          <div class="info-value"><strong>${customerEmail}</strong></div>
        </div>
        <div class="info-row">
          <div class="info-label">Requested Domain:</div>
          <div class="info-value"><strong>${requestedDomain}</strong></div>
        </div>
      </div>

      <div class="info-box">
        <h3>🌐 Deployment Details</h3>
        <div class="info-row">
          <div class="info-label">Live URL:</div>
          <div class="info-value"><a href="https://${pagesUrl}" target="_blank">https://${pagesUrl}</a></div>
        </div>
        <div class="info-row">
          <div class="info-label">Status:</div>
          <div class="info-value" style="color: #39FF14;"><strong>✅ Deployed Successfully</strong></div>
        </div>
      </div>

      <div class="info-box">
        <h3>📦 Website Files</h3>
        <p>Download the customer's website files:</p>
        <a href="${downloadUrl}" class="button">📥 Download ZIP File</a>
        <p style="font-size: 13px; color: #666; margin-top: 10px;">Link expires in 7 days</p>
      </div>

      <div class="steps">
        <h3 style="color: #ff6b35;">📋 Next Steps (Manual Action Required):</h3>

        <div class="step">
          <strong>Step 1:</strong> Buy the domain <code>${requestedDomain}</code> at DNSimple or your preferred registrar
        </div>

        <div class="step">
          <strong>Step 2:</strong> Add <code>${requestedDomain}</code> to your Cloudflare account
        </div>

        <div class="step">
          <strong>Step 3:</strong> Create a CNAME DNS record:
          <ul style="margin: 10px 0;">
            <li><strong>Type:</strong> CNAME</li>
            <li><strong>Name:</strong> @ (or ${requestedDomain})</li>
            <li><strong>Target:</strong> ${pagesUrl}</li>
            <li><strong>Proxy:</strong> ON (orange cloud ☁️)</li>
          </ul>
        </div>

        <div class="step">
          <strong>Step 4:</strong> Email the customer at <a href="mailto:${customerEmail}">${customerEmail}</a>:
          <div style="background: #f9f9f9; padding: 15px; margin-top: 10px; border-radius: 4px; font-family: monospace; font-size: 13px;">
            Subject: Your Website is Live! 🎉<br><br>
            Hi ${customerName},<br><br>
            Great news! Your website is now live at ${requestedDomain}.<br><br>
            You can visit it here: https://${requestedDomain}<br><br>
            Thanks for using Fowazz!
          </div>
        </div>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://${pagesUrl}" class="button">👀 View Live Site</a>
        <a href="${downloadUrl}" class="button" style="background: #333;">📥 Download Files</a>
      </div>
    </div>

    <div class="footer">
      <p>This is an automated notification from Fowazz deployment system</p>
      <p style="font-size: 12px;">Powered by Cloudflare Pages + Resend</p>
    </div>
  </div>
</body>
</html>
  `;

  const textEmail = `
🎉 NEW SITE DEPLOYED!

CUSTOMER INFORMATION:
- Name: ${customerName}
- Email: ${customerEmail}
- Requested Domain: ${requestedDomain}

DEPLOYMENT DETAILS:
- Live URL: https://${pagesUrl}
- Status: ✅ Deployed Successfully

WEBSITE FILES:
Download: ${downloadUrl}
(Link expires in 7 days)

NEXT STEPS (Manual Action Required):

1. Buy domain: ${requestedDomain} at DNSimple or your preferred registrar

2. Add ${requestedDomain} to your Cloudflare account

3. Create DNS record:
   - Type: CNAME
   - Name: @ (or ${requestedDomain})
   - Target: ${pagesUrl}
   - Proxy: ON (orange cloud ☁️)

4. Email customer at ${customerEmail}:
   "Hi ${customerName},

   Great news! Your website is now live at ${requestedDomain}.

   You can visit it here: https://${requestedDomain}

   Thanks for using Fowazz!"

View live site: https://${pagesUrl}

---
Powered by Fowazz + Cloudflare Pages
  `;

  console.log(textEmail);

  // Send email via Resend
  if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Fowazz Deployments <onboarding@resend.dev>',
        to: [process.env.ADMIN_EMAIL],
        subject: `🚀 New Deployment: ${requestedDomain} (${customerName})`,
        html: htmlEmail,
        text: textEmail
      });

      if (error) {
        console.error('❌ Email send error:', error);
      } else {
        console.log('✅ Email notification sent to', process.env.ADMIN_EMAIL);
        console.log('📧 Email ID:', data?.id);
      }
    } catch (e) {
      console.error('❌ Failed to send email:', e);
    }
  } else {
    console.log('⚠️ Email not configured (RESEND_API_KEY or ADMIN_EMAIL missing)');
  }

  // Also send Discord notification if configured
  if (process.env.DISCORD_WEBHOOK_URL) {
    try {
      await axios.post(process.env.DISCORD_WEBHOOK_URL, {
        content: textEmail
      });
      console.log('✅ Discord notification sent');
    } catch (e) {
      console.log('⚠️ Discord notification failed (optional)');
    }
  }
}

interface ProvisionJobData {
  domain: string;
  uploadKey: string;
  sessionId: string;
  customerEmail?: string;
  customerName?: string;
}

// Main worker
new Worker(
  'provision',
  async (job: Job<ProvisionJobData>) => {
    const { domain, uploadKey, customerEmail, customerName } = job.data;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 NEW DEPLOYMENT REQUEST`);
    console.log(`📝 Requested domain: ${domain}`);
    console.log(`👤 Customer: ${customerName} (${customerEmail})`);
    console.log(`📦 Upload key: ${uploadKey}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      // Step 1: Download ZIP from Supabase
      console.log(`[1/4] Downloading files from Supabase...`);
      const zipPath = await downloadZip(uploadKey);
      await job.updateProgress(25);

      // Step 2: Extract ZIP
      console.log(`\n[2/4] Extracting files...`);
      const extractPath = extractZip(zipPath);
      await job.updateProgress(40);

      // Step 3: Deploy to Cloudflare Pages
      console.log(`\n[3/4] Deploying to Cloudflare Pages...`);
      const pagesUrl = await deployToCloudflarePages(extractPath, domain);
      await job.updateProgress(80);

      // Step 4: Notify admin via email
      console.log(`\n[4/4] Sending notification...`);
      await notifyAdmin(
        domain,
        pagesUrl,
        customerEmail || 'no-email@example.com',
        customerName || 'Unknown User',
        uploadKey
      );
      await job.updateProgress(100);

      // Cleanup
      try {
        fs.rmSync(zipPath);
        fs.rmSync(extractPath, { recursive: true });
        console.log(`🧹 Cleaned up temp files`);
      } catch (e) {
        console.log('⚠️ Cleanup failed (non-critical)');
      }

      console.log(`\n${'='.repeat(60)}`);
      console.log(`✅ DEPLOYMENT COMPLETE!`);
      console.log(`🌐 Live at: https://${pagesUrl}`);
      console.log(`📝 Requested: ${domain}`);
      console.log(`⏰ Awaiting manual DNS connection...`);
      console.log(`${'='.repeat(60)}\n`);

      return {
        status: 'deployed',
        liveUrl: `https://${pagesUrl}`,
        requestedDomain: domain,
        manualDNSRequired: true
      };
      
    } catch (error: any) {
      console.error(`\n${'='.repeat(60)}`);
      console.error(`❌ DEPLOYMENT FAILED!`);
      console.error(`Error: ${error.message}`);
      console.error(`${'='.repeat(60)}\n`);
      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
      ...(process.env.REDIS_TLS === 'true' && {
        tls: {
          rejectUnauthorized: false
        }
      }),
    },
    concurrency: 2,
  }
);

console.log('👷 Worker started!');
console.log('🚀 Ready to deploy sites to Cloudflare Pages');
console.log('📢 You will be notified when DNS setup is needed\n');