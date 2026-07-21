# =============================================================================
# ALU Graduates Empowerment Platform - Terraform Configuration
# Provisions: VPC, EC2 instance, Security Groups on AWS
# =============================================================================

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "alu_platform_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Internet Gateway
resource "aws_internet_gateway" "alu_igw" {
  vpc_id = aws_vpc.alu_platform_vpc.id
  tags = {
    Name    = "${var.project_name}-igw"
    Project = var.project_name
  }
}

# Public Subnet
resource "aws_subnet" "alu_public_subnet" {
  vpc_id                  = aws_vpc.alu_platform_vpc.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  tags = {
    Name    = "${var.project_name}-public-subnet"
    Project = var.project_name
  }
}

# Route Table
resource "aws_route_table" "alu_public_rt" {
  vpc_id = aws_vpc.alu_platform_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.alu_igw.id
  }
  tags = {
    Name    = "${var.project_name}-public-rt"
    Project = var.project_name
  }
}

resource "aws_route_table_association" "alu_public_rta" {
  subnet_id      = aws_subnet.alu_public_subnet.id
  route_table_id = aws_route_table.alu_public_rt.id
}

# Security Group
resource "aws_security_group" "alu_platform_sg" {
  name        = "${var.project_name}-sg"
  description = "Security group for ALU Platform server"
  vpc_id      = aws_vpc.alu_platform_vpc.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
    description = "SSH access"
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS"
  }

  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Backend API"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound"
  }

  tags = {
    Name        = "${var.project_name}-sg"
    Environment = var.environment
    Project     = var.project_name
  }
}

# EC2 Instance
resource "aws_instance" "alu_platform_server" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.alu_public_subnet.id
  vpc_security_group_ids = [aws_security_group.alu_platform_sg.id]
  key_name               = var.key_pair_name

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
    encrypted             = true
  }

  user_data = <<-USERDATA
    #!/bin/bash
    apt-get update -y
    apt-get install -y docker.io
    systemctl start docker
    systemctl enable docker
    usermod -aG docker ubuntu
  USERDATA

  tags = {
    Name        = "${var.project_name}-server"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Elastic IP
resource "aws_eip" "alu_platform_eip" {
  instance = aws_instance.alu_platform_server.id
  domain   = "vpc"
  tags = {
    Name    = "${var.project_name}-eip"
    Project = var.project_name
  }
}
