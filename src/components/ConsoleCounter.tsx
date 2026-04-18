import { useData } from "@/contexts/DataContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Monitor } from "lucide-react";
import { memo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const ConsoleCounter = () => {
  const { consoles } = useData();
  const { dir } = useLanguage();
  const isRTL = dir === 'rtl';

  const ps4Available = consoles.filter(c => c.console_type.toLowerCase() === 'ps4' && c.status === 'available').length;
  const ps5Available = consoles.filter(c => c.console_type.toLowerCase() === 'ps5' && c.status === 'available').length;
  const totalAvailable = ps4Available + ps5Available;
  const totalConsoles = consoles.length;

  if (totalConsoles === 0) return null;

  return (
    <div className={`fixed top-20 z-50 hidden md:block ${isRTL ? 'left-4' : 'right-4'}`}>
      <Card className="glass-card border-primary/30 shadow-[0_8px_24px_hsl(var(--primary)/0.2)]">
        <CardContent className="p-4">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Gamepad2 className="w-5 h-5 text-primary" />
              <span className="font-display font-bold text-sm">Consoles</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium">PS5</span>
                </div>
                <Badge variant={ps5Available > 0 ? "default" : "secondary"} className="text-xs">
                  {ps5Available}
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium">PS4</span>
                </div>
                <Badge variant={ps4Available > 0 ? "default" : "secondary"} className="text-xs">
                  {ps4Available}
                </Badge>
              </div>
            </div>

            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground">Available:</span>
                <span className={`font-bold text-sm ${totalAvailable > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalAvailable}/{totalConsoles}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


export default memo(ConsoleCounter);
