# Deployment Guide

## System Requirements

### Hardware Requirements
- CPU: 4+ cores
- RAM: 16GB+
- Storage: 100GB+ SSD
- Network: 100Mbps+

### Software Requirements
- Node.js v14.0.0+
- PostgreSQL v12.0+
- IPFS v0.12.0+
- Docker v20.10.0+
- Docker Compose v2.0.0+

## Environment Setup

### 1. Development Environment
```bash
# Clone repository
git clone https://github.com/your-org/land-registry.git
cd land-registry

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with development settings

# Start development services
docker-compose -f docker-compose.dev.yml up -d

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### 2. Staging Environment
```bash
# Set up environment variables
cp .env.example .env.staging
# Edit .env.staging with staging settings

# Build Docker images
docker-compose -f docker-compose.staging.yml build

# Start staging services
docker-compose -f docker-compose.staging.yml up -d

# Run database migrations
docker-compose exec api npm run db:migrate
```

### 3. Production Environment
```bash
# Set up environment variables
cp .env.example .env.production
# Edit .env.production with production settings

# Build Docker images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations
docker-compose exec api npm run db:migrate
```

## Docker Configuration

### 1. Base Image
```dockerfile
# Dockerfile
FROM node:14-alpine

# Install dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Build application
RUN npm run build

# Start application
CMD ["npm", "start"]
```

### 2. Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - IPFS_HOST=ipfs
    depends_on:
      - db
      - ipfs
    ports:
      - "3001:3001"
    networks:
      - app-network

  db:
    image: postgres:12-alpine
    environment:
      - POSTGRES_USER=landregistry
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=landregistry
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

  ipfs:
    image: ipfs/go-ipfs:v0.12.0
    volumes:
      - ipfs-data:/data/ipfs
    ports:
      - "4001:4001"
      - "5001:5001"
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
  ipfs-data:
```

## Database Migration

### 1. Migration Script
```bash
#!/bin/bash
# migrate.sh

# Wait for database
echo "Waiting for database..."
./wait-for-it.sh db:5432 -t 60

# Run migrations
echo "Running migrations..."
npm run db:migrate

# Run seeds if needed
if [ "$NODE_ENV" = "development" ]; then
  echo "Running seeds..."
  npm run db:seed
fi
```

### 2. Rollback Script
```bash
#!/bin/bash
# rollback.sh

# Rollback last migration
echo "Rolling back migration..."
npm run db:rollback

# Verify rollback
npm run db:status
```

## Smart Contract Deployment

### 1. Contract Deployment
```javascript
// scripts/deploy.js
async function main() {
  // Deploy LandRegistry
  const LandRegistry = await ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();
  await landRegistry.deployed();
  console.log("LandRegistry deployed to:", landRegistry.address);

  // Deploy RenewalApproval
  const RenewalApproval = await ethers.getContractFactory("RenewalApproval");
  const renewalApproval = await RenewalApproval.deploy(landRegistry.address);
  await renewalApproval.deployed();
  console.log("RenewalApproval deployed to:", renewalApproval.address);

  // Deploy TransferApproval
  const TransferApproval = await ethers.getContractFactory("TransferApproval");
  const transferApproval = await TransferApproval.deploy(landRegistry.address);
  await transferApproval.deployed();
  console.log("TransferApproval deployed to:", transferApproval.address);

  // Save addresses
  const addresses = {
    landRegistry: landRegistry.address,
    renewalApproval: renewalApproval.address,
    transferApproval: transferApproval.address
  };

  fs.writeFileSync('contract-addresses.json', JSON.stringify(addresses, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
```

### 2. Contract Verification
```bash
# Verify LandRegistry
npx hardhat verify --network sepolia \
  --contract contracts/LandRegistry.sol:LandRegistry \
  <DEPLOYED_ADDRESS>

# Verify RenewalApproval
npx hardhat verify --network sepolia \
  --contract contracts/RenewalApproval.sol:RenewalApproval \
  <DEPLOYED_ADDRESS> <LAND_REGISTRY_ADDRESS>

# Verify TransferApproval
npx hardhat verify --network sepolia \
  --contract contracts/TransferApproval.sol:TransferApproval \
  <DEPLOYED_ADDRESS> <LAND_REGISTRY_ADDRESS>
```

## Monitoring Setup

### 1. Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'api'
    static_configs:
      - targets: ['api:3001']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
```

### 2. Grafana Dashboard
```json
{
  "dashboard": {
    "title": "Land Registry System",
    "panels": [
      {
        "title": "API Requests",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "http_requests_total"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "gauge",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "pg_stat_activity_count"
          }
        ]
      }
    ]
  }
}
```

## Backup Strategy

### 1. Database Backup
```bash
#!/bin/bash
# backup-db.sh

# Set variables
BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="landregistry_db_1"

# Create backup
docker exec $DB_CONTAINER pg_dump -U landregistry > \
  "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

# Compress backup
gzip "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
```

### 2. IPFS Backup
```bash
#!/bin/bash
# backup-ipfs.sh

# Set variables
BACKUP_DIR="/backups/ipfs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
IPFS_CONTAINER="landregistry_ipfs_1"

# Export IPFS repository
docker exec $IPFS_CONTAINER ipfs repo stat > \
  "$BACKUP_DIR/ipfs_stat_$TIMESTAMP.txt"

# Backup pinned files
docker exec $IPFS_CONTAINER ipfs pin ls --type recursive > \
  "$BACKUP_DIR/ipfs_pins_$TIMESTAMP.txt"
```

## SSL Configuration

### 1. Nginx Configuration
```nginx
# nginx.conf
server {
    listen 443 ssl;
    server_name api.landregistry.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    location / {
        proxy_pass http://api:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. SSL Certificate Setup
```bash
# Install certbot
apt-get install certbot python3-certbot-nginx

# Generate certificate
certbot --nginx -d api.landregistry.com

# Auto-renewal
certbot renew --dry-run
```

## Security Measures

### 1. Firewall Rules
```bash
# Allow SSH
ufw allow 22

# Allow HTTP/HTTPS
ufw allow 80
ufw allow 443

# Allow PostgreSQL only from internal network
ufw allow from 10.0.0.0/8 to any port 5432

# Enable firewall
ufw enable
```

### 2. Security Headers
```javascript
// app.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.landregistry.com"]
    }
  },
  referrerPolicy: { policy: 'same-origin' }
}));
```

## Maintenance Procedures

### 1. Database Maintenance
```sql
-- Analyze tables
ANALYZE VERBOSE properties;
ANALYZE VERBOSE property_history;

-- Vacuum tables
VACUUM ANALYZE properties;
VACUUM ANALYZE property_history;

-- Reindex
REINDEX TABLE properties;
REINDEX TABLE property_history;
```

### 2. Log Rotation
```javascript
// winston.config.js
module.exports = {
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
};
```

## Troubleshooting Guide

### 1. Common Issues
1. Database Connection Issues
   ```bash
   # Check database logs
   docker logs landregistry_db_1
   
   # Check database connection
   docker exec -it landregistry_db_1 psql -U landregistry
   ```

2. IPFS Connection Issues
   ```bash
   # Check IPFS logs
   docker logs landregistry_ipfs_1
   
   # Check IPFS connection
   curl http://localhost:5001/api/v0/version
   ```

### 2. Health Checks
```bash
# Check API health
curl http://localhost:3001/health

# Check database health
docker exec landregistry_db_1 pg_isready

# Check IPFS health
curl http://localhost:5001/api/v0/id
``` 