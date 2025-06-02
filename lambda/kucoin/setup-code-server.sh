#!/bin/bash

# === STEP 1: Install code-server ===
echo "Installing VS Code Server..."
curl -fsSL https://code-server.dev/install.sh | sh

# === STEP 2: Create code-server config ===
echo "Configuring code-server..."
mkdir -p ~/.config/code-server
cat <<EOF > ~/.config/code-server/config.yaml
bind-addr: 0.0.0.0:8080
auth: password
password: Oshun1!
cert: false
EOF

# === STEP 3: Create systemd service ===
echo "Creating systemd service..."
sudo tee /etc/systemd/system/code-server.service > /dev/null <<EOF
[Unit]
Description=VS Code Server
After=network.target

[Service]
Type=simple
User=ubuntu
ExecStart=/usr/bin/code-server
Restart=always

[Install]
WantedBy=default.target
EOF

# === STEP 4: Enable and start the service ===
echo "Enabling and starting code-server..."
sudo systemctl daemon-reexec
sudo systemctl daemon-reload
sudo systemctl enable code-server
sudo systemctl start code-server

echo "✅ VS Code Server installed and running at http://<your-ec2-ip>:8080"
echo "📌 Login with password: Oshun1!"
