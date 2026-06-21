# MUTHUR OS Terminal - Makefile

.PHONY: help install install-interactive update quick-upgrade uninstall build dev clean test verify version

help:
	@echo "MUTHUR OS Terminal - Available Commands"
	@echo ""
	@echo "  make install    - Install MUTHUR"
	@echo "  make update     - Update to latest version"
	@echo "  make uninstall  - Remove MUTHUR"
	@echo "  make build      - Build production binary"
	@echo "  make dev        - Run in development mode"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make test       - Run test suite"
	@echo "  make verify     - Verify setup"
	@echo "  make version    - Check version"
	@echo ""

install:
	@chmod +x scripts/install-auto.sh
	@./scripts/install-auto.sh

install-interactive:
	@chmod +x scripts/install.sh
	@./scripts/install.sh

update:
	@chmod +x scripts/upgrade.sh
	@./scripts/upgrade.sh

quick-upgrade:
	@chmod +x scripts/quick-upgrade.sh
	@./scripts/quick-upgrade.sh

uninstall:
	@chmod +x scripts/uninstall.sh
	@./scripts/uninstall.sh

build:
	@chmod +x scripts/build.sh
	@./scripts/build.sh

dev:
	@npm run tauri dev

clean:
	@echo "Cleaning build artifacts..."
	@rm -rf dist/ dist-ssr/ target/ node_modules/.vite/
	@echo "[OK] Clean complete"

test:
	@chmod +x scripts/test.sh
	@./scripts/test.sh

verify:
	@chmod +x scripts/verify-setup.sh
	@./scripts/verify-setup.sh

version:
	@chmod +x scripts/check-version.sh
	@./scripts/check-version.sh
