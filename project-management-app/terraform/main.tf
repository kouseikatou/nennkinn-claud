terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "nennkinn-claude"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-northeast1"
}

variable "zone" {
  description = "GCP zone"
  type        = string
  default     = "asia-northeast1-a"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "disability-pension"
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "compute.googleapis.com",
    "container.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "storage.googleapis.com",
    "secretmanager.googleapis.com"
  ])
  
  project = var.project_id
  service = each.value
  
  disable_on_destroy = false
}

# VPC Network
resource "google_compute_network" "main" {
  name                    = "${var.app_name}-vpc"
  auto_create_subnetworks = false
  depends_on              = [google_project_service.apis]
}

# Subnet
resource "google_compute_subnetwork" "main" {
  name          = "${var.app_name}-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.main.id
  
  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.1.0.0/16"
  }
  
  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.2.0.0/16"
  }
}

# Firewall rules
resource "google_compute_firewall" "allow_http" {
  name    = "${var.app_name}-allow-http"
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
    ports    = ["80", "443", "8080"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["web-server"]
}

resource "google_compute_firewall" "allow_ssh" {
  name    = "${var.app_name}-allow-ssh"
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["ssh-server"]
}

# Cloud SQL instance - commented out due to API permissions
# resource "google_sql_database_instance" "main" {
#   name             = "${var.app_name}-db"
#   database_version = "MYSQL_8_0"
#   region           = var.region
#   
#   settings {
#     tier = "db-f1-micro"
#     
#     backup_configuration {
#       enabled    = true
#       start_time = "03:00"
#       
#       backup_retention_settings {
#         retained_backups = 7
#       }
#     }
#     
#     ip_configuration {
#       ipv4_enabled    = true
#       authorized_networks {
#         value = "0.0.0.0/0"
#         name  = "all"
#       }
#     }
#     
#     database_flags {
#       name  = "character_set_server"
#       value = "utf8mb4"
#     }
#   }
#   
#   deletion_protection = false
#   depends_on         = [google_project_service.apis]
# }

# Database
# resource "google_sql_database" "main" {
#   name     = "disability_pension_production"
#   instance = google_sql_database_instance.main.name
#   charset  = "utf8mb4"
#   collation = "utf8mb4_unicode_ci"
# }

# Database user
# resource "google_sql_user" "main" {
#   name     = "pension_user"
#   instance = google_sql_database_instance.main.name
#   password = random_password.db_password.result
# }

# random_password.db_password" {
#   length  = 16
#   special = true
# }

# GKE Cluster - commented out for simplified deployment
# resource "google_container_cluster" "main" {
#   name     = "${var.app_name}-gke"
#   location = var.zone
#   
#   remove_default_node_pool = true
#   initial_node_count       = 1
#   
#   network    = google_compute_network.main.name
#   subnetwork = google_compute_subnetwork.main.name
#   
#   ip_allocation_policy {
#     cluster_secondary_range_name  = "pods"
#     services_secondary_range_name = "services"
#   }
#   
#   depends_on = [google_project_service.apis]
# }

# GKE Node Pool - commented out
# resource "google_container_node_pool" "main" {
#   name       = "${var.app_name}-node-pool"
#   location   = var.zone
#   cluster    = google_container_cluster.main.name
#   node_count = 1

#   node_config {
#     preemptible  = false
#     machine_type = "e2-standard-2"
#     
#     service_account = google_service_account.gke_nodes.email
#     oauth_scopes = [
#       "https://www.googleapis.com/auth/cloud-platform"
#     ]
#     
#     tags = ["web-server", "ssh-server"]
#   }
#   
#   management {
#     auto_repair  = true
#     auto_upgrade = true
#   }
# }

# Service Account for GKE nodes - commented out
# resource "google_service_account" "gke_nodes" {
#   account_id   = "${var.app_name}-gke-nodes"
#   display_name = "GKE Node Service Account"
# }

# resource "google_project_iam_member" "gke_nodes" {
#   for_each = toset([
#     "roles/logging.logWriter",
#     "roles/monitoring.metricWriter",
#     "roles/monitoring.viewer",
#     "roles/storage.objectViewer"
#   ])
#   
#   project = var.project_id
#   role    = each.value
#   member  = "serviceAccount:${google_service_account.gke_nodes.email}"
# }

# Compute Engine instance (alternative deployment)
resource "google_compute_instance" "main" {
  name         = "${var.app_name}-vm"
  machine_type = "e2-standard-2"
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 20
    }
  }

  network_interface {
    network    = google_compute_network.main.name
    subnetwork = google_compute_subnetwork.main.name
    
    access_config {
      // Ephemeral public IP
    }
  }

  tags = ["web-server", "ssh-server"]

  metadata_startup_script = file("${path.module}/startup-script.sh")

  service_account {
    email  = google_service_account.compute.email
    scopes = ["cloud-platform"]
  }
  
  depends_on = [google_project_service.apis]
}

# Service Account for Compute Engine
resource "google_service_account" "compute" {
  account_id   = "${var.app_name}-compute"
  display_name = "Compute Engine Service Account"
}

# Cloud Storage bucket for backups
resource "google_storage_bucket" "backups" {
  name     = "${var.project_id}-${var.app_name}-backups"
  location = var.region
  
  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }
  
  versioning {
    enabled = true
  }
  
  depends_on = [google_project_service.apis]
}

# Load Balancer
resource "google_compute_global_address" "main" {
  name = "${var.app_name}-ip"
}

resource "google_compute_managed_ssl_certificate" "main" {
  name = "${var.app_name}-ssl-cert"

  managed {
    domains = ["${var.app_name}.${var.project_id}.nip.io"]
  }
}

# Cloud Build trigger (optional - commented out for now)
# resource "google_cloudbuild_trigger" "main" {
#   name = "${var.app_name}-build-trigger"
#   
#   github {
#     owner = "your-github-username"
#     name  = "disability-pension-system"
#     push {
#       branch = "main"
#     }
#   }
#   
#   filename = "cloudbuild.yaml"
#   
#   depends_on = [google_project_service.apis]
# }

# Outputs
output "instance_ip" {
  description = "Public IP of the compute instance"
  value       = google_compute_instance.main.network_interface[0].access_config[0].nat_ip
}

# output "sql_instance_ip" {
#   description = "IP address of the Cloud SQL instance"
#   value       = google_sql_database_instance.main.ip_address[0].ip_address
# }

output "load_balancer_ip" {
  description = "Load balancer IP address"
  value       = google_compute_global_address.main.address
}

output "application_url" {
  description = "Application URL"
  value       = "http://${google_compute_instance.main.network_interface[0].access_config[0].nat_ip}"
}