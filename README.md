# ALU Graduates Empowerment Platform
> Connecting ALU's brightest innovations with the investors, sponsors, and buyers who can bring them to life.

## Live Application
**[Access Live App](http://54.216.4.17/)**

API Health Check: [http://54.216.4.17/api/health](http://54.216.4.17/api/health)

---

## Demo Video

[Watch Demo Video](https://drive.google.com/file/d/1yGdOEe0nMJxLVDk4mX4p5_64TdFqrIfD/view?usp=sharing)

## Team Members

| Name | Role | Student ID |
|------|------|------------|
| Levis Ishimwe | Full-Stack Developer & DevOps Lead | i.levis@alustudent.com |
| Obasi-Otani Owai Ibe | Backend Developer | o.ibe@alustudent.com |
| Elise Julio Hakizimana | Frontend Developer (CI/CD) | j.hakiziman1@alustudent.com |
| Karangwa Kethia | Frontend Developer (Security) | k.karangwa@alustudent.com |

### Contributions

| Name | Contribution |
|------|--------------|
| **Levis Ishimwe** | Terraform infrastructure (VPC, bastion, app server, RDS, ECR, security groups), frontend Docker setup, end-to-end testing, error debugging across the full pipeline, overall DevOps lead |
| **Elise Julio Hakizimana** | CI/CD pipeline (`ci.yml`, `cd.yml`), AWS security configuration, debugging support across the pipeline |
| **Obasi-Otani Owai Ibe** | Ansible deployment playbooks (`deploy.yml`, `bastion-proxy.yml`, inventory configuration) |
| **Karangwa Kethia** | Support on Ansible deployment playbooks, project documentation |

---

## Architecture Overview

```
                          INTERNET
                              │
                    ┌─────────▼─────────┐
                    │   GitHub Actions   │
                    │   CI/CD Pipeline   │
                    └─────────┬─────────┘
                              │ Push images (backend + frontend)
                    ┌─────────▼─────────┐
                    │    AWS ECR         │
                    │ (2 Private Repos)  │
                    └─────────┬─────────┘
                              │
              ┌───────────────▼───────────────────────┐
              │              AWS VPC                  │
              │  ┌──────────────────────────────────┐ │
              │  │         PUBLIC SUBNET             │ │
              │  │  ┌──────────────────────────────┐ │ │
              │  │  │      Bastion Host             │◄┼─┼── SSH (22) + HTTP (80)
              │  │  │      (t2.micro)                │ │ │
              │  │  │  nginx reverse proxy:          │ │ │
              │  │  │   /       → frontend:3000      │ │ │
              │  │  │   /api/   → backend:5000       │ │ │
              │  │  └──────────────┬─────────────────┘ │ │
              │  └─────────────────┼───────────────────┘ │
              │                    │ SSH jump / HTTP proxy │
              │  ┌─────────────────▼───────────────────┐ │
              │  │         PRIVATE SUBNET               │ │
              │  │  ┌─────────────────────────────────┐ │ │
              │  │  │        App VM (t2.micro)         │ │ │
              │  │  │  ┌───────────────┐ ┌───────────┐ │ │ │
              │  │  │  │ Frontend      │ │ Backend   │ │ │ │
              │  │  │  │ (React+nginx) │ │ (Node/Exp)│ │ │ │
              │  │  │  │ :3000 → :80   │ │ :5000     │ │ │ │
              │  │  │  └───────────────┘ └─────┬─────┘ │ │ │
              │  │  └───────────────────────────┼───────┘ │ │
              │  │                              │         │ │
              │  │  ┌───────────────────────────▼──────┐  │ │
              │  │  │   RDS PostgreSQL (db.t3.micro)    │  │ │
              │  │  └───────────────────────────────────┘  │ │
              │  └───────────────────────────────────────┘ │
              └─────────────────────────────────────────────┘

              External: MongoDB Atlas (cloud-managed, primary app database)
```

### Security Controls
- App VM is in a **private subnet** — no direct internet access
- All SSH access goes through the **Bastion Host** (jump server)
- All public HTTP traffic is reverse-proxied through the **Bastion's nginx**, never hitting the app server directly from the internet
- Backend port 5000 and frontend port 3000 are only reachable from the Bastion's security group, not from `0.0.0.0/0`
- Database (RDS) only accessible from the App VM (Security Group rule)
- ECR repositories are private — only authenticated AWS users can push/pull
- Container images scanned with Trivy; Terraform scanned with tfsec on every PR

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Tailwind CSS, served via nginx |
| Backend | Node.js, Express.js |
| Primary Database | MongoDB Atlas (cloud-managed) |
| Secondary/Managed DB | AWS RDS PostgreSQL |
| Reverse Proxy | nginx (on Bastion Host) |
| Auth | JWT |
| Media | Cloudinary |
| Container Registry | AWS ECR (private, separate repos for frontend/backend) |
| IaC | Terraform |
| Config Management | Ansible |
| CI/CD | GitHub Actions |
| Containerization | Docker, Docker Compose |
| Deployment | AWS EC2 (private subnet) |

---

## Repository Structure

```
Alu-graduates-platiform/
├── .github/
│   └── workflows/
│       ├── ci.yml          # CI: lint, test, security scan (on PRs)
│       └── cd.yml          # CD: build, push ECR, deploy (on main merge)
├── terraform/
│   ├── main.tf             # VPC, Bastion, App VM, RDS, 2x ECR, Security Groups
│   ├── variables.tf        # All configurable variables
│   ├── outputs.tf          # IPs, URLs, registry endpoints
│   ├── terraform.tfvars.example
│   └── README.md
├── ansible/
│   ├── deploy.yml          # Install Docker, pull from ECR, deploy app stack
│   ├── bastion-proxy.yml   # Install & configure nginx reverse proxy on Bastion
│   ├── inventory.ini       # Hosts with bastion jump config (app_server + bastion groups)
│   ├── templates/
│   │   ├── .env.j2
│   │   └── docker-compose.prod.yml.j2
│   └── README.md
├── backend/
│   ├── Dockerfile          # Multi-stage, non-root, healthcheck, OS-patched
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── socket/
│   ├── tests/
│   └── server.js
├── src/                    # React frontend
├── docker-compose.yml      # Local development
├── Dockerfile.frontend     # Frontend container (multi-stage, nginx)
├── nginx.conf              # Nginx config for React (local dev / container-internal)
├── .env.production         # Frontend production build config (relative API paths)
├── CHANGELOG.md            # Project evolution F1 → F2 → Summative
├── SECURITY.md             # Security findings and remediations
└── README.md
```

---

## Setup Instructions

### Prerequisites

- AWS account with EC2, RDS, ECR, VPC permissions
- Terraform >= 1.0
- Ansible >= 2.9
- Node.js v18+
- Docker and Docker Compose
- A MongoDB Atlas cluster and connection string

---

### Option 1: Full Cloud Deployment (Terraform + Ansible)

**Step 1 — Create AWS key pair**
```bash
aws ec2 create-key-pair \
  --key-name alu-platform-key \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/alu-platform-key.pem
chmod 400 ~/.ssh/alu-platform-key.pem
```

**Step 2 — Configure Terraform variables**
```bash
cd terraform/
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

**Step 3 — Provision infrastructure**
```bash
terraform init
terraform plan
terraform apply
```

Note the outputs: `bastion_public_ip`, `app_server_private_ip`, `ecr_repository_url`, `ecr_repository_url_frontend`

**Step 4 — Update Ansible inventory**
```bash
# ansible/inventory.ini uses BASTION_IP and APP_VM_PRIVATE_IP placeholders,
# which cd.yml replaces automatically from GitHub Secrets at deploy time.
```

**Step 5 — Set GitHub Secrets**

In your GitHub repo → Settings → Secrets and variables → Actions, add:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `SSH_PRIVATE_KEY`
- `BASTION_IP`
- `APP_VM_PRIVATE_IP`
- `JWT_SECRET`
- `MONGO_URI` (MongoDB Atlas connection string)
- `ADMIN_SECRET_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

**Step 6 — Deploy**
```bash
# Push to any branch to trigger CI
git push origin feature/my-branch

# Create PR → CI runs → merge to main → CD deploys automatically
```

---

### Option 2: Local Development

```bash
git clone https://github.com/levishimwe/Alu-graduates-platiform.git
cd Alu-graduates-platiform
cp backend/.env.example backend/.env
# Fill in backend/.env
docker-compose up --build
# Frontend: http://localhost:3000
# Backend: http://localhost:5000/api/health
```

---

## CI/CD Pipeline

### CI Pipeline (`.github/workflows/ci.yml`)
**Triggers:** Every push and pull request (except main)

| Step | Tool | Action |
|------|------|--------|
| Lint | ESLint | Fails on errors |
| Test | Jest + Supertest | Fails on test failure |
| Dependency Scan | npm audit | Fails build on HIGH+ production vulnerabilities |
| Container Scan | Trivy | Fails on CRITICAL/HIGH (with documented exceptions, see SECURITY.md) |
| IaC Scan | tfsec | Scans Terraform files |
| Docker Build | Docker Buildx | Verifies image builds |

### CD Pipeline (`.github/workflows/cd.yml`)
**Triggers:** Only on merge to `main`

1. Run all CI checks
2. Security scans
3. Build backend and frontend Docker images, push both to their AWS ECR repositories (tagged with commit SHA)
4. Configure SSH via GitHub Secrets
5. Run Ansible playbook against App VM (via Bastion) — installs Docker, pulls both images, deploys via docker-compose
6. Configure nginx reverse proxy on the Bastion Host (routes `/` to frontend, `/api` to backend)
7. Verify deployment via health check endpoint (backend and frontend)

---

## Security Measures

- All secrets stored in GitHub Secrets (never in code)
- App VM in private subnet — not directly internet accessible
- Database in private subnet — only accessible from App VM
- Bastion Host as sole SSH and HTTP entry point
- JWT authentication with 24h expiration
- bcrypt password hashing (10 rounds)
- Rate limiting on all API endpoints
- Helmet.js security headers
- CORS restricted to the deployed frontend's origin via `CLIENT_URL`
- UFW firewall configured on VMs
- SSH hardened (root login and password auth disabled)
- fail2ban installed to prevent brute force
- Trivy scans every Docker image before deployment; base OS packages patched via `apk upgrade`, unused npm CLI removed from production image
- tfsec scans all Terraform code on every PR
- Known, unfixable dependency risks are explicitly documented with justification in `SECURITY.md` rather than silently ignored

---

## Teardown

```bash
cd terraform/
terraform destroy
```

---

## License

[MIT License](./LICENSE)
