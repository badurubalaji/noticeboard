#!/usr/bin/env bash
# One-click setup for NoticeBoard on macOS / Linux.
#
#   ./setup.sh                # full setup + start
#   ./setup.sh --reset        # wipe local DB
#   ./setup.sh --no-seed      # skip demo
#   ./setup.sh --no-start     # configure but don't start
#
# This thin wrapper ensures Node.js 18+ is installed, then hands off to
# setup.js (which does the real work, cross-platform).

set -euo pipefail

cd "$(dirname "$0")"

bold()   { printf "\033[1m%s\033[0m\n" "$1"; }
ok()     { printf "  \033[32m✔\033[0m %s\n" "$1"; }
warn()   { printf "  \033[33m!\033[0m %s\n" "$1"; }
err()    { printf "  \033[31m✕\033[0m %s\n" "$1" >&2; }
step()   { printf "\n\033[36m▸ %s\033[0m\n" "$1"; }

bold "NoticeBoard — one-click setup (macOS / Linux)"

# ---------- Ensure Node 18+ ----------
step "Checking Node.js"
need_install=0
if ! command -v node >/dev/null; then
  warn "Node.js is not installed."
  need_install=1
else
  major=$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)
  if [ "$major" -lt 18 ]; then
    warn "Node $(node -v) is too old (need 18+)."
    need_install=1
  else
    ok "Node $(node -v)"
  fi
fi

install_node() {
  echo
  bold "Installing Node.js automatically…"
  case "$(uname -s)" in
    Darwin)
      if command -v brew >/dev/null; then
        brew install node
      else
        err "Homebrew is not installed. Install it from https://brew.sh and re-run, or"
        err "install Node manually from https://nodejs.org/en/download/"
        exit 1
      fi ;;
    Linux)
      if command -v apt-get >/dev/null; then
        echo "  Using NodeSource setup script (sudo required)…"
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
      elif command -v dnf >/dev/null; then
        sudo dnf install -y nodejs npm
      elif command -v pacman >/dev/null; then
        sudo pacman -Sy --noconfirm nodejs npm
      elif command -v zypper >/dev/null; then
        sudo zypper install -y nodejs npm
      else
        err "Could not detect a supported package manager (apt/dnf/pacman/zypper)."
        err "Install Node 18+ manually from https://nodejs.org and re-run."
        exit 1
      fi ;;
    *)
      err "Unknown OS. Install Node 18+ manually from https://nodejs.org and re-run."
      exit 1 ;;
  esac
  ok "Node installed: $(node -v)"
}

if [ "$need_install" -eq 1 ]; then
  read -r -p "Install Node.js now? [y/N] " ans
  case "$ans" in
    y|Y|yes|YES) install_node ;;
    *) err "Aborted. Install Node 18+ from https://nodejs.org and re-run."; exit 1 ;;
  esac
fi

# ---------- Hand off to setup.js ----------
exec node setup.js "$@"
