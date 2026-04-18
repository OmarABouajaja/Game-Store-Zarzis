import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Database, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const SchemaStatus = () => {
    const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');
    const [missingFeatures, setMissingFeatures] = useState<string[]>([]);

    useEffect(() => {
        checkSchema();
    }, []);

    const checkSchema = async () => {
        const missing = [];

        // Check 1: default_pricing_id on consoles
        const { error: consoleError } = await supabase
            .from('consoles')
            .select('default_pricing_id')
            .limit(1);

        if (consoleError && consoleError.message.includes('does not exist')) {
            missing.push("Missing 'default_pricing_id' column in database.");
        }

        // Check 2: Verify RLS (harder to check directly, but we assume if schema is old, RLS is old)
        // We can try to insert a dummy shortcut and delete it? No, too risky/complex.

        if (missing.length > 0) {
            setStatus('error');
            setMissingFeatures(missing);
        } else {
            setStatus('ok');
        }
    };

    const copyFixScript = () => {
        const lines = [
            "-- FIX SCRIPT: Performance + Schema",
            "CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);",
            "ALTER TABLE public.consoles ADD COLUMN IF NOT EXISTS default_pricing_id UUID REFERENCES public.pricing(id), ADD COLUMN IF NOT EXISTS shortcut_key TEXT;",
            "ALTER TABLE public.game_shortcuts ADD COLUMN IF NOT EXISTS shortcut_key TEXT;",
            "DROP POLICY IF EXISTS \"Staff can manage game shortcuts\" ON public.game_shortcuts;",
            "DROP POLICY IF EXISTS \"Everyone can read game shortcuts\" ON public.game_shortcuts;",
            "CREATE POLICY \"Everyone can read game shortcuts\" ON public.game_shortcuts FOR SELECT USING (true);",
            "CREATE POLICY \"Staff and Owners can manage shortcuts\" ON public.game_shortcuts FOR ALL USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(), 'owner'));"
        ];
        const script = lines.join("\\n");
        navigator.clipboard.writeText(script);
        toast({ title: "Copied to clipboard", description: "Paste this in your Supabase SQL Editor and run it again." });
    };

    if (status === 'checking' || status === 'ok') return null;

    return (
        <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Database Schema Update Required</AlertTitle>
            <AlertDescription className="space-y-4">
                <p>
                    Some features (Console Shortcuts, Deleting items) may not work, and you may see "Query timeout" errors because the database structure is outdated.
                    The following issues were detected:
                </p>
                <ul className="list-disc ps-5 text-sm">
                    {missingFeatures.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyFixScript} className="bg-white/10 hover:bg-white/20 border-white/20 text-white">
                        <Copy className="w-4 h-4 me-2" />
                        Copy Repair SQL
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open('https://supabase.com/dashboard/project/_/sql', '_blank')}>
                        <Database className="w-4 h-4 me-2" />
                        Open SQL Editor
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    );
};
