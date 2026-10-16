# Unraid and remote access

## Unraid

Use `ghcr.io/jeor/observatory:latest` with these settings:

| Setting | Value |
|---|---|
| Container port | `8080` |
| Data mapping | Your dedicated appdata folder → `/app/data` |
| Secrets mapping | Your secrets folder → `/run/secrets` (read-only) |
| `OBSERVATORY_MODE` | `live` |
| `OBSERVATORY_AUTH_FILE` | `/run/secrets/dashboard-login.json` |
| `OBSERVATORY_TIMEZONE` | Your IANA time zone, e.g. `Europe/London` |
| `ALLOWED_HOSTS` | Your dashboard hostname, without `https://` or a port |

Add the service addresses from the [connection guide](setup.md), plus these container paths:

```dotenv
AIOM_ADMIN_KEY_FILE=/run/secrets/aiom-key
AIOM_CONFIG_ID_FILE=/run/secrets/aiom-config
STREAMS_CREDENTIALS_FILE=/run/secrets/streams-login.json
```

Data must be writable and secrets readable by UID 1000. Use a dedicated data folder for each installation.

## Traefik

The [example Compose file](../../examples/compose.traefik.yaml) connects to an existing Traefik network without publishing a host port. It expects a `websecure` entrypoint, `letsencrypt` certificate resolver, and `proxy` network; adjust those names to match your setup.

Add your domain and network to `.env`:

```dotenv
OBSERVATORY_DOMAIN=observatory.example.com
PROXY_NETWORK=proxy
```

Then run from the repository directory:

```sh
docker compose --env-file .env -f examples/compose.traefik.yaml pull
docker compose --env-file .env -f examples/compose.traefik.yaml up -d --no-build
```

Use HTTPS for remote access. Keep the dashboard login enabled, and don't expose the raw HTTP port publicly. All signed-in viewers can see all profiles.
