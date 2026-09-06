import mysql from 'mysql2/promise';

const globalForMySql = globalThis as unknown as { mysqlPool?: mysql.Pool };

export function getMySqlPool() {
  if (globalForMySql.mysqlPool) return globalForMySql.mysqlPool;
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) throw new Error('Missing Hostinger MySQL settings. Configure DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME.');
  globalForMySql.mysqlPool = mysql.createPool({ host: DB_HOST, port: Number(DB_PORT || 3306), user: DB_USER, password: DB_PASSWORD, database: DB_NAME, waitForConnections: true, connectionLimit: 10, queueLimit: 0, charset: 'utf8mb4' });
  return globalForMySql.mysqlPool;
}
