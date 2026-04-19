terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0.0"
    }
  }

  backend "s3" {
    # Configure S3 backend for state storage
    # bucket = "terraform-state-bucket"
    # key    = "agent-runbook-generator/prod/terraform.tfstate"
    # region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# AWS ECS Module
module "ecs" {
  source = "../../modules/aws-ecs"

  service_name            = var.service_name
  image_url              = var.image_url
  region                 = var.aws_region
  cpu                    = 512
  memory                 = 1024
  desired_count          = 2
  enable_autoscaling     = true
  min_capacity           = 2
  max_capacity           = 10
  target_cpu_utilization = 70
  create_cluster         = true
  enable_health_check    = true
  log_retention_days     = 90
  create_lb              = true

  environment_variables = {
    NODE_ENV        = "production"
    LOG_LEVEL       = "warn"
    LLM_PROVIDER    = var.llm_provider
    OTEL_EXPORTER_OTLP_ENDPOINT = var.otel_endpoint
  }

  tags = {
    Environment = "prod"
    Project     = "agent-runbook-generator"
    ManagedBy   = "terraform"
  }
}
