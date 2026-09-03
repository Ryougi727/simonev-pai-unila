"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

type Praktikan = { id: string; npm: string; name: string; done: boolean };

export function ScanClient({ token, praktikan }: { token: string; praktikan: Praktikan[] }) {
  const [state, setState] = useState<Record<string, "idle" | "loading" | "done" | "error">>({});
  const [errMsg, setErrMsg] = useState("");

  const submit = async (p: Praktikan) => {
    if (p.done || state[p.id] === "loading") return;
    setState((s) => ({ ...s, [p.id]: "loading" }));
    setErrMsg("");
    try {
      const res = await fetch(`/api/attendance/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ praktikanId: p.id }),
      });
      const data = await res.json();
      if (!res.ok) { setErrMsg(data.error || "Gagal absen."); setState((s) => ({ ...s, [p.id]: "error" })); return; }
      setState((s) => ({ ...s, [p.id]: "done" }));
    } catch {
      setErrMsg("Koneksi bermasalah. Coba lagi.");
      setState((s) => ({ ...s, [p.id]: "error" }));
    }
  };

  return (
    <div className="space-y-2 text-left">
      {errMsg && <div className="text-red-600 text-xs font-semibold mb-2">{errMsg}</div>}
      {praktikan.map((p) => {
        const done = p.done || state[p.id] === "done";
        return (
          <button
            key={p.id}
            onClick={() => submit(p)}
            disabled={done}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm ${
              done ? "bg-primary-soft border-primary text-primary-hover font-semibold" : "bg-[#f2fbf5] border-[#dcefe2]"
            }`}
          >
            <span>{p.name} <span className="text-gray-400 font-normal">· {p.npm}</span></span>
            {done ? <CheckCircle2 size={16} /> : state[p.id] === "loading" ? "…" : null}
          </button>
        );
      })}
    </div>
  );
}
