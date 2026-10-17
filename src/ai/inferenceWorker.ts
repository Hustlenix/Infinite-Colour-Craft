import { predict, type DoodleModel } from '../utils/doodleNet';
let model:DoodleModel|null=null;
self.onmessage=(event:MessageEvent<{id:number;bitmap:number[];model?:DoodleModel}>)=>{
  const{id,bitmap}=event.data;
  try{if(event.data.model)model=event.data.model;if(!model)throw Error('The inference model is unavailable.');self.postMessage({id,result:predict(bitmap,model)});}
  catch(error){self.postMessage({id,error:String(error)});}
};
