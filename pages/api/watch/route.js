import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import os from "os";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const anime_id = searchParams.get("anime_id");
    const episode = searchParams.get("episode");

    if (!anime_id || !episode) {
      return new Response(
        JSON.stringify({ status: "error", message: "Missing anime_id or episode" }),
        { status: 400 }
      );
    }

    const targetUrl = `https://www.miruro.to/watch?id=${anime_id}&ep=${episode}`;
    console.log(`[INFO] Fetching video for Anime ${anime_id}, Episode ${episode}`);

    // ✅ Configure correct executablePath depending on environment
    const execPath =
      os.platform() === "win32"
        ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        : await chromium.executablePath();

    console.log(`[INFO] Using Chrome at: ${execPath}`);

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: execPath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/121.0.0.0 Safari/537.36"
    );

    console.log(`[ACTION] Navigating to ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

    let foundLink = null;
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let i = 0; i < 25; i++) {
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

    if (!foundLink) {
      return new Response(
        JSON.stringify({ status: "error", message: "No video link found" }),
        { status: 404 }
      );
    }

    console.log(`[SUCCESS] Found video: ${foundLink}`);
    return new Response(JSON.stringify({ status: "ok", watch_url: foundLink }), {
      status: 200,
    });
  } catch (error) {
    console.error("[ERROR] Watch handler failed:", error);
    return new Response(
      JSON.stringify({ status: "error", message: error.message }),
      { status: 500 }
    );
  }
}
