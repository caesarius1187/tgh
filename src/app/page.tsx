import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            TGH Pulseras
          </h1>
          <p className="text-gray-600 mb-8">
            Sistema de gestión de pulseras con chips NFC
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/activacion" 
            className="w-full btn-primary block text-center"
          >
            Activar Pulsera
          </Link>
          
          <Link 
            href="/login" 
            className="w-full btn-secondary block text-center"
          >
            Iniciar Sesión
          </Link>
        </div>
        
        <div className="text-center text-sm text-gray-500">
          <p>¿Necesitas ayuda? Contacta al administrador</p>
        </div>
      </div>
    </main>
  )
}
