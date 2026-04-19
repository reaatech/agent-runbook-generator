variable "project_name" {
  description = "Name of the Vercel project"
  type        = string
}

variable "framework" {
  description = "Framework preset for the project"
  type        = string
  default     = null
}

variable "team_id" {
  description = "Vercel team ID"
  type        = string
  default     = null
}

variable "git_repository" {
  description = "Git repository to deploy"
  type        = string
  default     = null
}

variable "git_branch" {
  description = "Git branch to deploy"
  type        = string
  default     = "main"
}

variable "root_directory" {
  description = "Root directory of the project"
  type        = string
  default     = null
}

variable "environment_variables" {
  description = "Environment variables for the project"
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "deploy" {
  description = "Whether to create a deployment"
  type        = bool
  default     = false
}

variable "production" {
  description = "Whether to deploy to production"
  type        = bool
  default     = true
}
