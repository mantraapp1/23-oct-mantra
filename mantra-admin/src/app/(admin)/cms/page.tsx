'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { HomeSection, FeaturedBanner, FAQ } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FileText, Image, HelpCircle, Plus, Trash2, Edit, Loader2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

export default function CMSPage() {
    // Sections
    const [sections, setSections] = useState<HomeSection[]>([]);
    const [sectionDialog, setSectionDialog] = useState(false);
    const [sectionName, setSectionName] = useState('');
    const [sectionManual, setSectionManual] = useState(false);

    // Banners
    const [banners, setBanners] = useState<FeaturedBanner[]>([]);
    const [bannerDialog, setBannerDialog] = useState(false);
    const [editBanner, setEditBanner] = useState<FeaturedBanner | null>(null);
    const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', image_url: '', link_url: '', is_active: true, display_order: 0 });

    // FAQs
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [faqDialog, setFaqDialog] = useState(false);
    const [editFaq, setEditFaq] = useState<FAQ | null>(null);
    const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: 'account' as FAQ['category'], keywords: '', is_active: true, display_order: 0 });

    // Delete
    const [deleteItem, setDeleteItem] = useState<{ type: string; id: string; title: string } | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        try {
            const [s, b, f] = await Promise.all([
                adminService.getHomeSections(),
                adminService.getFeaturedBanners(),
                adminService.getFAQs(),
            ]);
            setSections(s);
            setBanners(b);
            setFaqs(f);
        } catch { toast.error('Failed to load CMS data'); } finally { setLoading(false); }
    };

    // Section handlers
    const handleCreateSection = async () => {
        if (!sectionName) return;
        setSaving(true);
        try {
            await adminService.createHomeSection(sectionName, sectionManual, sections.length + 1);
            toast.success('Section created');
            setSectionDialog(false);
            setSectionName('');
            loadAll();
        } catch { toast.error('Failed to create section'); } finally { setSaving(false); }
    };

    // Banner handlers
    const openBannerDialog = (banner?: FeaturedBanner) => {
        if (banner) {
            setEditBanner(banner);
            setBannerForm({
                title: banner.title,
                subtitle: banner.subtitle || '',
                image_url: banner.image_url,
                link_url: banner.link_url || '',
                is_active: banner.is_active,
                display_order: banner.display_order,
            });
        } else {
            setEditBanner(null);
            setBannerForm({ title: '', subtitle: '', image_url: '', link_url: '', is_active: true, display_order: banners.length + 1 });
        }
        setBannerDialog(true);
    };

    const handleSaveBanner = async () => {
        if (!bannerForm.title || !bannerForm.image_url) return;
        setSaving(true);
        try {
            if (editBanner) {
                await adminService.updateFeaturedBanner(editBanner.id, bannerForm);
                toast.success('Banner updated');
            } else {
                await adminService.createFeaturedBanner(bannerForm as any);
                toast.success('Banner created');
            }
            setBannerDialog(false);
            loadAll();
        } catch { toast.error('Failed to save banner'); } finally { setSaving(false); }
    };

    // FAQ handlers
    const openFaqDialog = (faq?: FAQ) => {
        if (faq) {
            setEditFaq(faq);
            setFaqForm({
                question: faq.question,
                answer: faq.answer,
                category: faq.category,
                keywords: faq.keywords,
                is_active: faq.is_active,
                display_order: faq.display_order,
            });
        } else {
            setEditFaq(null);
            setFaqForm({ question: '', answer: '', category: 'account', keywords: '', is_active: true, display_order: faqs.length + 1 });
        }
        setFaqDialog(true);
    };

    const handleSaveFaq = async () => {
        if (!faqForm.question || !faqForm.answer) return;
        setSaving(true);
        try {
            if (editFaq) {
                await adminService.updateFAQ(editFaq.id, faqForm);
                toast.success('FAQ updated');
            } else {
                await adminService.createFAQ(faqForm as any);
                toast.success('FAQ created');
            }
            setFaqDialog(false);
            loadAll();
        } catch { toast.error('Failed to save FAQ'); } finally { setSaving(false); }
    };

    // Delete handler
    const handleDelete = async () => {
        if (!deleteItem) return;
        try {
            switch (deleteItem.type) {
                case 'section': await adminService.deleteHomeSection(deleteItem.id); break;
                case 'banner': await adminService.deleteFeaturedBanner(deleteItem.id); break;
                case 'faq': await adminService.deleteFAQ(deleteItem.id); break;
            }
            toast.success('Deleted successfully');
            setDeleteItem(null);
            loadAll();
        } catch { toast.error('Failed to delete'); }
    };

    const faqCategories = ['account', 'reading', 'writing', 'earnings', 'technical'] as const;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Content Management</h2>
                <p className="text-muted-foreground mt-1">Manage homepage sections, banners, and FAQs.</p>
            </div>

            <Tabs defaultValue="sections">
                <TabsList>
                    <TabsTrigger value="sections"><FileText className="h-4 w-4 mr-1.5" /> Home Sections</TabsTrigger>
                    <TabsTrigger value="banners"><Image className="h-4 w-4 mr-1.5" /> Banners</TabsTrigger>
                    <TabsTrigger value="faqs"><HelpCircle className="h-4 w-4 mr-1.5" /> FAQs</TabsTrigger>
                </TabsList>

                {/* SECTIONS */}
                <TabsContent value="sections" className="mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">Home Sections</CardTitle>
                            <Button size="sm" onClick={() => setSectionDialog(true)}><Plus className="h-4 w-4 mr-1" /> Add Section</Button>
                        </CardHeader>
                        <CardContent>
                            {sections.length === 0 ? (
                                <EmptyState icon={FileText} title="No sections" description="Create your first homepage section" />
                            ) : (
                                <div className="space-y-2">
                                    {sections.map((section) => (
                                        <div key={section.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                                            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{section.section_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {section.is_manual ? 'Manual' : 'Auto'} • Order: {section.priority_order}
                                                </p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteItem({ type: 'section', id: section.id, title: section.section_name })}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* BANNERS */}
                <TabsContent value="banners" className="mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">Featured Banners</CardTitle>
                            <Button size="sm" onClick={() => openBannerDialog()}><Plus className="h-4 w-4 mr-1" /> Add Banner</Button>
                        </CardHeader>
                        <CardContent>
                            {banners.length === 0 ? (
                                <EmptyState icon={Image} title="No banners" description="Create your first featured banner" />
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {banners.map((banner) => (
                                        <div key={banner.id} className="rounded-lg border overflow-hidden group">
                                            <div className="h-32 bg-muted relative">
                                                {banner.image_url && <img src={banner.image_url} alt="" className="w-full h-full object-cover" />}
                                                {!banner.is_active && (
                                                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] bg-red-500/80 text-white">Inactive</div>
                                                )}
                                            </div>
                                            <div className="p-3">
                                                <p className="font-medium text-sm">{banner.title}</p>
                                                {banner.subtitle && <p className="text-xs text-muted-foreground">{banner.subtitle}</p>}
                                                <div className="flex gap-2 mt-2">
                                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openBannerDialog(banner)}>
                                                        <Edit className="h-3 w-3 mr-1" /> Edit
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => setDeleteItem({ type: 'banner', id: banner.id, title: banner.title })}>
                                                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* FAQS */}
                <TabsContent value="faqs" className="mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">FAQs</CardTitle>
                            <Button size="sm" onClick={() => openFaqDialog()}><Plus className="h-4 w-4 mr-1" /> Add FAQ</Button>
                        </CardHeader>
                        <CardContent>
                            {faqs.length === 0 ? (
                                <EmptyState icon={HelpCircle} title="No FAQs" description="Create your first FAQ entry" />
                            ) : (
                                <div className="space-y-2">
                                    {faqs.map((faq) => (
                                        <div key={faq.id} className="p-3 rounded-lg border">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">{faq.category}</span>
                                                        {!faq.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">Inactive</span>}
                                                    </div>
                                                    <p className="font-medium text-sm">{faq.question}</p>
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                                                </div>
                                                <div className="flex gap-1 shrink-0">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openFaqDialog(faq)}>
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteItem({ type: 'faq', id: faq.id, title: faq.question })}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Section Dialog */}
            <Dialog open={sectionDialog} onOpenChange={setSectionDialog}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create Section</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Section Name</Label>
                            <Input value={sectionName} onChange={(e) => setSectionName(e.target.value)} placeholder="e.g. Trending Now" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Manual curation</Label>
                            <Switch checked={sectionManual} onCheckedChange={setSectionManual} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSectionDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreateSection} disabled={!sectionName || saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Banner Dialog */}
            <Dialog open={bannerDialog} onOpenChange={setBannerDialog}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editBanner ? 'Edit Banner' : 'Create Banner'}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2"><Label>Title *</Label><Input value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Subtitle</Label><Input value={bannerForm.subtitle} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Image URL *</Label><Input value={bannerForm.image_url} onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Link URL</Label><Input value={bannerForm.link_url} onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })} /></div>
                        <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={bannerForm.is_active} onCheckedChange={(v) => setBannerForm({ ...bannerForm, is_active: v })} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBannerDialog(false)}>Cancel</Button>
                        <Button onClick={handleSaveBanner} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {editBanner ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* FAQ Dialog */}
            <Dialog open={faqDialog} onOpenChange={setFaqDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>{editFaq ? 'Edit FAQ' : 'Create FAQ'}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={faqForm.category} onValueChange={(v) => setFaqForm({ ...faqForm, category: v as FAQ['category'] })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {faqCategories.map((c) => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2"><Label>Question *</Label><Input value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Answer *</Label><Textarea value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} rows={4} /></div>
                        <div className="space-y-2"><Label>Keywords</Label><Input value={faqForm.keywords} onChange={(e) => setFaqForm({ ...faqForm, keywords: e.target.value })} placeholder="comma-separated keywords" /></div>
                        <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={faqForm.is_active} onCheckedChange={(v) => setFaqForm({ ...faqForm, is_active: v })} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFaqDialog(false)}>Cancel</Button>
                        <Button onClick={handleSaveFaq} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {editFaq ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <ConfirmDialog
                open={!!deleteItem}
                onOpenChange={(open) => !open && setDeleteItem(null)}
                title="Delete Item"
                description={`Are you sure you want to delete "${deleteItem?.title}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="destructive"
                onConfirm={handleDelete}
            />
        </div>
    );
}
