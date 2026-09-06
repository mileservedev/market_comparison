'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, ShieldCheck, Sparkles, ThumbsUp } from 'lucide-react';

type ProductId = 'stride' | 'velocity';
type FeatureId = 'comfort' | 'fit' | 'style' | 'color' | 'pricing' | 'availability';
type VoteTotals = Record<FeatureId, Record<ProductId, number>>;

const products = {
  stride: { name: 'adidas', image: '/shoe-sections-six.png', accent: '#f4b740' },
  velocity: { name: 'Nike', image: '/shoe-sections-six.png', accent: '#ff5147' },
} as const;

const features: { id: FeatureId; name: string; hint: string }[] = [
  { id: 'style', name: 'Style', hint: 'Form & silhouette' },
  { id: 'fit', name: 'Fit', hint: 'Lockdown & sizing' },
  { id: 'color', name: 'Color', hint: 'Palette & finish' },
  { id: 'comfort', name: 'Comfort', hint: 'Cushioning & ride' },
  { id: 'pricing', name: 'Pricing', hint: 'Value for money' },
  { id: 'availability', name: 'Availability', hint: 'Ease of purchase' },
];

const emptyTotals: VoteTotals = { comfort: { stride: 0, velocity: 0 }, fit: { stride: 0, velocity: 0 }, style: { stride: 0, velocity: 0 }, color: { stride: 0, velocity: 0 }, pricing: { stride: 0, velocity: 0 }, availability: { stride: 0, velocity: 0 } };

