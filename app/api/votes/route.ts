import { createHash, randomUUID } from 'node:crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getMySqlPool } from '@/lib/mysql';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const features = ['comfort', 'fit', 'style', 'color', 'pricing', 'availability'] as const;
const products = ['stride', 'velocity'] as const;
interface TotalRow extends RowDataPacket { feature: string; product: string; total: number }
interface OwnVoteRow extends RowDataPacket { feature: string; product: string }

async function report(visitorKey?: string) {
  const db = getMySqlPool();
  const [rows] = await db.query<TotalRow[]>('SELECT feature, product, COUNT(*) AS total FROM votes GROUP BY feature, product');
  const totals: Record<string, { stride: number; velocity: number }> = Object.fromEntries(features.map((feature) => [feature, { stride: 0, velocity: 0 }]));
  for (const row of rows) if (totals[row.feature] && products.includes(row.product as never)) totals[row.feature][row.product as 'stride' | 'velocity'] = Number(row.total);
  const myVotes: Record<string, string> = {};
  if (visitorKey) { const [own] = await db.execute<OwnVoteRow[]>('SELECT feature, product FROM votes WHERE visitor_key = ?', [visitorKey]); for (const row of own) myVotes[row.feature] = row.product; }
  return { totals, myVotes };
}

function requestIp(request: Request) { return (request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown').slice(0, 45); }
function visitorKey(fingerprint: string, ip: string) { return createHash('sha256').update(`${fingerprint}|${ip}`).digest('hex'); }

export async function GET(request: Request) {
  try { const fingerprint = new URL(request.url).searchParams.get('fingerprint'); const key = fingerprint ? visitorKey(fingerprint.slice(0, 128), requestIp(request)) : undefined; return Response.json(await report(key)); }
  catch (error) { console.error('Unable to load votes', error); return Response.json({ error: 'Database unavailable' }, { status: 503 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { feature?: string; product?: string; fingerprint?: string; device?: unknown };
    if (!body.feature || !features.includes(body.feature as never) || !body.product || !products.includes(body.product as never) || !body.fingerprint || body.fingerprint.length < 32) return Response.json({ error: 'Invalid vote' }, { status: 400 });
    const db = getMySqlPool(); const ip = requestIp(request); const key = visitorKey(body.fingerprint.slice(0, 128), ip); const userAgent = (request.headers.get('user-agent') || 'unknown').slice(0, 512);
    await db.execute<ResultSetHeader>(`INSERT IGNORE INTO votes (id, feature, product, visitor_key, ip_address, user_agent, device_details, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`, [randomUUID(), body.feature, body.product, key, ip, userAgent, JSON.stringify(body.device ?? {}).slice(0, 2048)]);
    return Response.json(await report(key));
  } catch (error) { console.error('Unable to save vote', error); return Response.json({ error: 'Database unavailable' }, { status: 503 }); }
}
