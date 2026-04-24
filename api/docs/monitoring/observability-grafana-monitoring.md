# Production Observability Setup

This setup allows you to test the observability stack (Loki, Promtail, Grafana) with your production application locally before deploying to VPS.

## Files Created

- **`docker-compose.yml`** - Unified Docker Compose file with backend, Redis, and observability stack
- **`monitoring/promtail-config.yml`** - Promtail configuration with both Docker Service Discovery and file-based logs
- **`monitoring/loki-config.yml`** - Loki configuration (storage, retention, WAL)

## Quick Start

### Step 1: Build the Production Image

```bash
# Build the production image from data/Dockerfile
docker build -f data/Dockerfile -t proconnect-deploy:local .
```

### Step 2: Start Services

```bash
# 1. Create .env file (copy from .env.example and fill in your values)
cp .env.example .env
# Edit .env with your actual configuration (database URL, PORT=3010, etc.)
# Note: Redis connection is already configured in docker-compose.yml

# 2. Create directories for observability data
mkdir -p .observability-data/{loki,promtail,grafana}

# 3. Start all services
docker compose up -d

# 4. Check status
docker compose ps
```

**Note**:

- The `proconnect_backend` service reads environment variables from `.env` file
- Set `PORT=3010` in `.env` so the app matches the docker-compose port mapping `3010:3010`
- Redis connection is already configured in `docker-compose.yml` (`REDIS_HOST=redis`, `REDIS_PORT=6379`)
- Configure database URL and other required variables in `.env` before starting

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Host                          │
│                                                         │
│  ┌──────────────────┐      ┌──────────────────────┐   │
│  │ proconnect_backend│      │  Observability Stack │   │
│  │  (port 3010)     │      │                      │   │
│  │                  │      │  ┌────────────────┐  │   │
│  │  stdout/stderr   │─────▶│  │   Promtail     │  │   │
│  │       │          │      │  │  (log collector)│  │   │
│  │       ▼          │      │  │       │        │  │   │
│  │  /var/lib/docker/│      │  │       ▼        │  │   │
│  │  containers/     │      │  │     Loki       │  │   │
│  └──────────────────┘      │  │  (log storage) │  │   │
│                            │  │       │        │  │   │
│  ┌──────────────────┐      │  │       ▼        │  │   │
│  │ Redis            │      │  │   Grafana      │  │   │
│  │  (port 6379)     │      │  │ (visualization)│  │   │
│  └──────────────────┘      │  └────────────────┘  │   │
│                            └──────────────────────┘   │
│                                                         │
│  Shared Network: proconnect-network                     │
└─────────────────────────────────────────────────────────┘
```

## Services

### 1. proconnect_backend

- **Image**: Built from `data/Dockerfile`
- **Port**: 3010 (set `PORT=3010` in `.env` to match docker-compose mapping)
- **Environment**: Reads from `.env` file (database URL, Redis connection, etc.)
- **Logs**: Collected via Docker logging driver
- **Network**: proconnect-network

### 2. Redis

- **Image**: redis:7-alpine
- **Port**: 6380 (mapped to container port 6379)
- **Purpose**: Caching and session storage
- **Network**: proconnect-network

### 3. Redis Commander

- **Image**: rediscommander/redis-commander:latest
- **Port**: 8081
- **Purpose**: Redis management UI
- **Network**: proconnect-network

### 4. Loki

- **Image**: grafana/loki:2.9.6
- **Port**: 3100
- **Purpose**: Log aggregation and storage
- **Network**: proconnect-network

### 5. Promtail
- **Image**: grafana/promtail:2.9.6
- **Purpose**: Log collection from Docker containers and files
- **Features**:
  - Docker Service Discovery (auto-discovers all containers)
  - File-based logs support (for staging/PM2)
  - Reads from `/var/lib/docker/containers/`
  - Accesses Docker socket via `/var/run/docker.sock`
- **Network**: proconnect-network

### 6. Grafana

- **Image**: grafana/grafana:10.4.5
- **Port**: 3200
- **Purpose**: Log visualization and querying
- **Credentials**: admin/change_me (configurable via `.env`)
- **Network**: proconnect-network

## Access Points

- **Grafana**: http://localhost:3200

  - Username: `admin`
  - Password: `change_me` (or set via `GRAFANA_ADMIN_PASSWORD` in `.env`)

- **Application**: http://localhost:3010

- **Redis Commander**: http://localhost:8081

- **Redis**: localhost:6380 (if you need to connect directly)

- **Loki API**: http://localhost:3100

## Grafana Queries

### Basic Queries

```logql
# All logs from your application
{container_name="proconnect_backend"}

# All container logs
{job="docker-containers"}

# Logs from specific image
{image_name="proconnect-deploy:local"}
```

### Filter Queries

```logql
# Logs containing "error"
{container_name="proconnect_backend"} |= "error"

# Logs NOT containing "debug"
{container_name="proconnect_backend"} != "debug"

# Logs with specific level (if your app logs levels)
{container_name="proconnect_backend"} |= "level=error"
```

### Time-based Queries

```logql
# Last 5 minutes
{container_name="proconnect_backend"} | logfmt

# Rate of errors per minute
rate({container_name="proconnect_backend"} |= "error" [5m])
```

## Useful Commands

### Service Management

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Restart specific service
docker compose restart promtail

# View logs from all services
docker compose logs -f

# View logs from specific service
docker compose logs -f proconnect_backend
```

