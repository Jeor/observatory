# Help

| Problem | Check |
|---|---|
| Connection unavailable | Service address, credentials, and Docker network access. |
| Host not allowed | Add your browser's hostname to `ALLOWED_HOSTS` in `.env`. |
| Permission denied | Data must be writable and secrets readable by UID 1000. |
| Missing artwork | Only supported public raster images can be loaded; protected images and SVGs use a placeholder. |
| Wrong dates | Set `OBSERVATORY_TIMEZONE` to your IANA time zone, then restart. |
| Source account changed | Use a separate data volume for a different account or configuration. Password changes are fine. |

For startup errors:

```sh
docker compose logs --tail=50 observatory
```

Don't post credentials, private logs, or viewing records in public issues.

## What the dashboard measures

- **Journal:** saved playback state, not measured watch time or a complete record of every rewatch. Initial history depends on what AIOMetadata returns.
- **Genres:** fetched from metadata and cached; missing genres appear as Unclassified.
- **Traffic:** AIOStreams NNTP downloads, including any counted buffering or retries—not total internet use or per-profile bandwidth.
- **Provider totals:** a separate rolling seven-day snapshot.

Viewing records are retained for 400 days; traffic for 365 days. Stop the container before backing up the data volume.

## Compatibility

The connectors use AIOMetadata's Jellyfin dashboard and Stremio metadata APIs, and AIOStreams' admin login and hourly NNTP statistics APIs. There isn't yet a tested upstream-version matrix. If an upstream update changes these APIs, Observatory keeps the last successful data and shows a connection error.
