import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingBag, MapPin, Heart, User, LogOut, CheckCircle, Clock } from "lucide-react";

export default function Account() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const queryTab = searchParams.get("tab") || "orders";
  const [activeTab, setActiveTab] = useState(queryTab);

  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Auth Guard & fetch session
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
      } else {
        toast({
          title: "Session Expired",
          description: "Please sign in to view your account details.",
          variant: "destructive"
        });
        navigate("/auth");
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        navigate("/auth");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, toast]);

  // Sync tab with URL search parameter
  useEffect(() => {
    if (queryTab !== activeTab) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  // Fetch orders and addresses once user is loaded
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      // Fetch user orders matching email
      const { data: ordersData, error: ordersError } = await supabase
        .from("Order")
        .select("*")
        .eq("customerEmail", user.email)
        .order("createdAt", { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch user saved addresses
      const { data: addrData, error: addrError } = await supabase
        .from("Address")
        .select("*")
        .eq("userId", user.id)
        .order("createdAt", { ascending: false });

      if (addrError) throw addrError;

      setOrders(ordersData || []);
      setAddresses(addrData || []);
    } catch (error: any) {
      console.error("Error loading account data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully." });
    navigate("/");
  };

  const setTab = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-[60vh] bg-[hsl(var(--warm-bg))] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
        <p className="text-sm text-muted-foreground font-light animate-pulse">Loading account information...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--warm-bg))] py-16">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left Sidebar Menu */}
        <aside className="col-span-1 bg-white border border-border/80 p-6 shadow-sm rounded-sm space-y-6">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">User Profile</span>
            <h2 className="text-lg font-light text-foreground truncate mt-0.5">{user.email}</h2>
          </div>

          <nav className="flex flex-col gap-1.5">
            {[
              { id: "orders", label: "Your Orders", icon: ShoppingBag },
              { id: "profile", label: "Account Details", icon: User },
              { id: "wishlist", label: "Wishlist", icon: Heart }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors rounded-sm text-left ${
                  activeTab === tab.id
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <hr className="border-border/60" />

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors rounded-sm text-left font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </aside>

        {/* Right Details Panel */}
        <main className="col-span-1 md:col-span-3 space-y-6">
          {activeTab === "orders" && (
            <div className="bg-white border border-border/80 p-8 shadow-sm rounded-sm space-y-8 animate-in fade-in duration-300">
              <div>
                <h1 className="text-2xl font-light text-foreground uppercase tracking-wide">Your Orders</h1>
                <p className="text-xs text-muted-foreground mt-1">Review the order status and history of your store purchases.</p>
              </div>

              {orders.length > 0 ? (
                <div className="space-y-6">
                  {orders.map(order => (
                    <div key={order.id} className="border border-border/60 p-5 rounded-sm space-y-4 hover:border-border-foreground/30 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border/60 pb-3">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Order ID</p>
                          <p className="font-mono text-xs font-semibold text-accent mt-0.5 truncate max-w-[200px]">{order.id}</p>
                        </div>
                        <div className="sm:text-right">
                          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Order Date</p>
                          <p className="text-xs text-foreground font-medium mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Items Ordered</p>
                          <p className="text-sm text-foreground font-light">{order.items}</p>
                        </div>
                        <div className="sm:text-right">
                          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total Amount</p>
                          <p className="text-base font-medium text-foreground mt-0.5">₹{order.total}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === "Delivered" ? "bg-green-50 text-green-700" :
                          order.status === "Shipped" ? "bg-blue-50 text-blue-700" : "bg-yellow-50 text-yellow-700"
                        }`}>
                          {order.status === "Delivered" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center space-y-4">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground font-light">No orders placed under this email yet.</p>
                  <Link to="/shop" className="inline-block text-xs uppercase tracking-widest text-accent font-semibold hover:underline">
                    Browse Shop Catalog
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <div className="bg-white border border-border/80 p-8 shadow-sm rounded-sm space-y-8 animate-in fade-in duration-300">
              <div>
                <h1 className="text-2xl font-light text-foreground uppercase tracking-wide">Account Details</h1>
                <p className="text-xs text-muted-foreground mt-1">Review saved shipping locations and profile details.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile detail */}
                <div className="space-y-4">
                  <h3 className="text-xs uppercase tracking-widest font-semibold text-foreground border-b border-border/60 pb-2">Profile Info</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground font-light">Email Address</span>
                      <p className="text-foreground font-medium">{user.email}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground font-light">Account Created</span>
                      <p className="text-foreground">{new Date(user.created_at).toLocaleDateString("en-IN")}</p>
                    </div>
                  </div>
                </div>

                {/* Saved locations */}
                <div className="space-y-4">
                  <h3 className="text-xs uppercase tracking-widest font-semibold text-foreground border-b border-border/60 pb-2">Saved Locations</h3>
                  {addresses.length > 0 ? (
                    <div className="space-y-3">
                      {addresses.map(addr => (
                        <div key={addr.id} className="p-4 border border-border/60 rounded-sm flex gap-3">
                          <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <div className="text-xs space-y-1">
                            <p className="font-semibold text-foreground">{addr.name}</p>
                            <p className="text-muted-foreground">{addr.fullAddress}, {addr.landmark}</p>
                            <p className="text-muted-foreground">{addr.city}, {addr.district} - {addr.pincode}</p>
                            <p className="text-foreground/90 font-medium">Ph: {addr.contactNumber}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground font-light py-4">No saved addresses found. Add one in the cart checkout flow.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "wishlist" && (
            <div className="bg-white border border-border/80 p-8 shadow-sm rounded-sm space-y-8 animate-in fade-in duration-300">
              <div>
                <h1 className="text-2xl font-light text-foreground uppercase tracking-wide">Your Wishlist</h1>
                <p className="text-xs text-muted-foreground mt-1">Keep track of items you love.</p>
              </div>

              <div className="py-16 text-center space-y-4">
                <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground font-light">Your wishlist is currently empty.</p>
                <Link to="/shop" className="inline-block text-xs uppercase tracking-widest text-accent font-semibold hover:underline">
                  Add Pieces to Wishlist
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
