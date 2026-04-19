variable "service_name" {
  description = "Name of the service"
  type        = string
  default     = "agent-runbook-generator"
}

variable "image_url" {
  description = "Container image URL"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "llm_provider" {
  description = "LLM provider (claude, openai, google)"
  type        = string
  default     = "claude"
}

variable "otel_endpoint" {
  description = "OpenTelemetry collector endpoint"
  type        = string
  default     = ""
}
