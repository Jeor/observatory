#!/bin/sh
set -eu
image=${1:-observatory:audit}
name="observatory-smoke-$$"
volume="$name-data"
trap 'docker rm -f "$name" >/dev/null 2>&1 || true; docker volume rm "$volume" >/dev/null 2>&1 || true' EXIT
docker volume create "$volume" >/dev/null
# No production mounts or credentials; isolated demo with the hardened runtime settings.
docker run -d --name "$name" --read-only --tmpfs /tmp -v "$volume:/app/data" --cap-drop ALL --security-opt no-new-privileges:true -e OBSERVATORY_MODE=demo -e OBSERVATORY_TIMEZONE=UTC "$image" >/dev/null
for attempt in $(seq 1 30); do
  if docker exec "$name" node -e "fetch('http://127.0.0.1:8080/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then break; fi
  sleep 1
done
docker exec "$name" node -e "const assert=require('node:assert/strict');(async()=>{assert.notEqual(process.getuid(),0);const r=await fetch('http://127.0.0.1:8080/api/overview');assert.equal(r.status,200);const d=await r.json();assert.equal(d.mode,'demo');assert.equal(d.timeZone,'UTC');assert.ok(d.plays.length);assert.equal((await fetch('http://127.0.0.1:8080/')).status,200);console.log('Container demo smoke passed')})().catch(e=>{console.error(e);process.exit(1)})"

docker exec "$name" node -e "require('node:fs').writeFileSync('/app/data/smoke-marker','persistent')"
docker restart "$name" >/dev/null
docker exec "$name" node -e "require('node:assert/strict').equal(require('node:fs').readFileSync('/app/data/smoke-marker','utf8'),'persistent');console.log('Data volume survives restart')"
