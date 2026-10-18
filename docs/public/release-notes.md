# Observatory 0.4.1

- Fix AIOStreams statistics becoming stale after session expiry when the server redirects to login instead of returning HTTP 401.
- Renew the session and retry once for redirects to the same origin’s login page. Unrelated redirects are rejected and repeated authentication failures cannot cause a retry loop.
- Add regression coverage for session renewal, cookie reuse, and rejected redirects.

Docker: `ghcr.io/jeor/observatory:0.4.1` or `ghcr.io/jeor/observatory:latest`.

Update with `docker compose pull && docker compose up -d`. If pinned to an older version, change the image tag first.
