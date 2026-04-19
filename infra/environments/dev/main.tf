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
    # key    = "agent-runbook-generator/dev/terraform.tfstate"
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
  cpu                    = 256
  memory                 = 512
  desired_count          = 1
  enable_autoscaling     = false
  create_cluster         = true
  enable_health_check    = true
  log_retention_days     = 30
  create_lb              = true

  environment_variables = {
    NODE_ENV        = "production"
    LOG_LEVEL       = "info"
    LLM_PROVIDER    = var.llm_provider
    OTEL_EXPORTER_OTLP_ENDPOINT = var.otel_endpoint
  }

  tags = {
    Environment = "dev"
    Project     = "agent-runbook-generator"
    ManagedBy   = "terraform"
  }
}
