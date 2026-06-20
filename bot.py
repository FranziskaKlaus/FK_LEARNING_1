import os
import re
import logging
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, MessageHandler, CommandHandler, filters, ContextTypes
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

# Triggers on "analyze ..." with or without the word "this"
TRIGGER = re.compile(r"analyz\w*\s+(?:this\s+)?(.+)", re.IGNORECASE | re.DOTALL)

# URL of a specific post/reel/video (not a profile)
POST_URL = re.compile(
    r"(instagram\.com/(?:p|reel|reels|tv)/|tiktok\.com/@[^/]+/video/|youtube\.com/watch|youtu\.be/)",
    re.IGNORECASE,
)


def detect_platform(text: str) -> str:
    t = text.lower()
    if "tiktok.com" in t:
        return "tiktok"
    if "youtube.com" in t or "youtu.be" in t:
        return "youtube"
    if "twitter.com" in t or "x.com" in t:
        return "twitter"
    return "instagram"


def is_post_url(text: str) -> bool:
    return bool(POST_URL.search(text))


def extract_handle(text: str) -> str:
    # Profile URL like instagram.com/username
    url_match = re.search(
        r"(?:instagram|tiktok|twitter|x|youtube)\.com/(?:@)?([^/?&\s]+)", text
    )
    if url_match:
        return url_match.group(1).lstrip("@")
    handle_match = re.search(r"@([\w.]+)", text)
    if handle_match:
        return handle_match.group(1)
    return text.strip().lstrip("@")


def first_url(text: str) -> str:
    m = re.search(r"https?://\S+", text)
    return m.group(0) if m else text.strip()


def _dataset_items(run) -> list:
    # apify-client >=3 returns a Run object; older versions returned a dict
    dataset_id = run.default_dataset_id if hasattr(run, "default_dataset_id") else run["defaultDatasetId"]
    return list(apify.dataset(dataset_id).iterate_items())


def scrape_instagram_profile(handle: str) -> dict:
    run = apify.actor("apify/instagram-profile-scraper").call(
        run_input={"usernames": [handle]}
    )
    items = _dataset_items(run)
    return items[0] if items else {}


def scrape_instagram_post(url: str) -> dict:
    run = apify.actor("apify/instagram-scraper").call(
        run_input={"directUrls": [url], "resultsType": "posts", "resultsLimit": 1}
    )
    items = _dataset_items(run)
    return items[0] if items else {}


def scrape_tiktok_profile(handle: str) -> dict:
    run = apify.actor("clockworks/free-tiktok-scraper").call(
        run_input={"profiles": [handle], "resultsPerPage": 20}
    )
    items = _dataset_items(run)
    return items[0] if items else {}


def scrape_tiktok_post(url: str) -> dict:
    run = apify.actor("clockworks/free-tiktok-scraper").call(
        run_input={"postURLs": [url], "resultsPerPage": 1}
    )
    items = _dataset_items(run)
    return items[0] if items else {}


def analyze_with_claude(platform: str, label: str, kind: str, data: dict) -> str:
    if kind == "post":
        focus = """1. What the post/reel is about
2. Engagement (likes, comments, views) and how it compares to typical performance
3. Why it works (hook, format, topic, timing)
4. 2-3 actionable takeaways to replicate this success"""
    else:
        focus = """1. Key stats (followers, engagement rate, posting frequency)
2. Content themes and strengths
3. Top-performing content types
4. 2-3 actionable insights"""

    prompt = f"""You are a social media analyst. Analyze this {platform} {kind} ({label}) and provide:
{focus}

Keep it concise and punchy — this goes in a Telegram message.

Raw data:
{str(data)[:5000]}"""

    message = claude.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=800,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "👋 Hi! I analyze social media profiles and posts.\n\n"
        "Just send me:\n"
        "• `Analyze @username` — to analyze a profile\n"
        "• `Analyze <link>` — to analyze a specific post or reel\n\n"
        "Works with Instagram and TikTok.",
        parse_mode="Markdown",
    )


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = update.message.text or ""
    match = TRIGGER.search(text)
    if not match:
        return

    target = match.group(1).strip()
    platform = detect_platform(target)
    post = is_post_url(target)
    kind = "post" if post else "profile"

    label = first_url(target) if post else "@" + extract_handle(target)
    await update.message.reply_text(f"Analyzing {platform} {kind} ({label})... give me a sec ⏳")

    try:
        if platform == "instagram":
            data = scrape_instagram_post(first_url(target)) if post else scrape_instagram_profile(extract_handle(target))
        elif platform == "tiktok":
            data = scrape_tiktok_post(first_url(target)) if post else scrape_tiktok_profile(extract_handle(target))
        else:
            await update.message.reply_text(
                "Only Instagram and TikTok are supported right now. More platforms coming soon!"
            )
            return

        if not data:
            await update.message.reply_text(
                f"Couldn't find that {kind}. Double-check the link/handle and try again."
            )
            return

        analysis = analyze_with_claude(platform, label, kind, data)
        await update.message.reply_text(
            f"📊 *{label} on {platform.capitalize()}*\n\n{analysis}", parse_mode="Markdown"
        )

    except Exception as e:
        logger.error(f"Error analyzing {label}: {e}")
        await update.message.reply_text(
            f"Something went wrong analyzing {label}. Try again in a moment."
        )


def main() -> None:
    app = Application.builder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    logger.info("Bot is running...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
