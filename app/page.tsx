"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      try {
        const session = localStorage.getItem("mb_session")
        if (session) {
          const sessionData = JSON.parse(session)
          if (sessionData.user && sessionData.expires > Date.now()) {
            router.push("/dashboard")
            return
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error)
      }

      router.push("/login")
      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">MB Microcredits</h1>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}
