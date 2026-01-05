import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export const GET = () => NextResponse.json({ error: 'Método no implementado' }, { status: 501 })
export const POST = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })
export const PUT = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })
export const PATCH = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })
export const DELETE = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })

