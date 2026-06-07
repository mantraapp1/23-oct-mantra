'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, BookMarked, Lock } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            const { data: admin, error: adminError } = await supabase
                .from('admins')
                .select('id')
                .eq('user_id', data.user.id)
                .maybeSingle()

            if (adminError) {
                console.error("Error checking admin status", adminError)
            }

            if (!admin || adminError) {
                setError("Access denied. You are not an admin.")
                await supabase.auth.signOut()
                setLoading(false)
                return
            }

            router.push('/')
            router.refresh()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to login';
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-gradient flex h-screen w-full items-center justify-center p-4">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-violet-500/5 blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-2xl shadow-violet-500/30 mb-4">
                        <BookMarked className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold gradient-text">Mantra Admin</h1>
                    <p className="text-sm text-muted-foreground mt-1">mantranovels.com administration</p>
                </div>

                {/* Login Card */}
                <div className="glass rounded-2xl p-8">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@mantranovels.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-11 bg-background/50 border-border/50 focus:border-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-11 bg-background/50 border-border/50 focus:border-primary"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-violet-500/20 transition-all duration-300"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>
                </div>

                {/* Footer badge */}
                <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    <span>Protected Area — Authorized Personnel Only</span>
                </div>
            </div>
        </div>
    )
}
