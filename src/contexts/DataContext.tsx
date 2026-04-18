import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase, TABLES } from '@/lib/supabase';
import {
  Product,
  ServiceCatalog,
  Client,
  GameSession,
  ServiceRequest,
  Console,
  StoreSettings,
  BlogPost,
  PointsTransaction,
  Sale,
  GameShortcut,
  Order
} from '@/types';

// Convert Supabase data to our TypeScript types (Final Schema)
const mapProductFromDB = (dbProduct: any): Product => ({
  ...dbProduct,
  created_at: dbProduct.created_at,
  updated_at: dbProduct.updated_at
});

const mapServiceCatalogFromDB = (dbService: any): ServiceCatalog => ({
  ...dbService,
  created_at: dbService.created_at,
  updated_at: dbService.updated_at
});

const mapClientFromDB = (dbClient: any): Client => ({
  ...dbClient,
  // Map points_balance (DB column) to points (UI property) if needed
  points: dbClient.points ?? dbClient.points_balance ?? 0,
  created_at: dbClient.created_at,
  updated_at: dbClient.updated_at
});

const mapGameSessionFromDB = (dbSession: any): GameSession => ({
  ...dbSession,
  created_at: dbSession.created_at
});

const mapServiceRequestFromDB = (dbRequest: any): ServiceRequest => ({
  ...dbRequest,
  created_at: dbRequest.created_at,
  updated_at: dbRequest.updated_at
});

const mapConsoleFromDB = (dbConsole: any): Console => ({
  ...dbConsole,
  created_at: dbConsole.created_at,
  updated_at: dbConsole.updated_at
});

const mapStoreSettingsFromDB = (rows: any[]): StoreSettings => {
  const settings: any = {};
  rows.forEach(row => {
    let value = row.value;
    // Safely parse JSON if it was stored as a string
    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
      try {
        value = JSON.parse(value);
      } catch (e) {
        // Stay as string if parsing fails
      }
    }
    settings[row.key] = value;
  });
  return settings as StoreSettings;
};

const mapBlogPostFromDB = (dbPost: any): BlogPost => ({
  ...dbPost,
  created_at: dbPost.created_at,
  updated_at: dbPost.updated_at
});

const mapPointsTransactionFromDB = (dbTransaction: any): PointsTransaction => ({
  ...dbTransaction,
  created_at: dbTransaction.created_at
});

const mapSaleFromDB = (dbSale: any): Sale => ({
  ...dbSale,
  created_at: dbSale.created_at
});

const mapGameShortcutFromDB = (dbShortcut: any): GameShortcut => ({
  ...dbShortcut,
  created_at: dbShortcut.created_at,
  updated_at: dbShortcut.updated_at
});

const mapOrderFromDB = (dbOrder: any): Order => ({
  ...dbOrder,
  created_at: dbOrder.created_at,
  updated_at: dbOrder.updated_at
});

interface DataContextType {
  // Data
  products: Product[];
  services: ServiceCatalog[];
  clients: Client[];
  sessions: GameSession[];
  serviceRequests: ServiceRequest[];
  consoles: Console[];
  orders: Order[];
  settings: any;
  blogPosts: BlogPost[];
  pointsTransactions: PointsTransaction[];
  sales: Sale[];
  gameShortcuts: GameShortcut[];
  isLoading: boolean;

