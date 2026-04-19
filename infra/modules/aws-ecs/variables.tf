variable "service_name" {
  description = "Name of the service"
  type        = string
}

variable "image_url" {
  description = "Container image URL"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "cpu" {
  description = "CPU units for the task (256, 512, 1024, etc.)"
  type        = number
  default     = 256
}

variable "memory" {
  description = "Memory in MB for the task (512, 1024, 2048, etc.)"
  type        = number
  default     = 512
}

variable "cpu_architecture" {
  description = "CPU architecture (X86_64, ARM64)"
  type        = string
  default     = "X86_64"
}

variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
  default     = 1
}

variable "enable_autoscaling" {
  description = "Enable auto scaling"
  type        = bool
  default     = false
}

variable "min_capacity" {
  description = "Minimum number of tasks when auto scaling is enabled"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of tasks when auto scaling is enabled"
  type        = number
  default     = 10
}

variable "cpu_target_value" {
  description = "Target CPU utilization for auto scaling"
  type        = number
  default     = 70
}

variable "memory_target_value" {
  description = "Target memory utilization for auto scaling"
  type        = number
  default     = 70
}

variable "create_cluster" {
  description = "Create a new ECS cluster"
  type        = bool
  default     = true
}

variable "cluster_arn" {
  description = "ARN of existing ECS cluster (if create_cluster is false)"
  type        = string
  default     = ""
}

variable "cluster_name" {
  description = "Name of existing ECS cluster (if create_cluster is false)"
  type        = string
  default     = ""
}

variable "subnet_ids" {
  description = "List of subnet IDs for the service"
  type        = list(string)
  default     = []
}

variable "security_group_ids" {
  description = "List of security group IDs for the service"
  type        = list(string)
  default     = []
}

variable "lb_arn" {
  description = "ARN of the load balancer (optional)"
  type        = string
  default     = ""
}

variable "lb_target_group_arn" {
  description = "ARN of the target group (optional)"
  type        = string
  default     = ""
}

variable "environment_variables" {
  description = "Map of environment variables"
  type        = map(string)
  default     = {}
}

variable "enable_secrets" {
  description = "Enable secrets from AWS Secrets Manager"
  type        = bool
  default     = false
}

variable "secrets" {
  description = "List of secrets (name and ARN)"
  type = list(object({
    name = string
    arn  = string
  }))
  default = []
}

variable "secret_arns" {
  description = "List of secret ARNs for IAM policy"
  type        = list(string)
  default     = []
}

variable "enable_health_check" {
  description = "Enable health check"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "ecs_execution_role_arn" {
  description = "ARN of the ECS execution role"
  type        = string
}

variable "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  type        = string
}

variable "create_lb" {
  description = "Whether to create a load balancer"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
