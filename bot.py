import os
import re
import logging
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, MessageHandler, filters, ContextTypes
from apify_client import ApifyClient
import anthropic

load_dotenv()

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

TELEGRAM_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
APIFY_TOKEN = os.environ["APIFY_TOKEN"]

apify = ApifyClient(APIFY_TOKEN)
claude = anthropic.Anthropic()

TRIGGER = re.compile(r"analyze\s+this\s+(.+)", re.IGNORECASE)

ACTORS = {
    "instagram": "apify/instagram-profile-scraper",
    "tiktok": "clockworks/free-tiktok-scraper",
    "youtube": "streamers/youtube-scraper",
    "twitter": "quacker/twitter-scraper",
}


def detect_platform(text: str) -> str:
    t = text.lower()
    if "tiktok.com" in t:
        return "tiktok"
    if "youtube.com" in t or "youtu.be" in t:
        return "youtube"
    if "twitter.com" in t or "x.com" in t:
        return "twitter"
    return "instagram"


def extract_handle(text: str) -> str:
    url_match = re.search(r"(?:instagram|tiktok|twitter|x|youtube)\.com/(?:@)?([^/?&\s]+)", text)
    if url_match:
        return url_match.group(1).lstrip("@")
    handle_match = re.search(r"@([\w.]+)", text)
    if handle_match:
        return handle_match.group(1)
    return text.strip().lstrip("@")


def scrape_instagram(handle: str) -> dict:
    run = apify.actor("apify/instagram-profile-scraper").call(
        run_input={"usernames": [handle], "resultsLimit": 20}
    )
    items = list(apify.dataset(run["defaultDatasetId"]).iterate_items())
    return items[0] if items else {}


def scrape_tiktok(handle: str) -> dict:
    run = apify.actor("clockworks/free-tiktok-scraper").call(
        run_input={"profiles": [handle], "resultsPerPage": 20}
    )
    items = list(apify.dataset(run["defaultDatasetId"]).iterate_items())
    return items[0] if items else {}


def analyze_with_claude(platform: str, handle: str, data: dict) -> str:
    prompt = f"""You are a social media analyst. Analyze this {platform} profile data for @{handle} and provide:
1. Key stats (followers, engagement rate, posting frequency)
2. Content themes and strengths
3. Top-performing content types
4. 2-3 actionable insights

Keep it concise and punchy — this goes in a Telegram message.

Raw data:
{str(data)[:4000]}"""

    message = claude.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=800,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = update.message.text or ""
    match = TRIGGER.search(text)
    if not match:
        return

    profile_input = match.group(1).strip()
    platform = detect_platform(profile_input)
    handle = extract_handle(profile_input)

    await update.message.reply_text(f"Analyzing {platform} profile @{handle}... give me a sec ⏳")

    try:
        if platform == "instagram":
            data = scrape_instagram(handle)
        elif platform == "tiktok":
            data = scrape_tiktok(handle)
        else:
            await update.message.reply_text(
                f"Only Instagram and TikTok supported right now. More platforms coming soon!"
            )
            return

        if not data:
            await update.message.reply_text(f"Couldn't find profile @{handle}. Check the handle and try again.")
            return

        analysis = analyze_with_claude(platform, handle, data)
        await update.message.reply_text(f"📊 *@{handle} on {platform.capitalize()}*\n\n{analysis}", parse_mode="Markdown")

    except Exception as e:
        logger.error(f"Error analyzing @{handle}: {e}")
        await update.message.reply_text(f"Something went wrong analyzing @{handle}. Try again in a moment.")


def main() -> None:
    app = Application.builder().token(TELEGRAM_TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    logger.info("Bot is running...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
