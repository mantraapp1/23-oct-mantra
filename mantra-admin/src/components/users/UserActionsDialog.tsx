'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { adminService } from '@/services/adminService';
import { Profile } from '@/types/supabase';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
    const [title, setTitle] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (type === 'gift') {
                await adminService.giftUser(user.id, Number(amount), message);
                toast.success(`Gifted ₹${amount} to ${user.display_name || user.username}`);
            } else {
                await adminService.sendUserNotification(user.id, title, message);
                toast.success(`Message sent to ${user.display_name || user.username}`);
            }
            onOpenChange(false);
            setAmount('');
            setMessage('');
            setTitle('');
        } catch (error) {
            console.error(error);
            toast.error('Action failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{type === 'gift' ? '🎁 Send Gift' : '💬 Send Message'}</DialogTitle>
                    <DialogDescription>
                        {type === 'gift'
                            ? `Add coins to ${user.display_name || user.username}'s wallet.`
                            : `Send a system notification to ${user.display_name || user.username}.`}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {type === 'gift' && (
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount (₹)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    min="1"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    required
                                />
                            </div>
                        )}
                        {type === 'message' && (
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Notification title"
                                    required
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="message">{type === 'gift' ? 'Reason' : 'Message'}</Label>
                            <Textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={type === 'gift' ? 'Reason for gift (optional)' : 'Type your message...'}
                                rows={3}
                                required={type === 'message'}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
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
