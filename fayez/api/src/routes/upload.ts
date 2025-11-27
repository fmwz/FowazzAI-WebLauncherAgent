import dotenv from 'dotenv';
dotenv.config();
import { Router } from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

const router = Router();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!req.file.originalname.endsWith('.zip')) {
      return res.status(400).json({ error: 'Please upload a .zip file' });
    }

    const uploadId = crypto.randomUUID();
    const filename = `${uploadId}.zip`;

    console.log(`📦 Uploading ${req.file.originalname} (${req.file.size} bytes)...`);

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .upload(filename, req.file.buffer, {
        contentType: 'application/zip',
        upsert: false
      });

    if (error) {
      console.error('❌ Upload error:', error);
      return res.status(500).json({ error: 'Upload failed', details: error.message });
    }

    console.log(`✅ Upload complete: ${data.path}`);

    res.json({ 
      uploadId, 
      key: data.path,
      size: req.file.size,
      filename: req.file.originalname
    });
  } catch (e: any) {
    console.error('❌ Upload error:', e);
    res.status(500).json({ error: 'Upload failed', details: e.message });
  }
});

export default router;