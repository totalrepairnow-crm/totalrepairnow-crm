import { useEffect, useState } from "react";
export function useDebounce(value, delay=350){
  const [v,setV] = useState(value);
  useEffect(()=>{ const t=setTimeout(()=>setV(value), delay); return ()=>clearTimeout(t); }, [value,delay]);
  return v;
}
