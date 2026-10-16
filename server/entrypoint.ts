// Initialize only the mounted configuration directory, then permanently drop root.
import {mkdirSync,chownSync,statSync,chmodSync} from 'node:fs';
if(process.getuid?.()===0){
 const dir=process.env.CONFIG_DIR||'/config';
 mkdirSync(dir,{recursive:true,mode:0o700});const stat=statSync(dir);if(stat.uid!==1000||stat.gid!==1000)chownSync(dir,1000,1000);
 process.setgroups!([]);process.setgid!(1000);process.setuid!(1000);chmodSync(dir,0o700);
}
await import('./main.ts');
