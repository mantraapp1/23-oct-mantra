import { Profile } from "@/types/supabase"
import { columns } from "./columns"
import { DataTable } from "./data-table"
import { createClient } from "@/lib/supabase/server"

async function getData(): Promise<Profile[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100) // fetch 100 for now

    if (error) {
        console.error(error)
        return []
    }

    return data as Profile[]
}

export default async function UsersPage() {
    const data = await getData()

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6">User Management</h1>
            <DataTable columns={columns} data={data} />
        </div>
    )
}
