'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronDown,
  Crown,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import { campaignList, type Campaign } from '@/lib/campaigns';

type VoteTotals = Record<string, Record<string, number>>;
type ProductStyle = CSSProperties & {
  '--product-accent': string;
  '--product-accent-rgb': string;
};
type LeaderStyle = CSSProperties & {
  '--leader-accent': string;
  '--leader-accent-rgb': string;
};

function emptyTotals(campaign: Campaign): VoteTotals {
  return Object.fromEntries(
    campaign.features.map((feature) => [
      feature.id,
      Object.fromEntries(campaign.products.map((product) => [product.id, 0])),
    ]),
  );
}

async function deviceFingerprint() {
  const storageKey = 'pickwise_device_id';
  let deviceId = window.localStorage.getItem(storageKey);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    window.localStorage.setItem(storageKey, deviceId);
  }
  const raw = [
    deviceId,
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency ?? '',
    navigator.maxTouchPoints ?? '',
  ].join('|');
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(raw),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export default function CampaignComparison({
  campaign,
}: {
  campaign: Campaign;
}) {
  const initialTotals = useMemo(() => emptyTotals(campaign), [campaign]);
  const [totals, setTotals] = useState<VoteTotals>(initialTotals);
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});
  const [fingerprint, setFingerprint] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [leftProduct, rightProduct] = campaign.products;

  const refresh = useCallback(
    async (fp?: string) => {
      const params = new URLSearchParams({ campaign: campaign.slug });
      if (fp) params.set('fingerprint', fp);
      try {
        const response = await fetch(`/api/votes?${params}`, {
          cache: 'no-store',
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        setTotals({ ...initialTotals, ...data.totals });
        setMyVotes(data.myVotes ?? {});
        setMessage('');
      } catch {
        setMessage('Live results are reconnecting…');
      }
    },
    [campaign.slug, initialTotals],
  );

  useEffect(() => {
    let active = true;
    void deviceFingerprint()
      .then((fp) => {
        if (!active) return;
        setFingerprint(fp);
        void refresh(fp);
      })
      .catch(() => {
        if (active) {
          setMessage('Voting is unavailable in this browser.');
        }
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  useEffect(() => {
    if (!fingerprint) return;
    const timer = window.setInterval(() => {
      void refresh(fingerprint);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [refresh, fingerprint]);

  const productVotes = useMemo(() => {
    const votes = Object.fromEntries(
      campaign.products.map((product) => [product.id, 0]),
    );
    for (const featureTotals of Object.values(totals)) {
      for (const product of campaign.products) {
        votes[product.id] += featureTotals[product.id] ?? 0;
      }
    }
    return votes;
  }, [campaign.products, totals]);

  const totalVotes = Object.values(productVotes).reduce(
    (sum, count) => sum + count,
    0,
  );
  const leader =
    totalVotes === 0
      ? null
      : productVotes[leftProduct.id] === productVotes[rightProduct.id]
        ? 'tie'
        : productVotes[leftProduct.id] > productVotes[rightProduct.id]
          ? leftProduct.id
          : rightProduct.id;
  const winningProduct = campaign.products.find(
    (product) => product.id === leader,
  );
  const leadBy = Math.abs(
    productVotes[leftProduct.id] - productVotes[rightProduct.id],
  );
  const leaderStyle: LeaderStyle = {
    '--leader-accent': winningProduct?.accent ?? '#f4b740',
    '--leader-accent-rgb': winningProduct?.accentRgb ?? '244 183 64',
  };

  async function vote(feature: string, product: string) {
    if (!fingerprint || busy || myVotes[feature]) return;
    setBusy(feature);
    setMessage('');
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          campaign: campaign.slug,
          feature,
          product,
          fingerprint,
          device: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setTotals(data.totals);
      setMyVotes(data.myVotes);
      setMessage(
        `Your ${campaign.features.find((item) => item.id === feature)?.name} vote is counted.`,
      );
    } catch {
      setMessage('We could not save that vote. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/8 bg-[#0b0b0c]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-3 px-3 py-3 sm:px-8 sm:py-4">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-400 text-black">
              <Sparkles size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-[.16em]">PICKWISE</p>
              <p className="text-[10px] uppercase tracking-[.2em] text-zinc-500">
                Head-to-head
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/8 px-2.5 py-2 text-xs text-emerald-300 sm:px-3">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live voting
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1480px] px-3 pb-12 pt-4 sm:px-8 sm:pb-16 sm:pt-6">
        <div className="campaign-toolbar mb-6 flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/[.035] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-zinc-500">
              Campaign
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              Each campaign has its own shareable URL and results.
            </p>
          </div>
          <details className="campaign-menu relative sm:min-w-72">
            <summary className="campaign-select flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#151518] py-3 pl-4 pr-3 text-sm font-semibold text-white outline-none transition focus-visible:border-amber-400/60">
              <span>{campaign.selectorLabel}</span>
              <ChevronDown
                className="campaign-chevron shrink-0 text-zinc-500"
                size={17}
              />
            </summary>
            <nav
              className="campaign-options absolute left-0 right-0 top-[calc(100%+.45rem)] z-20 overflow-hidden rounded-xl border border-white/10 bg-[#151518] p-1.5 shadow-2xl shadow-black/60"
              aria-label="Choose campaign"
            >
              {campaignList.map((item) => (
                <Link
                  key={item.slug}
                  href={`/campaigns/${item.slug}`}
                  aria-current={
                    item.slug === campaign.slug ? 'page' : undefined
                  }
                  className="campaign-option block rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-white/8 hover:text-white focus-visible:bg-white/8 focus-visible:text-white focus-visible:outline-none"
                >
                  {item.selectorLabel}
                </Link>
              ))}
            </nav>
          </details>
        </div>

        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[.22em] text-amber-400">
              {campaign.eyebrow}
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
              {campaign.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
              {campaign.description}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3">
            <div className="text-right">
              <p className="text-2xl font-semibold tabular-nums">
                {totalVotes}
              </p>
              <p className="text-[10px] uppercase tracking-[.17em] text-zinc-500">
                Votes counted
              </p>
            </div>
            <RefreshCw className="text-zinc-600" size={18} />
          </div>
        </div>

        <output
          className="leader-banner mb-4"
          style={leaderStyle}
          aria-live="polite"
        >
          <span className="leader-crown">
            <Crown size={26} />
          </span>
          <div>
            {leader === null ? (
              <>
                <p className="leader-eyebrow">The crown is waiting</p>
                <p className="leader-name">Be the first to vote</p>
              </>
            ) : leader === 'tie' ? (
              <>
                <p className="leader-eyebrow">Neck and neck</p>
                <p className="leader-name">
                  {leftProduct.name} and {rightProduct.name} are tied
                </p>
              </>
            ) : (
              <>
                <p className="leader-eyebrow">Current community vote leader</p>
                <p className="leader-name">{winningProduct?.name} is leading</p>
                <p className="leader-detail">
                  {productVotes[leader]} total votes · ahead by {leadBy}
                </p>
              </>
            )}
          </div>
        </output>

        <div className="comparison-grid grid min-w-0 gap-4 lg:grid-cols-2">
          {campaign.products.map((product) => {
            const winning = leader === product.id;
            const productStyle: ProductStyle = {
              '--product-accent': product.accent,
              '--product-accent-rgb': product.accentRgb,
            };
            return (
              <article
                key={product.id}
                style={productStyle}
                className={`product-card ${product.mirrored ? 'mirrored' : ''} ${winning ? 'overall-winner' : ''} min-w-0 overflow-hidden rounded-[22px] border border-white/10 bg-[#111113] shadow-2xl shadow-black/20 sm:rounded-[28px]`}
              >
                <div className="product-title relative px-4 pt-5 text-center sm:px-7 sm:pt-6">
                  <h2 className="text-xl font-semibold uppercase tracking-[.12em] sm:text-2xl">
                    {product.name}
                  </h2>
                  {winning && (
                    <span
                      className="card-crown"
                      aria-label="Current community vote leader"
                    >
                      <Crown size={18} /> Community leader
                    </span>
                  )}
                </div>
                <div
                  className={`visual-map ${campaign.mapClass} relative mt-1 aspect-[3/2] w-full overflow-hidden`}
                >
                  <Image
                    src={campaign.diagram}
                    alt={`${product.name} sectioned ${campaign.subject} diagram`}
                    fill
                    loading="eager"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className={`diagram pointer-events-none h-full w-full object-contain opacity-80 ${product.mirrored ? 'mirrored' : ''}`}
                    style={{ filter: product.diagramFilter }}
                  />
                  {campaign.features.map((feature) => {
                    const chosen = myVotes[feature.id];
                    const selected = chosen === product.id;
                    const locked = Boolean(chosen && !selected);
                    const count = totals[feature.id]?.[product.id] ?? 0;
                    return (
                      <button
                        key={feature.id}
                        onClick={() => vote(feature.id, product.id)}
                        disabled={busy === feature.id || Boolean(chosen)}
                        aria-label={`${selected ? 'Your saved vote' : locked ? 'Voting locked' : `Vote for ${product.name}`} on ${feature.name}. ${count} votes.`}
                        className={`section-hit section-${feature.id} ${selected ? 'selected' : ''} ${locked ? 'locked' : ''}`}
                      >
                        <span className="section-content">
                          <strong>{feature.name}</strong>
                          <span className="section-score">
                            <span className="idle-count">{count}</span>
                            <ThumbsUp className="hover-thumb" size={16} />
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>

        <section className="mt-5 min-w-0 rounded-[22px] border border-white/10 bg-[#111113] p-4 sm:rounded-[28px] sm:p-7">
          <div className="report-heading mb-6 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-zinc-500">
                Community report
              </p>
              <h2 className="mt-1 text-lg font-semibold sm:text-xl">
                Feature-by-feature results
              </h2>
            </div>
            <div className="report-promise flex shrink-0 items-center gap-2 text-xs text-zinc-500">
              <ShieldCheck size={15} className="shrink-0 text-emerald-400" />
              One device, one choice per feature
            </div>
          </div>
          <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
            {campaign.features.map((feature) => {
              const pair = totals[feature.id] ?? {};
              const sum =
                (pair[leftProduct.id] ?? 0) + (pair[rightProduct.id] ?? 0);
              const left = sum
                ? Math.round(((pair[leftProduct.id] ?? 0) / sum) * 100)
                : 50;
              const right = 100 - left;
              return (
                <div key={feature.id} className="min-w-0">
                  <div className="mb-2 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{feature.name}</p>
                      <p className="text-xs text-zinc-500">{feature.hint}</p>
                    </div>
                    <p className="shrink-0 text-xs text-zinc-500">
                      {sum} vote{sum === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-zinc-800">
                    <span
                      className="result-left transition-all"
                      style={{
                        width: `${left}%`,
                        backgroundColor: leftProduct.accent,
                      }}
                    />
                    <span
                      className="result-right transition-all"
                      style={{
                        width: `${right}%`,
                        backgroundColor: rightProduct.accent,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between gap-3 text-xs">
                    <span style={{ color: leftProduct.accent }}>
                      {leftProduct.name} <b>{left}%</b>
                    </span>
                    <span
                      className="text-right"
                      style={{ color: rightProduct.accent }}
                    >
                      <b>{right}%</b> {rightProduct.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="legal-disclaimer mt-5 rounded-2xl border border-amber-400/15 bg-amber-400/[.045] px-4 py-4 text-xs leading-5 text-zinc-400 sm:px-5">
          <p className="font-semibold text-zinc-200">Independent comparison</p>
          <p className="mt-1">
            Independent community preference poll. Not affiliated with,
            sponsored by, or endorsed by adidas, Nike, Hyundai, or Honda.
            Results reflect user votes—not objective product testing. All
            trademarks belong to their respective owners.
          </p>
        </aside>

        <footer className="mt-5 flex min-w-0 flex-col justify-between gap-3 rounded-2xl border border-white/8 bg-white/[.025] px-4 py-4 text-xs leading-5 text-zinc-500 sm:flex-row sm:items-center sm:px-5">
          <p className="flex min-w-0 items-start gap-2">
            <ShieldCheck size={15} className="mt-0.5 shrink-0" />
            <span>
              Duplicate-vote protection uses a pseudonymous HMAC identifier; raw
              IP addresses are not stored in the voting database. Voting records
              are retained for a limited period.
            </span>
          </p>
          <div className="flex shrink-0 flex-col gap-1 text-zinc-300 sm:items-end">
            <Link
              className="text-amber-300 underline decoration-amber-300/35 underline-offset-4 hover:text-amber-200"
              href="/privacy"
            >
              Privacy policy
            </Link>
            <p aria-live="polite">
              {message || 'Results refresh automatically.'}
            </p>
          </div>
        </footer>
      </section>
    </main>
  );
}
