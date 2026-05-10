"use client";

export function ArraysHashingVisual({ stage }: { stage: number }) {
  if (stage === 1) return (
    <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-3">
      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Memory Layout</div>
      <div className="font-mono text-xs space-y-1.5">
        <div className="text-zinc-500">arr = [10, 20, 30, 40]  (base = 1000, 4 bytes each)</div>
        {[0,1,2,3].map(i => (
          <div key={i} className={`flex items-center gap-3 p-1.5 rounded-lg ${i===2?"bg-sky-50 border border-sky-200":""}`}>
            <span className="text-zinc-400 w-20">addr {1000+i*4}</span>
            <span className={`font-bold ${i===2?"text-sky-600":"text-zinc-700"}`}>{[10,20,30,40][i]}</span>
            <span className="text-zinc-400">← arr[{i}]{i===2?" ← you want this":""}</span>
          </div>
        ))}
      </div>
      <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-mono">
        <span className="text-sky-600 font-bold">addr</span> = 1000 + 2 × 4 = <span className="text-emerald-600 font-bold">1008</span> — direct, no scan
      </div>
    </div>
  );

  if (stage === 2) return (
    <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-3">
      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Hash Map Buckets</div>
      <div className="grid grid-cols-4 gap-1 text-xs font-mono">
        {["apple→5","—","—","—","—","cat→2","—","dog→8"].map((v,i)=>(
          <div key={i} className={`p-1.5 rounded-md text-center border ${v==="—"?"bg-zinc-50 border-zinc-200 text-zinc-300":"bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold"}`}>
            <div className="text-zinc-400 text-[10px] mb-0.5">b{i}</div>
            {v}
          </div>
        ))}
      </div>
      <div className="text-xs text-zinc-500">
        hash(&apos;apple&apos;) % 8 = <span className="text-indigo-600 font-bold">0</span> → read bucket 0 directly → O(1)
      </div>
    </div>
  );

  if (stage === 3) return (
    <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-3">
      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Two Sum: [2, 7, 11, 15], target=9</div>
      <div className="text-xs font-mono space-y-1.5">
        {[{n:2,comp:7,found:false,seen:"{}→{2:0}"},{n:7,comp:2,found:true,seen:"{2:0}"}].map((row,i)=>(
          <div key={i} className={`flex items-center gap-2 p-1.5 rounded-lg ${row.found?"bg-emerald-50 border border-emerald-200":""}`}>
            <span className="text-zinc-400 w-4">{i}</span>
            <span className={row.found?"text-emerald-600 font-bold":"text-zinc-700"}>n={row.n}</span>
            <span className="text-zinc-400">comp={row.comp}</span>
            {row.found
              ? <span className="text-emerald-600 font-bold ml-auto">✓ found! return [0,1]</span>
              : <span className="text-zinc-500 ml-auto">store → {row.seen}</span>}
          </div>
        ))}
      </div>
      <div className="text-xs text-zinc-500">One pass, O(n). Each element: check complement → store or return.</div>
    </div>
  );

  return null;
}
