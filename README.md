# ALU Graduates Empowerment Platform
> Connecting ALU's brightest innovations with the investors, sponsors, and buyers who can bring them to life.

## Live Application
**[Access Live App](http://YOUR_BASTION_IP:5000/api/health)** ← Replace with real IP after Terraform apply

---

## Team Members

| Name | Role | Student ID |
|------|------|------------|
| Levis Ishimwe | Full-Stack Developer & DevOps Lead | i.levis@alustudent.com |
| Obasi-Otani Owai Ibe | Backend Developer | o.ibe@alustudent.com |
| Elise Julio Hakizimana | Frontend Developer (CI/CD) | j.hakiziman1@alustudent.com |
| Karangwa Kethia | Frontend Developer (Security) | k.karangwa@alustudent.com |

---

## Architecture Overview

```
                          INTERNET
                              │
                    ┌─────────▼─────────┐
                    │   GitHub Actions   │
                    │   CI/CD Pipeline   │
                    └─────────┬─────────┘
                              │ Push image
                    ┌─────────▼─────────┐
                    │    AWS ECR         │
                    │ (Private Registry) │
                    └─────────┬─────────┘
                              │
              ┌───────────────▼───────────────┐
              │         AWS VPC               │
              │  ┌────────────────────────┐   │
              │  │    PUBLIC SUBNET        │   │
              │  │  ┌──────────────────┐  │   │
              │  │  │  Bastion Host    │◄─┼───┼── SSH (port 22)
              │  │  │  (t2.micro)      │  │   │
              │  │  └────────┬─────────┘  │   │
              │  └───────────┼────────────┘   │
              │              │ SSH Jump        │
              │  ┌───────────▼────────────┐   │
              │  │    PRIVATE SUBNET       │   │
              │  │  ┌──────────────────┐  │   │
              │  │  │  App VM          │  │   │
              │  │  │  (t2.micro)      │  │   │
              │  │  │  Docker + App    │  │   │
              │  │  └────────┬─────────┘  │   │
              │  │           │            │   │
              │  │  ┌────────▼─────────┐  │   │
              │  │  │  RDS PostgreSQL  │  │   │
              │  │  │  (db.t3.micro)   │  │   │
              │  │  └──────────────────┘  │   │
              │  └────────────────────────┘   │
              └───────────────────────────────┘
```

### Security Controls
- App VM is in **private subnet** — no direct internet access
- All SSH access goes through **Bastion Host** (jump server)
- Database only accessible from App VM (Security Group rule)
- ECR is private — only authenticated AWS users can push/pull

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB (Atlas / Docker) |
| Managed DB | AWS RDS PostgreSQL |
| Auth | JWT |
| Media | Cloudinary |
| Container Registry | AWS ECR (private) |
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
│   ├── main.tf             # VPC, Bastion, App VM, RDS, ECR
│   ├── variables.tf        # All configurable variables
│   ├── outputs.tf          # IPs, URLs, registry endpoint
│   ├── terraform.tfvars.example
│   └── README.md
├── ansible/
│   ├── deploy.yml          # Install Docker, pull from ECR, deploy
│   ├── inventory.ini       # Hosts with bastion jump config
│   ├── templates/
│   │   ├── .env.j2
│   │   └── docker-compose.prod.yml.j2
│   └── README.md
├── backend/
│   ├── Dockerfile          # Multi-stage, non-root, healthcheck
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
├── Dockerfile.frontend     # Frontend container
├── nginx.conf              # Nginx config for React
├── CHANGELOG.md            # Project evolution F1→F2→Summative
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

Note the outputs: `bastion_public_ip`, `app_server_private_ip`, `ecr_repository_url`

**Step 4 — Update Ansible inventory**
```bash
# Edit ansible/inventory.ini
# Replace BASTION_IP and APP_VM_PRIVATE_IP with Terraform outputs
```

**Step 5 — Set GitHub Secrets**

In your GitHub repo → Settings → Secrets, add:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `SSH_PRIVATE_KEY`
- `BASTION_IP`
- `APP_VM_PRIVATE_IP`
- `JWT_SECRET`
- `MONGO_URI`
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
| Dependency Scan | npm audit | Flags HIGH+ vulnerabilities |
| Container Scan | Trivy | Fails on CRITICAL/HIGH |
| IaC Scan | tfsec | Scans Terraform files |
| Docker Build | Docker Buildx | Verifies image builds |

### CD Pipeline (`.github/workflows/cd.yml`)
**Triggers:** Only on merge to `main`

1. Run all CI checks
2. Security scans
3. Build Docker image and push to **AWS ECR** (tagged with commit SHA)
4. Configure SSH via GitHub Secrets
5. Run Ansible playbook against App VM (via Bastion)
6. Verify deployment via health check endpoint

---

## Security Measures

- All secrets stored in GitHub Secrets (never in code)
- App VM in private subnet — not directly internet accessible
- Database in private subnet — only accessible from App VM
- Bastion Host as sole SSH entry point
- JWT authentication with 24h expiration
- bcrypt password hashing (10 rounds)
- Rate limiting on all API endpoints
- Helmet.js security headers
- UFW firewall configured on VMs
- SSH hardened (root login and password auth disabled)
- fail2ban installed to prevent brute force
- Trivy scans every Docker image before deployment
- tfsec scans all Terraform code on every PR

---

## Teardown

```bash
cd terraform/
terraform destroy
```

---

## Demo Video

[Watch Demo Video](https://youtu.be/YOUR_VIDEO_ID) ← Add after recording

---

## License

[MIT License](./LICENSE)
