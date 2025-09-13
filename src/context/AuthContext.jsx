import { createContext, useContext, useMemo, useState } from 'react';
import { post } from '../utils/api';

const AuthCtx = createContext(null);
export const useAuth = ()=>useContext(AuthCtx);

export function AuthProvider({children}){
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser]   = useState(null);

  const login = async (email,password)=>{
    const res = await post('/login',{email,password});
    const tok = res.accessToken || res.token;
    localStorage.setItem('token', tok);
    setToken(tok);
  };

  const logout = ()=>{
    localStorage.removeItem('token'); setToken(null); setUser(null);
  };

  const value = useMemo(()=>({token,user,login,logout}),[token,user]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
