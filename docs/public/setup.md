# Connect your services

## 1. Edit `.env`

```dotenv
OBSERVATORY_MODE=live
OBSERVATORY_TIMEZONE=Europe/London
OBSERVATORY_AUTH_FILE=/run/secrets/dashboard-login.json
AIOM_ORIGIN=http://your-aiometadata:3232
STREAMS_ORIGIN=http://your-aiostreams:3004
```

Use your own time zone and server addresses. Addresses must be reachable from Docker; `localhost` inside a container refers to that container. Leave out either service you don't use.

## 2. Add credential files

Create these files inside `.secrets/`:

| File | Contents |
|---|---|
| `dashboard-login.json` | `{"username":"owner","password":"YOUR-UNIQUE-PASSWORD"}` |
| `aiom-key` | Your AIOMetadata admin key |
| `aiom-config` | Your AIOMetadata configuration UUID |
| `streams-login.json` | `{"username":"YOUR-USERNAME","password":"YOUR-PASSWORD"}` for the AIOStreams admin account |

Choose a dashboard password of at least 16 characters. Only create the service files you need; keep keys and UUIDs on a single line.

The container runs as UID 1000. On Linux, make the secrets readable by that user only:

```sh
sudo chown -R 1000:1000 .secrets
sudo chmod 700 .secrets
sudo find .secrets -type f -exec chmod 600 {} \;
```

## 3. Restart

```sh
docker compose up -d --no-build
```

Sign in with your dashboard login, then check **Connections**. See [hosting](hosting.md) for remote access or Unraid, and [help](help.md) if a connection fails.
