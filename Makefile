SHELL := /bin/bash

JSON_FILES := $(shell find . -path ./.git -prune -o -path ./node_modules -prune -o -name '*.json' -print | sort)
YAML_FILES := $(shell find . -path ./.git -prune -o -path ./node_modules -prune -o \( -name '*.yml' -o -name '*.yaml' \) -print | sort)
SHELL_FILES := $(shell find package-templates/scripts -type f -name '*.sh' -print | sort)

.PHONY: validate validate-json validate-yaml validate-shell validate-structure validate-sage

validate: validate-json validate-yaml validate-shell validate-structure validate-sage
	@echo "validate: PASS"

validate-json:
	@if [ -n "$(JSON_FILES)" ]; then \
		for file in $(JSON_FILES); do \
			python3 -m json.tool "$$file" >/dev/null; \
		done; \
	fi
	@echo "validate-json: PASS"

validate-yaml:
	@if [ -n "$(YAML_FILES)" ]; then \
		if command -v ruby >/dev/null 2>&1; then \
			ruby -e 'require "yaml"; ARGV.each { |file| YAML.load_file(file) }' $(YAML_FILES); \
			echo "validate-yaml: PASS"; \
		else \
			echo "validate-yaml: SKIPPED (ruby not found)"; \
		fi; \
	fi

validate-shell:
	@if [ -n "$(SHELL_FILES)" ]; then \
		for file in $(SHELL_FILES); do \
			bash -n "$$file"; \
		done; \
	fi
	@echo "validate-shell: PASS"

validate-structure:
	@test -f README.md
	@test -f README-ja.md
	@test -f package-templates/ci-examples/github-actions/ai-check.yml
	@test -f package-templates/ci-examples/github-actions/ai-check-fast.yml
	@test -f package-templates/ci-examples/github-actions/ai-quality-reusable.yml
	@test -f package-templates/ci-examples/github-actions/ai-quality-call.yml
	@grep -q "workflow_call" package-templates/ci-examples/github-actions/ai-quality-reusable.yml
	@grep -q "uses: ./.github/workflows/ai-quality-reusable.yml" package-templates/ci-examples/github-actions/ai-quality-call.yml
	@echo "validate-structure: PASS"

validate-sage:
	@if [ -x scripts/sage-validate.sh ]; then \
		bash scripts/sage-validate.sh; \
	else \
		echo "validate-sage: SKIPPED (scripts/sage-validate.sh not found)"; \
	fi
