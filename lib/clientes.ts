import { createClient } from "@/lib/supabase/server"

export interface Client {
  id: string
  client_code: string
  first_name: string
  last_name: string
  dni: string
  phone?: string
  address?: string
  email?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getClientsData() {
  const supabase = await createClient()

  try {
    // Get all clients
    const { data: clients, error } = await supabase
      .from("active_clients")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching clients:", error)
      return {
        clients: [],
        totalClients: 0,
        activeClients: 0,
      }
    }

    const clientsData = clients || []
    const totalClients = clientsData.length
    const activeClients = clientsData.filter((client) => client.is_active).length

    return {
      clients: clientsData,
      totalClients,
      activeClients,
    }
  } catch (error) {
    console.error("Error in getClientsData:", error)
    return {
      clients: [],
      totalClients: 0,
      activeClients: 0,
    }
  }
}

export async function getClientById(id: string) {
  const supabase = await createClient()

  try {
    const { data: client, error } = await supabase.from("active_clients").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching client:", error)
      return null
    }

    return client
  } catch (error) {
    console.error("Error in getClientById:", error)
    return null
  }
}

export async function getClientByDni(dni: string) {
  const supabase = await createClient()

  try {
    const { data: client, error } = await supabase.from("active_clients").select("*").eq("dni", dni).single()

    if (error) {
      console.error("Error fetching client by DNI:", error)
      return null
    }

    return client
  } catch (error) {
    console.error("Error in getClientByDni:", error)
    return null
  }
}
