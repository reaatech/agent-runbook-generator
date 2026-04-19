variable "site_name" {
  description = "Name of the Netlify site"
  type        = string
}

variable "account_slug" {
  description = "Netlify account slug"
  type        = string
  default     = null
}

variable "account_name" {
  description = "Netlify account name"
  type        = string
  default     = null
}

variable "force_destroy" {
  description = "Allow the site to be deleted even if it contains files"
  type        = bool
  default     = false
}

variable "production_branch" {
  description = "Production branch for the site"
  type        = string
  default     = "main"
}

variable "build_hook" {
  description = "Build hook for CI/CD"
  type        = string
  default     = null
}

variable "security_headers_snippet" {
  description = "Security headers snippet"
  type        = string
  default     = null
}

variable "redirect_rules" {
  description = "Redirect rules"
  type        = string
  default     = null
}
