# Help

- **Setup code:** Open the container log. A fresh code is printed whenever an unconfigured container starts. It stops working after setup is saved.
- **WebUI will not open:** Check that the container is healthy and its host port is unused. Unraid’s WebUI link uses the port selected in the template.
- **Setup appears instead of the dashboard:** Configuration could not be loaded. Check volume permissions and your existing secret-file mounts before saving new settings.
- **Connection failed:** Use **Connections → Manage connections → Test connection**. Check the service address, credentials, and required upstream API settings.
- **Settings cannot be saved:** `/config` must be writable by UID 1000. The supplied container initializes its ownership before dropping root privileges.
- **No activity yet:** Check Connections for the last successful sync. AIOMetadata is polled every 15 seconds; AIOStreams every 60 seconds.
- **Forgotten owner password:** Stop the container, back up the configuration volume, and edit only the `login` object in `settings.json`. Keep the file private and restart. For secret-file installations, update the file referenced by `OBSERVATORY_AUTH_FILE` instead.

Do not share credentials, setup codes, configuration files, or raw viewing data in public bug reports.
