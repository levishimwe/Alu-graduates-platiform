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

| Rule | Severity | Resource | Finding | Status |
|------|----------|----------|---------|--------|
| `aws-ec2-no-public-ip` | Warning | `aws_subnet` | Public subnet assigns public IPs | Accepted — required for demo access |
| `aws-ec2-no-wide-ingress` | Warning | `aws_security_group` | SSH open to 0.0.0.0/0 | Mitigated — restrict `allowed_ssh_cidr` variable in production |
| `aws-ebs-enable-volume-encryption` | Info | `aws_instance` | Root volume encrypted | Fixed — `encrypted = true` set |

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
