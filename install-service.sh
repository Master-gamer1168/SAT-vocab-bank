#!/usr/bin/env bash
set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVICE_FILE="$REPO_DIR/sat-vocab.service"
UNIT_PATH="/etc/systemd/system/sat-vocab.service"

# 1. Patch the service file with the actual repo path and node binary
NODE_BIN="$(which node)"
sed "s|/home/user/SAT-vocab-bank|$REPO_DIR|g; s|/usr/bin/node|$NODE_BIN|g" \
  "$SERVICE_FILE" > /tmp/sat-vocab.service

# 2. Install
sudo cp /tmp/sat-vocab.service "$UNIT_PATH"
sudo systemctl daemon-reload
sudo systemctl enable sat-vocab
sudo systemctl restart sat-vocab

echo ""
echo "✓ Service installed and started."
echo "  Open: http://localhost:3001"
echo ""
echo "Useful commands:"
echo "  sudo systemctl status sat-vocab   # check status"
echo "  sudo systemctl restart sat-vocab  # restart"
echo "  sudo journalctl -u sat-vocab -f   # view logs"
