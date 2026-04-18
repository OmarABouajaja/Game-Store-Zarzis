import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { useConsoles, useUpdateConsole } from "@/hooks/useConsoles";
import { usePricing } from "@/hooks/usePricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Gamepad2, Plus, Trash2, Edit2, Save, Keyboard, Monitor } from "lucide-react";
import { GameShortcut, Console } from "@/types";

interface ShortcutManagerDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ShortcutManagerDialog = ({ isOpen, onOpenChange }: ShortcutManagerDialogProps) => {
    // Game Shortcut Hooks
    const { gameShortcuts, addGameShortcut, updateGameShortcut, deleteGameShortcut, isLoading } = useData();

    // Console Hooks
    const { data: consoles } = useConsoles();
    const { data: pricing } = usePricing();
    const updateConsole = useUpdateConsole();

    // Local State
    const [isAdding, setIsAdding] = useState(false);
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
            setIsAdding(false);
            resetForm();
            resetForm();
            toast({ title: "Shortcut created" });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Creation failed";
            toast({ title: "Error", description: message, variant: "destructive" });
        }
    };

    const handleUpdate = async (id: string) => {
        try {
            await updateGameShortcut(id, formData);
            setIsEditing(null);
            resetForm();
            resetForm();
            toast({ title: "Shortcut updated" });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Update failed";
            toast({ title: "Error", description: message, variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this shortcut?")) return;
        try {
            await deleteGameShortcut(id);
            await deleteGameShortcut(id);
            toast({ title: "Shortcut deleted" });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Deletion failed";
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

    // Console Update Handler
    const handleConsoleUpdate = async (consoleId: string, updates: Partial<Console>) => {
        try {
            await updateConsole.mutateAsync({ id: consoleId, ...updates });
            toast({ title: "Console config updated" });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Update failed";
            toast({ title: "Failed to update", description: message, variant: 'destructive' });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Shortcut Configuration</DialogTitle>
                    <DialogDescription>
                        Manage keyboard shortcuts for quick actions.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="console-keys" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="console-keys" className="flex items-center gap-2">
                            <Monitor className="w-4 h-4" />
                            Console Instant Start
                        </TabsTrigger>
                        <TabsTrigger value="game-autofill" className="flex items-center gap-2">
                            <Keyboard className="w-4 h-4" />
                            Game Name Autofill
                        </TabsTrigger>
                    </TabsList>

                    {/* CONSOLE KEYS TAB */}
                    <TabsContent value="console-keys" className="space-y-4">
                        <div className="bg-muted/30 p-4 rounded-lg border text-sm text-muted-foreground mb-4">
                            <p>Assign keys to specific consoles to <span className="font-bold text-primary">instantly start</span> a session with default settings from the dashboard.</p>
                        </div>

                        <div className="grid gap-3">
                            {consoles?.map((console) => (
                                <div key={console.id} className="flex items-center gap-4 p-3 border rounded-lg bg-card shadow-sm">
                                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-accent/20 rounded-md">
                                        <Monitor className="w-6 h-6 text-primary" />
                                        <span className="text-xs font-bold mt-1">#{console.station_number}</span>
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Trigger Key</Label>
                                            <Input
                                                className="uppercase font-mono text-center tracking-widest"
                                                placeholder="None"
                                                maxLength={1}
                                                defaultValue={console.shortcut_key || ""}
                                                onBlur={(e) => {
                                                    const val = e.target.value.toUpperCase();
                                                    if (val !== console.shortcut_key) {
                                                        handleConsoleUpdate(console.id, { shortcut_key: val });
                                                    }
                                                }}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs">Default Mode / Pricing</Label>
                                            <Select
                                                defaultValue={console.default_pricing_id || ""}
                                                onValueChange={(val) => handleConsoleUpdate(console.id, { default_pricing_id: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select default start mode..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {pricing?.filter(p => p.console_type === console.console_type).map(p => (
                                                        <SelectItem key={p.id} value={p.id}>
                                                            {p.name} ({p.price_type === 'hourly' ? `${p.price} DT/h` : `${p.price} DT/game`})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* GAME AUTOFILL TAB (Legacy) */}
                    <TabsContent value="game-autofill" className="space-y-4">
                        <div className="bg-muted/30 p-4 rounded-lg border text-sm text-muted-foreground mb-4">
                            <p>Configure quick keys (e.g. 'F') to <span className="font-bold text-primary">autofill game titles</span> (e.g. "FIFA 24") when the Start Session dialog is open.</p>
                        </div>

                        {/* Add New Section */}
                        {!isAdding && !isEditing && (
                            <Button variant="hero" className="w-full h-12 text-lg font-bold" onClick={() => { setIsAdding(true); resetForm(); }}>
                                <Plus className="w-5 h-5 me-2" />
                                Add New Game Shortcut
                            </Button>
                        )}

                        {(isAdding || isEditing) && (
                            <div className="bg-muted/30 p-4 rounded-lg space-y-4 border">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold">{isAdding ? "New Shortcut" : "Edit Shortcut"}</h4>
                                    <Button variant="ghost" size="sm" onClick={() => { setIsAdding(false); setIsEditing(null); }}>Cancel</Button>
                                </div>

                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Label>Game Name</Label>
                                        <Input
                                            placeholder="e.g. EA Sports FC 24"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-1">
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
                                        <div className="space-y-1">
                                            <Label>Icon</Label>
                                            <Input
                                                placeholder="🎮"
                                                value={formData.icon}
                                                onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Key Bind</Label>
                                            <Input
                                                placeholder="A-Z"
                                                value={formData.shortcut_key}
                                                onChange={e => setFormData({ ...formData, shortcut_key: e.target.value.toUpperCase().slice(0, 1) })}
                                                maxLength={1}
                                            />
                                        </div>
                                    </div>
                                    <Button className="w-full h-12 text-lg font-bold" variant="hero" onClick={() => isAdding ? handleCreate() : handleUpdate(isEditing!)}>
                                        <Save className="w-5 h-5 me-2" />
                                        {isAdding ? "Create Shortcut" : "Save Changes"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* List */}
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Existing Game Shortcuts</Label>
                            {isLoading ? (
                                <div className="text-center py-4 text-muted-foreground">Loading...</div>
                            ) : gameShortcuts.length === 0 ? (
                                <div className="text-center py-6 border-2 border-dashed rounded-lg opacity-50">
                                    <Gamepad2 className="w-8 h-8 mx-auto mb-2" />
                                    <p>No shortcuts configured</p>
                                </div>
                            ) : (
                                <div className="grid gap-2">
                                    {gameShortcuts.map((shortcut) => (
                                        <div key={shortcut.id} className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors ${isEditing === shortcut.id ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <div className="text-2xl w-8 text-center">{shortcut.icon || '🎮'}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium truncate">{shortcut.name}</span>
                                                    {shortcut.shortcut_key && (
                                                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 font-mono">
                                                            {shortcut.shortcut_key}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{shortcut.console_type}</div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(shortcut)}>
                                                    <Edit2 className="w-3 h-3" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(shortcut.id)}>
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
