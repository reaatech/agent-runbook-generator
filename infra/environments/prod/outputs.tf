output "service_url" {
  description = "URL of the deployed service"
  value       = module.ecs.service_url
}

output "load_balancer_arn" {
  description = "ARN of the load balancer"
  value       = module.ecs.load_balancer_arn
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = module.ecs.service_name
}
