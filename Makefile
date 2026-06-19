# MUTHUR OS Terminal - Makefile

.PHONY: help install update uninstall build dev clean test verify version

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
	@chmod +x install-auto.sh
	@./install-auto.sh

install-interactive:
	@chmod +x install.sh
	@./install.sh

update:
	@chmod +x upgrade.sh
	@./upgrade.sh

quick-upgrade:
	@chmod +x quick-upgrade.sh
	@./quick-upgrade.sh

uninstall:
	@chmod +x uninstall.sh
	@./uninstall.sh

build:
	@chmod +x build.sh
	@./build.sh

dev:
	@npm run tauri dev

clean:
	@echo "Cleaning build artifacts..."
	@rm -rf dist/ dist-ssr/ target/ node_modules/.vite/
	@echo "[OK] Clean complete"

test:
	@chmod +x test.sh
	@./test.sh

verify:
	@chmod +x verify-setup.sh
	@./verify-setup.sh

version:
	@chmod +x check-version.sh
	@./check-version.sh
