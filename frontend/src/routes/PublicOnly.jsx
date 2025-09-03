import { Navigate } from "react-router-dom";
export default function PublicOnly({ children }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) return <Navigate to="/" replace />;
  return children;
}
