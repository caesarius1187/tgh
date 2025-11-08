import mysql, {
  type Pool,
  type PoolConnection,
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
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tgh_pulseras',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
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
    console.log('✅ Conexión a MySQL establecida correctamente')
    return true
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error)
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
