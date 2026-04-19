import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConsoles, useUpdateConsole, useCreateConsole, useDeleteConsole } from "@/hooks/useConsoles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Console } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gamepad2, Plus, Settings, Wifi, WifiOff, Wrench, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ConsoleManagement = () => {
  const { isOwner } = useAuth();
  const { t } = useLanguage();
  const { data: consoles, isLoading } = useConsoles();
  const [selectedConsole, setSelectedConsole] = useState<Console | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isaddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Hooks
  const createConsole = useCreateConsole();
  const updateConsole = useUpdateConsole();
  const deleteConsole = useDeleteConsole();

  // Only owners can access this page
  if (!isOwner) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">{t("console.access_denied")}</h2>
              <p className="text-muted-foreground">{t("console.owners_only")}</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const handleStatusChange = async (consoleId: string, newStatus: string) => {
    try {
      await updateConsole.mutateAsync({
        id: consoleId,
        status: newStatus as Console['status']
      });

      toast({
        title: t("console.status_updated"),
        description: `${t("console.now")} ${newStatus}`
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("console.failed_update_status"),
        variant: "destructive"
      });
    }
  };

  const handleEditConsole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsole) return;

    try {
      await updateConsole.mutateAsync({
        id: selectedConsole.id,
        name: selectedConsole.name,
        console_type: selectedConsole.console_type,
        station_number: typeof selectedConsole.station_number === 'string' ? parseInt(selectedConsole.station_number) : selectedConsole.station_number,
        status: selectedConsole.status,
        shortcut_key: selectedConsole.shortcut_key
      });

      toast({ title: t("console.updated"), description: t("console.changes_saved") });
      setIsDialogOpen(false);
      setSelectedConsole(null);
    } catch (error) {
      toast({ title: t("common.error"), description: t("console.failed_update"), variant: "destructive" });
    }
  };

  const handleDeleteConsole = async (id: string) => {
    if (!confirm("Are you sure you want to delete this console?\n\nWARNING: This will PERMANENTLY DELETE all associated gaming session history and financial records for this console.\n\nThis action cannot be undone.")) return;

    try {
      await deleteConsole.mutateAsync(id);
      toast({ title: "Console Deleted", description: "Console removed successfully." });
      setIsDialogOpen(false);
    } catch (error: unknown) {
      console.error("Delete Error:", error);
      const err = error as Error & { code?: string };
      // Check for Foreign Key Violation (Postgres Error 23503)
      if (err?.message?.includes("foreign key constraint") || err?.code === '23503' || JSON.stringify(err).includes("23503")) {
        toast({
          title: "Cannot Delete Console",
          description: "This console has session history. Please mark it as 'Offline' or 'Maintenance' instead to preserve financial records.",
          variant: "destructive",
          duration: 5000
        });
      } else {
        toast({ title: "Error", description: "Failed to delete console. Try marking it as 'Offline'.", variant: "destructive" });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'in_use':
      case 'occupied': return 'bg-yellow-500';
      case 'maintenance': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return t("console.status.available");
      case 'in_use':
      case 'occupied': return t("console.status.in_use");
      case 'maintenance': return t("console.status.maintenance");
      case 'offline': return t("console.status.offline");
      default: return status;
    }
  };

  const ps4Consoles = consoles?.filter(c => c.console_type === 'ps4') || [];
  const ps5Consoles = consoles?.filter(c => c.console_type === 'ps5') || [];
  const otherConsoles = consoles?.filter(c => !['ps4', 'ps5'].includes(c.console_type)) || [];

  const ConsoleGrid = ({ title, consoles: consoleList, icon }: { title: string, consoles: Console[], icon: React.ReactNode }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <Badge variant="outline">{consoleList.length} units</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {consoleList.map((console) => (
          <Card key={console.id} className="glass-card group hover:border-primary/50 transition-colors relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{console.name}</CardTitle>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(console.status)}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={
                    console.status === 'available' ? 'default' :
                      (console.status === 'in_use') ? 'secondary' :
                        console.status === 'maintenance' ? 'destructive' : 'outline'
                  }>
                    {getStatusText(console.status)}
                  </Badge>
                </div>

                {console.shortcut_key && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted border rounded">⌨</kbd>
                      Quick Key:
                    </span>
                    <Badge variant="secondary" className="font-mono text-sm px-2 py-1 bg-primary/20 border-primary/30">
                      {console.shortcut_key}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Station:</span>
                  <span className="font-medium">#{console.station_number}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <Badge variant="outline">{console.console_type?.toUpperCase()}</Badge>
                </div>

                <div className="flex gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedConsole({ ...console });
                          setIsDialogOpen(true);
                        }}
                      >
                        <Settings className="w-3 h-3 me-1" />
                        Manage
                      </Button>
                    </DialogTrigger>
                    {/* Management is handled by the main edit dialog hooked to selectedConsole */}
                  </Dialog>

                  <Button
                    size="sm"
                    variant={console.status === 'available' ? 'default' : 'secondary'}
                    onClick={() => handleStatusChange(console.id, 'available')}
                  >
                    {console.status === 'available' ? (
                      <Wifi className="w-3 h-3" />
                    ) : (
                      <WifiOff className="w-3 h-3" />
                    )}
                  </Button>

                  {/* Quick Delete for Owners */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConsole(console.id);
                    }}
                    title="Delete Console"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">{t("console.title")}</h1>
              <p className="text-muted-foreground">
                {t("console.subtitle")}
              </p>
            </div>

            {/* Add Console Dialog */}
            <Dialog open={isaddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-lg hover:shadow-primary/25 transition-all">
                  <Plus className="w-4 h-4 me-2" />
                  {t("console.add")}
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg">
                <DialogHeader>
                  <DialogTitle>{t("console.add_new_title")}</DialogTitle>
                  <DialogDescription>
                    {t('console.add_desc', 'Create a new station for your store. Station numbers must be unique.')}
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const name = formData.get('name') as string;
                    const type = formData.get('type') as string;
                    const station = parseInt(formData.get('station') as string);
                    const status = formData.get('status') as string;

                    if (!name || !type || !station) return;

                    try {
                      await createConsole.mutateAsync({
                        name,
                        console_type: type as Console['console_type'],
                        station_number: station,
                        status: (status as Console['status']) || 'available',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      });
                      toast({ title: "Console Added", description: `${name} created successfully.` });
                      setIsAddDialogOpen(false);
                      // Form reset is handled by Dialog closing/unmounting primarily, but explicit reset is safer if reused
                    } catch (err: unknown) {
                      console.error("Create console error:", err);
                      const message = err instanceof Error ? err.message : t('console.create_failed', "Failed to create console.");
                      toast({
                        title: t('common.error', "Error"),
                        description: message,
                        variant: "destructive"
                      });
                    }
                  }}
                  className="space-y-4 py-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('console.name_label', 'Console Name')}</label>
                    <div className="relative">
                      <Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        name="name"
                        placeholder="e.g. PS5 Station 1"
                        className="ps-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('console.type', 'Type')}</label>
                      <Select name="type" required defaultValue="ps5">
                        <SelectTrigger>
                          <SelectValue placeholder={t('common.select', 'Select type')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ps5">PS5</SelectItem>
                          <SelectItem value="ps4">PS4</SelectItem>
                          <SelectItem value="xbox">Xbox</SelectItem>
                          <SelectItem value="pc">PC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('console.station_num', 'Station #')}</label>
                      <Input
                        name="station"
                        type="number"
                        min="1"
                        placeholder="1"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('console.initial_status', 'Initial Status')}</label>
                    <Select name="status" defaultValue="available">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">{t('console.status.available', 'Available')}</SelectItem>
                        <SelectItem value="maintenance">{t('console.status.maintenance', 'Maintenance')}</SelectItem>
                        <SelectItem value="offline">{t('console.status.offline', 'Offline')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter>
                    <Button type="submit">{t('console.create_btn', 'Create Console')}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Edit Console Dialog (Global) */}
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setSelectedConsole(null);
          }}>
            <DialogContent className="w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg">
              <DialogHeader>
                <DialogTitle>{t('console.edit_title', 'Edit Console')}: {selectedConsole?.name}</DialogTitle>
              </DialogHeader>
              {selectedConsole && (
                <form onSubmit={handleEditConsole} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('console.name_label', 'Name')}</label>
                    <Input
                      value={selectedConsole.name}
                      onChange={(e) => setSelectedConsole({ ...selectedConsole, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('console.type', 'Type')}</label>
                      <Select
                        value={selectedConsole.console_type}
                        onValueChange={(v) => setSelectedConsole({ ...selectedConsole, console_type: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ps5">PS5</SelectItem>
                          <SelectItem value="ps4">PS4</SelectItem>
                          <SelectItem value="xbox">Xbox</SelectItem>
                          <SelectItem value="pc">PC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('console.station_num', 'Station #')}</label>
                      <Input
                        type="number"
                        value={selectedConsole.station_number}
                        onChange={(e) => setSelectedConsole({ ...selectedConsole, station_number: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>
                  </div>


                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('console.status_label', 'Status')}</label>
                    <Select
                      value={selectedConsole.status}
                      onValueChange={(v) => setSelectedConsole({ ...selectedConsole, status: v as Console['status'] })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">{t('console.status.available', 'Available')}</SelectItem>
                        <SelectItem value="in_use">{t('console.status.in_use', 'In Use')}</SelectItem>
                        <SelectItem value="maintenance">{t('console.status.maintenance', 'Maintenance')}</SelectItem>
                        <SelectItem value="offline">{t('console.status.offline', 'Offline')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('console.shortcut_key', 'Shortcut Key (Optional)')}</label>
                    <Input
                      placeholder="1-9 or A-Z"
                      value={selectedConsole.shortcut_key || ''}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().slice(0, 1);
                        // Validate: only allow 0-9, A-Z
                        if (value === '' || /^[0-9A-Z]$/.test(value)) {
                          setSelectedConsole({ ...selectedConsole, shortcut_key: value });
                        }
                      }}
                      maxLength={1}
                      className="font-mono text-center text-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('console.shortcut_desc', 'Use 1-9 for the first 9 consoles, then A-Z for additional stations. Press this key anywhere in Sessions to quick-start.')}
                    </p>
                    {selectedConsole.shortcut_key && (
                      <div className="flex items-center gap-2 text-xs bg-primary/10 border border-primary/20 rounded p-2">
                        <Badge variant="outline" className="font-mono">{selectedConsole.shortcut_key}</Badge>
                        <span className="text-muted-foreground">← {t('console.press_to_launch', 'Press this key to launch')} {selectedConsole.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Warning Alert if needed */}
                  <div className="flex items-start gap-2 p-3 bg-muted rounded-md mb-2">
                    <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      {t('console.delete_warning_desc', 'Deleting a console will permanently remove all session history. To disable a console without losing history, set status to Offline.')}
                    </p>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteConsole(selectedConsole.id)}
                    >
                      <Trash2 className="w-4 h-4 me-2" />
                      {t('common.delete', 'Delete')}
                    </Button>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
                      <Button type="submit">{t('common.save', 'Save Changes')}</Button>
                    </div>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Gamepad2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {consoles?.filter(c => c.status === 'available').length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Available</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Gamepad2 className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {consoles?.filter(c => c.status === 'in_use').length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">In Use</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {consoles?.filter(c => c.status === 'maintenance').length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Maintenance</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Gamepad2 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{consoles?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Units</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Console Grids */}
          <div className="space-y-8">
            <ConsoleGrid
              title="PS5 Consoles"
              consoles={ps5Consoles}
              icon={<Gamepad2 className="w-5 h-5 text-primary" />}
            />

            <ConsoleGrid
              title="PS4 Consoles"
              consoles={ps4Consoles}
              icon={<Gamepad2 className="w-5 h-5 text-secondary" />}
            />

            {otherConsoles.length > 0 && (
              <ConsoleGrid
                title="Other Devices"
                consoles={otherConsoles}
                icon={<Gamepad2 className="w-5 h-5 text-muted-foreground" />}
              />
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default ConsoleManagement;
