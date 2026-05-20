variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
}

variable "resource_group_name" {
  description = "Nazwa grupy zasobów"
  type        = string
  default     = "rg-technologie-chmurowe"
}

variable "location" {
  description = "Region Azure"
  type        = string
  default     = "polandcentral"
}

variable "vm_size" {
  description = "Rozmiar VM"
  type        = string
  default     = "Standard_D2s_v3"
}

variable "admin_username" {
  description = "Nazwa użytkownika SSH"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key" {
  description = "Klucz publiczny SSH (zawartość pliku .pub)"
  type        = string
}

variable "project_name" {
  description = "Prefiks nazw zasobów"
  type        = string
  default     = "tc"
}
