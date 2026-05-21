#!/usr/bin/env bash
# Minimal EC2 bootstrap for a Docker Compose deployment of Roomie.kz.
# Target: Ubuntu 24.04 LTS (or similar).
# Run once on the server with: sudo bash setup-ec2.sh

set -euo pipefail

log() { printf '\033[1;32m[+]\033[0m %s\n' "$*"; }
die() { printf '\033[1;31m[x]\033[0m %s\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run as root (use sudo)."

log "Waiting for apt/dpkg to become available..."
while pgrep -x apt >/dev/null || pgrep -x apt-get >/dev/null || pgrep -x dpkg >/dev/null; do
  sleep 3
done

log "Updating package lists..."
apt-get update -y

log "Upgrading installed packages..."
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

log "Installing prerequisites..."
apt-get install -y ca-certificates curl gnupg

log "Installing Docker Engine..."
install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.asc ]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
fi

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -y
apt-get install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin

systemctl enable --now docker

log "Adding 'ubuntu' user to the docker group..."
usermod -aG docker ubuntu

log "Creating /opt/roomie-kz..."
install -d -m 0755 -o ubuntu -g ubuntu /opt/roomie-kz

log "Verifying Docker install..."
docker --version
docker compose version

log ""
log "Bootstrap complete."
log "Reconnect so the 'ubuntu' user picks up docker-group access."
log "Then copy your .env file to /opt/roomie-kz/.env and push to main."
