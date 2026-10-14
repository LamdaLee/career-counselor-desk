import { RefObject, useEffect } from 'react';
export default function useClickOutside(ref:RefObject<HTMLElement>,fn:()=>void){useEffect(()=>{const listener=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))fn();};document.addEventListener('mousedown',listener);return()=>document.removeEventListener('mousedown',listener);},[ref,fn]);}
