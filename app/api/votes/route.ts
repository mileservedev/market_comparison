import { createHash, randomUUID } from 'node:crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getCampaign } from '@/lib/campaigns';
import { ensureCampaignVoteSchema, getMySqlPool } from '@/lib/mysql';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TotalRow extends RowDataPacket {
  feature: string;
  product: string;
  total: number;
}
interface OwnVoteRow extends RowDataPacket {
  feature: string;
  product: string;
}

async function report(campaignSlug: string, visitorKey?: string) {
  const campaign = getCampaign(campaignSlug);
  if (!campaign) throw new Error('Unknown campaign');
  await ensureCampaignVoteSchema();
  const db = getMySqlPool();
  const features = campaign.features.map((feature) => feature.id);
  const products = campaign.products.map((product) => product.id);
  const [rows] = await db.execute<TotalRow[]>(
    'SELECT feature, product, COUNT(*) AS total FROM votes WHERE campaign = ? GROUP BY feature, product',
    [campaignSlug],
  );
  const totals: Record<string, Record<string, number>> = Object.fromEntries(
    features.map((feature) => [
      feature,
      Object.fromEntries(products.map((product) => [product, 0])),
    ]),
  );
  for (const row of rows)
    if (totals[row.feature] && products.includes(row.product))
      totals[row.feature][row.product] = Number(row.total);
  const myVotes: Record<string, string> = {};
  if (visitorKey) {
    const [own] = await db.execute<OwnVoteRow[]>(
      'SELECT feature, product FROM votes WHERE campaign = ? AND visitor_key = ?',
      [campaignSlug, visitorKey],
    );
    for (const row of own) myVotes[row.feature] = row.product;
  }
  return { totals, myVotes };
}

function requestIp(request: Request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  ).slice(0, 45);
}
function visitorKey(fingerprint: string, ip: string) {
  return createHash('sha256').update(`${fingerprint}|${ip}`).digest('hex');
}

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const campaign = searchParams.get('campaign') || 'running-shoes';
    if (!getCampaign(campaign))
      return Response.json({ error: 'Invalid campaign' }, { status: 400 });
    const fingerprint = searchParams.get('fingerprint');
    const key = fingerprint
      ? visitorKey(fingerprint.slice(0, 128), requestIp(request))
      : undefined;
    return Response.json(await report(campaign, key));
  } catch (error) {
    console.error('Unable to load votes', error);
    return Response.json({ error: 'Database unavailable' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      campaign?: string;
      feature?: string;
      product?: string;
      fingerprint?: string;
      device?: unknown;
    };
    const campaignSlug = body.campaign || 'running-shoes';
    const campaign = getCampaign(campaignSlug);
    const features = campaign?.features.map((feature) => feature.id) ?? [];
    const products = campaign?.products.map((product) => product.id) ?? [];
    if (
      !campaign ||
      !body.feature ||
      !features.includes(body.feature) ||
      !body.product ||
      !products.includes(body.product) ||
      !body.fingerprint ||
      body.fingerprint.length < 32
    )
      return Response.json({ error: 'Invalid vote' }, { status: 400 });
    await ensureCampaignVoteSchema();
    const db = getMySqlPool();
    const ip = requestIp(request);
    const key = visitorKey(body.fingerprint.slice(0, 128), ip);
    const userAgent = (request.headers.get('user-agent') || 'unknown').slice(
      0,
      512,
    );
    await db.execute<ResultSetHeader>(
      `INSERT IGNORE INTO votes (id, campaign, feature, product, visitor_key, ip_address, user_agent, device_details, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        randomUUID(),
        campaignSlug,
        body.feature,
        body.product,
        key,
        ip,
        userAgent,
        JSON.stringify(body.device ?? {}).slice(0, 2048),
      ],
    );
    return Response.json(await report(campaignSlug, key));
  } catch (error) {
    console.error('Unable to save vote', error);
    return Response.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
