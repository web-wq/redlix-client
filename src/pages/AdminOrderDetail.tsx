import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Printer,
  FileDown,
  CheckCircle,
  Clock,
  User,
  MapPin,
  CreditCard,
  ShoppingBag,
  Hash,
  Loader2,
  AlertCircle,
} from "lucide-react";

/* ─── tiny field-row helper ─────────────────────────────────── */
function Field({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-border/40 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:w-40 shrink-0 mt-0.5">
        {label}
      </span>
      <span className={`text-sm text-foreground break-all ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

/* ─── section card ───────────────────────────────────────────── */
function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-border/70 rounded-sm shadow-sm overflow-hidden print:shadow-none print:border print:border-gray-300">
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-muted/30 border-b border-border/50 print:bg-gray-50">
        <Icon className="w-4 h-4 text-accent print:text-gray-600" />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
      </div>
      <div className="px-5 py-4 space-y-0">{children}</div>
    </div>
  );
}

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [order, setOrder] = useState<any>(null);
  const [address, setAddress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── guard: must be admin with valid signed token ── */
  useEffect(() => {
    const token = sessionStorage.getItem("admin_session_token");
    const expiry = sessionStorage.getItem("admin_session_expiry");
    const isValid =
      token &&
      expiry &&
      token.startsWith("mc_admin_") &&
      Date.now() < parseInt(expiry, 10);

    if (!isValid) {
      // Clear stale session data
      sessionStorage.removeItem("admin_authenticated");
      sessionStorage.removeItem("admin_session_token");
      sessionStorage.removeItem("admin_session_expiry");
      navigate("/admin");
    }
  }, [navigate]);

  /* ── fetch order ── */
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        /* 1. Fetch the order */
        const { data: orderData, error: orderErr } = await supabase
          .from("Order")
          .select("*")
          .eq("id", id)
          .single();
        if (orderErr) throw orderErr;
        setOrder(orderData);

        /* 2. Try to find the customer's address via their email → user lookup */
        if (orderData?.customerEmail) {
          // Look up addresses where emailAddress matches the customer email
          const { data: addrByEmail } = await supabase
            .from("Address")
            .select("*")
            .eq("emailAddress", orderData.customerEmail)
            .order("createdAt", { ascending: false })
            .limit(1);

          if (addrByEmail && addrByEmail.length > 0) {
            setAddress(addrByEmail[0]);
          } else {
            // Fallback: try name match
            const { data: addrByName } = await supabase
              .from("Address")
              .select("*")
              .eq("name", orderData.customerName)
              .order("createdAt", { ascending: false })
              .limit(1);
            if (addrByName && addrByName.length > 0) setAddress(addrByName[0]);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load order.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  /* ── print handler ── */
  const handlePrint = () => window.print();

  /* ── PDF handler (print-to-PDF via browser dialog) ── */
  const handleDownloadPDF = () => {
    document.title = `Order-${id?.substring(0, 8).toUpperCase()}`;
    window.print();
  };

  /* ── status colour ── */
  const statusClass =
    order?.status === "Delivered"
      ? "bg-green-50 text-green-700 border-green-200"
      : order?.status === "Shipped"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-yellow-50 text-yellow-700 border-yellow-200";

  /* ── render ── */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--warm-bg))]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading order details…</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--warm-bg))]">
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-sm text-muted-foreground">{error || "Order not found."}</p>
          <button
            onClick={() => navigate("/admin?tab=orders")}
            className="text-xs underline text-accent"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Print / PDF styles injected into <head> via a style tag ── */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-page {
            padding: 24px !important;
            max-width: 100% !important;
          }
          .print-header-logo {
            font-size: 20px !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-[hsl(var(--warm-bg))] print:bg-white">
        {/* ── Topbar (hidden when printing) ── */}
        <div className="no-print bg-white border-b border-border/80 px-6 py-4 flex items-center justify-between gap-4 shadow-sm">
          <button
            onClick={() => navigate("/admin?tab=orders")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest border border-border text-foreground hover:bg-muted/30 transition-colors rounded-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest bg-primary text-primary-foreground hover:opacity-90 transition-opacity rounded-sm"
            >
              <FileDown className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>

        {/* ── Page content ── */}
        <div ref={printRef} className="print-page max-w-3xl mx-auto px-6 py-10 space-y-8">

          {/* ── Print letterhead (visible on print only) ── */}
          <div className="hidden print:block print-header-logo mb-6 pb-4 border-b border-gray-300">
            <p className="text-2xl font-light tracking-wide text-gray-900">Miracle Collections</p>
            <p className="text-xs text-gray-500 mt-0.5">Admin — Order Invoice / Detail Sheet</p>
          </div>

          {/* ── Page header ── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                Order Detail
              </p>
              <h1 className="text-2xl font-light text-foreground tracking-wide">
                #{order.id.substring(0, 8).toUpperCase()}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleString("en-IN", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </p>
            </div>

            <span
              className={`self-start inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-xs font-semibold ${statusClass}`}
            >
              {order.status === "Delivered" ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              {order.status}
            </span>
          </div>

          {/* ── Customer Information ── */}
          <Section icon={User} title="Customer Information">
            <Field label="Full Name" value={order.customerName} />
            <Field label="Email Address" value={order.customerEmail} />
            {address?.contactNumber && <Field label="Phone Number" value={address.contactNumber} />}
            {address?.alternativeMobile && <Field label="Alt. Phone" value={address.alternativeMobile} />}
          </Section>

          {/* ── Delivery Address ── */}
          <Section icon={MapPin} title="Delivery Address">
            {address ? (
              <>
                <Field label="Recipient Name" value={address.name} />
                <Field label="Full Address" value={address.fullAddress} />
                {address.landmark && <Field label="Landmark" value={address.landmark} />}
                <Field label="City" value={address.city} />
                <Field label="District" value={address.district} />
                <Field label="Pincode" value={address.pincode} />
                {address.contactNumber && <Field label="Contact No." value={address.contactNumber} />}
                {address.alternativeMobile && <Field label="Alt. Mobile" value={address.alternativeMobile} />}
                {address.emailAddress && <Field label="Email (Address)" value={address.emailAddress} />}
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic py-2">
                Address data not found — it may not have been linked to this order or has been removed.
              </p>
            )}
          </Section>

          {/* ── Payment Information ── */}
          <Section icon={CreditCard} title="Payment Information">
            <Field
              label="Payment Method"
              value={order.paymentMethod === "UPI_QR" ? "UPI / QR Code Payment" : "Cash on Delivery (COD)"}
            />
            {order.paymentMethod === "UPI_QR" && (
              <>
                <Field label="Transaction ID" value={order.transactionId || "Not provided"} mono />
                <Field label="UTR / Reference No." value={order.referenceNumber || "Not provided"} mono />
              </>
            )}
          </Section>

          {/* ── Items Ordered ── */}
          <Section icon={ShoppingBag} title="Items Ordered">
            <div className="py-2">
              {order.items
                ?.split(",")
                .map((item: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 py-1.5 border-b border-border/30 last:border-0"
                  >
                    <span className="text-xs text-muted-foreground font-mono mt-0.5 w-5 shrink-0">
                      {i + 1}.
                    </span>
                    <span className="text-sm text-foreground">{item.trim()}</span>
                  </div>
                ))}
            </div>

            {/* Order Total */}
            <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Order Total
              </span>
              <span className="text-xl font-light text-foreground">
                ₹{order.total?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </Section>

          {/* ── Order Reference ── */}
          <Section icon={Hash} title="Order Reference">
            <div className="py-2">
              <p className="text-xs font-mono text-foreground select-all break-all">{order.id}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Created: {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "medium" })}
              </p>
            </div>
          </Section>

          {/* ── Print footer ── */}
          <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-center">
            <p className="text-xs text-gray-400">
              Miracle Collections — Printed on {new Date().toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