async function deviceFingerprint() {
  const storageKey = 'pickwise_device_id';
  let deviceId = window.localStorage.getItem(storageKey);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    window.localStorage.setItem(storageKey, deviceId);
  }
  const raw = [deviceId, navigator.userAgent, navigator.language, navigator.platform, `${screen.width}x${screen.height}x${screen.colorDepth}`, Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.hardwareConcurrency ?? '', navigator.maxTouchPoints ?? ''].join('|');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function Home() {
  const [totals, setTotals] = useState<VoteTotals>(emptyTotals);
  const [myVotes, setMyVotes] = useState<Partial<Record<FeatureId, ProductId>>>({});
  const [fingerprint, setFingerprint] = useState('');
  const [busy, setBusy] = useState<FeatureId | null>(null);
  const [message, setMessage] = useState('');
  const refresh = useCallback(async (fp?: string) => {
    try { const res = await fetch(`/api/votes${fp ? `?fingerprint=${encodeURIComponent(fp)}` : ''}`, { cache: 'no-store' }); if (!res.ok) throw new Error(); const data = await res.json(); setTotals({ ...emptyTotals, ...data.totals }); setMyVotes(data.myVotes ?? {}); }
    catch { setMessage('Live results are reconnecting…'); }
  }, []);
  useEffect(() => { deviceFingerprint().then((fp) => { setFingerprint(fp); refresh(fp); }); }, [refresh]);
  useEffect(() => { if (!fingerprint) return; const timer = window.setInterval(() => refresh(fingerprint), 15000); return () => window.clearInterval(timer); }, [refresh, fingerprint]);
  const totalVotes = useMemo(() => Object.values(totals).reduce((sum, t) => sum + t.stride + t.velocity, 0), [totals]);

  async function vote(feature: FeatureId, product: ProductId) {
    if (!fingerprint || busy || myVotes[feature]) return; setBusy(feature); setMessage('');
    try {
      const res = await fetch('/api/votes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ feature, product, fingerprint, device: { userAgent: navigator.userAgent, language: navigator.language, platform: navigator.platform, viewport: `${window.innerWidth}x${window.innerHeight}`, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone } }) });
      if (!res.ok) throw new Error(); const data = await res.json(); setTotals(data.totals); setMyVotes(data.myVotes); setMessage(`Your ${features.find((f) => f.id === feature)?.name} vote is counted.`);
    } catch { setMessage('We could not save that vote. Please try again.'); } finally { setBusy(null); }
  }

  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b border-white/8 bg-[#0b0b0c]/90 backdrop-blur-xl"><div className="mx-auto flex max-w-[1480px] items-center justify-between px-5 py-4 sm:px-8"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-amber-400 text-black"><Sparkles size={18}/></span><div><p className="text-sm font-bold tracking-[.16em]">PICKWISE</p><p className="text-[10px] uppercase tracking-[.2em] text-zinc-500">Head-to-head</p></div></div><div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/8 px-3 py-2 text-xs text-emerald-300"><span className="size-1.5 animate-pulse rounded-full bg-emerald-400"/>Live voting</div></div></header>
    <section className="mx-auto max-w-[1480px] px-5 pb-16 pt-8 sm:px-8">
      <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[.22em] text-amber-400">Running shoe showdown</p><h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">Every feature. One clear winner.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">Tap the same feature on either shoe to cast your preference. You get one choice per feature—and you can change your mind.</p></div><div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3"><div className="text-right"><p className="text-2xl font-semibold tabular-nums">{totalVotes}</p><p className="text-[10px] uppercase tracking-[.17em] text-zinc-500">Votes counted</p></div><RefreshCw className="text-zinc-600" size={18}/></div></div>
      <div className="grid gap-4 lg:grid-cols-2">{(Object.keys(products) as ProductId[]).map((productId) => { const product = products[productId]; return <article key={productId} className={`product-card product-${productId} overflow-hidden rounded-[28px] border border-white/10 bg-[#111113] shadow-2xl shadow-black/20`}><div className="px-5 pt-6 text-center sm:px-7"><h2 className="text-2xl font-semibold uppercase tracking-[.12em]">{product.name}</h2></div><div className="shoe-map relative mt-1 aspect-[3/2] overflow-hidden"><img src={product.image} alt={`${product.name} sectioned running shoe diagram`} className={`pointer-events-none h-full w-full object-contain opacity-80 ${productId === 'velocity' ? 'velocity-diagram' : ''}`}/>{features.map((feature) => { const chosen = myVotes[feature.id]; const selected = chosen === productId; const locked = Boolean(chosen && !selected); const count = totals[feature.id][productId]; return <button key={feature.id} onClick={() => vote(feature.id, productId)} disabled={busy === feature.id || Boolean(chosen)} aria-label={`${selected ? 'Your saved vote' : locked ? 'Voting locked' : `Vote for ${product.name}`} on ${feature.name}. ${count} votes.`} className={`section-hit section-${feature.id} ${selected ? 'selected' : ''} ${locked ? 'locked' : ''}`}><span className="section-content"><strong>{feature.name}</strong><span className="section-score"><span className="idle-count">{count}</span><ThumbsUp className="hover-thumb" size={16}/></span></span></button>; })}</div></article>; })}</div>
      <section className="mt-5 rounded-[28px] border border-white/10 bg-[#111113] p-5 sm:p-7"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-zinc-500">Community report</p><h2 className="mt-1 text-xl font-semibold">Feature-by-feature results</h2></div><div className="flex items-center gap-2 text-xs text-zinc-500"><ShieldCheck size={15} className="text-emerald-400"/>One device, one choice per feature</div></div><div className="grid gap-x-8 gap-y-6 md:grid-cols-2">{features.map((feature) => { const pair = totals[feature.id]; const sum = pair.stride + pair.velocity; const left = sum ? Math.round(pair.stride / sum * 100) : 50; const right = 100 - left; return <div key={feature.id}><div className="mb-2 flex items-end justify-between"><div><p className="font-medium">{feature.name}</p><p className="text-xs text-zinc-500">{feature.hint}</p></div><p className="text-xs text-zinc-500">{sum} vote{sum === 1 ? '' : 's'}</p></div><div className="flex h-2 overflow-hidden rounded-full bg-zinc-800"><span className="bg-amber-400 transition-all" style={{ width: `${left}%` }}/><span className="bg-red-500 transition-all" style={{ width: `${right}%` }}/></div><div className="mt-2 flex justify-between text-xs"><span className="text-amber-300">adidas <b>{left}%</b></span><span className="text-red-300"><b>{right}%</b> Nike</span></div></div>; })}</div></section>
      <footer className="mt-5 flex flex-col justify-between gap-3 rounded-2xl border border-white/8 bg-white/[.025] px-5 py-4 text-xs text-zinc-500 sm:flex-row sm:items-center"><p className="flex items-center gap-2"><ShieldCheck size={15}/>To prevent duplicate votes, this demo stores your IP address, browser/device details, and a pseudonymous device fingerprint.</p><p aria-live="polite" className="text-zinc-300">{message || 'Results refresh automatically.'}</p></footer>
    </section>
  </main>;
}
