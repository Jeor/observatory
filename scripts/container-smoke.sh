#!/bin/sh
set -eu
image=${1:-observatory:audit}
name="observatory-smoke-$$"
volume="$name-data"
trap 'docker rm -f "$name" >/dev/null 2>&1 || true; docker volume rm "$volume" >/dev/null 2>&1 || true' EXIT
docker volume create "$volume" >/dev/null
# No production mounts or credentials; isolated demo with the hardened runtime settings.
docker run -d --name "$name" --read-only --tmpfs /tmp -v "$volume:/app/data" --cap-drop ALL --cap-add CHOWN --cap-add SETUID --cap-add SETGID --security-opt no-new-privileges:true -e OBSERVATORY_MODE=demo -e OBSERVATORY_TIMEZONE=UTC "$image" >/dev/null
for attempt in $(seq 1 30); do
  if docker exec "$name" node -e "fetch('http://127.0.0.1:8080/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then break; fi
  sleep 1
done
docker exec "$name" node -e "const assert=require('node:assert/strict');(async()=>{assert.match(require('node:fs').readFileSync('/proc/1/status','utf8'),/Uid:\s+1000\s+1000/);const r=await fetch('http://127.0.0.1:8080/api/overview');assert.equal(r.status,200);const d=await r.json();assert.equal(d.mode,'demo');assert.equal(d.timeZone,'UTC');assert.ok(d.plays.length);assert.equal((await fetch('http://127.0.0.1:8080/')).status,200);console.log('Container demo smoke passed')})().catch(e=>{console.error(e);process.exit(1)})"

docker exec "$name" node -e "require('node:fs').writeFileSync('/app/data/smoke-marker','persistent')"
docker restart "$name" >/dev/null
docker exec "$name" node -e "require('node:assert/strict').equal(require('node:fs').readFileSync('/app/data/smoke-marker','utf8'),'persistent');console.log('Data volume survives restart')"

# First-run setup on a bind mount, matching the Unraid template.
docker rm -f "$name" >/dev/null
config=$(mktemp -d)
cleanup_setup() {
  docker rm -f "$name" >/dev/null 2>&1 || true
  docker volume rm "$volume" >/dev/null 2>&1 || true
  # The bind-mount test transfers ownership to UID 1000. Restore the runner's
  # ownership before deleting this isolated temporary directory (CI uses 1001).
  docker run --rm --user 0:0 --entrypoint chown -v "$config:/cleanup" "$image" -R "$(id -u):$(id -g)" /cleanup
  rm -rf "$config"
}
trap cleanup_setup EXIT
chmod 755 "$config"
docker run -d --name "$name" --user 0:0 --read-only --tmpfs /tmp -v "$config:/config" --cap-drop ALL --cap-add CHOWN --cap-add SETUID --cap-add SETGID --security-opt no-new-privileges:true -e CONFIG_DIR=/config -e DATA_DIR=/config/data -e OBSERVATORY_MODE=live "$image" >/dev/null
for attempt in $(seq 1 30); do
  if docker exec "$name" node -e "fetch('http://127.0.0.1:8080/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then break; fi
  sleep 1
done
setup_code=$(docker logs "$name" 2>/dev/null | sed -n 's/^Observatory setup code: //p' | head -1)
docker exec -e SETUP_CODE="$setup_code" "$name" node -e "const assert=require('node:assert/strict');(async()=>{assert.match(require('node:fs').readFileSync('/proc/1/status','utf8'),/Uid:\s+1000\s+1000/);const base='http://127.0.0.1:8080';assert.equal((await fetch(base+'/setup')).status,200);const r=await fetch(base+'/api/setup/save',{method:'POST',headers:{origin:base,'content-type':'application/json','x-setup-code':process.env.SETUP_CODE},body:JSON.stringify({login:{username:'smoke',password:'x'},timeZone:'UTC'})});assert.equal(r.status,200);console.log('Unraid setup smoke passed with one-character password')})().catch(e=>{console.error(e);process.exit(1)})"
sleep 1
docker exec "$name" node -e "const assert=require('node:assert/strict');(async()=>{const base='http://127.0.0.1:8080';assert.equal((await fetch(base+'/')).status,401);assert.equal((await fetch(base+'/api/overview',{headers:{authorization:'Basic '+Buffer.from('smoke:x').toString('base64')}})).status,200)})().catch(e=>{console.error(e);process.exit(1)})"
