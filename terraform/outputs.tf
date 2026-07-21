# =============================================================================
# Terraform Outputs - Expose key infrastructure details
# =============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.alu_platform_vpc.id
}

output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.alu_public_subnet.id
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.alu_platform_sg.id
}

output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.alu_platform_server.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_eip.alu_platform_eip.public_ip
}

output "instance_public_dns" {
  description = "Public DNS of the EC2 instance"
  value       = aws_instance.alu_platform_server.public_dns
}

output "backend_url" {
  description = "URL to access the backend API"
  value       = "http://${aws_eip.alu_platform_eip.public_ip}:5000/api/health"
}

output "frontend_url" {
  description = "URL to access the frontend"
  value       = "http://${aws_eip.alu_platform_eip.public_ip}"
}
