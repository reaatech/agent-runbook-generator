output "service_url" {
  description = "URL of the Cloud Run service"
  value       = google_cloud_run_v2_service.main.uri
}

output "service_name" {
  description = "Name of the Cloud Run service"
  value       = google_cloud_run_v2_service.main.name
}

output "service_location" {
  description = "Region of the Cloud Run service"
  value       = google_cloud_run_v2_service.main.location
}

output "service_account_email" {
  description = "Service account email"
  value       = google_service_account.eval_sa.email
}
