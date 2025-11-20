# Whisper Deployment Guide (Ubuntu VPS)

This guide details how to deploy the Whisper application to an Ubuntu VPS using Nginx as a reverse proxy, PM2 for process management, and Certbot for SSL.

## Prerequisites

- An Ubuntu VPS (20.04 or 22.04 recommended).
- Root access or a user with `sudo` privileges.
- A domain name pointing to your VPS IP address (e.g., `sss.andri.is`).

## 1. Server Setup

Update your package list and upgrade existing packages:

```bash
sudo apt update && sudo apt upgrade -y
```

Install Node.js (LTS version) and npm:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Install Nginx:

```bash
sudo apt install nginx -y
```

Install PM2 (Process Manager) globally:

```bash
sudo npm install -g pm2
```

## 2. Clone and Setup Application

Clone your repository to the server (e.g., in `/var/www/whisper`):

```bash
# Create directory and change ownership (replace 'youruser' with your actual username)
sudo mkdir -p /var/www/whisper
sudo chown -R $USER:$USER /var/www/whisper

# Clone repo (or copy files)
git clone https://github.com/andripetur/Whisper.git /var/www/whisper
cd /var/www/whisper
```

### Backend Setup

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

Start the backend with PM2:

```bash
pm2 start server.js --name "whisper-backend"
pm2 save
pm2 startup
```

### Frontend Setup

Navigate to the client directory, install dependencies, and build:

```bash
cd ../client
npm install
npm run build
```

This will create a `dist` directory containing your production-ready frontend files.

## 3. Nginx Configuration

Create a new Nginx configuration file for your site:

```bash
sudo nano /etc/nginx/sites-available/whisper
```

Paste the following configuration (replace `sss.andri.is` with your actual domain):

```nginx
server {
    listen 80;
    server_name sss.andri.is;

    root /var/www/whisper/client/dist;
    index index.html;

    # Serve Frontend (SPA support)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/whisper /etc/nginx/sites-enabled/
sudo nginx -t # Test configuration
sudo systemctl restart nginx
```

## 4. SSL Setup (HTTPS)

Install Certbot and the Nginx plugin:

```bash
sudo apt install certbot python3-certbot-nginx -y
```

Obtain and install the SSL certificate:

```bash
sudo certbot --nginx -d sss.andri.is
```

Follow the prompts. Certbot will automatically update your Nginx configuration to force HTTPS.

## 5. Maintenance

- **View Logs**: `pm2 logs whisper-backend`
- **Restart Backend**: `pm2 restart whisper-backend`
- **Update Frontend**:
  1. `git pull`
  2. `cd client && npm install && npm run build`