### Troubleshooting

```bash
# Check Promtail targets (what containers it's monitoring)
docker compose exec promtail wget -qO- http://localhost:9080/targets

# Check Promtail configuration
docker compose exec promtail cat /etc/promtail/config.yml

# View Promtail logs
docker compose logs promtail --tail 50

# View Loki logs
docker compose logs loki --tail 50

# Test Loki API
curl http://localhost:3100/loki/api/v1/labels

# Get available container names
curl http://localhost:3100/loki/api/v1/label/container_name/values

# Query logs via API
curl -G http://localhost:3100/loki/api/v1/query_range \
  --data-urlencode 'query={container_name="proconnect_backend"}' \
  --data-urlencode 'limit=100'
```

### Docker Inspection

```bash
# Check if Promtail can access Docker socket
docker compose exec promtail ls -la /var/run/docker.sock

# Check if Promtail can read container logs
docker compose exec promtail ls -la /var/lib/docker/containers/

# View container log files
ls -la /var/lib/docker/containers/*/*-json.log
```

## Troubleshooting Guide

### Issue: Logs not appearing in Grafana

**Check 1: Verify Promtail is running**

```bash
docker compose ps promtail
docker compose logs promtail
```

**Check 2: Verify Promtail can access Docker socket**

```bash
docker compose exec promtail ls -la /var/run/docker.sock
```

**Check 3: Check Promtail targets**

```bash
docker compose exec promtail wget -qO- http://localhost:9080/targets
```

**Check 4: Verify Loki is receiving logs**

```bash
docker compose logs loki | grep "received"
```

**Check 5: Test Loki API directly**

```bash
curl http://localhost:3100/loki/api/v1/labels
```

### Issue: Promtail permission errors

**Solution: Fix Docker socket permissions**

```bash
sudo chmod 666 /var/run/docker.sock
```

### Issue: Container logs not being collected

**Check 1: Verify container is running**

```bash
docker compose ps proconnect_backend
```

**Check 2: Check if log files exist**

```bash
ls -la /var/lib/docker/containers/*/*-json.log
```

**Check 3: Generate test logs**

```bash
curl http://localhost:3010/health
docker compose logs proconnect_backend --tail 20
```

## Deployment to VPS

Once tested locally, you can deploy to VPS:

1. **Upload files to VPS**

```bash
scp -r docker-compose.yml monitoring/ user@vps:/path/to/project/
```

2. **On VPS, start services**

```bash
cd /path/to/project
docker compose up -d
```

3. **Configure firewall** (restrict access to specific IPs)

```bash
sudo ufw allow from YOUR_IP to any port 3200
sudo ufw deny 3200
sudo ufw enable
```

4. **Set up reverse proxy with Nginx** (recommended for production)

```nginx
server {
    listen 80;
    server_name grafana.yourdomain.com;

    allow YOUR_IP;
    deny all;

    location / {
        proxy_pass http://localhost:3200;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Differences from Staging

| Feature         | Staging (`docker-compose-observability.yml`) | Production (`docker-compose.yml`) |
| --------------- | -------------------------------------------- | ----------------------------------- |
| App Container   | ❌ Not included                              | ✅ Includes `proconnect_backend`     |
| Redis           | ❌ Not included                              | ✅ Includes Redis + Redis Commander |
| Log Collection  | File-based (`./logs:/var/app/logs`)          | Docker Service Discovery + File-based |
| Promtail Config | `promtail-config.yml` (file-based only)      | `promtail-config.yml` (both modes)  |
| Docker Socket   | ❌ Not mounted                               | ✅ Mounted for service discovery     |
| Container Logs  | ❌ Not collected                             | ✅ Collects all container logs       |
| Network         | Default                                      | Shared `proconnect-network`          |

## Unified Promtail Configuration

The [`monitoring/promtail-config.yml`](monitoring/promtail-config.yml:1) now supports **both** log collection modes:

### 1. Docker Service Discovery (for Production/Local)
```yaml
scrape_configs:
  - job_name: docker-containers
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
```
- Automatically discovers all running Docker containers
- Collects logs from `/var/lib/docker/containers/`
- Labels: `container_name`, `image_name`, `compose_service`, etc.

### 2. File-based Logs (for Staging/PM2)
```yaml
scrape_configs:
  - job_name: file-logs
    static_configs:
      - targets:
          - localhost
        labels:
          __path__: /var/app/logs/*.log
```
- Reads logs from mounted volume `./logs:/var/app/logs`
- Used when running with PM2 or other process managers
- Labels: `job: file-logs`, `app: proconnect-api`, `env: staging`

### How It Works

Both scrape configs run simultaneously:
- **Docker containers**: All container logs are collected automatically
- **File logs**: If you mount `./logs:/var/app/logs`, those are also collected
- **Single config file**: Works for both staging and production environments

## Next Steps

1. ✅ Build production image: `docker build -f data/Dockerfile -t proconnect-deploy:local .`
2. ✅ Start stack with `docker compose up -d` and verify services
3. ✅ Verify logs appear in Grafana
4. ✅ Test different LogQL queries
5. ✅ Deploy to VPS
6. ✅ Configure IP restrictions
7. ✅ Set up SSL with Nginx

## Additional Resources

- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [Promtail Documentation](https://grafana.com/docs/loki/latest/clients/promtail/)
- [LogQL Documentation](https://grafana.com/docs/loki/latest/logql/)
- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
