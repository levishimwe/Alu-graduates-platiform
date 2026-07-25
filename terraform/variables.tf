# =============================================================================
# Variables - No hardcoded secrets or region names
# =============================================================================

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "alu-platform"
}

variable "environment" {
  description = "Environment (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "Public subnet CIDR (Bastion Host)"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidr" {
  description = "Private subnet CIDR (App VM)"
  type        = string
  default     = "10.0.2.0/24"
}

variable "private_subnet_2_cidr" {
  description = "Second private subnet CIDR (RDS requirement)"
  type        = string
  default     = "10.0.3.0/24"
}

variable "ami_id" {
  description = "Ubuntu 22.04 LTS AMI ID"
  type        = string
  default     = "ami-0694d931cee176e7d"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "key_pair_name" {
  description = "AWS key pair name for SSH"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH to bastion"
  type        = string
  default     = "0.0.0.0/0"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "alu_platform"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}
