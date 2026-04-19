terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
  }
}

resource "vercel_project" "main" {
  name      = var.project_name
  framework = var.framework
  team_id   = var.team_id

  git_repository = var.git_repository
  git_branch     = var.git_branch
  root_directory = var.root_directory

  environment = [
    for key, value in var.environment_variables : {
      key    = key
      value  = value
      target = ["production", "preview"]
    }
  ]
}

resource "vercel_deployment" "main" {
  count = var.deploy ? 1 : 0

  project_id = vercel_project.main.id
  team_id    = var.team_id
  ref        = var.git_branch
  production = var.production
}

resource "vercel_project_environment_variable" "main" {
  for_each = var.environment_variables

  project_id = vercel_project.main.id
  team_id    = var.team_id
  key        = each.key
  value      = each.value
  target     = ["production", "preview"]
}
