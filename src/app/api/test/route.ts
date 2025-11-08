import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    server: 'TGH Pulseras API'
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      success: true,
      message: 'POST funcionando correctamente',
      receivedData: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error procesando datos',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 400 })
  }
}
