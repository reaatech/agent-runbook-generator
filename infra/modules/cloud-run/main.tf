resource "google_cloud_run_v2_service" "main" {
  name     = var.service_name
  location = var.region
  ingress  = var.ingress

  template {
    max_instance_count         = var.max_instance_count
    min_instance_count         = var.min_instance_count
    max_instance_request_concurrency = var.max_instance_request_concurrency

    containers {
      image = var.image_url

      dynamic "env" {
        for_each = var.environment_variables
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = var.secret_environment_variables
        content {
          name = env.value.name
          value_source {
            secret_key_ref {
              secret  = env.value.secret
              version = env.value.version
            }
          }
        }
      }

      resources {
        limits = {
          cpu    = var.cpu_limit
          memory = var.memory_limit
        }
      }
    }

    service_account = google_service_account.eval_sa.email

    scaling {
      min_instance_count = var.min_instance_count
      max_instance_count = var.max_instance_count
    }
  }

  traffic_percentages = var.traffic_percentages

  autogenerate_description = true
}

resource "google_service_account" "eval_sa" {
  account_id   = "${var.service_name}-sa"
  display_name = "Service account for ${var.service_name}"
  description  = "Service account for Cloud Run service: ${var.service_name}"
}

resource "google_cloud_run_service_iam_member" "allow_unauthenticated" {
  count    = var.allow_unauthenticated ? 1 : 0
  location = google_cloud_run_v2_service.main.location
  project  = var.project_id
  name     = google_cloud_run_v2_service.main.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
