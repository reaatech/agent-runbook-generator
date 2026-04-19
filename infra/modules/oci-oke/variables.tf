variable "compartment_id" {
  description = "OCID of the compartment where resources will be created"
  type        = string
}

variable "vcn_id" {
  description = "OCID of the VCN where the cluster will be created"
  type        = string
}

variable "cluster_name" {
  description = "Name of the OKE cluster"
  type        = string
  default     = "agent-runbook-generator-cluster"
}

variable "cluster_type" {
  description = "Type of OKE cluster (BASIC or STANDARD)"
  type        = string
  default     = "BASIC"
}

variable "kubernetes_version" {
  description = "Kubernetes version for the cluster"
  type        = string
  default     = "v1.27.1"
}

variable "availability_domain" {
  description = "Availability domain for cluster endpoint and node pool"
  type        = string
}

variable "node_pool_name" {
  description = "Name of the node pool"
  type        = string
  default     = "agent-runbook-generator-node-pool"
}

variable "node_shape" {
  description = "Shape of the worker nodes"
  type        = string
  default     = "VM.Standard.E4.Flex"
}

variable "node_shape_config" {
  description = "Configuration for node shape (memory and OCPUs)"
  type = object({
    memory_in_gbs = number
    ocpus          = number
  })
  default = null
}

variable "node_image_id" {
  description = "Image ID for worker nodes"
  type        = string
}

variable "node_metadata" {
  description = "Metadata for nodes"
  type        = map(string)
  default     = {}
}

variable "initial_node_count" {
  description = "Initial number of nodes in the node pool"
  type        = number
  default     = 1
}

variable "ssh_public_key" {
  description = "SSH public key for node access"
  type        = string
  default     = ""
}

variable "is_public_ip_enabled" {
  description = "Whether to enable public IP for cluster endpoint"
  type        = bool
  default     = true
}

variable "nsg_ids" {
  description = "List of NSG IDs for cluster endpoint"
  type        = list(string)
  default     = []
}

variable "enable_dashboard" {
  description = "Whether to enable Kubernetes dashboard"
  type        = bool
  default     = false
}

variable "endpoint_subnet_cidr" {
  description = "CIDR block for endpoint subnet"
  type        = string
  default     = "10.0.10.0/24"
}

variable "lb_subnet_cidr" {
  description = "CIDR block for load balancer subnet"
  type        = string
  default     = "10.0.20.0/24"
}

variable "node_subnet_cidr" {
  description = "CIDR block for node subnet"
  type        = string
  default     = "10.0.30.0/24"
}

variable "vcn_route_table_id" {
  description = "Route table ID for subnets"
  type        = string
  default     = ""
}

variable "vcn_security_list_id" {
  description = "Security list ID for subnets"
  type        = string
  default     = ""
}

variable "create_cluster" {
  description = "Whether to create the cluster"
  type        = bool
  default     = true
}

variable "defined_tags" {
  description = "Defined tags for resources"
  type        = map(map(string))
  default     = {}
}

variable "freeform_tags" {
  description = "Freeform tags for resources"
  type        = map(string)
  default     = {}
}
