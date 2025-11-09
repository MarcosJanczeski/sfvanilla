type Pending = { ts: number; payload: any };
const KEY = "sfv:queue";

export function enqueue(p: any) {
  const qs: Pending[] = JSON.parse(localStorage.getItem(KEY) || "[]");
  qs.push({ ts: Date.now(), payload: p });
  localStorage.setItem(KEY, JSON.stringify(qs));
}

export async function flush(send: (p:any)=>Promise<void>) {
  let qs: Pending[] = JSON.parse(localStorage.getItem(KEY) || "[]");
  const keep: Pending[] = [];
  for (const it of qs) {
    try { await send(it.payload); } catch { keep.push(it); }
  }
  localStorage.setItem(KEY, JSON.stringify(keep));
}

export function onReonline(fn: ()=>void) {
  window.addEventListener("online", fn);
}
