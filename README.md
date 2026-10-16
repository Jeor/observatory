# Observatory

A private viewing journal and traffic dashboard for **AIOMetadata** and **AIOStreams**. Explore your history, genre constellation, monthly and yearly reviews, and provider usage.

## Install

**Unraid:** Add the [Observatory template](unraid/observatory.xml) to your user templates, choose an unused port, and install. Open **WebUI** from the container menu.

**Docker Compose:** Download [compose.yaml](compose.yaml), then run:

```sh
docker compose up -d
```

Open **http://localhost:18085**. Copy the **setup code** from `docker compose logs observatory`, create your login, and connect your services. Any non-empty password is accepted. You can connect either service and add the other later under **Connections → Manage connections**.

Settings and history persist in the configuration volume. Keep it private and backed up. For remote access, use HTTPS.

[Unraid & hosting](docs/public/hosting.md) · [Connection setup](docs/public/setup.md) · [Help](docs/public/help.md) · [Development](docs/public/development.md)

Licensed under [GPLv3](LICENSE).
