# Production Deployment Guide (VPS)

This guide provides a comprehensive, step-by-step walkthrough to deploy the TradingView to Tradovate Webhook Bridge onto a standard Linux Virtual Private Server (VPS) such as DigitalOcean, AWS EC2, Hetzner, or Linode running **Ubuntu 22.04 LTS or newer**.

This production setup utilizes `docker-compose.prod.yml`, placing the backend, frontend, Postgres, and Redis behind a secure Nginx reverse proxy with automated SSL (HTTPS) termination.

---

## Step 1: VPS Provisioning & Initial Setup

1. **Spin up a Server:** Rent a Linux VPS with at least 2GB of RAM and 1 CPU Core. (Ubuntu 22.04 LTS or 24.04 LTS is recommended).
2. **Point your Domain System (DNS):** Create two `A` records in your domain registrar (e.g. Cloudflare, Namecheap, GoDaddy).
   - `trading.yourdomain.com` ➡️ pointing to your VPS IP address.
3. **SSH into the server:**
   ```bash
   ssh root@YOUR_SERVER_IP
   ```
4. **Update system packages:**
   ```bash
   apt update && apt upgrade -y
   ```

---

## Step 2: Install Docker and Docker Compose

You need Docker installed on the server to run the containers.

```bash
# 1. Install Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 2. Verify Docker is running
systemctl status docker --no-pager

# 3. Enable Docker to start on boot
systemctl enable docker
```

*(Docker Compose is now bundled as a CLI plugin natively via `docker compose`, making the installation simple)*

---

## Step 3: Install Certbot (for free SSL Certificates)

Because TradingView requires `HTTPS` for webhooks securely over the internet, we will use Let's Encrypt to generate free SSL certificates.

```bash
# 1. Install Certbot
apt install certbot -y

# 2. Generate the SSL Certificates for your domain (Replace 'trading.yourdomain.com' and your email)
certbot certonly --standalone -d trading.yourdomain.com --agree-tos --email you@yourdomain.com -n

# Certbot will output the locations of the keys. They are usually found in:
# /etc/letsencrypt/live/trading.yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/trading.yourdomain.com/privkey.pem
```

---

## Step 4: Clone the Project Repository

Pull your specialized webhook bridge code onto the production server.

```bash
# 1. Install git
apt install git -y

# 2. Clone the repository into the /opt directory
cd /opt
# Replace with your actual git repository URL. If it is private, set up SSH keys or use a Personal Access Token (PAT).
git clone https://github.com/jetheredge-lab/webhook.git app
cd app
```

---

## Step 5: Configure the Environment Variables

We need to provide all the production secrets explicitly out of version control. 

```bash
# Copy the structure
cp .env.example .env

# Open it with the nano editor
nano .env
```

**Inside the `.env` file, apply the following changes:**

**1. Application Setup:**
- Change `NODE_ENV=development` to `NODE_ENV=production`.

**2. Cryptographic Secrets (CRITICAL SECURITY):**
- Generate strong, completely randomized 32-character secure hashes for both `APP_SECRET` and `WEBHOOK_SECRET`. 
- *(Pro Tip: Keep the terminal open with nano, duplicate your SSH connection in another window, and run `openssl rand -hex 32` twice. Copy those strings and paste them here).*
- `APP_SECRET`: This encrypts your system tokens and Tradovate API keys inside Postgres. Make it very secure.
- `WEBHOOK_SECRET`: This acts as a password for TradingView to authorize webhooks securely. Remember this exact string, as you'll attach it to all TradingView alerts later.

**3. Database Configuration (Postgres & Redis):**
- Locate `POSTGRES_PASSWORD=change_this_to_a_secure_database_password`. 
- Generate a brand new ultra secure password and replace `change_this_to_a_secure_database_password` with it.
- **That is all!** Both the `DATABASE_URL` below it and the internal Docker Container will dynamically construct themselves to perfectly mirror whatever password string you enter on that line natively!

**4. Initial System Admin Account:**
- `DASHBOARD_USERNAME`: Choose an initial operator ID (e.g., `admin`).
- `DASHBOARD_PASSWORD`: Pick a strong password. You will use these exact credentials to log into the frontend dashboard the very first time. (You can change/reset this later through the system UI).

**5. SSL/Domain Mappings (Prod Only):**
- Update `DOMAIN=your-domain.com` to exactly match your DNS records (e.g., `DOMAN=trading.yourdomain.com`). Nginx requires this internally to resolve incoming alerts correctly.
- Update `CERTBOT_EMAIL` to a real email address so Let's Encrypt can notify you before your free SSL certificates expire.

Once you have configured everything, save and close the file (`CTRL+O` to write, `Enter` to confirm, then `CTRL+X` to exit nano).

---

## Step 6: Configure Nginx File for Production

The standard `nginx.prod.conf` handles SSL termination automatically but you must insert your specific domain strictly to map to the certs.

```bash
nano nginx/nginx.prod.conf
```

Find the `server` block for port 443 and replace `trading.yourdomain.com` with your exact domain matching the Certbot file path.
Ensure the cert paths match:
`ssl_certificate /etc/letsencrypt/live/trading.yourdomain.com/fullchain.pem;`
`ssl_certificate_key /etc/letsencrypt/live/trading.yourdomain.com/privkey.pem;`

Save and exit.

---

## Step 7: Build and Launch the Project

With the `.env` mapped and Nginx SSL mapped, Boot the entire Docker fleet logic natively:

```bash
# Run the secure production variant
docker compose -f docker-compose.prod.yml up -d --build
```

Docker will now download `node`, `postgres`, `redis`, and compile your frontend/backend systems safely into hardened containers.

---

## Step 9: Execute Database Migrations

Your database is spinning empty. You need to push your Prisma schema mapping inside the running Backend container.

```bash
# 1. Execute prisma migration exclusively against the backend container internally:
docker compose -f docker-compose.prod.yml exec app-backend npx prisma migrate deploy --preview-feature

# 2. Generate backend types silently
docker compose -f docker-compose.prod.yml exec app-backend npx prisma generate
```

> **Troubleshooting Prisma Connection Failures:**
> If you receive an error stating `Container is restarting` or an `Authentication Failed` error from Postgres, this means your Docker containers started **before** you finished updating the `.env` database passwords, securely locking the previous passwords into the internal Docker Volumes forever. To reset Postgres and apply the new hashes, run this to completely purge the old volumes and rebuild:
> ```bash
> docker compose -f docker-compose.prod.yml down -v
> docker compose -f docker-compose.prod.yml up -d --build
> ```

---

## Step 10: Configure Linux Firewall (UFW)

Lock down the server tightly maping everything so only web traffic (and SSH) gets through. The internal Docker network will protect Postgres and Redis natively!

```bash
ufw allow OpenSSH
ufw allow "Nginx Full"
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```
*(When prompted "Command may disrupt existing ssh connections", press `y` and `Enter`.)*

---

## Step 11: Set TradingView Webhook URL

Everything is now online, secured behind HTTPS and firing natively into the robust Redis queues.

Head over to **TradingView**. When creating an alert, set your Webhook URL securely to:

**`https://trading.yourdomain.com/webhook/tradingview`**

Copy the raw `JSON` mapped from the Application's **"Alert Generator"** directly into TradingView's message box, and ensure the secret provided in that box seamlessly flawlessly maps internally to the `WEBHOOK_SECRET` mapped to your VPS logic!

## Summary

- **App Status:** `docker compose -f docker-compose.prod.yml ps -a`
- **View Logs:** `docker compose -f docker-compose.prod.yml logs -f app-backend`
- **Restart App:** `docker compose -f docker-compose.prod.yml restart`
