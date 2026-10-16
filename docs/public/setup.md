# Connect your services

1. Open Observatory’s WebUI. Copy the **setup code** from the container log.
2. Create your owner login and choose your time zone. Passwords can be any non-empty length.
3. Enable either or both services, enter the details below, and click **Test connection**.
4. Save, then sign into the dashboard with your Observatory login.

| Service | What you need |
|---|---|
| AIOMetadata | Server address, dashboard admin key, and saved configuration UUID. Enable its Jellyfin API. |
| AIOStreams | Server address and dashboard admin username/password. Its Usenet statistics API must be available. |

Use an address reachable from inside Docker. `localhost` refers to the Observatory container, not your other services.

You can skip a service and add it later in **Connections → Manage connections**. Leave a saved key or password blank to keep it. Changing to a different source account requires a separate data volume to keep histories apart.

Credentials are stored privately in `/config/settings.json` and are never returned to the browser. Existing environment and secret-file configurations remain supported until you save settings through the wizard.
