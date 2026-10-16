export function startPoller({interval,task,onError}:{interval:number;task:(signal:AbortSignal)=>Promise<void>;onError:(message:string)=>void}):()=>void{
 const controller=new AbortController();let stopped=false,failures=0,timer:ReturnType<typeof setTimeout>;
 async function tick(){try{await task(controller.signal);failures=0;}catch(e){failures++;if(!stopped)onError(e instanceof Error&&/^HTTP \d{3}$/.test(e.message)?e.message:'Connection unavailable or incompatible');}finally{if(!stopped)timer=setTimeout(tick,Math.min(300000,interval*2**Math.min(failures,8)));}}
 void tick();return ()=>{stopped=true;clearTimeout(timer);controller.abort();};
}
