import React, { useEffect, useState } from 'react';
import { getUsers } from '../lib/api';

const RoleBadge = ({ role }) => {
  const cls = role === 'admin' ? 'badge badge-admin' : 'badge badge-user';
  return <span className={cls}>{role}</span>;
};

export default function Users() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const data = await getUsers();
        if (!live) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Users load error', e);
        if (live) setErr('Could not load users');
      }
    })();
    return () => { live = false; };
  }, []);

  return (
    <div>
      <div className="toolbar">
        <h1>Users</h1>
      </div>

      {err && <div className="alert error">{err}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Email</th><th>Username</th><th>Role</th></tr>
          </thead>
          <tbody>
            {rows.map(u => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.username || '-'}</td>
                <td><RoleBadge role={u.role || 'user'} /></td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={3} style={{textAlign:'center', color:'#64748b'}}>No users</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

