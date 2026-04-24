# VPS monitoring stack patches

These patches apply to the VPS under `/opt/prometheus/` and wherever your
shared Postgres compose lives. They cover three concrete gaps:

1. Isolate node-exporter / cAdvisor / Alloy on a private `monitoring-net`
   (internal-only) instead of leaving them reachable from other `proxy-net`
   tenants.
2. Add Prometheus scrape jobs for `mizan-backend`, `mizan-frontend:9464`
   and `mizan-mcp`.
3. Add a healthcheck to the shared Postgres compose.

Daemon-wide log rotation via `/etc/docker/daemon.json` is already handled.

## 1. Split monitoring onto an internal-only network

Edit `/opt/prometheus/docker-compose.yml`:

```yaml
# Add a new network. `internal: true` means this network has no external
# gateway, containers on it cannot reach the internet, and containers on
# other networks cannot reach them. That is exactly what we want for
# metrics-only sidecars.
networks:
  monitoring-net:
    internal: true
  proxy-net:
    external: true

services:
  prometheus:
    # Prometheus needs proxy-net to scrape app containers, AND
    # monitoring-net to reach node-exporter / cadvisor / alloy.
    networks:
      - proxy-net
      - monitoring-net

  grafana:
    # Grafana only needs proxy-net (to talk to Prometheus via its DNS name
    # on that network and to be reached by Nginx). Keep it off
    # monitoring-net so a Grafana CVE can't pivot to the cadvisor API.
    networks:
      - proxy-net

  node-exporter:
    # Remove proxy-net from this service. Only monitoring-net.
    networks:
      - monitoring-net
    # Optional: drop any `ports:` block, exposing on the host isn't
    # needed when Prometheus can reach it over monitoring-net.

  cadvisor:
    networks:
      - monitoring-net

  alloy:
    networks:
      - monitoring-net
```

After applying, verify from a different container on `proxy-net`:

```bash
docker exec mizan-backend wget -qO- http://node-exporter:9100/metrics
# Should fail: no route / name resolution. If it succeeds, something is
# still on proxy-net.
```

And from Prometheus:

```bash
docker exec prometheus wget -qO- http://node-exporter:9100/metrics | head
# Should succeed.
```

## 2. Prometheus scrape jobs for Mizan services

Edit `/opt/prometheus/prometheus.yml` and add (or merge with the existing
`scrape_configs:` block):

```yaml
scrape_configs:
  - job_name: "mizan-backend"
    metrics_path: /metrics
    static_configs:
      - targets: ["mizan-backend:8080"]
        labels:
          service: backend
          stack: mizan

  - job_name: "mizan-frontend"
    # Next.js OTel exposes Prom metrics on OTEL_METRICS_PORT (9464).
    metrics_path: /metrics
    static_configs:
      - targets: ["mizan-frontend:9464"]
        labels:
          service: frontend
          stack: mizan

  - job_name: "mizan-mcp"
    metrics_path: /metrics
    static_configs:
      - targets: ["mizan-mcp:5001"]
        labels:
          service: mcp
          stack: mizan
```

Then reload without restarting:

```bash
docker kill -s HUP prometheus
# or
curl -X POST http://prometheus:9090/-/reload
```

Check the targets page: `https://<grafana-host>/prometheus/targets`, all
three should be `UP` within ~30 s. If any are `DOWN`, confirm they're on
`proxy-net` and that the target port matches your compose.

The backend exposes the Prometheus scrape endpoint via
`app.MapPrometheusScrapingEndpoint()` in `Program.cs`; the MCP server
should do the same (check `Mizan.Mcp.Server/Program.cs`). The frontend
port comes from `OTEL_METRICS_PORT=9464` which is already set in
`docker-compose.yml`, confirm it's mirrored on the VPS `.env` if you
don't source from the repo one.

## 3. Postgres healthcheck

For the shared Postgres compose (wherever `postgresql-db-n8n` lives on
the VPS), add:

```yaml
services:
  postgres:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s
```

The dev compose already has this (`docker-compose.yml:18`). Doubling the
`$` is intentional so Compose passes the literal through to the shell
rather than expanding it at parse time.

After applying, consumers that use `depends_on: condition: service_healthy`
will wait for Postgres to be ready before starting.

## Verification checklist

- [ ] `docker inspect <node-exporter> | jq '.[0].NetworkSettings.Networks | keys'` shows only `monitoring-net`.
- [ ] Prometheus targets page shows `mizan-backend`, `mizan-frontend`, `mizan-mcp` all UP.
- [ ] `docker ps --format '{{.Names}}  {{.Status}}'` shows `(healthy)` next to postgres.
- [ ] A container on `proxy-net` cannot resolve `node-exporter` / `cadvisor` / `alloy` DNS.
