SHELL := /bin/bash

JSON_FILES := $(shell find . \( -path ./.git -o -path '*/node_modules' -o -path '*/.next' \) -prune -o -name '*.json' -print | sort)
YAML_FILES := $(shell find . \( -path ./.git -o -path '*/node_modules' -o -path '*/.next' \) -prune -o \( -name '*.yml' -o -name '*.yaml' \) -print | sort)
SHELL_FILES := $(shell find package-templates/scripts -type f -name '*.sh' -print | sort)

.PHONY: validate validate-json validate-yaml validate-shell validate-structure validate-sage

validate: validate-json validate-yaml validate-shell validate-structure validate-sage
	@echo "validate: PASS"

validate-json:
	@if [ -n "$(JSON_FILES)" ]; then \
		set -e; \
		for file in $(JSON_FILES); do \
			python3 -m json.tool "$$file" >/dev/null; \
		done; \
	fi
	@echo "validate-json: PASS"

validate-yaml:
	@if [ -n "$(YAML_FILES)" ]; then \
		if command -v ruby >/dev/null 2>&1; then \
			ruby -e 'require "yaml"; ARGV.each { |file| YAML.load_file(file) }' $(YAML_FILES) && \
				echo "validate-yaml: PASS"; \
		else \
			echo "validate-yaml: SKIPPED (ruby not found)"; \
		fi; \
	fi

validate-shell:
	@if [ -n "$(SHELL_FILES)" ]; then \
		set -e; \
		for file in $(SHELL_FILES); do \
			bash -n "$$file"; \
		done; \
	fi
	@echo "validate-shell: PASS"

validate-structure:
	@test -f README.md
	@test -f README-ja.md
	@test -f examples/nextjs-basic/package.json
	@test -f examples/nextjs-basic/tsconfig.json
	@test -f examples/nextjs-basic/app/page.tsx
	@test -f examples/nextjs-basic/app/api/users/[id]/route.ts
	@test -f examples/nextjs-basic/app/users/[id]/page.tsx
	@test -f examples/nextjs-basic/lib/users.ts
	@test -f examples/nextjs-basic/tests/users.test.ts
	@test -f examples/nextjs-basic/docs/before.md
	@test -f examples/nextjs-basic/docs/after.md
	@grep -q '"ai:check"' examples/nextjs-basic/package.json
	@grep -q '"ai:check:fast"' examples/nextjs-basic/package.json
	@grep -q '"strict": true' examples/nextjs-basic/tsconfig.json
	@test -f package-templates/docs/test-design-template.md
	@test -f package-templates/prompts/diagnostic-repair.md
	@grep -q "^## Requirement" package-templates/docs/test-design-template.md
	@grep -q "^## Acceptance Criteria" package-templates/docs/test-design-template.md
	@grep -q "^## Test Matrix" package-templates/docs/test-design-template.md
	@grep -q "^## Given-When-Then" package-templates/docs/test-design-template.md
	@grep -q "^## Verification Commands" package-templates/docs/test-design-template.md
	@grep -q "^## Risks and Gaps" package-templates/docs/test-design-template.md
	@grep -q "Do Not Change Acceptance Criteria" package-templates/prompts/diagnostic-repair.md
	@grep -q "^## Repair Plan" package-templates/prompts/diagnostic-repair.md
	@grep -q "^## Patch Rules" package-templates/prompts/diagnostic-repair.md
	@grep -q "^## Re-check Commands" package-templates/prompts/diagnostic-repair.md
	@grep -q "diagnostic-repair.md" package-templates/prompts/README.md
	@grep -q "test-design-template.md" package-templates/README.md
	@grep -q "test-design-template.md" README.md
	@grep -q "diagnostic-repair.md" README.md
	@grep -q "test-design-template.md" README-ja.md
	@grep -q "diagnostic-repair.md" README-ja.md
	@grep -q "test-design-template.md" docs/roadmap.md
	@grep -q "diagnostic-repair.md" docs/roadmap.md
	@lines=$$(wc -l < package-templates/docs/test-design-template.md); test "$$lines" -ge 120 -a "$$lines" -le 350
	@lines=$$(wc -l < package-templates/prompts/diagnostic-repair.md); test "$$lines" -ge 80 -a "$$lines" -le 250
	@test -f docs/phase-1-initial-dogfooding-report.md
	@grep -q "^## Anonymization" docs/phase-1-initial-dogfooding-report.md
	@grep -q "^## Scope" docs/phase-1-initial-dogfooding-report.md
	@grep -q "^## Methodology" docs/phase-1-initial-dogfooding-report.md
	@grep -q "^## Evidence" docs/phase-1-initial-dogfooding-report.md
	@grep -q "^## Findings" docs/phase-1-initial-dogfooding-report.md
	@grep -q "^## Limitations" docs/phase-1-initial-dogfooding-report.md
	@grep -q "^## Next Actions" docs/phase-1-initial-dogfooding-report.md
	@grep -q "project-template-repo" docs/phase-1-initial-dogfooding-report.md
	@grep -q "project-nextjs-example" docs/phase-1-initial-dogfooding-report.md
	@test "$$(grep -c '^### DF-' docs/phase-1-initial-dogfooding-report.md)" -ge 3
	@grep -q "not external production project data" docs/phase-1-initial-dogfooding-report.md
	@grep -q "not Phase 2 graduation evidence" docs/phase-1-initial-dogfooding-report.md
	@grep -q "phase-1-initial-dogfooding-report.md" README.md
	@grep -q "phase-1-initial-dogfooding-report.md" README-ja.md
	@grep -q "phase-1-initial-dogfooding-report.md" docs/roadmap.md
	@grep -q "phase-1-initial-dogfooding-report.md" docs/phase-1-dogfooding-protocol.md
	@lines=$$(wc -l < docs/phase-1-initial-dogfooding-report.md); test "$$lines" -ge 90 -a "$$lines" -le 260
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
