output "project_id" {
  description = "ID of the Vercel project"
  value       = vercel_project.main.id
}

output "project_name" {
  description = "Name of the Vercel project"
  value       = vercel_project.main.name
}

output "deployment_url" {
  description = "URL of the deployment"
  value       = try(vercel_deployment.main[0].url, null)
}

output "project_url" {
  description = "URL of the project"
  value       = vercel_project.main.url
}