  // Actions
  updateSettings: (settings: Partial<StoreSettings>) => void;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addService: (service: Omit<ServiceCatalog, 'id' | 'created_at' | 'updated_at'>) => void;
  updateService: (id: string, service: Partial<ServiceCatalog>) => void;
  deleteService: (id: string) => void;
  addClient: (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => Promise<Client | undefined>;
  updateClient: (id: string, client: Partial<Client>) => void;
  addSession: (session: Omit<GameSession, 'id'>) => void;
  updateSession: (id: string, session: Partial<GameSession>) => void;
  addServiceRequest: (request: Omit<ServiceRequest, 'id' | 'created_at' | 'updated_at'>) => void;
  updateServiceRequest: (id: string, request: Partial<ServiceRequest>) => void;
  updateConsole: (id: string, console: Partial<Console>) => void;
  addBlogPost: (post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>) => void;
  updateBlogPost: (id: string, post: Partial<BlogPost>) => void;
  deleteBlogPost: (id: string) => void;
  addPointsTransaction: (transaction: Omit<PointsTransaction, 'id' | 'created_at'>) => void;
  addGameShortcut: (shortcut: Omit<GameShortcut, 'id' | 'created_at' | 'updated_at'>) => void;
  updateGameShortcut: (id: string, shortcut: Partial<GameShortcut>) => void;
  deleteGameShortcut: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);


interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [consoles, setConsoles] = useState<Console[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [pointsTransactions, setPointsTransactions] = useState<PointsTransaction[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [gameShortcuts, setGameShortcuts] = useState<GameShortcut[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from Supabase - Split into Essential and On-Demand
  useEffect(() => {
    const loadEssentialData = async () => {
      try {
        setIsLoading(true);
        // Load what's needed for initial view and app configuration
        // Including products for home page showcase
        const [
          consolesResponse,
          settingsResponse,
          pricingResponse,
          gameShortcutsResponse
        ] = await Promise.all([
          supabase.from(TABLES.CONSOLES).select('*'),
          supabase.from(TABLES.STORE_SETTINGS).select('*'),
          supabase.from(TABLES.PRICING).select('*').order('sort_order', { ascending: true }),
          supabase.from(TABLES.GAME_SHORTCUTS).select('*').order('display_order', { ascending: true })
        ]);

        setConsoles(consolesResponse.data?.map(mapConsoleFromDB) || []);
        setSettings(settingsResponse.data ? mapStoreSettingsFromDB(settingsResponse.data) : null);
        setGameShortcuts(gameShortcutsResponse.data?.map(mapGameShortcutFromDB) || []);

        // Pricing is kept local if not already moved to hooks
        // setPricing(pricingResponse.data || []); 

      } catch (error) {
        console.error('Error loading essential data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const loadSecondaryData = async () => {
      // Load larger collections with a slight delay or on idle to prioritize UI rendering
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => fetchSecondary());
      } else {
        setTimeout(fetchSecondary, 1000);
      }
    };

    const fetchSecondary = async () => {
      try {
        const [
          productsResponse,
          servicesResponse,
          clientsResponse,
          sessionsResponse,
          serviceRequestsResponse,
          blogPostsResponse,
          pointsTransactionsResponse,
          salesResponse,
          ordersResponse
        ] = await Promise.all([
          supabase.from(TABLES.PRODUCTS).select('*').order('created_at', { ascending: false }).limit(100),
          supabase.from(TABLES.SERVICES_CATALOG).select('*').eq('is_active', true).order('created_at', { ascending: false }),
          supabase.from(TABLES.CLIENTS).select('*').order('created_at', { ascending: false }).limit(100),
          supabase.from(TABLES.GAMING_SESSIONS).select('*').order('start_time', { ascending: false }).limit(50),
          supabase.from(TABLES.SERVICE_REQUESTS).select('*').order('created_at', { ascending: false }).limit(50),
          supabase.from(TABLES.BLOG_POSTS).select('*').eq('is_published', true).order('created_at', { ascending: false }),
          supabase.from(TABLES.POINTS_TRANSACTIONS).select('*').order('created_at', { ascending: false }).limit(100),
          supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(100),
          supabase.from(TABLES.ORDERS).select('*').order('created_at', { ascending: false }).limit(50)
        ]);

        setProducts(productsResponse.data?.map(mapProductFromDB) || []);
        setServices(servicesResponse.data?.map(mapServiceCatalogFromDB) || []);
        setClients(clientsResponse.data?.map(mapClientFromDB) || []);
        setSessions(sessionsResponse.data?.map(mapGameSessionFromDB) || []);
        setServiceRequests(serviceRequestsResponse.data?.map(mapServiceRequestFromDB) || []);
        setBlogPosts(blogPostsResponse.data?.map(mapBlogPostFromDB) || []);
        setPointsTransactions(pointsTransactionsResponse.data?.map(mapPointsTransactionFromDB) || []);
        setSales(salesResponse.data?.map(mapSaleFromDB) || []);
        setOrders(ordersResponse.data?.map(mapOrderFromDB) || []);
      } catch (error) {
        console.error('Error loading secondary data:', error);
      }
    };

    loadEssentialData().then(loadSecondaryData);
  }, []);

  // Supabase handles UUID generation, so we don't need this anymore

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    try {
      const updatePromises = Object.entries(newSettings).map(([key, value]) =>
        supabase
          .from(TABLES.STORE_SETTINGS)
          .upsert({
            key,
            value,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' })
      );

      const results = await Promise.all(updatePromises);
      const errors = results.filter(r => r.error).map(r => r.error);

      if (errors.length > 0) throw errors[0];

      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  const addProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .insert([{
          ...product,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      const newProduct = mapProductFromDB(data);
      setProducts(prev => [newProduct, ...prev]);
    } catch (error) {
      toast({ title: "Error", description: "Failed to add product", variant: "destructive" });
    }
  };

  const updateProduct = async (id: string, product: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .update({
          ...product,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedProduct = mapProductFromDB(data);
      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
    } catch (error) {
      toast({ title: "Error", description: "Failed to update product", variant: "destructive" });
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.PRODUCTS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
    }
  };

  const addService = async (service: Omit<ServiceCatalog, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.SERVICES_CATALOG)
        .insert([{
          ...service,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      const newService = mapServiceCatalogFromDB(data);
      setServices(prev => [newService, ...prev]);
    } catch (error) {
      toast({ title: "Error", description: "Failed to add service", variant: "destructive" });
    }
  };

  const updateService = async (id: string, service: Partial<ServiceCatalog>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.SERVICES_CATALOG)
        .update({
          ...service,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedService = mapServiceCatalogFromDB(data);
      setServices(prev => prev.map(s => s.id === id ? updatedService : s));
    } catch (error) {
      toast({ title: "Error", description: "Failed to update service", variant: "destructive" });
    }
  };

  const deleteService = async (id: string) => {
    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from(TABLES.SERVICES_CATALOG)
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setServices(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete service", variant: "destructive" });
    }
  };

  const addClient = async (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CLIENTS)
        .insert([{
          ...client,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      const newClient = mapClientFromDB(data);
      setClients(prev => [newClient, ...prev]);
      return newClient;
    } catch (error) {
      toast({ title: "Error", description: "Failed to add client", variant: "destructive" });
      throw error;
    }
  };

  const updateClient = async (id: string, client: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CLIENTS)
        .update({
          ...client,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedClient = mapClientFromDB(data);
      setClients(prev => prev.map(c => c.id === id ? updatedClient : c));
    } catch (error) {
      toast({ title: "Error", description: "Failed to update client", variant: "destructive" });
    }
  };

  const addSession = async (session: Omit<GameSession, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.GAMING_SESSIONS)
        .insert([{
          ...session,
        }])
        .select()
        .single();

      if (error) throw error;

      const newSession = mapGameSessionFromDB(data);
      setSessions(prev => [newSession, ...prev]);
    } catch (error) {
      toast({ title: "Error", description: "Failed to add session", variant: "destructive" });
    }
  };

  const updateSession = async (id: string, session: Partial<GameSession>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.GAMING_SESSIONS)
        .update(session)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedSession = mapGameSessionFromDB(data);
      setSessions(prev => prev.map(s => s.id === id ? updatedSession : s));
    } catch (error) {
      toast({ title: "Error", description: "Failed to update session", variant: "destructive" });
    }
  };

  const addServiceRequest = async (request: Omit<ServiceRequest, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.SERVICE_REQUESTS)
        .insert([{
          ...request,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      const newRequest = mapServiceRequestFromDB(data);
      setServiceRequests(prev => [newRequest, ...prev]);
    } catch (error) {
      toast({ title: "Error", description: "Failed to add service request", variant: "destructive" });
    }
  };

  const updateServiceRequest = async (id: string, request: Partial<ServiceRequest>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.SERVICE_REQUESTS)
        .update({
          ...request,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedRequest = mapServiceRequestFromDB(data);
      setServiceRequests(prev => prev.map(r => r.id === id ? updatedRequest : r));
    } catch (error) {
      toast({ title: "Error", description: "Failed to update service request", variant: "destructive" });
    }
  };

  const updateConsole = async (id: string, consoleData: Partial<Console>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CONSOLES)
        .update({
          ...consoleData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedConsole = mapConsoleFromDB(data);
      setConsoles(prev => prev.map(c => c.id === id ? updatedConsole : c));
    } catch (error) {
      toast({ title: "Error", description: "Failed to update console", variant: "destructive" });
    }
  };

  const addBlogPost = async (post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.BLOG_POSTS)
        .insert([{
          ...post,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      const newPost = mapBlogPostFromDB(data);
      setBlogPosts(prev => [newPost, ...prev]);
    } catch (error) {
      toast({ title: "Error", description: "Failed to add blog post", variant: "destructive" });
    }
  };

  const updateBlogPost = async (id: string, post: Partial<BlogPost>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.BLOG_POSTS)
        .update({
          ...post,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedPost = mapBlogPostFromDB(data);
      setBlogPosts(prev => prev.map(p => p.id === id ? updatedPost : p));
    } catch (error) {
      toast({ title: "Error", description: "Failed to update blog post", variant: "destructive" });
    }
  };

  const deleteBlogPost = async (id: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.BLOG_POSTS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBlogPosts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete blog post", variant: "destructive" });
    }
  };

  const addPointsTransaction = async (transaction: Omit<PointsTransaction, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.POINTS_TRANSACTIONS)
        .insert([{
          ...transaction,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      const newTransaction = mapPointsTransactionFromDB(data);
      setPointsTransactions(prev => [newTransaction, ...prev]);

      // Update Client Balance Automatically
      if (transaction.client_id) {
        // Use declared amount (which is signed by convention in PointsTransaction)
        const pointsChange = transaction.amount;
        // Logic simplified: amount should already be negative for redemptions if using standard hooks.
        // But if we want to be extra safe against 'transaction.type' vs 'amount' mismatch:

        // Actually, let's just trust amount. useRedeemPoints sets amount = -points.
        // transaction.type comes from DB column 'transaction_type'. 
        // Note: The argument is Omit<PointsTransaction...>, so it matches DB schema.
        // DB schema has 'transaction_type', not 'type'. Standardize on 'amount'.

        // Fetch current points to ensure atomicity/freshness (or closest to it)
        const { data: clientData } = await supabase
          .from(TABLES.CLIENTS)
          .select('points')
          .eq('id', transaction.client_id)
          .single();

        const currentPoints = clientData?.points || 0;
        const newTotal = currentPoints + pointsChange;

        // Update DB
        const { error: updateError } = await supabase
          .from(TABLES.CLIENTS)
          .update({
            points: newTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.client_id);

        if (!updateError) {
          // Update Local State
          setClients(prev => prev.map(c =>
            c.id === transaction.client_id ? { ...c, points: newTotal } : c
          ));
        }
      }

    } catch (error) {
      toast({ title: "Error", description: "Failed to add points transaction", variant: "destructive" });
    }
  };


  const addGameShortcut = async (shortcut: Omit<GameShortcut, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.GAME_SHORTCUTS)
        .insert([{
          ...shortcut,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      const newShortcut = mapGameShortcutFromDB(data);
      setGameShortcuts(prev => [...prev, newShortcut].sort((a, b) => a.display_order - b.display_order));
    } catch (error) {
      toast({ title: "Error", description: "Failed to add game shortcut", variant: "destructive" });
    }
  };

  const updateGameShortcut = async (id: string, shortcut: Partial<GameShortcut>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.GAME_SHORTCUTS)
        .update({
          ...shortcut,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedShortcut = mapGameShortcutFromDB(data);
      setGameShortcuts(prev =>
        prev.map(s => s.id === id ? updatedShortcut : s)
          .sort((a, b) => a.display_order - b.display_order)
      );
    } catch (error) {
      toast({ title: "Error", description: "Failed to update game shortcut", variant: "destructive" });
    }
  };

  const deleteGameShortcut = async (id: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.GAME_SHORTCUTS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGameShortcuts(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete game shortcut", variant: "destructive" });
    }
  };

  const value: DataContextType = useMemo(() => ({
    products,
    services,
    clients,
    sessions,
    serviceRequests,
    consoles,
    orders, // Added orders here
    settings: settings || null,
    blogPosts,
    pointsTransactions,
    sales, // Added to exported values
    isLoading,
    updateSettings,
    addProduct,
    updateProduct,
    deleteProduct,
    addService,
    updateService,
    deleteService,
    addClient,
    updateClient,
    addSession,
    updateSession,
    addServiceRequest,
    updateServiceRequest,
    updateConsole,
    addBlogPost,
    updateBlogPost,
    deleteBlogPost,
    addPointsTransaction,
    gameShortcuts,
    addGameShortcut,
    updateGameShortcut,
    deleteGameShortcut
  }), [products, services, clients, sessions, serviceRequests, consoles, orders, settings, blogPosts, pointsTransactions, sales, isLoading, gameShortcuts]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
