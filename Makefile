SHELL := /bin/bash

JSON_FILES := $(shell find . \( -path ./.git -o -path '*/node_modules' -o -path '*/.next' \) -prune -o -name '*.json' -print | sort)
YAML_FILES := $(shell find . \( -path ./.git -o -path '*/node_modules' -o -path '*/.next' \) -prune -o \( -name '*.yml' -o -name '*.yaml' \) -print | sort)
SHELL_FILES := $(shell find package-templates/scripts -type f -name '*.sh' -print | sort)

.PHONY: validate validate-json validate-yaml validate-shell validate-structure validate-cli validate-npm-pack validate-npm-publish-dry-run validate-sage

validate: validate-json validate-yaml validate-shell validate-structure validate-cli validate-npm-pack validate-npm-publish-dry-run validate-sage
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
	@test -f README-en.md
	@test -f README-ja.md
	@grep -q "README-en.md" README.md
	@grep -q "README.md" README-en.md
	@grep -q "README.md" README-ja.md
	@grep -q "README-en.md" README-ja.md
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
	@test -f package-templates/scripts/ai-check-secure.sh
	@grep -q '"ai:check:secure"' package-templates/package.scripts.fragment.json
	@grep -q "semgrep scan --config auto" package-templates/package.scripts.fragment.json
	@grep -q "ai-check-secure.sh" package-templates/scripts/README.md
	@grep -q "ai:check:secure" src/cli/profile-scripts.mjs
	@grep -q "ai-check-secure.sh" src/cli/init.mjs
	@grep -q "ai-check-secure.sh" src/cli/doctor.mjs
	@grep -q "ai-check-secure.sh" src/cli/update.mjs
	@grep -q "ai:check:secure" docs/cli.md
	@grep -q "semgrep scan --config auto" docs/cli.md
	@grep -q "ai:check:secure" docs/usage-model.md
	@grep -q "ai-check-secure.sh" README.md
	@grep -q "ai-check-secure.sh" README-en.md
	@grep -q "React Doctor は RN 診断に対応" README.md
	@grep -q "React Doctor supported for RN diagnostics" README-en.md
	@grep -q "React Doctor.*React Native" package-templates/profiles/expo-rn/README.md
	@grep -q "React Doctor official README" package-templates/profiles/expo-rn/README.md
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
	@grep -q "test-design-template.md" README-en.md
	@grep -q "diagnostic-repair.md" README-en.md
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
	@grep -q "phase-1-initial-dogfooding-report.md" README-en.md
	@grep -q "phase-1-initial-dogfooding-report.md" docs/roadmap.md
	@grep -q "phase-1-initial-dogfooding-report.md" docs/phase-1-dogfooding-protocol.md
	@lines=$$(wc -l < docs/phase-1-initial-dogfooding-report.md); test "$$lines" -ge 90 -a "$$lines" -le 260
	@test -f docs/releases/v0.1.0.md
	@grep -q "^## Highlights" docs/releases/v0.1.0.md
	@grep -q "^## Included" docs/releases/v0.1.0.md
	@grep -q "^## Install" docs/releases/v0.1.0.md
	@grep -q "^## Verification" docs/releases/v0.1.0.md
	@grep -q "^## Limitations" docs/releases/v0.1.0.md
	@grep -q "^## Next" docs/releases/v0.1.0.md
	@grep -q "v0.2.0" docs/releases/v0.1.0.md
	@grep -q "docs/releases/v0.1.0.md" README.md
	@grep -q "docs/releases/v0.1.0.md" README-en.md
	@grep -q "releases/v0.1.0.md" docs/roadmap.md
	@grep -q "Released" docs/roadmap.md
	@grep -q "v0.1.0.*Released" package-templates/README.md
	@lines=$$(wc -l < docs/releases/v0.1.0.md); test "$$lines" -ge 80 -a "$$lines" -le 240
	@test -f package-templates/ci-examples/github-actions/ai-check.yml
	@test -f package-templates/ci-examples/github-actions/ai-check-fast.yml
	@test -f package-templates/ci-examples/github-actions/ai-quality-reusable.yml
	@test -f package-templates/ci-examples/github-actions/ai-quality-call.yml
	@grep -q "workflow_call" package-templates/ci-examples/github-actions/ai-quality-reusable.yml
	@grep -q "uses: ./.github/workflows/ai-quality-reusable.yml" package-templates/ci-examples/github-actions/ai-quality-call.yml
	@test -f .github/workflows/ai-quality.yml
	@grep -q "workflow_call" .github/workflows/ai-quality.yml
	@grep -q "permissions:" .github/workflows/ai-quality.yml
	@grep -q "contents: read" .github/workflows/ai-quality.yml
	@grep -q "package-manager" .github/workflows/ai-quality.yml
	@grep -q "check-command" .github/workflows/ai-quality.yml
	@test -f ai-quality/action.yml
	@grep -q "using: composite" ai-quality/action.yml
	@grep -q "package-manager" ai-quality/action.yml
	@grep -q "check-command" ai-quality/action.yml
	@grep -q "working-directory" ai-quality/action.yml
	@grep -q "upload-ai-check-artifacts" ai-quality/action.yml
	@test -f docs/github-actions.md
	@grep -q "Hosted reusable workflow" docs/github-actions.md
	@grep -q "Composite Action" docs/github-actions.md
	@grep -q "copy examples" docs/github-actions.md
	@grep -q "Marketplace" docs/github-actions.md
	@grep -q "docs/github-actions.md" README.md
	@grep -q "docs/github-actions.md" README-en.md
	@grep -q "./github-actions.md" docs/roadmap.md
	@grep -q "hosted reusable workflow" package-templates/ci-examples/README.md
	@grep -q "Composite Action" package-templates/ci-examples/README.md
	@test -f docs/releases/v0.3.0.md
	@grep -q "^## Highlights" docs/releases/v0.3.0.md
	@grep -q "^## Install" docs/releases/v0.3.0.md
	@grep -q "^## Verification" docs/releases/v0.3.0.md
	@grep -q "^## Limitations" docs/releases/v0.3.0.md
	@grep -q "^## Next" docs/releases/v0.3.0.md
	@grep -q "GitHub Actions integration" docs/releases/v0.3.0.md
	@grep -q "not an npm package release" docs/releases/v0.3.0.md
	@grep -q "v0.3.0.*Released" README.md
	@grep -q "v0.3.0.*Released" README-en.md
	@grep -q "Released on 2026-05-16" docs/roadmap.md
	@grep -q "docs/releases/v0.3.0.md" README.md
	@grep -q "docs/releases/v0.3.0.md" README-en.md
	@grep -q "releases/v0.3.0.md" docs/roadmap.md
	@grep -q "@v0.3.0" docs/github-actions.md
	@grep -q "future @v1" docs/github-actions.md
	@grep -q "Marketplace listing is planned" docs/github-actions.md
	@grep -q "v0.3.0.*Released" package-templates/ci-examples/README.md
	@test -f docs/releases/v0.4.0.md
	@grep -q "^## Highlights" docs/releases/v0.4.0.md
	@grep -q "^## Install" docs/releases/v0.4.0.md
	@grep -q "^## Verification" docs/releases/v0.4.0.md
	@grep -q "^## Publish" docs/releases/v0.4.0.md
	@grep -q "^## Limitations" docs/releases/v0.4.0.md
	@grep -q "^## Next" docs/releases/v0.4.0.md
	@grep -q "ai-check-template@0.4.0" docs/releases/v0.4.0.md
	@grep -q "release-ready" docs/releases/v0.4.0.md
	@grep -q "npm publish pending" docs/releases/v0.4.0.md
	@grep -q "ai-check-template run" docs/releases/v0.4.0.md
	@grep -q "ai-check-template expect" docs/releases/v0.4.0.md
	@grep -q "MultiEdit" docs/releases/v0.4.0.md
	@grep -q "first-look" docs/releases/v0.4.0.md
	@grep -q "v0.4.0.*Release-ready" README.md
	@grep -q "v0.4.0.*Release-ready" README-en.md
	@grep -q "v0.4.0.*Release-ready" package-templates/README.md
	@grep -q "releases/v0.4.0.md" docs/roadmap.md
	@grep -q 'package version is `0.4.0`' docs/roadmap.md
	@test -f package.json
	@grep -q '"version": "0.4.0"' package.json
	@grep -q '"ai-check-template": "bin/ai-check-template.mjs"' package.json
	@grep -q '"repository"' package.json
	@grep -q '"bugs"' package.json
	@grep -q '"homepage"' package.json
	@grep -q '"keywords"' package.json
	@grep -q '"publishConfig"' package.json
	@grep -q '"access": "public"' package.json
	@test -f bin/ai-check-template.mjs
	@test -f src/cli/index.mjs
	@test -f src/cli/doctor.mjs
	@test -f src/cli/expect.mjs
	@test -f src/cli/init.mjs
	@test -f src/cli/profile.mjs
	@test -f src/cli/run.mjs
	@test -f src/cli/update.mjs
	@test -f src/cli/utils.mjs
	@test -f tests/cli/doctor.test.mjs
	@test -f tests/cli/package.test.mjs
	@test -f tests/cli/update.test.mjs
	@test -f docs/cli.md
	@grep -q "doctor" docs/cli.md
	@grep -q "init" docs/cli.md
	@grep -q "update" docs/cli.md
	@grep -q -- "--profile" docs/cli.md
	@grep -q -- "--dry-run" docs/cli.md
	@grep -q -- "--overwrite" docs/cli.md
	@grep -q -- "--ci" docs/cli.md
	@grep -q -- "--claude-hooks" docs/cli.md
	@grep -q -- "--review-templates" docs/cli.md
	@grep -q "reviewTemplates" src/cli/install-state.mjs
	@grep -q "PULL_REQUEST_TEMPLATE.md" src/cli/init.mjs
	@grep -q "PULL_REQUEST_TEMPLATE.md" src/cli/update.mjs
	@grep -q "PULL_REQUEST_TEMPLATE.md" src/cli/doctor.mjs
	@grep -q "docs/cli.md" README.md
	@grep -q "docs/cli.md" README-en.md
	@test -f docs/usage-model.md
	@grep -q "Local loop" docs/usage-model.md
	@grep -q "Repair loop" docs/usage-model.md
	@grep -q "E2E loop" docs/usage-model.md
	@grep -q "CI gate" docs/usage-model.md
	@grep -q "Review gate" docs/usage-model.md
	@grep -q "post-implementation verification stack" docs/usage-model.md
	@grep -q "does not make AI write code" docs/usage-model.md
	@test -f package-templates/.github/PULL_REQUEST_TEMPLATE.md
	@test -f package-templates/worksheet/ai-code-understanding.md
	@test -f package-templates/prompts/design-explanation.md
	@test -f package-templates/prompts/tradeoff-analysis.md
	@test -f package-templates/prompts/self-understanding-check.md
	@test -f package-templates/prompts/review-training.md
	@test -f package-templates/playwright/README.md
	@test -f package-templates/playwright/playwright.config.ts
	@test -f package-templates/playwright/tests/smoke.spec.ts
	@test -f package-templates/prompts/e2e-test-creation.md
	@test -f package-templates/prompts/security-scan.md
	@test -f package-templates/supabase/README.md
	@test -f package-templates/supabase/tests/database/rls_policy.test.sql
	@test -f package-templates/supabase/tests/rls/rls.integration.test.ts
	@test -f package-templates/supabase/tests/e2e/magic-link.spec.ts
	@grep -q "trace: \"on-first-retry\"" package-templates/playwright/playwright.config.ts
	@grep -q "getByRole" package-templates/playwright/tests/smoke.spec.ts
	@grep -q "@smoke" package-templates/playwright/tests/smoke.spec.ts
	@grep -q "getByRole > getByLabel > getByText > getByTestId > CSS/XPath" package-templates/prompts/e2e-test-creation.md
	@grep -q "ai:check:secure" package-templates/prompts/security-scan.md
	@grep -q "semgrep scan --config auto" package-templates/prompts/security-scan.md
	@grep -q "Suppression Policy" package-templates/prompts/security-scan.md
	@grep -q "security-scan.md" package-templates/prompts/README.md
	@grep -q "security-scan.md" docs/usage-model.md
	@grep -q "supabase test db" package-templates/supabase/README.md
	@grep -q "service_role" package-templates/supabase/README.md
	@grep -q "pgtap" package-templates/supabase/tests/database/rls_policy.test.sql
	@grep -q "service-role bypass warning" package-templates/supabase/tests/rls/rls.integration.test.ts
	@grep -q "SUPABASE_LOCAL_MAIL_API_URL" package-templates/supabase/tests/e2e/magic-link.spec.ts
	@grep -q "../../supabase/README.md" package-templates/profiles/supabase-rls/README.md
	@grep -q "Upload Playwright artifacts" package-templates/ci-examples/github-actions/ai-check.yml
	@grep -q "playwright-artifacts" package-templates/ci-examples/github-actions/ai-check.yml
	@grep -q "package-templates/playwright/README.md" docs/usage-model.md
	@grep -q "e2e-test-creation.md" package-templates/prompts/README.md
	@grep -q "e2e-test-creation.md" package-templates/profiles/react-nextjs/README.md
	@grep -q "AI-Generated Code Review" package-templates/.github/PULL_REQUEST_TEMPLATE.md
	@grep -q "Adopted design" package-templates/.github/PULL_REQUEST_TEMPLATE.md
	@grep -q "Alternatives considered" package-templates/.github/PULL_REQUEST_TEMPLATE.md
	@grep -q "Risks and tradeoffs" package-templates/.github/PULL_REQUEST_TEMPLATE.md
	@grep -q "Tests added or updated" package-templates/.github/PULL_REQUEST_TEMPLATE.md
	@grep -q "AI Request" package-templates/worksheet/ai-code-understanding.md
	@grep -q "Adopted Design" package-templates/worksheet/ai-code-understanding.md
	@grep -q "Alternatives Considered" package-templates/worksheet/ai-code-understanding.md
	@grep -q "Fragile Areas" package-templates/worksheet/ai-code-understanding.md
	@grep -q "Reimplementation Check" package-templates/worksheet/ai-code-understanding.md
	@for file in package-templates/prompts/design-explanation.md package-templates/prompts/tradeoff-analysis.md package-templates/prompts/self-understanding-check.md package-templates/prompts/review-training.md; do \
		grep -q "^## Purpose" "$$file"; \
		grep -q "^## Prompt" "$$file"; \
		grep -q "^## Usage" "$$file"; \
		grep -q "^## Review Output" "$$file"; \
	done
	@grep -q "design-explanation.md" package-templates/prompts/README.md
	@grep -q "tradeoff-analysis.md" package-templates/prompts/README.md
	@grep -q "self-understanding-check.md" package-templates/prompts/README.md
	@grep -q "review-training.md" package-templates/prompts/README.md
	@grep -q "package-templates/.github/PULL_REQUEST_TEMPLATE.md" README.md
	@grep -q "package-templates/worksheet/ai-code-understanding.md" README.md
	@grep -q -- "--review-templates" README.md
	@grep -q "package-templates/.github/PULL_REQUEST_TEMPLATE.md" README-en.md
	@grep -q "package-templates/worksheet/ai-code-understanding.md" README-en.md
	@grep -q -- "--review-templates" README-en.md
	@grep -q "package-templates/.github/PULL_REQUEST_TEMPLATE.md" docs/usage-model.md
	@grep -q "package-templates/worksheet/ai-code-understanding.md" docs/usage-model.md
	@grep -q -- "--review-templates" docs/usage-model.md
	@grep -q ".github/PULL_REQUEST_TEMPLATE.md" package-templates/README.md
	@grep -q "worksheet/ai-code-understanding.md" package-templates/README.md
	@grep -q "ai-code-understanding.md" docs/roadmap.md
	@grep -q "docs/usage-model.md" README.md
	@grep -q "docs/usage-model.md" README-en.md
	@grep -q "./usage-model.md" docs/roadmap.md
	@grep -q "doctor" README.md
	@grep -q "doctor" README-en.md
	@grep -q "doctor" docs/roadmap.md
	@grep -q "update" README.md
	@grep -q "update" README-en.md
	@grep -q "update" docs/roadmap.md
	@grep -q "./cli.md" docs/roadmap.md
	@grep -q "npm pack" docs/cli.md
	@grep -q "npm pack" README.md
	@grep -q "npm pack" README-en.md
	@grep -q "npm pack" docs/roadmap.md
	@test -f docs/releases/v0.2.0.md
	@grep -q "^## Highlights" docs/releases/v0.2.0.md
	@grep -q "^## Install" docs/releases/v0.2.0.md
	@grep -q "^## Verification" docs/releases/v0.2.0.md
	@grep -q "^## Publish" docs/releases/v0.2.0.md
	@grep -q "^## Limitations" docs/releases/v0.2.0.md
	@grep -q "0.2.0" docs/releases/v0.2.0.md
	@grep -q "v0.2.0-alpha.0" docs/releases/v0.2.0.md
	@grep -q "v0.2.0.*Released" README.md
	@grep -q "v0.2.0.*Released" README-en.md
	@grep -q "Released on 2026-05-16" docs/roadmap.md
	@grep -q "v0.2.0.*Released" package-templates/README.md
	@grep -q "npx -y ai-check-template@latest" docs/releases/v0.2.0.md
	@grep -q "GitHub Release" docs/releases/v0.2.0.md
	@grep -q "npm publish --dry-run --tag latest" docs/cli.md
	@grep -q "npm publish --dry-run --tag latest" README.md
	@grep -q "npm publish --dry-run --tag latest" README-en.md
	@grep -q "npm publish --dry-run --tag latest" docs/roadmap.md
	@echo "validate-structure: PASS"

validate-cli:
	@node bin/ai-check-template.mjs --help >/dev/null
	@node bin/ai-check-template.mjs doctor --help >/dev/null
	@node bin/ai-check-template.mjs update --help >/dev/null
	@node --test tests/cli/*.test.mjs
	@echo "validate-cli: PASS"

validate-npm-pack:
	@npm pack --dry-run --json >/dev/null
	@echo "validate-npm-pack: PASS"

validate-npm-publish-dry-run:
	@version=$$(node -p "require('./package.json').version"); \
	if npm view "ai-check-template@$$version" version >/dev/null 2>&1; then \
		npm view ai-check-template version dist-tags --json >/dev/null; \
	else \
		npm publish --dry-run --tag latest --json >/dev/null; \
	fi
	@echo "validate-npm-publish-dry-run: PASS"

validate-sage:
	@if [ -x scripts/sage-validate.sh ]; then \
		bash scripts/sage-validate.sh; \
	else \
		echo "validate-sage: SKIPPED (scripts/sage-validate.sh not found)"; \
	fi
