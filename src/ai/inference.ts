import { predict, type DoodleModel } from '../utils/doodleNet';
let worker:Worker|null=null,sequence=0,sentModel:DoodleModel|null=null;
type Predictions=ReturnType<typeof predict>;
const pending=new Map<number,{resolve:(value:Predictions)=>void;reject:(error:Error)=>void;cleanup:()=>void}>();
/** Cold on-device inference measured ~160 ms on the UI thread. Share one lazy worker. */
export function recognizeDoodle(bitmap:number[],model:DoodleModel,signal:AbortSignal):Promise<Predictions>{
  if(signal.aborted)return Promise.reject(new DOMException('Cancelled','AbortError'));
  if(typeof Worker==='undefined')return Promise.resolve().then(()=>predict(bitmap,model));
  if(!worker){
    worker=new Worker(new URL('./inferenceWorker.ts',import.meta.url),{type:'module'});
    worker.onmessage=(event:MessageEvent<{id:number;result?:Predictions;error?:string}>)=>{
      const task=pending.get(event.data.id);if(!task)return;pending.delete(event.data.id);task.cleanup();
      if(event.data.error)task.reject(Error(event.data.error));else task.resolve(event.data.result!);
    };
    worker.onerror=()=>{
      const tasks=[...pending.values()];pending.clear();worker?.terminate();worker=null;sentModel=null;
      for(const task of tasks){task.cleanup();task.reject(Error('The on-device inference worker failed. Try recognizing again.'));}
    };
  }
  return new Promise((resolve,reject)=>{
    const id=++sequence;
    const abort=()=>{pending.delete(id);cleanup();reject(new DOMException('Cancelled','AbortError'));};
    const timer=setTimeout(()=>{pending.delete(id);cleanup();reject(Error('Recognition timed out. Try again.'));},10000);
    const cleanup=()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);};
    signal.addEventListener('abort',abort,{once:true});pending.set(id,{resolve,reject,cleanup});
    try{worker!.postMessage({id,bitmap,...(sentModel===model?{}:{model})});sentModel=model;}
    catch(error){pending.delete(id);cleanup();reject(error instanceof Error?error:Error(String(error)));}
  });
}
