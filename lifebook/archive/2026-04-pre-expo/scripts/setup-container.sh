#!/bin/bash

# Ubuntu LXC Container Setup Script for Development
# Run this script on the container: ssh claude@10.90.10.17 < setup-container.sh

echo "=== Setting up Ubuntu LXC Container for Development ==="

# Update system
sudo apt update && sudo apt upgrade -y

# Install essential development tools
sudo apt install -y \
    curl \
    wget \
    git \
    vim \
    nano \
    htop \
    tree \
    unzip \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    jq

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add claude user to docker group
sudo usermod -aG docker claude

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Python 3 and pip
sudo apt install -y python3 python3-pip python3-venv

# Install PostgreSQL client
sudo apt install -y postgresql-client

# Install Redis tools
sudo apt install -y redis-tools

# Create development directories
mkdir -p ~/projects
mkdir -p ~/scripts
mkdir -p ~/.ssh

# Set up Git configuration (you'll need to customize this)
git config --global user.name "Claude Dev"
git config --global user.email "dev@example.com"

# Configure SSH for passwordless sudo (optional - for automation)
echo "claude ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/claude

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 3000  # React dev server
sudo ufw allow 8000  # Backend API
sudo ufw allow 5432  # PostgreSQL
sudo ufw allow 6379  # Redis
sudo ufw allow 9200  # Elasticsearch
sudo ufw --force enable

echo "=== Container setup complete! ==="
echo "Next steps:"
echo "1. Test Docker: docker --version"
echo "2. Test Node.js: node --version && npm --version"
echo "3. Clone your repositories to ~/projects/"
echo "4. Set up your development environment"

# Display system info
echo ""
echo "=== System Information ==="
echo "OS: $(lsb_release -d | cut -f2)"
echo "Kernel: $(uname -r)"
echo "Docker: $(docker --version 2>/dev/null || echo 'Not installed')"
echo "Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
echo "NPM: $(npm --version 2>/dev/null || echo 'Not installed')"
echo "Git: $(git --version 2>/dev/null || echo 'Not installed')"