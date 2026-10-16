import {mkdir,cp,writeFile,lstat,readdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
// Explicit public allowlist. Never archive the working directory wholesale.
const dest=resolve(process.argv[2]||`releases/observatory-${Date.now()}`);
const paths=['web','shared','server','public','tests','.github','examples','unraid','docs/public','scripts/prepare-release.mjs','scripts/container-smoke.sh','scripts/smoke.mjs','package.json','package-lock.json','tsconfig.json','vite.config.ts','index.html','Dockerfile','compose.yaml','.gitignore','.dockerignore','.env.example','README.md','LICENSE','SECURITY.md'];
await mkdir(dirname(dest),{recursive:true});
await mkdir(dest,{recursive:false});
async function safe(path){if((await lstat(path)).isSymbolicLink())throw Error('Symlink in release: '+path);if((await lstat(path)).isDirectory())for(const name of await readdir(path))await safe(path+'/'+name);}
for(const path of paths){await safe(path);await cp(path,resolve(dest,path),{recursive:true});}
await writeFile(resolve(dest,'RELEASE-MANIFEST.json'),JSON.stringify({files:paths},null,2)+'\n');
console.log(`Prepared public source: ${dest}`);
