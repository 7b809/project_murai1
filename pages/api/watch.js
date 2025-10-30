import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import os from "os";

export default async function handler(req, res) {
  const { anime_id, episode } = req.query;
  if (!anime_id || !episode)
    return res.status(400).json({ error: "Missing anime_id or episode" });

  const targetUrl = `https://www.miruro.to/watch?id=${anime_id}&ep=${episode}`;
  console.log(`[INFO] Fetching video for Anime ${anime_id}, Episode ${episode}`);

  let browser;

  try {
    // Determine Chrome path
    let execPath;
    if (os.platform() === "win32") {
      execPath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    } else {
      execPath = await chromium.executablePath();
    }

    console.log(`[INFO] Using Chrome path: ${execPath}`);

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: execPath,
      headless: true,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

    let foundLink = null;
    const maxPresses = 25;

    for (let i = 0; i < maxPresses; i++) {
      console.log(`[ACTION] Pressing "K" (${i + 1}/${maxPresses})`);
      await page.keyboard.press("k");
      await new Promise((r) => setTimeout(r, 1200)); // ✅ Compatible delay

      const html = await page.content();
      const m3u8Match = html.match(/https?:\/\/[^\s"']+\.m3u8/);
      const mp4Match = html.match(/https?:\/\/[^\s"']+\.mp4/);

      if (m3u8Match || mp4Match) {
        foundLink = mp4Match ? mp4Match[0] : m3u8Match[0];
        break;
      }
    }

    await browser.close();

    if (foundLink) {
      console.log(`[SUCCESS] Found video link: ${foundLink}`);
      return res.json({ status: "ok", watch_url: foundLink });
    } else {
      console.log("[FAIL] No video found after all attempts.");
      return res.json({ status: "error", message: "No video link found after 25 tries." });
    }
  } catch (error) {
    console.error("[ERROR]", error);
    if (browser) await browser.close();
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}
