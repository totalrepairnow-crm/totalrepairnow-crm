import React,{useEffect,useMemo,useState} from "react";
import { api } from "../api";
import { useDebounce } from "../hooks/useDebounce";

const COLUMNS=[
  {key:"company_name",label:"Empresa"},
  {key:"email",label:"Email"},
  {key:"phone",label:"Teléfono"},
  {key:"status",label:"Estado"},
  {key:"last_contact_at",label:"Último contacto"},
];

export default function Clientes(){
  const [q,setQ]=useState(""); const dq=useDebounce(q,400);
  const [status,setStatus]=useState("");
  const [page,setPage]=useState(1); const [pageSize]=useState(10);
  const [sort,setSort]=useState("company_name"); const [order,setOrder]=useState("asc");
  const [rows,setRows]=useState([]); const [total,setTotal]=useState(0); const [loading,setLoading]=useState(false);
  const totalPages=useMemo(()=>Math.max(1,Math.ceil(total/pageSize)),[total,pageSize]);

  const load=async()=>{ setLoading(true);
    try{ const d=await api.clients.list({q:dq,status,page,pageSize,sort,order}); setRows(d.items||[]); setTotal(d.total||0); }
    catch(e){ console.error(e); setRows([]); setTotal(0); }
    finally{ setLoading(false); } };

  useEffect(()=>{ setPage(1); },[dq,status]);
  useEffect(()=>{ load(); /* eslint-disable-next-line */ },[dq,status,page,pageSize,sort,order]);

  const toggleSort=(k)=>{ if(sort===k) setOrder(order==="asc"?"desc":"asc"); else { setSort(k); setOrder("asc"); } };

  return (<div style={{padding:16}}>
    <h2 style={{marginBottom:8}}>Clientes</h2>
    <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
      <input placeholder="Buscar por empresa, email, teléfono…" value={q} onChange={e=>setQ(e.target.value)}
        style={{padding:8,borderRadius:8,border:"1px solid #e5e7eb",minWidth:260}}/>
      <select value={status} onChange={e=>setStatus(e.target.value)} style={{padding:8,borderRadius:8,border:"1px solid #e5e7eb"}}>
        <option value="">Todos</option><option value="activo">Activo</option><option value="inactivo">Inactivo</option>
      </select>
      <span style={{color:"#6b7280",fontSize:13}}>{loading?"Cargando…":`Total: ${total}`}</span>
    </div>
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr>{COLUMNS.map(c=>(
          <th key={c.key} onClick={()=>toggleSort(c.key)}
              style={{textAlign:"left",padding:"10px 8px",borderBottom:"1px solid #e5e7eb",cursor:"pointer",whiteSpace:"nowrap"}}>
            {c.label} {sort===c.key?(order==="asc"?"▲":"▼"):"↕"}
          </th>))}
        </tr></thead>
        <tbody>
          {rows.length===0&&!loading&&(<tr><td colSpan={COLUMNS.length} style={{padding:16,color:"#6b7280"}}>Sin resultados</td></tr>)}
          {rows.map(r=>(
            <tr key={r.id||r.cliente_id}>
              <td style={{padding:"10px 8px",borderBottom:"1px solid #f3f4f6"}}>{r.company_name}</td>
              <td style={{padding:"10px 8px",borderBottom:"1px solid #f3f4f6"}}>{r.email||"-"}</td>
              <td style={{padding:"10px 8px",borderBottom:"1px solid #f3f4f6"}}>{r.phone||"-"}</td>
              <td style={{padding:"10px 8px",borderBottom:"1px solid #f3f4f6",textTransform:"capitalize"}}>{r.status||"-"}</td>
              <td style={{padding:"10px 8px",borderBottom:"1px solid #f3f4f6"}}>{r.last_contact_at?new Date(r.last_contact_at).toLocaleString():"-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div style={{display:"flex",gap:8,alignItems:"center",marginTop:12}}>
      <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}>«</button>
      <span style={{color:"#6b7280"}}>Página {page} de {totalPages}</span>
      <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}>»</button>
    </div>
  </div>);
}
