#!/bin/bash
# Run this on your Hostinger VPS to install and start the bot

set -e

echo "=== Social Media Analyzer Bot Setup ==="

# Install Python deps
echo "Installing dependencies..."
pip3 install -r requirements.txt -q

# Create .env if it doesn't exist
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
BOT_DIR=$(pwd)
BOT_USER=$(whoami)

cat > /tmp/analyzesome.service <<EOF
[Unit]
Description=AnalyzeSoMe Telegram Bot
After=network.target

[Service]
Type=simple
User=$BOT_USER
WorkingDirectory=$BOT_DIR
EnvironmentFile=$BOT_DIR/.env
ExecStart=/usr/bin/python3 $BOT_DIR/bot.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/analyzesome.service /etc/systemd/system/analyzesome.service
sudo systemctl daemon-reload
sudo systemctl enable analyzesome
sudo systemctl start analyzesome

echo ""
echo "=== Done! Bot is running ==="
echo ""
echo "Useful commands:"
echo "  sudo systemctl status analyzesome   # check status"
echo "  sudo journalctl -u analyzesome -f   # live logs"
echo "  sudo systemctl restart analyzesome  # restart bot"
