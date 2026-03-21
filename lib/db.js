import sql from 'mssql';

const connectionPool = new Map();

export async function getStoreConnection(storeConfig) {
  const key = `${storeConfig.dbIp}:${storeConfig.dbPort}:${storeConfig.dbName}`;
  
  console.log('Connecting to store DB:', storeConfig.dbIp, storeConfig.dbPort);
  
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
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
  };

  try {
    const pool = await sql.connect(config);
    console.log('Successfully connected to store DB');
    connectionPool.set(key, pool);
    return pool;
  } catch (error) {
    console.error('Failed to connect to store DB:', error.message);
    console.error('Connection details - IP:', storeConfig.dbIp, 'Port:', storeConfig.dbPort);
    throw error;
  }
}

export async function closeStoreConnection(storeConfig) {
  const key = `${storeConfig.dbIp}:${storeConfig.dbPort}:${storeConfig.dbName}`;
  
  if (connectionPool.has(key)) {
    const pool = connectionPool.get(key);
    await pool.close();
    connectionPool.delete(key);
  }
}
