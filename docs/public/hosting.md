# Hosting

## Unraid

Download `unraid/observatory.xml` from this repository and place it in `/boot/config/plugins/dockerMan/templates-user/`. In **Docker → Add Container**, select **Observatory**, choose an unused host port, and apply.

Open **WebUI** from the container’s menu. Copy the setup code from **Logs**, then complete the wizard. No SSH access or credential files are required for setup.

The template stores settings and history in `/mnt/user/appdata/observatory`. The container initializes the configuration directory’s ownership and then runs as UID/GID 1000. Keep this directory backed up and private.

The template is provided here; Observatory is not yet listed in Community Applications.

## Docker Compose

The supplied compose file listens on localhost by default. Set `OBSERVATORY_BIND` to your server’s LAN IP to access it from other devices, and set `OBSERVATORY_PORT` to an unused port. Check the startup output for bind conflicts; Observatory never stops another container to free a port.

## Remote access

Use an HTTPS reverse proxy and keep the owner login enabled. Set `ALLOWED_HOSTS` to additional dashboard hostnames before accessing them. This is a single-owner dashboard: anyone with its login can see all connected profiles.

## Existing installations

Existing `OBSERVATORY_AUTH_FILE`, AIOMetadata/AIOStreams secret-file variables, and `/app/data` volumes remain supported. Keep those mounts when updating. The default settings location is the existing data directory unless `CONFIG_DIR` is set. Do not replace your data volume just to update the image.
