output "public_ip_address" {
  description = "Publiczny adres IP maszyny wirtualnej"
  value       = azurerm_public_ip.main.ip_address
}

output "vm_name" {
  description = "Nazwa maszyny wirtualnej"
  value       = azurerm_linux_virtual_machine.main.name
}

output "ssh_command" {
  description = "Komenda SSH do połączenia z VM"
  value       = "ssh ${var.admin_username}@${azurerm_public_ip.main.ip_address}"
}

output "app_url" {
  description = "Adres URL aplikacji"
  value       = "https://${azurerm_public_ip.main.ip_address}"
}
