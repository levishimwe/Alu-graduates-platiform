# Changelog - ALU Graduates Empowerment Platform

All notable changes to this project are documented here.

---

## Summative - Complete DevOps Pipeline (July 2026)

### Added
- **Bastion Host** in public subnet for secure SSH access to private VM
- **Private subnet** for application VM (no direct internet access)
- **RDS PostgreSQL** managed database in private subnet
- **AWS ECR** private container registry for Docker images
- **NAT Gateway** for private subnet outbound internet access
- **CD pipeline** (`cd.yml`) triggering on merge to main
- **ECR image push** with commit SHA tagging in CD pipeline
- **Ansible updated** with ECR login, image pull, and bastion jump host
- **Production docker-compose** template for server deployment
- **Architecture diagram** in README.md
- **CHANGELOG.md** documenting full project evolution
- **Live deployment** accessible via public URL

### Changed
- Terraform expanded from basic VPC to full 6-component architecture
- CI pipeline updated to fail on CRITICAL vulnerabilities (not just warn)
- Ansible inventory updated with ProxyCommand for bastion jump
- README.md updated as full operations manual with live URL

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
- Team collaborators added: Obasi-Otani, Elise Julio, Karangwa Kethia
- Initial codebase: React + Node.js/Express + MongoDB

### Team Members
- **Levis Ishimwe** — Full-Stack Developer & DevOps Lead
- **Obasi-Otani Owai Ibe** — Backend Developer
- **Elise Julio Hakizimana** — Frontend Developer
- **Karangwa Kethia** — Frontend Developer
