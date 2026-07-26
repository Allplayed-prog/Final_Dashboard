export type SafeResult<T>={data:T;error:string|null};
export async function safeQuery<T>(promise:PromiseLike<{data:T|null;error:{message:string}|null}> | any, fallback:T):Promise<SafeResult<T>>{
  try { const result=await promise; return result.error?{data:fallback,error:result.error.message}:{data:(result.data??fallback) as T,error:null}; }
  catch(error){ return {data:fallback,error:error instanceof Error?error.message:'Unbekannter Datenbankfehler'}; }
}
