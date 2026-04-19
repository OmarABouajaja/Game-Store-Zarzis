import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Gamepad2, Plus, Trash2, Edit2, GripVertical, Save } from "lucide-react";
import { GameShortcut } from "@/types";

const GameSettings = () => {
    const { gameShortcuts, addGameShortcut, updateGameShortcut, deleteGameShortcut, isLoading } = useData();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        console_type: "PS5",
        icon: "🎮",
        display_order: 0,
        is_active: true,
        shortcut_key: ""
    });

    const handleCreate = async () => {
        if (!formData.name) return;
        try {
            await addGameShortcut({
                ...formData,
                display_order: gameShortcuts.length
            });
            setIsAddDialogOpen(false);
            resetForm();
            toast({ title: "Shortcut created" });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to create shortcut";
            toast({ title: "Error", description: message, variant: "destructive" });
        }
    };

    const handleUpdate = async (id: string) => {
        try {
            await updateGameShortcut(id, formData);
            setIsEditing(null);
            resetForm();
            toast({ title: "Shortcut updated" });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to update shortcut";
            toast({ title: "Error", description: message, variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this shortcut?")) return;
        try {
            await deleteGameShortcut(id);
            toast({ title: "Shortcut deleted" });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to delete shortcut";
            toast({ title: "Error", description: message, variant: "destructive" });
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            console_type: "PS5",
            icon: "🎮",
            display_order: 0,
            is_active: true,
            shortcut_key: ""
        });
    };

    const startEdit = (shortcut: GameShortcut) => {
        setFormData({
            name: shortcut.name,
            console_type: shortcut.console_type,
            icon: shortcut.icon || "🎮",
            display_order: shortcut.display_order,
            is_active: shortcut.is_active,
            shortcut_key: shortcut.shortcut_key || ""
        });
        setIsEditing(shortcut.id);
    };

    return (
        <ProtectedRoute requireOwner>
            <DashboardLayout>
                <div className="p-6 max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold font-display">Game Shortcuts</h1>
                            <p className="text-muted-foreground text-sm">Manage games for quick session start</p>
                        </div>

                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="hero">
                                    <Plus className="w-4 h-4 me-2" />
                                    Add Shortcut
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg">
                                <DialogHeader>
                                    <DialogTitle>{t('settings.new_shortcut', 'New Game Shortcut')}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Game Name</Label>
                                        <Input
                                            placeholder="e.g. EA Sports FC 24"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Console</Label>
                                            <Select value={formData.console_type} onValueChange={v => setFormData({ ...formData, console_type: v })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="PS4">PS4</SelectItem>
                                                    <SelectItem value="PS5">PS5</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Icon/Emoji</Label>
                                            <Input
                                                placeholder="🎮"
                                                value={formData.icon}
                                                onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Key Bind</Label>
                                            <Input
                                                placeholder="1-9, A-Z"
                                                value={formData.shortcut_key}
                                                onChange={e => setFormData({ ...formData, shortcut_key: e.target.value.toUpperCase().slice(0, 1) })}
                                                maxLength={1}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
                                    <Button variant="hero" onClick={handleCreate}>{t('common.create', 'Create')}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4">
                        {isLoading ? (
                            <div className="text-center py-10 text-muted-foreground">Loading shortcuts...</div>
                        ) : gameShortcuts.length === 0 ? (
                            <div className="text-center py-10 glass-card rounded-xl">
                                <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                                <p className="text-muted-foreground">No shortcuts yet. Add your first game!</p>
                            </div>
                        ) : (
                            gameShortcuts.map((shortcut) => (
                                <Card key={shortcut.id} className="overflow-hidden glass-card hover:bg-muted/30 transition-colors">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-lg text-2xl">
                                            {shortcut.icon || '🎮'}
                                        </div>

                                        <div className="flex-1">
                                            {isEditing === shortcut.id ? (
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={formData.name}
                                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                        className="bg-background"
                                                    />
                                                </div>
                                            ) : (
                                                <div>
                                                    <h3 className="font-bold flex items-center gap-2">
                                                        {shortcut.name}
                                                        {shortcut.shortcut_key && (
                                                            <span className="text-[10px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded border border-secondary/30 font-mono">
                                                                Key: {shortcut.shortcut_key}
                                                            </span>
                                                        )}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground">{shortcut.console_type}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {isEditing === shortcut.id ? (
                                                <>
                                                    <Button size="icon" variant="ghost" onClick={() => setIsEditing(null)}>
                                                        {t('common.cancel', 'Cancel')}
                                                    </Button>
                                                    <Button size="icon" variant="hero" onClick={() => handleUpdate(shortcut.id)}>
                                                        <Save className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button size="icon" variant="ghost" onClick={() => startEdit(shortcut)}>
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(shortcut.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
};

export default GameSettings;
