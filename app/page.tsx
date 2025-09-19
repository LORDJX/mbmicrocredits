export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">MB Microcréditos</h1>
        <p className="text-xl text-gray-600">Sistema de Gestión de Microcréditos</p>
        <div className="space-x-4">
          <a
            href="/auth/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Iniciar Sesión
          </a>
          <a
            href="/auth/sign-up"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Registrarse
          </a>
        </div>
      </div>
    </div>
  )
}
