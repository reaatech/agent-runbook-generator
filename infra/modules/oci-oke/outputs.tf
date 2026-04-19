output "cluster_id" {
  description = "OCID of the OKE cluster"
  value       = try(oci_containerengine_cluster.main[0].id, null)
}

output "cluster_name" {
  description = "Name of the OKE cluster"
  value       = var.cluster_name
}

output "cluster_endpoint" {
  description = "Endpoint of the OKE cluster"
  value       = try(oci_containerengine_cluster.main[0].endpoints[0].private_endpoint, null)
}

output "node_pool_id" {
  description = "OCID of the node pool"
  value       = try(oci_containerengine_node_pool.main[0].id, null)
}

output "kubeconfig" {
  description = "Kubeconfig for the cluster"
  value       = try(oci_containerengine_cluster.main[0].metadata[0].kubeconfig, null)
  sensitive   = true
}

output "cluster_options" {
  description = "Cluster options"
  value       = try(oci_containerengine_cluster.main[0].cluster_options, null)
}
