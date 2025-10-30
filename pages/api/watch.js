import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import os from "os";

export default async function handler(req, res) {
  const { anime_id, episode } = req.query;

  if (!anime_id || !episode) {
    return res.status(400).json({ error: "Missing anime_id or episode" });
  }

  const targetUrl = `https://www.miruro.to/watch?id=${anime_id}&ep=${episode}`;
  console.log(`[INFO] Fetching video for Anime ${anime_id}, Episode ${episode}`);

  let browser;
  try {
    // ✅ Determine Chrome executable path (local or Vercel)
    const execPath =
      os.platform() === "win32"
        ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        : await chromium.executablePath();

    console.log(`[INFO] Using Chrome path: ${execPath}`);

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: execPath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
      timeout: 0,
    });

    const page = await browser.newPage();

    // ✅ Add user-agent to bypass bot detection
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/121.0.0.0 Safari/537.36"
    );

    console.log(`[ACTION] Navigating to ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

    let foundLink = null;
    const maxPresses = 25;

    // ✅ Function for delay
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let i = 0; i < maxPresses; i++) {
      console.log(`[ACTION] Pressing "K" (${i + 1}/${maxPresses})`);
      await page.keyboard.press("k");
      await wait(1200);

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
      console.log("[FAIL] No video link found after 25 key presses.");
      return res.status(404).json({
        status: "error",
        message: "No video link found after 25 attempts.",
      });
    }
  } catch (error) {
    console.error("[ERROR] Watch handler failed:", error);
    if (browser) await browser.close();
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}
