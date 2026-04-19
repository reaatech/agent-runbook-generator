variable "app_name" {
  description = "Name of the application"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "image_url" {
  description = "Container image URL"
  type        = string
}

variable "cpu" {
  description = "CPU allocation"
  type        = number
  default     = 0.5
}

variable "memory" {
  description = "Memory allocation in GiB"
  type        = number
  default     = 1
}

variable "min_replicas" {
  description = "Minimum number of replicas"
  type        = number
  default     = 0
}

variable "max_replicas" {
  description = "Maximum number of replicas"
  type        = number
  default     = 10
}

variable "create_resource_group" {
  description = "Whether to create a new resource group"
  type        = bool
  default     = true
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = ""
}

variable "existing_resource_group_name" {
  description = "Name of existing resource group to use"
  type        = string
  default     = ""
}

variable "subnet_id" {
  description = "Subnet ID for the container apps environment"
  type        = string
  default     = null
}

variable "environment_variables" {
  description = "Map of environment variables"
  type        = map(string)
  default     = {}
}

variable "secrets" {
  description = "Map of secrets (name => {name, key_vault_secret_id})"
  type        = map(object({
    name                  = string
    key_vault_secret_id   = string
  }))
  default     = {}
  sensitive   = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
