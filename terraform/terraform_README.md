# Terraform - ALU Graduates Empowerment Platform

Provisions complete AWS infrastructure including VPC, Bastion Host, App VM, RDS, ECR, and Security Groups.

## Architecture

```
Internet
    │
    ▼
[Bastion Host] ←── SSH access
    │ (Public Subnet)
    │
    ▼
[App VM] ────────► [RDS Database]
(Private Subnet)    (Private Subnet)
    │
    ▼
[ECR Registry] ◄── Docker images pushed from CI/CD
```

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured (`aws configure`)
- AWS account with EC2, RDS, ECR permissions

## Setup

### 1. Create AWS key pair

```bash
aws ec2 create-key-pair \
  --key-name alu-platform-key \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/alu-platform-key.pem
chmod 400 ~/.ssh/alu-platform-key.pem
```

### 2. Configure variables

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 3. Initialize

```bash
cd terraform/
terraform init
```

### 4. Preview

```bash
terraform plan
```

### 5. Apply

```bash
terraform apply
```

Note the outputs — you'll need `bastion_public_ip`, `app_server_private_ip`, and `ecr_repository_url` for Ansible and CI/CD.

### 6. Destroy (cleanup)

```bash
terraform destroy
```

## Key Outputs

| Output | Use |
|--------|-----|
| `bastion_public_ip` | SSH jump host IP |
| `app_server_private_ip` | App VM IP (for Ansible inventory) |
| `ecr_repository_url` | Docker image push target |
| `database_endpoint` | DB connection string |
