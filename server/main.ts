import {readConfig} from './config.ts';
import {startDashboard} from './runtime.ts';
import {createManagement, startSetupServer} from './setup.ts';
let stop:(()=>Promise<void>)|undefined;
let switching=false;
async function launch(){
 let c;try{c=readConfig();}catch{console.log('Observatory needs configuration. Open the WebUI to finish setup.');}
 // A fresh live install always claims an owner before showing private data.
 if(c?.mode==='live'&&!c.login)c=undefined;
 const manage=c?.mode==='demo'?(async()=>false):createManagement(c,()=>{if(switching)return;switching=true;setTimeout(async()=>{try{await stop?.();await launch();}catch{console.error('Could not restart Observatory. Restart the container and check its storage permissions.');process.exitCode=1;}finally{switching=false;}},150);});
 if(c){try{stop=startDashboard(c,manage);return;}catch{console.log('Observatory could not open its data. Setup is available; check the data volume and account settings.');}}
 stop=startSetupServer(manage);
}
await launch();
for(const signal of ['SIGTERM','SIGINT'] as const)process.on(signal,()=>{void stop?.().then(()=>process.exit(0));});
