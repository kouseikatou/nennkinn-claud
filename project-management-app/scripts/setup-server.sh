#!/bin/bash

# Server Setup Script for Ubuntu/Debian
# Run this script on your production server to prepare it for deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root. Use sudo."
        exit 1
    fi
}

# Update system packages
update_system() {
    log_info "Updating system packages..."
    apt-get update
    apt-get upgrade -y
    log_success "System packages updated."
}

# Install Docker
install_docker() {
    log_info "Installing Docker..."
    
    # Remove old versions
    apt-get remove -y docker docker-engine docker.io containerd runc || true
    
    # Install dependencies
    apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    log_success "Docker installed successfully."
}

# Install Docker Compose
install_docker_compose() {
    log_info "Installing Docker Compose..."
    
    # Download Docker Compose
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep -Po '"tag_name": "\K.*?(?=")')
    curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Make it executable
    chmod +x /usr/local/bin/docker-compose
    
    # Create symlink
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    log_success "Docker Compose installed successfully."
}

# Install Nginx (for reverse proxy if not using Docker)
install_nginx() {
    log_info "Installing Nginx..."
    apt-get install -y nginx
    systemctl start nginx
    systemctl enable nginx
    log_success "Nginx installed successfully."
}

# Install Node.js and npm (if needed for PM2 deployment)
install_nodejs() {
    log_info "Installing Node.js..."
    
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Install PM2 globally
    npm install -g pm2
    
    # Set up PM2 startup
    env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
    
    log_success "Node.js and PM2 installed successfully."
}

# Install MySQL client
install_mysql_client() {
    log_info "Installing MySQL client..."
    apt-get install -y mysql-client
    log_success "MySQL client installed successfully."
}

# Set up firewall
setup_firewall() {
    log_info "Setting up firewall..."
    
    # Install ufw if not installed
    apt-get install -y ufw
    
    # Reset firewall rules
    ufw --force reset
    
    # Set default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 80
    ufw allow 443
    
    # Allow MySQL (only from localhost)
    ufw allow from 127.0.0.1 to any port 3306
    
    # Enable firewall
    ufw --force enable
    
    log_success "Firewall configured successfully."
}

# Create deploy user
create_deploy_user() {
    log_info "Creating deploy user..."
    
    # Create user if doesn't exist
    if ! id "deploy" &>/dev/null; then
        useradd -m -s /bin/bash deploy
        usermod -aG docker deploy
        usermod -aG sudo deploy
        
        # Create SSH directory
        mkdir -p /home/deploy/.ssh
        chown deploy:deploy /home/deploy/.ssh
        chmod 700 /home/deploy/.ssh
        
        log_success "Deploy user created successfully."
        log_warning "Please add your SSH public key to /home/deploy/.ssh/authorized_keys"
    else
        log_warning "Deploy user already exists."
    fi
}

# Set up SSL certificate directory
setup_ssl() {
    log_info "Setting up SSL certificate directory..."
    
    mkdir -p /etc/ssl/disability-pension
    chown deploy:deploy /etc/ssl/disability-pension
    chmod 755 /etc/ssl/disability-pension
    
    log_success "SSL directory created."
    log_warning "Please place your SSL certificates in /etc/ssl/disability-pension/"
}

# Install security updates automatically
setup_auto_updates() {
    log_info "Setting up automatic security updates..."
    
    apt-get install -y unattended-upgrades
    dpkg-reconfigure -plow unattended-upgrades
    
    log_success "Automatic updates configured."
}

# Install monitoring tools
install_monitoring() {
    log_info "Installing monitoring tools..."
    
    # Install htop, iotop, nethogs for system monitoring
    apt-get install -y htop iotop nethogs
    
    # Install fail2ban for security
    apt-get install -y fail2ban
    systemctl start fail2ban
    systemctl enable fail2ban
    
    log_success "Monitoring tools installed."
}

# Set up log rotation
setup_log_rotation() {
    log_info "Setting up log rotation..."
    
    cat > /etc/logrotate.d/disability-pension << 'EOF'
/var/log/disability-pension/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 deploy deploy
    postrotate
        docker-compose -f /home/deploy/disability-pension-system/docker-compose.production.yml restart || true
    endscript
}
EOF
    
    log_success "Log rotation configured."
}

# Main execution
main() {
    log_info "Starting server setup for Disability Pension Management System..."
    
    check_root
    update_system
    install_docker
    install_docker_compose
    install_mysql_client
    install_nodejs
    setup_firewall
    create_deploy_user
    setup_ssl
    setup_auto_updates
    install_monitoring
    setup_log_rotation
    
    log_success "Server setup completed successfully!"
    echo ""
    log_info "Next steps:"
    echo "1. Add your SSH public key to /home/deploy/.ssh/authorized_keys"
    echo "2. Place SSL certificates in /etc/ssl/disability-pension/"
    echo "3. Clone your repository to /home/deploy/"
    echo "4. Configure environment variables"
    echo "5. Run the deployment script"
    echo ""
    log_warning "Please reboot the server to ensure all changes take effect."
}

# Run main function
main "$@"