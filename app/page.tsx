import { redirect } from "next/navigation"

export default function Home() {
  // Redirigir a login como página principal
  redirect("/login")
}
