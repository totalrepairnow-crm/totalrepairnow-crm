import React from "react";

export function Input(props){ return <input className="input" {...props} />; }
export function Select({options=[], ...rest}){
  return (
    <select className="select" {...rest}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
export function Button({kind, ...rest}){ return <button className={`button ${kind||""}`} {...rest} />; }
