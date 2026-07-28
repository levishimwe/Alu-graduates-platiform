# =============================================================================
# ALU Graduates Empowerment Platform - Terraform Main Configuration
# Provisions: VPC, Bastion Host, App VM, RDS, ECR, Security Groups
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

# =============================================================================
# VPC - Private Network
# =============================================================================
resource "aws_vpc" "alu_vpc" {
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
  vpc_id = aws_vpc.alu_vpc.id
  tags = {
    Name    = "${var.project_name}-igw"
    Project = var.project_name
  }
}

# =============================================================================
# Subnets
# =============================================================================

# Public Subnet - for Bastion Host
resource "aws_subnet" "alu_public_subnet" {
  vpc_id                  = aws_vpc.alu_vpc.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name    = "${var.project_name}-public-subnet"
    Project = var.project_name
  }
}

# Private Subnet - for Application VM and Database
resource "aws_subnet" "alu_private_subnet" {
  vpc_id            = aws_vpc.alu_vpc.id
  cidr_block        = var.private_subnet_cidr
  availability_zone = "${var.aws_region}a"

  tags = {
    Name    = "${var.project_name}-private-subnet"
    Project = var.project_name
  }
}

# Private Subnet 2 - required for RDS subnet group
resource "aws_subnet" "alu_private_subnet_2" {
  vpc_id            = aws_vpc.alu_vpc.id
  cidr_block        = var.private_subnet_2_cidr
  availability_zone = "${var.aws_region}b"

  tags = {
    Name    = "${var.project_name}-private-subnet-2"
    Project = var.project_name
  }
}

# =============================================================================
# Route Tables
# =============================================================================

# Public Route Table
resource "aws_route_table" "alu_public_rt" {
  vpc_id = aws_vpc.alu_vpc.id
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

# NAT Gateway for private subnet outbound internet access
resource "aws_eip" "nat_eip" {
  domain = "vpc"
  tags = {
    Name    = "${var.project_name}-nat-eip"
    Project = var.project_name
  }
}

resource "aws_nat_gateway" "alu_nat" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.alu_public_subnet.id
  tags = {
    Name    = "${var.project_name}-nat"
    Project = var.project_name
  }
  depends_on = [aws_internet_gateway.alu_igw]
}

# Private Route Table - routes through NAT
resource "aws_route_table" "alu_private_rt" {
  vpc_id = aws_vpc.alu_vpc.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.alu_nat.id
  }
  tags = {
    Name    = "${var.project_name}-private-rt"
    Project = var.project_name
  }
}

resource "aws_route_table_association" "alu_private_rta" {
  subnet_id      = aws_subnet.alu_private_subnet.id
  route_table_id = aws_route_table.alu_private_rt.id
}

resource "aws_route_table_association" "alu_private_rta_2" {
  subnet_id      = aws_subnet.alu_private_subnet_2.id
  route_table_id = aws_route_table.alu_private_rt.id
}

# =============================================================================
# Security Groups
# =============================================================================

# Bastion Host Security Group - allows SSH from internet
resource "aws_security_group" "bastion_sg" {
  name        = "${var.project_name}-bastion-sg"
  description = "Security group for Bastion Host"
  vpc_id      = aws_vpc.alu_vpc.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
    description = "SSH from allowed IP"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound"
  }

  tags = {
    Name    = "${var.project_name}-bastion-sg"
    Project = var.project_name
  }
}

# App VM Security Group - allows traffic from bastion and public web
resource "aws_security_group" "app_sg" {
  name        = "${var.project_name}-app-sg"
  description = "Security group for Application VM"
  vpc_id      = aws_vpc.alu_vpc.id

  ingress {
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion_sg.id]
    description     = "SSH from Bastion only"
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
    Name    = "${var.project_name}-app-sg"
    Project = var.project_name
  }
}

# Database Security Group - allows access from App VM only
resource "aws_security_group" "db_sg" {
  name        = "${var.project_name}-db-sg"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.alu_vpc.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
    description     = "PostgreSQL from App VM only"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-db-sg"
    Project = var.project_name
  }
}

# =============================================================================
# Bastion Host - Public subnet jump server
# =============================================================================
resource "aws_instance" "bastion" {
  ami                    = var.ami_id
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.alu_public_subnet.id
  vpc_security_group_ids = [aws_security_group.bastion_sg.id]
  key_name               = var.key_pair_name

  tags = {
    Name        = "${var.project_name}-bastion"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_eip" "bastion_eip" {
  instance = aws_instance.bastion.id
  domain   = "vpc"
  tags = {
    Name    = "${var.project_name}-bastion-eip"
    Project = var.project_name
  }
}

# =============================================================================
# Application VM - Private subnet
# =============================================================================
resource "aws_instance" "app_server" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.alu_private_subnet.id
  vpc_security_group_ids = [aws_security_group.app_sg.id]
  key_name               = var.key_pair_name

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
    encrypted             = true
  }

  tags = {
    Name        = "${var.project_name}-app-server"
    Environment = var.environment
    Project     = var.project_name
  }
}

# =============================================================================
# RDS - Managed Database (PostgreSQL)
# =============================================================================
resource "aws_db_subnet_group" "alu_db_subnet_group" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = [aws_subnet.alu_private_subnet.id, aws_subnet.alu_private_subnet_2.id]

  tags = {
    Name    = "${var.project_name}-db-subnet-group"
    Project = var.project_name
  }
}

resource "aws_db_instance" "alu_database" {
  identifier             = "${var.project_name}-db"
  engine                 = "postgres"
  engine_version         = "15.18"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  storage_type           = "gp2"
  storage_encrypted      = true
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.alu_db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  publicly_accessible    = false
  skip_final_snapshot    = true
  deletion_protection    = false

  tags = {
    Name        = "${var.project_name}-database"
    Environment = var.environment
    Project     = var.project_name
  }
}

# =============================================================================
# ECR - Private Container Registry
# =============================================================================
resource "aws_ecr_repository" "alu_platform_ecr" {
  name                 = "${var.project_name}-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = "${var.project_name}-ecr"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_ecr_lifecycle_policy" "alu_ecr_policy" {
  repository = aws_ecr_repository.alu_platform_ecr.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 5 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 5
      }
      action = {
        type = "expire"
      }
    }]
  })
}
