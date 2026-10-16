# Observatory

A self-hosted dashboard for your AIOMetadata viewing history and AIOStreams downloads. Explore your journal, genre constellation, monthly reviews, and traffic charts.

![Observatory demo](docs/public/demo.png)

## Quick start

Install Docker with Compose, then run:

```sh
git clone https://github.com/Jeor/observatory.git
cd observatory
cp .env.example .env
mkdir -p .secrets
docker compose pull
docker compose up -d --no-build
```

Open **http://localhost:8080** on the computer running Docker. It starts with demo data—no API keys needed. Images support AMD64 and ARM64.

## Use your own data

Follow the short [connection guide](docs/public/setup.md) to add your service addresses and credentials.

Everyone with dashboard access can see all connected profiles. Use HTTPS for remote access.

## Update

```sh
docker compose pull
docker compose up -d --no-build
```

If you pinned a version in `.env`, change it to the desired release first. Your data stays in the Docker volume. Stop the container before backing up that volume.

## More

- [Unraid and Traefik](docs/public/hosting.md)
- [Data coverage and troubleshooting](docs/public/help.md)
- [Build from source](docs/public/development.md)
- [Releases](https://github.com/Jeor/observatory/releases)

Licensed under [GPLv3](LICENSE).
