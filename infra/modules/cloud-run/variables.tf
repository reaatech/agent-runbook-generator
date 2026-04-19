variable "service_name" {
  description = "Name of the Cloud Run service"
  type        = string
}

variable "region" {
  description = "Google Cloud region"
  type        = string
}

variable "project_id" {
  description = "Google Cloud project ID"
  type        = string
}

variable "image_url" {
  description = "Container image URL"
  type        = string
}

variable "cpu_limit" {
  description = "CPU limit for the container"
  type        = string
  default     = "1"
}

variable "memory_limit" {
  description = "Memory limit for the container"
  type        = string
  default     = "512Mi"
}

variable "max_instance_count" {
  description = "Maximum number of instances"
  type        = number
  default     = 100
}

variable "min_instance_count" {
  description = "Minimum number of instances (0 for scale to zero)"
  type        = number
  default     = 0
}

variable "max_instance_request_concurrency" {
  description = "Maximum concurrent requests per instance"
  type        = number
  default     = 80
}

variable "environment_variables" {
  description = "Environment variables to set"
  type        = map(string)
  default     = {}
}

variable "secret_environment_variables" {
  description = "Secret environment variables"
  type = list(object({
    name    = string
    secret  = string
    version = string
  }))
  default = []
}

variable "ingress" {
  description = "Ingress settings (all, internal, internal-and-cloud-load-balancing)"
  type        = string
  default     = "all"
}

variable "allow_unauthenticated" {
  description = "Allow unauthenticated invocations"
  type        = bool
  default     = true
}

variable "traffic_percentages" {
  description = "Traffic percentages for revisions"
  type        = list(number)
  default     = [100]
}
