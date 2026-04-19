output "site_id" {
  description = "ID of the Netlify site"
  value       = netlify_site.main.id
}

output "site_url" {
  description = "URL of the Netlify site"
  value       = netlify_site.main.url
}

output "deploy_url" {
  description = "Deploy preview URL"
  value       = netlify_site.main.deploy_url
}

output "admin_url" {
  description = "Admin URL of the Netlify site"
  value       = netlify_site.main.admin_url
}

output "build_hook_id" {
  description = "ID of the build hook"
  value       = try(netlify_build_hook.main.id, null)
}

output "deploy_key" {
  description = "Deploy key for the site"
  value       = try(netlify_deploy_key.main.key, null)
  sensitive   = true
}
