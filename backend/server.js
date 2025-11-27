import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// serve static front-end
app.use(express.static(path.join(__dirname, "public")));

// === BUILD SITE ROUTE ===
app.post("/api/build-site", async (req, res) => {
  const { userPrompt, userId = "default_user" } = req.body;
  if (!userPrompt) return res.status(400).json({ error: "Missing userPrompt" });

  try {
    console.log("💬 Sending build request to Claude…");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [
          {
            role: "system",
            content: `
You are Fowazz — the AI web designer for FawzSites.com.
Follow these stages:
1. Plan logical subpages based on the user description.
2. Generate compact HTML pages with inline CSS (black/orange theme, neon green #21f36b).
3. Output JSON only, exactly in this structure:
{
  "site_map": ["index.html", "about.html"],
  "pages": {
    "index.html": "<!doctype html>…</html>",
    "about.html": "<!doctype html>…</html>"
  }
}
No commentary outside JSON.
            `
          },
          { role: "user", content: userPrompt }
        ]
      })
    });

    const data = await response.json();
    const raw = data?.content?.[0]?.text || "";
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Claude did not return valid JSON");

    const siteData = JSON.parse(raw.slice(start, end + 1));

    // create user folder
    const userDir = path.join(__dirname, "sites", userId);
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

    // save each page
    for (const [filename, html] of Object.entries(siteData.pages)) {
      fs.writeFileSync(path.join(userDir, filename), html);
      console.log(`✅ Saved ${filename}`);
    }

    res.json({
      message: "Site built successfully!",
      site_map: siteData.site_map,
      preview_url: `/sites/${userId}/index.html`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Build failed", details: err.message });
  }
});

// serve generated sites
app.use("/sites", express.static(path.join(__dirname, "sites")));

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`🌍 Fowazz server running at http://localhost:${port}`));
