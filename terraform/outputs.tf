# =============================================================================
# Outputs - Expose key infrastructure details
# =============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.alu_vpc.id
}

output "bastion_public_ip" {
  description = "Bastion Host public IP - use this for SSH jump"
  value       = aws_eip.bastion_eip.public_ip
}

output "app_server_private_ip" {
  description = "App VM private IP - access via bastion"
  value       = aws_instance.app_server.private_ip
}

output "ecr_repository_url" {
  description = "ECR repository URL for pushing Docker images"
  value       = aws_ecr_repository.alu_platform_ecr.repository_url
}

output "ecr_registry_id" {
  description = "ECR registry ID"
  value       = aws_ecr_repository.alu_platform_ecr.registry_id
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = aws_db_instance.alu_database.endpoint
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.alu_database.db_name
}

output "application_url" {
  description = "Application URL via Bastion"
  value       = "http://${aws_eip.bastion_eip.public_ip}:5000/api/health"
}

output "ssh_bastion_command" {
  description = "SSH command to connect to Bastion"
  value       = "ssh -i ~/.ssh/${var.key_pair_name}.pem ubuntu@${aws_eip.bastion_eip.public_ip}"
}

output "ssh_app_via_bastion" {
  description = "SSH command to App VM via Bastion"
  value       = "ssh -J ubuntu@${aws_eip.bastion_eip.public_ip} ubuntu@${aws_instance.app_server.private_ip}"
}
