# Changelog - ALU Graduates Empowerment Platform

All notable changes to this project are documented here.

---

## Summative - Complete DevOps Pipeline (July 2026)

### Added
- **Bastion Host** in public subnet for secure SSH access to private VM
- **Private subnet** for application VM (no direct internet access)
- **RDS PostgreSQL** managed database in private subnet
- **AWS ECR** — two private container registries, one for backend and one for frontend
- **NAT Gateway** for private subnet outbound internet access
- **CD pipeline** (`cd.yml`) triggering on merge to main
- **ECR image push** with commit SHA tagging for both backend and frontend in CD pipeline
- **Ansible deployment playbooks** (`deploy.yml`) with ECR login, image pull, and bastion jump host
- **Bastion reverse proxy playbook** (`bastion-proxy.yml`) — installs and configures nginx to route public traffic to the private app server
- **Frontend containerization and deployment** — React app built and deployed as a second container alongside the backend
- **Production docker-compose** template updated for backend + frontend deployment
- **Architecture diagram** in README.md, updated to reflect frontend + reverse proxy
- **CHANGELOG.md** documenting full project evolution
- **Live deployment** accessible via public URL through nginx on the Bastion Host

### Changed
- Terraform expanded from basic VPC to full architecture: VPC, bastion, app server, RDS, 2x ECR, security groups
- CI pipeline updated to fail the build on real HIGH/CRITICAL vulnerabilities instead of always passing
- Ansible inventory updated with `ProxyCommand`/`ProxyJump` for bastion jump, corrected host group naming to match playbook targets
- README.md updated as full operations manual with live URL, updated architecture, and contribution breakdown
- Frontend API calls changed from hardcoded `http://localhost:5000/api` to relative `/api` paths so the built app works correctly against any deployed host
- Backend `MONGO_URI` corrected to use the MongoDB Atlas connection string instead of a hardcoded local Docker hostname
- Backend `CLIENT_URL` wired through Ansible templates and CD pipeline secrets so CORS correctly allows the live frontend origin

### Fixed
- RDS Postgres engine version corrected after AWS deprecated the originally selected minor version
- RDS master username changed from a reserved word (`admin`) to a valid value
- RDS master password corrected to remove disallowed special characters
- SSH `ProxyJump` authentication fixed so CI-driven deployments can reach the private app server through the bastion
- Ansible inventory host group name mismatch (`app_servers` vs `app_server`) that caused deployment tasks to be silently skipped
- SSH private key filename mismatch between the CD workflow and the Ansible inventory that caused deployment connection failures
- Dependency vulnerabilities resolved in production dependencies (removed unused `sequelize`/`mysql2`, upgraded `nodemailer`); one remaining transitive dependency risk documented as accepted risk in `SECURITY.md` after investigation showed no safe non-breaking fix exists
- Container image vulnerabilities resolved by upgrading Alpine OS packages and removing the unused, bundled npm CLI from the production image
- Corrected a broken YAML step structure in `cd.yml` that caused the deployment workflow to fail to parse
- Fixed frontend/backend port mismatch in production docker-compose (nginx inside the frontend container listens on port 80, not 3000)

---

## Formative 3 - Infrastructure as Code & DevSecOps (July 2026)

### Added
- `terraform/` directory with `main.tf`, `variables.tf`, `outputs.tf`
- Terraform provisions VPC, EC2, and Security Groups on AWS
- `ansible/` directory with `playbook.yml` and `inventory.ini`
- Ansible installs Docker, deploys app, configures UFW and SSH hardening
- **Trivy** container image scanning in CI pipeline
- **tfsec** Terraform IaC scanning in CI pipeline
- `SECURITY.md` documenting all security findings and remediations
- `Dockerfile.frontend` for React app containerization
- `nginx.conf` for serving React build
- Frontend service added to `docker-compose.yml`
- MongoDB healthcheck with `condition: service_healthy`

### Fixed
- ESLint config updated with `jest: true` environment (fixes CI no-undef errors)
- docker-compose `depends_on` upgraded to use `condition: service_healthy`
- `backend/.eslintrc.json` created to fix CI pipeline failures

---

## Formative 2 - Containerization & CI Pipeline (June/July 2026)

### Added
- `backend/Dockerfile` with multi-stage build, non-root user, dumb-init
- `docker-compose.yml` orchestrating backend and MongoDB
- `.dockerignore` to exclude unnecessary files from Docker build
- `.github/workflows/ci.yml` with lint → test → docker-build pipeline
- `backend/tests/health.test.js` for automated API health testing
- Jest and Supertest as dev dependencies for testing
- GitHub Actions CI triggers on push and pull requests

### Changed
- Entire backend migrated from MySQL/Sequelize to MongoDB/Mongoose
- All controllers rewritten with Mongoose query patterns
- All models converted from Sequelize to Mongoose schemas
- Auth middleware simplified to MongoDB-only
- Branch protection rules updated to require CI checks

---

## Formative 1 - Project Foundation (June 2026)

### Added
- Repository initialized at `https://github.com/levishimwe/Alu-graduates-platiform`
- `README.md` with project description, team members, and setup instructions
- `.gitignore` configured for Node.js, React, and MongoDB stack
- `MIT LICENSE` file
- GitHub Projects board with 10 user stories (Kanban view)
- Branch protection rules on `main` requiring PR reviews
- Team collaborators added
- Initial codebase: React + Node.js/Express + MongoDB

---

## Team Members

- **Levis Ishimwe** — Full-Stack Developer & DevOps Lead (fixing, debugging and testing)
- **Obasi-Otani Owai Ibe** — Backend Developer (deployment)
- **Elise Julio Hakizimana** — Frontend Developer (CI/CD)
- **Karangwa Kethia** — Frontend Developer (Security: ECR, RDS and AWS; and documentation)
