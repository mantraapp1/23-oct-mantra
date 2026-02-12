import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown, Gift, MessageSquare, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserActionsDialog } from "@/components/users/UserActionsDialog"
import { useState } from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Profile } from "@/types/supabase"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export const columns: ColumnDef<Profile>[] = [
    {
        accessorKey: "profile_picture_url",
        header: "",
        cell: ({ row }) => {
            const profile = row.original
            return (
                <Avatar>
                    <AvatarImage src={profile.profile_picture_url || ''} />
                    <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
            )
        }
    },
    {
        accessorKey: "username",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Username
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
    },
    {
        accessorKey: "email", // Note: Email is not in Profile type directly usually, user object has it. But assuming we might join relevant data or just use username.
        // Wait, Profile type has id, username, full_name... NO email. Email is in auth.users.
        // We should probably fetch email separately or handle it.
        // For now, let's use username.
        header: "Email",
        cell: ({ row }) => {
            // Placeholder for email since it's not in public profile
            return <span className="text-muted-foreground">Private</span>
        }
    },
    {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
            const role = row.original.role
            return (
                <Badge variant={role === 'admin' ? 'destructive' : role === 'author' ? 'default' : 'secondary'}>
                    {role}
                </Badge>
            )
        }
    },
    {
        accessorKey: "created_at",
        header: "Joined",
        cell: ({ row }) => {
            const date = new Date(row.original.updated_at || Date.now()) // using updated_at as proxy if created_at missing in type
            return <span>{date.toLocaleDateString()}</span>
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const profile = row.original
            const [giftOpen, setGiftOpen] = useState(false)
            const [msgOpen, setMsgOpen] = useState(false)

            return (
                <>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(profile.id)}
                            >
                                Copy User ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <ExternalLink className="mr-2 h-4 w-4" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setMsgOpen(true)}>
                                <MessageSquare className="mr-2 h-4 w-4" /> Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setGiftOpen(true)}>
                                <Gift className="mr-2 h-4 w-4" /> Send Gift
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <UserActionsDialog
                        user={profile}
                        type="gift"
                        open={giftOpen}
                        onOpenChange={setGiftOpen}
                    />
                    <UserActionsDialog
                        user={profile}
                        type="message"
                        open={msgOpen}
                        onOpenChange={setMsgOpen}
                    />
                </>
            )
        },
    },
]
