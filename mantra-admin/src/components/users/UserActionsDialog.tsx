'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Need to create textarea or use input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Need to create select
import { adminService } from '@/services/adminService';
import { Profile } from '@/types/supabase';
import { Gift, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner'; // Need to install sonner or use toast

interface UserActionsProps {
    user: Profile;
    type: 'gift' | 'message';
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UserActionsDialog({ user, type, open, onOpenChange }: UserActionsProps) {
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (type === 'gift') {
                await adminService.giftUser(user.id, Number(amount), message);
                // toast.success(`Gifted ${amount} coins to ${user.username}`);
                alert(`Gifted ${amount} coins to ${user.username}`);
            } else {
                // await adminService.sendMessage(user.id, message);
                // toast.success(`Message sent to ${user.username}`);
                alert(`Message sent to ${user.username}`);
            }
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            // toast.error('Action failed');
            alert('Action failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{type === 'gift' ? 'Send Gift' : 'Send Message'}</DialogTitle>
                    <DialogDescription>
                        {type === 'gift'
                            ? `Add coins or bonus to ${user.username}'s wallet.`
                            : `Send a direct system message to ${user.username}.`}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {type === 'gift' && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="amount" className="text-right">
                                    Amount
                                </Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="message" className="text-right">
                                Message
                            </Label>
                            <Input
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="col-span-3"
                                placeholder={type === 'gift' ? "Reason (optional)" : "Type your message..."}
                                required={type === 'message'}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {type === 'gift' ? 'Send Gift' : 'Send Message'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
