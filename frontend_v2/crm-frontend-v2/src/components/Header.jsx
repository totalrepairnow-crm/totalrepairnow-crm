import { Link, useLocation, useNavigate } from "react-router-dom";
import { getToken, clearToken } from "../lib/api";

export default function Header(){
  const nav = useNavigate();
  const loc = useLocation();
  const authed = !!getToken();
  const isClients = loc.pathname === "/clients" || loc.pathname.startsWith("/clients/");

  function handleLogout(){
    clearToken();
    nav("/login", { replace:true });
  }

  return (
    <header style={{borderBottom:"1px solid #e5e7eb", background:"#fff"}}>
      <div className="container" style={{display:"flex",alignItems:"center",gap:16}}>
        <Link to="/" style={{display:"inline-flex",alignItems:"center",gap:10}}>
          <img src="/v2/logo.png" alt="Total Repair Now" width="32" height="32" />
          <strong>CRM</strong>
        </Link>

        {authed ? (
          <nav style={{marginLeft:"auto",display:"flex",gap:12}}>
            <Link to="/dashboard" className={loc.pathname==="/dashboard" ? "active" : ""}>Dashboard</Link>
            <Link to="/clients" className={isClients ? "active" : ""}>Clients</Link>
            <Link to="/users" className={loc.pathname==="/users" ? "active" : ""}>Users</Link>
            <button className="btn-ghost" onClick={handleLogout}>Logout</button>
          </nav>
        ) : (
          <nav style={{marginLeft:"auto",display:"flex",gap:12}}>
            <Link to="/login" className={loc.pathname==="/login" ? "active" : ""}>Login</Link>
          </nav>
        )}
      </div>
    </header>
  );
}

