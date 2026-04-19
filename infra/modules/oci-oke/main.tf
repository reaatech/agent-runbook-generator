terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
  }
}

resource "oci_containerengine_cluster" "main" {
  count = var.create_cluster ? 1 : 0

  cluster_options {
    add_ons {
      is_kubernetes_dashboard_enabled = var.enable_dashboard
      is_tiller_enabled               = false
    }

    service_lb_subnet_ids = [oci_core_subnet.lb_subnet[0].id]
  }

  compartment_id = var.compartment_id
  endpoint_config {
    is_public_ip_enabled = var.is_public_ip_enabled
    nsg_ids              = var.nsg_ids
    subnet_id            = oci_core_subnet.endpoint_subnet[0].id
  }

  kubernetes_version = var.kubernetes_version
  metadata {
    defined_tags = var.defined_tags
    display_name = var.cluster_name
    freeform_tags = merge(
      {
        "managed_by" = "terraform"
      },
      var.freeform_tags
    )
  }

  type = var.cluster_type
  vcn_id = var.vcn_id
}

resource "oci_containerengine_node_pool" "main" {
  count = var.create_cluster ? 1 : 0

  cluster_id       = oci_containerengine_cluster.main[0].id
  compartment_id   = var.compartment_id
  kubernetes_version = var.kubernetes_version
  node_config_details {
    placement_configs {
      availability_domain = var.availability_domain
      subnet_id           = oci_core_subnet.node_subnet[0].id
    }
  }

  node_shape = var.node_shape

  dynamic "node_shape_config" {
    for_each = var.node_shape_config != null ? [var.node_shape_config] : []
    content {
      memory_in_gbs = node_shape_config.value.memory_in_gbs
      ocpus          = node_shape_config.value.ocpus
    }
  }

  node_source_details {
    image_id    = var.node_image_id
    source_type = "IMAGE"
  }

  dynamic "node_metadata" {
    for_each = var.node_metadata
    content {
      key   = node_metadata.key
      value = node_metadata.value
    }
  }

  initial_node_count = var.initial_node_count
  ssh_public_key     = var.ssh_public_key

  metadata {
    defined_tags = var.defined_tags
    display_name = var.node_pool_name
    freeform_tags = merge(
      {
        "managed_by" = "terraform"
      },
      var.freeform_tags
    )
  }
}

resource "oci_core_subnet" "endpoint_subnet" {
  count = var.create_cluster ? 1 : 0

  cidr_block     = var.endpoint_subnet_cidr
  compartment_id = var.compartment_id
  display_name   = "${var.cluster_name}-endpoint-subnet"
  vcn_id         = var.vcn_id
  dns_label      = "endpoint"
  route_table_id = var.vcn_route_table_id
  security_list_ids = [var.vcn_security_list_id]
}

resource "oci_core_subnet" "lb_subnet" {
  count = var.create_cluster ? 1 : 0

  cidr_block     = var.lb_subnet_cidr
  compartment_id = var.compartment_id
  display_name   = "${var.cluster_name}-lb-subnet"
  vcn_id         = var.vcn_id
  dns_label      = "lb"
  route_table_id = var.vcn_route_table_id
  security_list_ids = [var.vcn_security_list_id]
}

resource "oci_core_subnet" "node_subnet" {
  count = var.create_cluster ? 1 : 0

  cidr_block     = var.node_subnet_cidr
  compartment_id = var.compartment_id
  display_name   = "${var.cluster_name}-node-subnet"
  vcn_id         = var.vcn_id
  dns_label      = "nodes"
  route_table_id = var.vcn_route_table_id
  security_list_ids = [var.vcn_security_list_id]
}
