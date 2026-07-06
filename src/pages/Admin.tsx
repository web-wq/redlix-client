import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  MessageSquare,
  LogOut,
  Lock,
  Mail,
  TrendingUp,
  Plus,
  CheckCircle,
  Clock,
  ChevronRight,
  Loader2,
  RefreshCw,
  Eye,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Helper: a labelled row used in the order-detail modal
function Row({ label, value, mono = false, badge }: { label: string; value: string; mono?: boolean; badge?: "purple" | "amber" }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold shrink-0 mt-0.5 w-32">{label}</span>
      {badge ? (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${
          badge === "purple" ? "bg-purple-50 text-purple-700" : "bg-amber-50 text-amber-700"
        }`}>{value}</span>
      ) : (
        <span className={`text-sm text-foreground text-right ${mono ? "font-mono" : ""}`}>{value}</span>
      )}
    </div>
  );
}

export default function Admin() {
  const { toast } = useToast();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // URL tab synchronization
  const queryTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(queryTab);

  // Live Database States
  const [orders, setOrders] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Authentication check on load
  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin_authenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Sync tab with URL search parameter
  useEffect(() => {
    if (queryTab !== activeTab) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch Orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("Order")
        .select("*")
        .order("createdAt", { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch Inquiries
      const { data: inquiriesData, error: inquiriesError } = await supabase
        .from("Inquiry")
        .select("*")
        .order("createdAt", { ascending: false });

      if (inquiriesError) throw inquiriesError;

      // Fetch Products
      const { data: productsData, error: productsError } = await supabase
        .from("Product")
        .select("*")
        .order("createdAt", { ascending: false });

      if (productsError) throw productsError;

      setOrders(ordersData || []);
      setInquiries(inquiriesData || []);
      setDbProducts(productsData || []);
    } catch (error: any) {
      console.error("Dashboard fetch error:", error);
      toast({
        title: "Sync Error",
        description: error.message || "Failed to load records from database.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (email === adminEmail && password === adminPassword) {
      sessionStorage.setItem("admin_authenticated", "true");
      setIsAuthenticated(true);
      toast({
        title: "Access Granted",
        description: "Welcome to Miracle Collections Admin Panel.",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid email or password. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    setIsAuthenticated(false);
    toast({
      title: "Logged Out",
      description: "You have successfully signed out of the admin panel.",
    });
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Update order status logic
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      const { error } = await supabase
        .from("Order")
        .update({ status: nextStatus })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Order Status Updated",
        description: `Order ${orderId.substring(0, 8)} set to ${nextStatus}.`
      });

      // Refresh data locally
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Could not update status.",
        variant: "destructive"
      });
    }
  };

  // Statistics calculation
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const activeOrdersCount = orders.filter(o => o.status !== "Delivered").length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[hsl(var(--warm-bg))] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-white border border-border/80 p-8 shadow-sm rounded-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-light tracking-wide text-foreground mb-2">Miracle Collections</h1>
            <p className="text-sm text-muted-foreground">Admin Portal Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground/60" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-b border-muted-foreground/35 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                  placeholder="admin@miraclecollections.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground/60" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-b border-muted-foreground/35 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-primary text-primary-foreground text-sm uppercase tracking-widest hover:opacity-90 transition-opacity font-medium mt-4"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--warm-bg))] flex flex-col md:flex-row">
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-border/80 flex flex-col pt-12 pb-8 px-4">
        <div className="px-4 mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Portal</p>
          <h2 className="text-xl font-light text-foreground mt-1">Miracle Admin</h2>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "orders", label: "Orders", icon: ShoppingBag },
            { id: "products", label: "Products", icon: Package },
            { id: "inquiries", label: "Inquiries", icon: MessageSquare }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors rounded-sm ${
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

        <div className="px-4 pt-4 border-t border-border/80 flex flex-col gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-sm text-left disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>Sync Data</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors rounded-sm text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main dashboard space */}
      <main className="flex-1 px-6 md:px-12 pt-12 pb-20 overflow-y-auto relative">
        {isLoading && (
          <div className="absolute top-6 right-12 flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Synchronizing...
          </div>
        )}

        {activeTab === "overview" && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-light text-foreground tracking-wide">Overview</h1>
              <p className="text-sm text-muted-foreground mt-1">Real-time statistics & shop metrics from database.</p>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Total Revenue", val: `₹${totalRevenue.toLocaleString("en-IN")}`, detail: "Live transaction total", icon: TrendingUp },
                { title: "Pending Orders", val: activeOrdersCount.toString(), detail: "Need fulfillment", icon: ShoppingBag },
                { title: "Total Products", val: dbProducts.length.toString(), detail: "Across database catalog", icon: Package },
                { title: "Inquiries", val: inquiries.length.toString(), detail: "From Contact form", icon: MessageSquare }
              ].map((card, i) => (
                <div key={i} className="bg-white border border-border/80 p-6 shadow-sm rounded-sm">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{card.title}</span>
                    <card.icon className="w-4 h-4 text-accent" />
                  </div>
                  <h3 className="text-2xl font-light text-foreground mb-1">{card.val}</h3>
                  <span className="text-xs text-muted-foreground/80">{card.detail}</span>
                </div>
              ))}
            </div>

            {/* Recent Orders section */}
            <div className="bg-white border border-border/80 p-6 shadow-sm rounded-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base uppercase tracking-widest font-semibold text-foreground">Recent Orders</h3>
                <button
                  onClick={() => handleTabChange("orders")}
                  className="text-xs uppercase tracking-widest text-accent hover:underline flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/60 text-xs uppercase tracking-widest text-muted-foreground pb-4">
                        <th className="py-3 font-semibold">Order ID</th>
                        <th className="py-3 font-semibold">Customer</th>
                        <th className="py-3 font-semibold">Status</th>
                        <th className="py-3 font-semibold">Items</th>
                        <th className="py-3 font-semibold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-sm">
                      {orders.slice(0, 5).map(order => (
                        <tr key={order.id} className="hover:bg-muted/10 transition-colors">
                          <td className="py-4 font-mono font-medium text-accent truncate max-w-[120px]">{order.id}</td>
                          <td className="py-4 text-foreground">
                            <div>
                              <p>{order.customerName}</p>
                              <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status === "Delivered" ? "bg-green-50 text-green-700" :
                              order.status === "Shipped" ? "bg-blue-50 text-blue-700" : "bg-yellow-50 text-yellow-700"
                            }`}>
                              {order.status === "Delivered" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {order.status}
                            </span>
                          </td>
                          <td className="py-4 text-muted-foreground max-w-xs truncate">{order.items}</td>
                          <td className="py-4 text-right font-medium text-foreground">₹{order.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground font-light">
                  No orders have been recorded in the database yet.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-light text-foreground tracking-wide">Orders</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage, update, and track customer order fulfillment statuses.</p>
            </div>

            <div className="bg-white border border-border/80 shadow-sm rounded-sm">
              {orders.length > 0 ? (
                <div className="overflow-x-auto w-full">
                  <table className="min-w-[860px] w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/60 text-xs uppercase tracking-widest text-muted-foreground">
                        <th className="py-3 px-4 font-semibold whitespace-nowrap">Order ID</th>
                        <th className="py-3 px-4 font-semibold whitespace-nowrap">Customer</th>
                        <th className="py-3 px-4 font-semibold whitespace-nowrap">Date</th>
                        <th className="py-3 px-4 font-semibold whitespace-nowrap">Status</th>
                        <th className="py-3 px-4 font-semibold whitespace-nowrap">Change Status</th>
                        <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Total</th>
                        <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-sm">
                      {orders.map(order => (
                        <tr key={order.id} className="hover:bg-muted/10 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs font-medium text-accent whitespace-nowrap max-w-[110px] truncate">
                            #{order.id.substring(0, 8).toUpperCase()}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <p className="font-medium text-foreground">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground whitespace-nowrap text-xs">
                            {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status === "Delivered" ? "bg-green-50 text-green-700" :
                              order.status === "Shipped" ? "bg-blue-50 text-blue-700" : "bg-yellow-50 text-yellow-700"
                            }`}>
                              {order.status === "Delivered" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="text-xs border border-border bg-transparent p-1 focus:outline-none focus:border-accent text-foreground rounded-sm"
                            >
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-foreground whitespace-nowrap">₹{order.total?.toLocaleString("en-IN")}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors rounded-sm"
                            >
                              <Eye className="w-3.5 h-3.5" /> Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center text-sm text-muted-foreground font-light">
                  No orders found in database.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
            onClick={() => setSelectedOrder(null)}
          >
            <div
              className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Order Details</p>
                  <h2 className="text-lg font-medium text-foreground mt-0.5">
                    #{selectedOrder.id.substring(0, 8).toUpperCase()}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-6">
                {/* Customer Info */}
                <section>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Customer Information</p>
                  <div className="space-y-2 text-sm">
                    <Row label="Name" value={selectedOrder.customerName} />
                    <Row label="Email" value={selectedOrder.customerEmail} />
                    {selectedOrder.phone && <Row label="Phone" value={selectedOrder.phone} />}
                    {selectedOrder.alternatePhone && <Row label="Alt. Phone" value={selectedOrder.alternatePhone} />}
                  </div>
                </section>

                {/* Delivery Address */}
                {(selectedOrder.address || selectedOrder.city) && (
                  <section>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Delivery Address</p>
                    <div className="space-y-2 text-sm">
                      {selectedOrder.address && <Row label="Address" value={selectedOrder.address} />}
                      {selectedOrder.landmark && <Row label="Landmark" value={selectedOrder.landmark} />}
                      {selectedOrder.city && <Row label="City" value={selectedOrder.city} />}
                      {selectedOrder.district && <Row label="District" value={selectedOrder.district} />}
                      {selectedOrder.pincode && <Row label="Pincode" value={selectedOrder.pincode} />}
                    </div>
                  </section>
                )}

                {/* Payment Info */}
                <section>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Payment Information</p>
                  <div className="space-y-2 text-sm">
                    <Row
                      label="Method"
                      value={selectedOrder.paymentMethod === "UPI_QR" ? "UPI / QR Code" : "Cash on Delivery (COD)"}
                      badge={selectedOrder.paymentMethod === "UPI_QR" ? "purple" : "amber"}
                    />
                    {selectedOrder.paymentMethod === "UPI_QR" && (
                      <>
                        {selectedOrder.transactionId && <Row label="Transaction ID" value={selectedOrder.transactionId} mono />}
                        {selectedOrder.referenceNumber && <Row label="Reference / UTR" value={selectedOrder.referenceNumber} mono />}
                      </>
                    )}
                    <Row label="Order Status" value={selectedOrder.status} />
                    <Row label="Date" value={new Date(selectedOrder.createdAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })} />
                  </div>
                </section>

                {/* Items */}
                <section>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Items Ordered</p>
                  <div className="bg-muted/30 border border-border/40 rounded-sm p-4">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{selectedOrder.items}</p>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Order Total</span>
                    <span className="text-lg font-medium text-foreground">₹{selectedOrder.total?.toLocaleString("en-IN")}</span>
                  </div>
                </section>
              </div>

              <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2 text-xs uppercase tracking-widest bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-light text-foreground tracking-wide">Products</h1>
                <p className="text-sm text-muted-foreground mt-1">Review active database shop inventory items.</p>
              </div>
              <button
                onClick={() => navigate("/admin/products/new")}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-xs uppercase tracking-widest hover:opacity-90 transition-opacity font-medium"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>

            <div className="bg-white border border-border/80 p-6 shadow-sm rounded-sm">
              {dbProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/60 text-xs uppercase tracking-widest text-muted-foreground pb-4">
                        <th className="py-3 font-semibold">Image</th>
                        <th className="py-3 font-semibold">Product Name</th>
                        <th className="py-3 font-semibold">Category</th>
                        <th className="py-3 font-semibold">Variant</th>
                        <th className="py-3 font-semibold">Sizes</th>
                        <th className="py-3 font-semibold">Stock Status</th>
                        <th className="py-3 font-semibold text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-sm">
                      {dbProducts.map(prod => (
                        <tr key={prod.slug} className="hover:bg-muted/10 transition-colors">
                          <td className="py-3">
                            <img src={prod.image} alt={prod.name} className="w-10 h-10 object-cover rounded-sm border border-border" />
                          </td>
                          <td className="py-3 font-medium text-foreground">{prod.name}</td>
                          <td className="py-3 text-muted-foreground uppercase text-xs tracking-wider">{prod.category}</td>
                          <td className="py-3 text-muted-foreground">{prod.variant || "—"}</td>
                          <td className="py-3">
                            <span className="text-xs text-foreground font-mono">{prod.sizes || "—"}</span>
                          </td>
                          <td className="py-3">
                            <span className="text-xs text-foreground">{prod.availability || "In Stock"}</span>
                          </td>
                          <td className="py-3 text-right font-medium text-foreground">₹{prod.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center text-sm text-muted-foreground font-light">
                  No products have been added to the database yet. Click "Add Product" to create one.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "inquiries" && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-light text-foreground tracking-wide">Customer Inquiries</h1>
              <p className="text-sm text-muted-foreground mt-1">Review contact form feedback messages from the database.</p>
            </div>

            {inquiries.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {inquiries.map(inq => (
                  <div key={inq.id} className="bg-white border border-border/80 p-6 shadow-sm rounded-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-medium text-foreground">{inq.name}</h4>
                        <p className="text-sm text-muted-foreground">{inq.email}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(inq.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground bg-muted/30 p-4 border border-border/40 leading-relaxed rounded-sm whitespace-pre-wrap">
                      {inq.message}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-muted-foreground font-light bg-white border border-border/80 rounded-sm">
                No customer inquiries have been recorded yet.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
