import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';

const globalForMySql = globalThis as unknown as {
  mysqlPool?: mysql.Pool;
  campaignSchemaPromise?: Promise<void>;
};

export function getMySqlPool() {
  if (globalForMySql.mysqlPool) return globalForMySql.mysqlPool;
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME)
    throw new Error(
      'Missing Hostinger MySQL settings. Configure DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME.',
    );
  globalForMySql.mysqlPool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT || 3306),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  });
  return globalForMySql.mysqlPool;
}

interface CountRow extends RowDataPacket {
  total: number;
}

async function migrateCampaignVoteSchema() {
  const db = getMySqlPool();
  const connection = await db.getConnection();
  try {
    await connection.query(
      "SELECT GET_LOCK('pickwise_campaign_schema_v2', 10)",
    );
    const [columns] = await connection.query<CountRow[]>(
      "SELECT COUNT(*) AS total FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'votes' AND COLUMN_NAME = 'campaign'",
    );
    if (!Number(columns[0]?.total)) {
      await connection.query(
        "ALTER TABLE votes ADD COLUMN campaign VARCHAR(64) NOT NULL DEFAULT 'running-shoes' AFTER id",
      );
    }

    const [oldUnique] = await connection.query<CountRow[]>(
      "SELECT COUNT(*) AS total FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'votes' AND INDEX_NAME = 'uq_votes_visitor_feature'",
    );
    if (Number(oldUnique[0]?.total)) {
      await connection.query(
        'ALTER TABLE votes DROP INDEX uq_votes_visitor_feature',
      );
    }

    const [campaignUnique] = await connection.query<CountRow[]>(
      "SELECT COUNT(*) AS total FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'votes' AND INDEX_NAME = 'uq_votes_campaign_visitor_feature'",
    );
    if (!Number(campaignUnique[0]?.total)) {
      await connection.query(
        'ALTER TABLE votes ADD UNIQUE KEY uq_votes_campaign_visitor_feature (campaign, visitor_key, feature)',
      );
    }

    const [campaignReportIndex] = await connection.query<CountRow[]>(
      "SELECT COUNT(*) AS total FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'votes' AND INDEX_NAME = 'idx_votes_campaign_feature_product'",
    );
    if (!Number(campaignReportIndex[0]?.total)) {
      await connection.query(
        'ALTER TABLE votes ADD KEY idx_votes_campaign_feature_product (campaign, feature, product)',
      );
    }
  } finally {
    try {
      await connection.query(
        "SELECT RELEASE_LOCK('pickwise_campaign_schema_v2')",
      );
    } finally {
      connection.release();
    }
  }
}

export function ensureCampaignVoteSchema() {
  globalForMySql.campaignSchemaPromise ??= migrateCampaignVoteSchema().catch(
    (error) => {
      globalForMySql.campaignSchemaPromise = undefined;
      throw error;
    },
  );
  return globalForMySql.campaignSchemaPromise;
}
