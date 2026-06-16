#!/bin/bash
# Run this on your Hostinger VPS to install and start the bot

set -e

echo "=== Social Media Analyzer Bot Setup ==="

BOT_DIR=$(pwd)
BOT_USER=$(whoami)
VENV="$BOT_DIR/venv"

# Create virtual environment if needed
if [ ! -d "$VENV" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv "$VENV"
fi

# Install Python deps inside venv
echo "Installing dependencies..."
"$VENV/bin/pip" install -r requirements.txt -q

# Check .env exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "!! Edit .env with your tokens before continuing:"
    echo "   nano .env"
    echo ""
    echo "Then re-run this script."
    exit 1
fi

# Install systemd service
cat > /tmp/analyzesome.service <<EOF
[Unit]
Description=AnalyzeSoMe Telegram Bot
After=network.target

[Service]
Type=simple
User=$BOT_USER
WorkingDirectory=$BOT_DIR
EnvironmentFile=$BOT_DIR/.env
ExecStart=$VENV/bin/python $BOT_DIR/bot.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

mv /tmp/analyzesome.service /etc/systemd/system/analyzesome.service
systemctl daemon-reload
systemctl enable analyzesome
systemctl start analyzesome

echo ""
echo "=== Done! Bot is running ==="
echo ""
echo "Useful commands:"
echo "  systemctl status analyzesome   # check status"
echo "  journalctl -u analyzesome -f   # live logs"
echo "  systemctl restart analyzesome  # restart bot"
