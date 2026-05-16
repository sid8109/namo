import sql from "mssql";

const globalForMSSQL = globalThis;

if (!globalForMSSQL.connectionPool) {
  globalForMSSQL.connectionPool = new Map();
}

const connectionPool = globalForMSSQL.connectionPool;

export async function getStoreConnection(storeConfig) {
  const key = `${storeConfig.dbIp}:${storeConfig.dbPort}:${storeConfig.dbName}`;

  if (connectionPool.has(key)) {
    const pool = connectionPool.get(key);
    if (pool.connected) {
      return pool;
    }
    connectionPool.delete(key);
  }

  const config = {
    server: storeConfig.dbIp,
    port: parseInt(storeConfig.dbPort),
    user: storeConfig.dbUser,
    password: storeConfig.dbPassword,
    database: storeConfig.dbName,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
    },
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
  };

  try {
    const pool = await new sql.ConnectionPool(config).connect();
    connectionPool.set(key, pool);
    return pool;
  } catch (error) {
    console.error("DB connection error:", error);
    throw error;
  }
}
