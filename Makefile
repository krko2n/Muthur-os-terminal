# MUTHUR OS Terminal - Makefile

.PHONY: help install upgrade uninstall build dev clean test verify

help:
	@echo "MUTHUR OS Terminal - Available Commands"
	@echo ""
	@echo "  make install    - Install MUTHUR"
	@echo "  make upgrade    - Upgrade to latest version"
	@echo "  make uninstall  - Remove MUTHUR"
	@echo "  make build      - Build production binary"
	@echo "  make dev        - Run in development mode"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make test       - Run test suite"
	@echo "  make verify     - Verify setup"
	@echo ""

install:
	@chmod +x install.sh
	@./install.sh

upgrade:
	@chmod +x upgrade.sh
	@./upgrade.sh

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
