terraform {
  required_providers {
    netlify = {
      source  = "netlify/netlify"
      version = "~> 0.2"
    }
  }
}

resource "netlify_site" "main" {
  name           = var.site_name
  account_slug   = var.account_slug
  account_name   = var.account_name
  force_destroy  = var.force_destroy
}

resource "netlify_build_hook" "main" {
  site_id    = netlify_site.main.id
  title      = "CI/CD Build Hook"
  branch     = var.production_branch
  build_hook = var.build_hook
}

resource "netlify_deploy_key" "main" {
  site_id = netlify_site.main.id
  title   = "Deploy Key"
}

resource "netlify_site_snippet" "main" {
  site_id = netlify_site.main.id
  title   = "Security Headers"
  general = var.security_headers_snippet
}

resource "netlify_site_snippet" "redirects" {
  site_id = netlify_site.main.id
  title   = "Redirect Rules"
  general = var.redirect_rules
}
