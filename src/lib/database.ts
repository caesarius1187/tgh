import {
  Pool,
  type PoolClient,
  type PoolConfig,
  type QueryConfig,
  type QueryResult,
  type QueryResultRow
} from 'pg'

type QueryValue = string | number | boolean | Date | Buffer | null | undefined
type QueryParams = ReadonlyArray<QueryValue>
type QueryValueArray = QueryValue[]
type QueryConfigType = QueryConfig<QueryValueArray>

const toBool = (value?: string): boolean => {
  if (!value) return false
  return ['true', '1', 'yes', 'y'].includes(value.toLowerCase())
}

const getEnv = (value?: string, fallback?: string): string | undefined =>
  value ?? fallback

const connectionUrl =
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.DATABASE_URL

let host = getEnv(process.env.POSTGRES_HOST, 'localhost')
let port = Number(getEnv(process.env.POSTGRES_PORT, '5432'))
let user = getEnv(process.env.POSTGRES_USER, 'postgres') ?? 'postgres'
let password = getEnv(process.env.POSTGRES_PASSWORD, '')
let database = getEnv(process.env.POSTGRES_DATABASE, 'postgres') ?? 'postgres'

if (connectionUrl) {
  try {
    const url = new URL(connectionUrl)
    host = url.hostname || host
    if (url.port) {
      port = Number(url.port)
    }
    user = decodeURIComponent(url.username || user)
    password = decodeURIComponent(url.password || password || '')
    database = url.pathname ? url.pathname.replace(/^\//, '') : database
  } catch (error) {
    console.warn('No se pudo parsear POSTGRES_URL/DATABASE_URL. Continuando con variables individuales.', error)
  }
}

const sslPreference =
  process.env.POSTGRES_SSL ??
  (connectionUrl && connectionUrl.includes('sslmode=require') ? 'true' : 'false')

const useSSL = toBool(sslPreference)
const sslRejectUnauthorized = process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED
  ? toBool(process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED)
  : false

const baseConfig: PoolConfig = connectionUrl
  ? { connectionString: connectionUrl }
  : {
      host,
      port,
      user,
      password,
      database
    }

if (useSSL) {
  baseConfig.ssl = {
    rejectUnauthorized: sslRejectUnauthorized
  }
}

baseConfig.max = Number(process.env.POSTGRES_POOL_MAX || process.env.PGPOOL_MAX_CLIENTS || 10)
baseConfig.idleTimeoutMillis = Number(process.env.POSTGRES_POOL_IDLE || 30000)
baseConfig.connectionTimeoutMillis = Number(process.env.POSTGRES_POOL_TIMEOUT || 10000)

let pool: Pool | null = null

export const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool(baseConfig)
  }
  return pool
}

export const getClient = async (): Promise<PoolClient> => {
  return await getPool().connect()
}

export const executeQuery = async <T extends QueryResultRow = QueryResultRow>(
  query: string | QueryConfigType,
  params: QueryParams = []
): Promise<QueryResult<T>> => {
  if (typeof query === 'string') {
    return getPool().query<T>(query, params as QueryValueArray)
  }
  return getPool().query<T>(query)
}

export const testConnection = async (): Promise<boolean> => {
  try {
    await getPool().query('SELECT 1')
    console.log('✅ Conexión a la base de datos establecida correctamente')
    return true
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error)
    return false
  }
}

export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end()
    pool = null
  }
}

export default getPool
