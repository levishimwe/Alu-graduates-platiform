# Terraform - ALU Graduates Empowerment Platform

Provisions AWS infrastructure: VPC, EC2 instance, and Security Groups.

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/downloads) >= 1.0
- AWS account with IAM credentials configured
- AWS CLI installed and configured (`aws configure`)

## Setup

### 1. Configure AWS credentials

```bash
aws configure
# Enter: AWS Access Key ID, Secret Access Key, Region (us-east-1), Output format (json)
```

### 2. Create a key pair in AWS

```bash
aws ec2 create-key-pair --key-name alu-platform-key --query 'KeyMaterial' --output text > alu-platform-key.pem
chmod 400 alu-platform-key.pem
```

### 3. Initialize Terraform

```bash
cd terraform/
terraform init
```

### 4. Preview changes

```bash
terraform plan -var="key_pair_name=alu-platform-key"
```

### 5. Apply configuration

```bash
terraform apply -var="key_pair_name=alu-platform-key"
```

Type `yes` when prompted.

## Outputs

After applying, Terraform will display:

| Output | Description |
|--------|-------------|
| `instance_public_ip` | Public IP of the server |
| `backend_url` | URL to access the backend API |
| `frontend_url` | URL to access the frontend |
| `vpc_id` | VPC resource ID |

## Destroy infrastructure

```bash
terraform destroy -var="key_pair_name=alu-platform-key"
```

## Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS region | `us-east-1` |
| `instance_type` | EC2 instance type | `t3.micro` |
| `allowed_ssh_cidr` | IP allowed SSH access | `0.0.0.0/0` |
| `key_pair_name` | AWS key pair name | Required |
