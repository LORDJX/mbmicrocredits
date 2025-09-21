import { redirect } from "next/navigation"

export default function Home() {
  // Hacemos que la página principal sea la de inicio de sesión
  redirect("/login")
}
