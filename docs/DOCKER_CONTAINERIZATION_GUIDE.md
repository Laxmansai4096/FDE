# 🐳 Complete Docker & Containerization Master Guide for AI Engineers & FDEs

---

## 📖 Table of Contents
1. [Introduction: Why Containerization is Critical for FDEs](#1-introduction-why-containerization-is-critical-for-fdes)
2. [Docker Architecture & Core Concepts](#2-docker-architecture--core-concepts)
3. [Complete Docker Command Reference](#3-complete-docker-command-reference)
4. [Writing Production Multi-Stage Dockerfiles for AI Microservices](#4-writing-production-multi-stage-dockerfiles-for-ai-microservices)
5. [Docker Compose Multi-Container Orchestration (FastAPI + Redis + PGVector)](#5-docker-compose-multi-container-orchestration-fastapi--redis--pgvector)
6. [Container Optimization & GPU Acceleration (NVIDIA CUDA Container Toolkit)](#6-container-optimization--gpu-acceleration-nvidia-cuda-container-toolkit)
7. [FDE Production Security Hardening & Best Practices](#7-fde-production-security-hardening--best-practices)

---

## 1. Introduction: Why Containerization is Critical for FDEs

In enterprise client deployments, the **"Works on My Machine"** syndrome is fatal. Clients operate across diverse infrastructure: Azure Kubernetes Service (AKS), AWS ECS, on-premise air-gapped GPU servers, or serverless container runtimes.

### How Containerization Empowers FDEs:
* **Environment Reproducibility**: Bundles Python/Node runtime, system CUDA C++ libraries, vector databases, and dependencies into an immutable image.
* **Isolation & Security**: Sandboxes untrusted code execution and prevents dependency collisions.
* **Portability & Rapid Scale**: Deploy the exact same container locally, to staging, and to multi-region cloud clusters.

---

## 2. Docker Architecture & Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DOCKER HOST                                   │
│  ┌──────────────────┐   ┌────────────────────────────────────────────┐  │
│  │  Docker Daemon   │◄──┤             Containers                     │  │
│  └────────┬─────────┘   │ ┌──────────────┐ ┌───────────────────────┐ │  │
│           │             │ │ FastAPI App  │ │ Redis Semantic Cache │ │  │
│           ▼             │ └──────────────┘ └───────────────────────┘ │  │
│  ┌──────────────────┐   └────────────────────────────────────────────┘  │
│  │   Local Images   │                                                   │
│  └──────────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

* **Dockerfile**: Blueprint / source code for creating a container image.
* **Image**: Read-only template containing the application code, libraries, and runtime environment.
* **Container**: Runnable instance of an image.
* **Volume**: Persistent storage mounted from the host filesystem into a container (e.g. for database storage).
* **Network**: Isolated virtual bridge connecting container microservices.

---

## 3. Complete Docker Command Reference

### 🔹 Image Management

```bash
# Build an image from Dockerfile in current directory
docker build -t aura-ai-platform:1.0 .

# Build with build arguments
docker build --build-arg NODE_ENV=production -t aura-ai-platform:latest .

# List all local Docker images
docker images

# Remove an image
docker rmi aura-ai-platform:1.0

# Tag an image for container registry (Azure Container Registry / Docker Hub)
docker tag aura-ai-platform:latest myregistry.azurecr.io/aura-ai-platform:v1.0

# Push image to registry
docker push myregistry.azurecr.io/aura-ai-platform:v1.0
```

---

### 🔹 Container Lifecycle Management

```bash
# Run a container in detached mode (-d) with port mapping (-p) and environment vars (-e)
docker run -d \
  --name aura-server \
  -p 3000:3000 \
  -e PORT=3000 \
  -e NODE_ENV=production \
  aura-ai-platform:latest

# List running containers
docker ps

# List all containers (including stopped ones)
docker ps -a

# View container logs (follow output -f, tail 100 lines)
docker logs -f --tail 100 aura-server

# Execute an interactive shell session inside a running container
docker exec -it aura-server /bin/sh

# Inspect container internal IP, mounts, and configuration
docker inspect aura-server

# Stop and remove container
docker stop aura-server
docker rm aura-server

# Clean up unused containers, networks, images, and build cache
docker system prune -a --volumes
```

---

## 4. Writing Production Multi-Stage Dockerfiles for AI Microservices

### Node.js Enterprise Server Multi-Stage Dockerfile (`Dockerfile`)

```dockerfile
# ==========================================
# STAGE 1: Build & Dependency Installation
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY . .

# ==========================================
# STAGE 2: Minimal Production Runtime Image
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production \
    PORT=3000

# Security: Create and run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy node_modules and built artifacts from builder stage
COPY --from=builder /app /app

# Set file permissions for non-root user
RUN chown -R appuser:appgroup /app
USER appuser

# Expose port
EXPOSE 3000

# Healthcheck probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/gateway/status || exit 1

# Start server
CMD ["node", "server/index.js"]
```

---

## 5. Docker Compose Multi-Container Orchestration (FastAPI + Redis + PGVector)

Create `docker-compose.yml` to orchestrate microservices locally with 1 command.

```yaml
version: '3.8'

services:
  # 1. Frontend & Enterprise Gateway Server
  aura-app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - REDIS_URL=redis://redis-cache:6379
      - DATABASE_URL=postgresql://fde_user:fde_password@pgvector-db:5432/aura_db
    depends_on:
      - redis-cache
      - pgvector-db
    restart: always

  # 2. Redis Semantic Vector Cache
  redis-cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --save 60 1 --loglevel notice

  # 3. PostgreSQL with PGVector Extension for Hybrid RAG
  pgvector-db:
    image: pgvector/pgvector:pg16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: fde_user
      POSTGRES_PASSWORD: fde_password
      POSTGRES_DB: aura_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  redis_data:
  postgres_data:
```

### Docker Compose Commands:
```bash
# Start all microservices in background
docker-compose up -d

# View combined logs across all microservices
docker-compose logs -f

# Check status of container cluster
docker-compose ps

# Stop and remove containers, networks, and volumes
docker-compose down -v
```

---

## 6. Container Optimization & GPU Acceleration (NVIDIA CUDA Container Toolkit)

For Python AI models running local embedding models (e.g. `sentence-transformers`) or local LLMs (e.g. `vLLM` / `Ollama`), enable GPU passthrough:

```dockerfile
# CUDA Base Image for PyTorch / vLLM acceleration
FROM nvidia/cuda:12.1.1-runtime-ubuntu22.04

WORKDIR /app

RUN apt-get update && apt-get install -y python3-pip python3-dev

COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python3", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Running CUDA Container:
```bash
docker run --gpus all -d -p 8000:8000 my-llm-fastapi-service:latest
```

---

## 7. FDE Production Security Hardening & Best Practices

1. **Never Run Containers as Root**: Always declare `USER appuser`.
2. **Use Multi-Stage Builds**: Reduces final image size from 1.2GB to <120MB, shrinking the attack surface.
3. **Use Specific Image Tags**: Avoid `FROM node:latest`. Use pinned digests or version tags (`FROM node:20.11-alpine`).
4. **Scan Images for Vulnerabilities**:
   ```bash
   docker scout cve aura-ai-platform:latest
   # Or using Trivy:
   trivy image aura-ai-platform:latest
   ```
5. **Use `.dockerignore`**: Exclude `.git`, `node_modules`, `.env`, and scratch log files from build context.
