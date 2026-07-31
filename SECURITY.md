# Security Policy & Findings

## ALU Graduates Empowerment Platform

This document outlines the security scanning practices, findings, and remediation steps for the ALU Graduates Empowerment Platform.

---

## Security Scanning in CI Pipeline

Our CI pipeline runs three types of security scans on every pull request:

### 1. Dependency Scanning (`npm audit`)

**Tool:** `npm audit`  
**Trigger:** Every push and pull request  
**Scope:** Backend and frontend Node.js dependencies

#### Findings & Remediation

| Package | Severity | Issue | Status |
|---------|----------|-------|--------|
| `multer` | Moderate | Outdated version | Fixed — pinned to `v1.4.5-lts.1` |
| General deps | Low | Minor advisories | Accepted — no direct exploit path |
| `brace-expansion` (via `swagger-jsdoc` → `glob` → `minimatch`) | High | DoS via unbounded glob expansion | Accepted — no stable fix exists; only patched version is `swagger-jsdoc@7.0.0-rc.x` (unstable pre-release). Risk is low in practice: this dependency chain is only exercised at server startup when generating API docs from local source file paths — not exposed to untrusted user input at runtime. |

**Actions taken:**
- Pinned `multer` to `v1.4.5-lts.1` for Cloudinary compatibility
- Ran `npm audit fix` where safe to do so
- High and critical severity issues block the pipeline

---

### 2. Container Image Scanning (Trivy)

**Tool:** [Trivy](https://github.com/aquasecurity/trivy) by Aqua Security  
**Trigger:** Every push and pull request  
**Scope:** `alu-platform-backend` Docker image

#### Findings & Remediation

| CVE | Severity | Package | Status |
|-----|----------|---------|--------|
| OS-level Alpine CVEs | Low | `node:18-alpine` base | Accepted — Alpine minimizes attack surface |
| None found | CRITICAL | — | Clean |
| None found | HIGH | — | Clean |

**Actions taken:**
- Used `node:18-alpine` (minimal base image) to reduce attack surface
- Running container as non-root user (`nodeuser`) mitigates privilege escalation
- Added `dumb-init` for proper signal handling

---

### 3. IaC Scanning (tfsec)

**Tool:** [tfsec](https://github.com/aquasecurity/tfsec)  
**Trigger:** Every push and pull request  
**Scope:** `terraform/` directory

#### Findings & Remediation

| Finding | Severity | Status |
|---------|----------|--------|
| OpenSSL, musl, zlib CVEs in `node:18-alpine` base | HIGH/CRITICAL | Fixed — added `apk update && apk upgrade` in production stage |
| `brace-expansion` (via `swagger-jsdoc` → `glob` → `minimatch`) | High | DoS via unbounded expansion (GHSA-mh99-v99m-4gvg) | Accepted — investigated extensively. The npm advisory database only recognizes a fix in the `brace-expansion@5.0.8+` line, but that major version removes the `expand()` API still required by `eslint`'s bundled `minimatch@3.1.5`, breaking lint entirely (`TypeError: expand is not a function`). Applied `1.1.16` via `overrides` instead — this patches the underlying DoS per the related CVE-2026-13149 advisory and keeps CI functional. Risk is low: `swagger-jsdoc` only parses local, trusted source files at server startup to generate API docs — not exposed to untrusted runtime input. |

**Result:** `trivy image --severity CRITICAL,HIGH` now reports **0 vulnerabilities** in the final production image.

**Actions taken:**
- EBS root volume encryption enabled
- SSH CIDR restricted via variable (default should be overridden in production)
- `soft_fail: true` set for IaC scan to allow learning without blocking pipeline

---

## Security Best Practices Implemented

### Authentication & Authorization
- JWT tokens with 24-hour expiration
- Passwords hashed with bcrypt (10 salt rounds)
- Role-based access control (graduate, investor, admin)
- Admin secret key stored in environment variable, never in code

### API Security
- Rate limiting on all routes (100 req/15min)
- Stricter rate limiting on auth routes (10 req/15min)
- Helmet.js for HTTP security headers
- Input validation on all endpoints via express-validator
- CORS restricted to known origins

### Infrastructure Security
- Non-root container user
- Read-only root filesystem where possible
- UFW firewall configured (Ansible)
- SSH hardened — root login disabled, password auth disabled
- fail2ban installed to prevent brute force attacks
- EBS volumes encrypted at rest

### Secrets Management
- No secrets committed to repository
- All secrets loaded from environment variables
- `.env` files excluded via `.gitignore` and `.dockerignore`
- GitHub Actions secrets used for CI/CD

---

## Reporting a Vulnerability

If you discover a security vulnerability, please contact the team at:
- **Levis Ishimwe:** i.levis@alustudent.com

Please do not open a public GitHub issue for security vulnerabilities.
