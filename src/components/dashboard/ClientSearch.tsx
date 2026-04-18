import { useState } from "react";
import { Check, ChevronsUpDown, User, Plus, Phone, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Client } from "@/types";
import { useClients } from "@/hooks/useClients";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface ClientSearchProps {
    onSelect: (client: Client | null) => void;
    selectedClient?: Client | null;
    className?: string;
    onCreateNew?: () => void;
}

export function ClientSearch({ onSelect, selectedClient, className, onCreateNew }: ClientSearchProps) {
    const [open, setOpen] = useState(false);
    const { data: clients, isLoading } = useClients();

    // Custom filter function to search both name and phone
    const filterFunction = (value: string, search: string) => {
        const client = clients?.find((c) => c.id === value);
        if (!client) return 0;

        const searchLower = search.toLowerCase();
        const nameMatch = client.name.toLowerCase().includes(searchLower);
        const phoneMatch = client.phone.includes(searchLower);

        return nameMatch || phoneMatch ? 1 : 0;
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between h-auto py-2", className)}
                >
                    {selectedClient ? (
                        <div className="flex flex-col items-start gap-1 text-left">
                            <span className="font-bold flex items-center gap-2">
                                <User className="w-3 h-3 text-primary" />
                                {selectedClient.name}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-2">
                                <Phone className="w-3 h-3" />
                                {selectedClient.phone}
                                <Badge variant="secondary" className="ms-2 h-4 text-[10px] px-1 py-0">
                                    {selectedClient.points} pts
                                </Badge>
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center text-muted-foreground">
                            <Search className="me-2 h-4 w-4" />
                            Select client...
                        </div>
                    )}
                    <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command filter={filterFunction}>
                    <CommandInput placeholder="Search name or phone..." />
                    <CommandList>
                        {isLoading ? (
                            <div className="p-2 space-y-2">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                            </div>
                        ) : (
                            <>
                                <CommandEmpty>
                                    <div className="p-2 text-center text-sm text-muted-foreground">
                                        No client found.
                                        {onCreateNew && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="mt-2 w-full text-primary"
                                                onClick={() => {
                                                    onCreateNew();
                                                    setOpen(false);
                                                }}
                                            >
                                                <Plus className="w-3 h-3 me-1" />
                                                Create New
                                            </Button>
                                        )}
                                    </div>
                                </CommandEmpty>
                                <CommandGroup heading="Clients">
                                    {clients?.map((client) => (
                                        <CommandItem
                                            key={client.id}
                                            value={client.id} // Shadcn command usually uses value for unique ID in filtering if passed explicitly, but we used custom filter. 
                                            // IMPORTANT: verify Shadcn command usage. 'value' prop refers to the search text usually if check not customized, but with custom filter we use ID as unique key and look it up. 
                                            // Actually, simpler standard usage: value should be distinguishable string.
                                            onSelect={(currentValue) => {
                                                // currentValue here is lowercase usually. 
                                                // Let's use the ID we passed in value.
                                                const found = clients.find((c) => c.id === currentValue);
                                                onSelect(found || null);
                                                setOpen(false);
                                            }}
                                            className="cursor-pointer"
                                        >
                                            <Check
                                                className={cn(
                                                    "me-2 h-4 w-4",
                                                    selectedClient?.id === client.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium">{client.name}</span>
                                                <span className="text-xs text-muted-foreground">{client.phone} • {client.points} pts</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}

                    </CommandList>
                    {onCreateNew && (
                        <>
                            <CommandSeparator />
                            <div className="p-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start text-xs text-muted-foreground hover:text-primary"
                                    onClick={() => {
                                        onCreateNew();
                                        setOpen(false);
                                    }}
                                >
                                    <Plus className="w-3 h-3 me-2" />
                                    Create new client
                                </Button>
                            </div>
                        </>
                    )}
                </Command>
            </PopoverContent>
        </Popover>
    );
}
