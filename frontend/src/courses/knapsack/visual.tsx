"use client";

export function KnapsackVisual({ stage }: { stage: number }) {
  if (stage === 1) return (
    <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-3">
      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Decision Tree</div>
      <div className="text-xs space-y-1.5 font-mono">
        <div className="text-zinc-500">For each item i:</div>
        <div className="pl-3 space-y-1">
          <div><span className="text-sky-600 font-bold">SKIP</span> → solve(rest, same capacity)</div>
          <div><span className="text-emerald-600 font-bold">TAKE</span> → solve(rest, W−wᵢ) + vᵢ</div>
        </div>
        <div className="pt-1.5 text-zinc-500">n items → <span className="text-red-600 font-bold">2ⁿ leaves</span></div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        {[["n=3","8"],["n=15","32,768"],["n=30","1B+"]].map(([n,c])=>(
          <div key={n} className="p-2 rounded-lg bg-zinc-50 border border-zinc-200">
            <div className="font-mono font-bold text-zinc-700">{n}</div>
            <div className="text-red-500 font-semibold text-[11px]">{c}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (stage === 2) return (
    <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-3">
      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Memoization</div>
      <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 font-mono text-xs text-zinc-700">
        memo[(i, w)] = best value<br/>using first i items, capacity w
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-red-50 border border-red-200">
          <div className="font-bold text-red-700 mb-0.5">Without cache</div>
          <div className="text-red-600 leading-snug">Same (i,w) solved O(2ⁿ) times</div>
        </div>
        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
          <div className="font-bold text-emerald-700 mb-0.5">With cache</div>
          <div className="text-emerald-600 leading-snug">Each (i,w) solved once → O(n×W)</div>
        </div>
      </div>
    </div>
  );

  if (stage === 3) return (
    <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-2">
      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">DP Table (cap=8)</div>
      <div className="overflow-x-auto">
        <table className="text-xs font-mono border-collapse w-full">
          <thead><tr>
            <th className="text-zinc-400 text-left pb-1 pr-2">i\w</th>
            {[0,1,2,3,4,5,6,7,8].map(w=><th key={w} className="text-zinc-400 pb-1 px-1 text-center">{w}</th>)}
          </tr></thead>
          <tbody>
            {[{l:"0",r:[0,0,0,0,0,0,0,0,0]},{l:"1💎",r:[0,0,0,0,0,0,0,10,10]},{l:"2🥇",r:[0,0,0,0,0,8,8,10,10]},{l:"3🔋",r:[0,0,0,5,5,8,8,10,13]}].map(({l,r},ri)=>(
              <tr key={ri}>
                <td className="text-zinc-500 pr-2 py-0.5">{l}</td>
                {r.map((v,wi)=><td key={wi} className={`text-center px-1 py-0.5 rounded ${ri===3&&wi===8?"bg-emerald-100 text-emerald-700 font-bold":v>0?"text-zinc-700":"text-zinc-300"}`}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-zinc-500">dp[3][8]=<span className="text-emerald-600 font-bold">13</span> → Gold+Battery</div>
    </div>
  );

  if (stage === 4) return (
    <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-3">
      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">1D DP: item (2kg,$3), W=5</div>
      <div className="text-xs font-mono space-y-2">
        <div>
          <div className="text-red-600 font-bold mb-0.5">Left→Right (wrong):</div>
          <div className="text-zinc-600 pl-2 space-y-0.5">
            <div>w=2: dp[2]=max(0,dp[0]+3)=<span className="font-bold">3</span></div>
            <div>w=4: dp[4]=max(0,<span className="text-red-500">dp[2]</span>+3)=<span className="text-red-600 font-bold">6</span> ← item used twice!</div>
          </div>
        </div>
        <div>
          <div className="text-emerald-600 font-bold mb-0.5">Right→Left (correct):</div>
          <div className="text-zinc-600 pl-2 space-y-0.5">
            <div>w=4: dp[4]=max(0,<span className="text-emerald-500">dp[2]</span>+3)=<span className="text-emerald-700 font-bold">3</span> ✓</div>
            <div>w=2: dp[2]=max(0,dp[0]+3)=<span className="text-emerald-700 font-bold">3</span> ✓</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (stage === 5) return (
    <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-3">
      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Pattern Map</div>
      <table className="w-full text-xs">
        <thead><tr>
          <th className="text-left text-zinc-500 font-medium pb-1.5">Problem</th>
          <th className="text-left text-zinc-500 font-medium pb-1.5">Loop</th>
        </tr></thead>
        <tbody>
          {[["0/1 Knapsack","R→L"],["Subset Sum","R→L"],["Unbounded Knapsack","L→R"],["Coin Change (min)","L→R"]].map(([p,d])=>(
            <tr key={p}>
              <td className="text-zinc-700 py-1 pr-2 text-[11px]">{p}</td>
              <td className={`py-1 font-mono font-bold text-[11px] ${d==="R→L"?"text-sky-600":"text-emerald-600"}`}>{d}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return null;
}
