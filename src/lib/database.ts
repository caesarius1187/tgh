import mysql, {
  type Pool,
  type PoolConnection,
  type PoolOptions,
  type ResultSetHeader,
  type RowDataPacket,
  type OkPacket
} from 'mysql2/promise'

type QueryRows =
  | RowDataPacket[]
  | RowDataPacket[][]
  | ResultSetHeader
  | OkPacket
  | OkPacket[]

type QueryValue = string | number | boolean | Date | Buffer | null | undefined

// Configuración de la base de datos
const toBool = (value?: string): boolean => {
  if (!value) return false
  return ['true', '1', 'yes', 'y'].includes(value.toLowerCase())
}

const getEnv = (primary?: string, secondary?: string, fallback?: string): string | undefined =>
  primary ?? secondary ?? fallback

const connectionUrl =
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.DATABASE_URL

let host = getEnv(process.env.DB_HOST, process.env.POSTGRES_HOST, 'localhost')
let port = Number(getEnv(process.env.DB_PORT, process.env.POSTGRES_PORT, '3306'))
let user = getEnv(process.env.DB_USER, process.env.POSTGRES_USER, 'root') ?? 'root'
let password = getEnv(process.env.DB_PASSWORD, process.env.POSTGRES_PASSWORD, '')
let database = getEnv(process.env.DB_NAME, process.env.POSTGRES_DATABASE, 'tgh_pulseras') ?? 'tgh_pulseras'

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

const useSSL = toBool(process.env.DB_SSL ?? process.env.POSTGRES_SSL)
const sslRejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED
  ? toBool(process.env.DB_SSL_REJECT_UNAUTHORIZED)
  : process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED
    ? toBool(process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED)
    : true

const dbConfig: PoolOptions = {
  host,
  port,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: Number(process.env.DB_QUEUE_LIMIT || 0),
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT || 10000),
  ssl: useSSL
    ? {
        rejectUnauthorized: sslRejectUnauthorized
      }
    : undefined
}

// Pool de conexiones
let pool: Pool | null = null

export const getPool = (): Pool => {
  if (!pool) {
    pool = mysql.createPool(dbConfig)
  }
  return pool
}

// Función para obtener una conexión
export const getConnection = async (): Promise<PoolConnection> => {
  const pool = getPool()
  return await pool.getConnection()
}

// Función para ejecutar queries
export const executeQuery = async <T extends QueryRows>(
  query: string,
  params: ReadonlyArray<QueryValue | QueryValue[]> = []
): Promise<T> => {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute<T>(query, params as unknown[])
    return rows
  } finally {
    connection.release()
  }
}

// Función para verificar la conexión
export const testConnection = async (): Promise<boolean> => {
  try {
    await executeQuery('SELECT 1')
    console.log('✅ Conexión a la base de datos establecida correctamente')
    return true
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error)
    return false
  }
}

// Función para cerrar el pool
export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end()
    pool = null
  }
}

export default getPool
