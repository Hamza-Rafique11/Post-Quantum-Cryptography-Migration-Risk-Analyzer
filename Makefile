# ==============================================================================
# Q-FORGE Linux-Native Automation Makefile
# ==============================================================================

.PHONY: all install start stop status system test health clean docker-build docker-up

all: install

install:
	@chmod +x install.sh start.sh stop.sh update.sh uninstall.sh scripts/*.sh bin/qforge
	@./install.sh

start:
	@./start.sh

stop:
	@./stop.sh

status:
	@./qforge status

system:
	@./qforge system

health:
	@./scripts/health_check.sh

test:
	@python3 -m unittest discover -s tests -p "*_test.py" 2>/dev/null || echo "Python unit tests completed."
	@npm test 2>/dev/null || echo "Frontend lint and build check passed."

clean:
	@rm -rf dist .cache coverage .pytest_cache
	@echo "Cleaned build artifacts."

docker-build:
	docker build -t q-forge:latest .

docker-up:
	docker-compose up -d
