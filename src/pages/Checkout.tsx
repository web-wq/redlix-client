import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { Loader2, Plus, Check, MapPin, ArrowRight, QrCode, CreditCard, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ── Security helpers ────────────────────────────────────────────
/** Strip HTML tags and trim whitespace to prevent XSS stored in DB */
function sanitize(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")         // strip HTML tags
    .replace(/javascript:/gi, "")    // strip JS protocol
    .replace(/on\w+=/gi, "")         // strip inline event handlers
    .trim();
}

/** Validate 10-digit Indian mobile number */
function validatePhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.trim());
}

/** Validate 6-digit Indian pincode */
function validatePincode(pin: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pin.trim());
}

/** Validate UPI transaction / UTR reference: alphanumeric, 6–50 chars */
function validatePaymentRef(ref: string): boolean {
  return /^[A-Za-z0-9\-_]{4,60}$/.test(ref.trim());
}

export default function Checkout() {
  const { items, clearCart, subtotal } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [checkoutStep, setCheckoutStep] = useState<"address" | "payment">("address");
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Auth & Addresses States
  const [user, setUser] = useState<any>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Address Form States
  const [addrName, setAddrName] = useState("");
  const [addrFull, setAddrFull] = useState("");
  const [addrLandmark, setAddrLandmark] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrDistrict, setAddrDistrict] = useState("");
  const [addrPincode, setAddrPincode] = useState("");
  const [addrContact, setAddrContact] = useState("");
  const [addrEmail, setAddrEmail] = useState("");
  const [addrAlternative, setAddrAlternative] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Payment Form States
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI_QR">("UPI_QR");
  const [payerName, setPayerName] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  // Redirect if cart is empty (unless order completed)
  useEffect(() => {
    if (items.length === 0 && !orderCompleted) {
      navigate("/cart");
    }
  }, [items, orderCompleted, navigate]);

  // Fetch auth user session on load
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
      } else {
        // Redirect guest user to auth
        toast({
          title: "Sign In Required",
          description: "Please sign in or create an account to complete checkout.",
        });
        navigate("/auth?redirect=/checkout");
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        navigate("/auth?redirect=/checkout");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, toast]);

  // Fetch user addresses from database when user is loaded
  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      const { data, error } = await supabase
        .from("Address")
        .select("*")
        .eq("userId", user.id)
        .order("createdAt", { ascending: false });

      if (error) throw error;
      setSavedAddresses(data || []);
      
      // Auto-select the latest address if available
      if (data && data.length > 0 && !selectedAddressId) {
        setSelectedAddressId(data[0].id);
      }
    } catch (error: any) {
      console.error("Error fetching addresses:", error);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // ── Validate inputs before saving ────────────────────────────
    if (!validatePhone(addrContact)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit Indian mobile number.",
        variant: "destructive"
      });
      return;
    }
    if (!validatePincode(addrPincode)) {
      toast({
        title: "Invalid Pincode",
        description: "Please enter a valid 6-digit Indian pincode.",
        variant: "destructive"
      });
      return;
    }
    if (addrAlternative && !validatePhone(addrAlternative)) {
      toast({
        title: "Invalid Alternate Number",
        description: "Alternate mobile must be a valid 10-digit number.",
        variant: "destructive"
      });
      return;
    }

    setIsSavingAddress(true);
    try {
      const newAddressId = crypto.randomUUID();
      const { error } = await supabase
        .from("Address")
        .insert({
          id: newAddressId,
          userId: user.id,
          name: sanitize(addrName),
          fullAddress: sanitize(addrFull),
          landmark: sanitize(addrLandmark),
          city: sanitize(addrCity),
          district: sanitize(addrDistrict),
          pincode: addrPincode.trim(),
          contactNumber: addrContact.trim(),
          emailAddress: addrEmail ? sanitize(addrEmail) : null,
          alternativeMobile: addrAlternative ? addrAlternative.trim() : null
        });

      if (error) throw error;

      toast({
        title: "Address Saved",
        description: "Delivery location saved successfully.",
      });

      // Clear address form states
      setAddrName("");
      setAddrFull("");
      setAddrLandmark("");
      setAddrCity("");
      setAddrDistrict("");
      setAddrPincode("");
      setAddrContact("");
      setAddrEmail("");
      setAddrAlternative("");
      setIsAddingAddress(false);

      // Refresh addresses and set active selection
      await fetchAddresses();
      setSelectedAddressId(newAddressId);
    } catch (error: any) {
      toast({
        title: "Failed to save address",
        description: error.message || "Something went wrong.",
        variant: "destructive"
      });
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handlePlaceOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Prevent double-submission
    if (isSubmittingOrder) return;

    const selectedAddress = savedAddresses.find(a => a.id === selectedAddressId);
    if (!selectedAddress) {
      toast({
        title: "Select Address",
        description: "Please select or add a delivery address location.",
        variant: "destructive"
      });
      return;
    }

    if (paymentMethod === "UPI_QR") {
      const txnClean = transactionId.trim();
      const refClean = referenceNumber.trim();
      const payerClean = payerName.trim();

      if (!payerClean || !txnClean || !refClean) {
        toast({
          title: "Payment Info Required",
          description: "Please fill in all transaction verification details.",
          variant: "destructive"
        });
        return;
      }

      if (!validatePaymentRef(txnClean)) {
        toast({
          title: "Invalid Transaction ID",
          description: "Transaction ID must be 4-60 alphanumeric characters.",
          variant: "destructive"
        });
        return;
      }

      if (!validatePaymentRef(refClean)) {
        toast({
          title: "Invalid Reference / UTR",
          description: "UTR/Reference must be 4-60 alphanumeric characters.",
          variant: "destructive"
        });
        return;
      }
    }

    setIsSubmittingOrder(true);
    try {
      const itemsListString = items.map(item => `${sanitize(item.name)} (Qty: ${item.quantity})`).join(", ");

      const { error } = await supabase
        .from("Order")
        .insert({
          id: crypto.randomUUID(),
          userId: user.id,
          customerName: sanitize(selectedAddress.name),
          customerEmail: sanitize(selectedAddress.emailAddress || user.email),
          items: itemsListString,
          total: subtotal,
          status: "Processing",
          paymentMethod: paymentMethod,
          transactionId: paymentMethod === "UPI_QR" ? sanitize(transactionId) : "",
          referenceNumber: paymentMethod === "UPI_QR" ? sanitize(referenceNumber) : ""
        });

      if (error) throw error;

      toast({
        title: "Order Placed Successfully!",
        description: paymentMethod === "UPI_QR"
          ? "Your payment is being verified. Order has been recorded."
          : "Cash on delivery order has been recorded.",
      });

      clearCart();
      setOrderCompleted(true);
    } catch (error: any) {
      toast({
        title: "Checkout failed",
        description: error.message || "Failed to submit purchase order.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // UPI Link generation
  const upiId = "sravankumar97@axl";
  const upiLink = `upi://pay?pa=${upiId}&pn=Miracle%20Collections&am=${subtotal.toFixed(2)}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(upiLink)}`;

  if (orderCompleted) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center space-y-6">
        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-light text-foreground tracking-wide">Thank You for Your Order!</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Your order has been placed successfully and is now processing. We will notify you once your items ship.
        </p>
        <Link
          to="/shop"
          className="inline-block px-8 py-3.5 bg-accent text-accent-foreground text-xs uppercase tracking-widest hover:opacity-90 transition-opacity font-medium rounded-sm"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] bg-[hsl(var(--warm-bg))] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
        <p className="text-sm text-muted-foreground font-light">Verifying checkout session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--warm-bg))] py-16">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Checkout Steps Wizard (8 cols on lg) */}
        <div className="lg:col-span-8 bg-white border border-border/80 p-8 shadow-sm rounded-sm space-y-8">
          {/* Breadcrumbs / Progress indicators */}
          <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground pb-4 border-b border-border/60">
            <span className={checkoutStep === "address" ? "text-foreground font-semibold" : "text-muted-foreground/60"}>
              1. Delivery Address
            </span>
            <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
            <span className={checkoutStep === "payment" ? "text-foreground font-semibold" : "text-muted-foreground/60"}>
              2. Payment Method
            </span>
          </div>

          {/* Step 1: Address Selection */}
          {checkoutStep === "address" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {isAddingAddress ? (
                /* Save Location Form */
                <form onSubmit={handleSaveAddress} className="space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-border/60">
                    <h3 className="text-sm uppercase tracking-widest font-semibold text-foreground">Add Shipping Address</h3>
                    <button 
                      type="button" 
                      onClick={() => setIsAddingAddress(false)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Back to list
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    <label htmlFor="addrName" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Recipient Full Name</label>
                    <input
                      id="addrName"
                      required
                      value={addrName}
                      onChange={(e) => setAddrName(e.target.value)}
                      className="w-full py-2 border-b border-muted-foreground/35 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                      placeholder="e.g. Priyan Sharma"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="addrFull" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Full Address</label>
                    <input
                      id="addrFull"
                      required
                      value={addrFull}
                      onChange={(e) => setAddrFull(e.target.value)}
                      className="w-full py-2 border-b border-muted-foreground/35 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                      placeholder="e.g. H.No 18-206, Near Main Road"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label htmlFor="addrLandmark" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Landmark</label>
                      <input
                        id="addrLandmark"
                        required
                        value={addrLandmark}
                        onChange={(e) => setAddrLandmark(e.target.value)}
                        className="w-full py-2 border-b border-muted-foreground/35 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                        placeholder="e.g. Opp. Bus Stand"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="addrCity" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">City</label>
                      <input
                        id="addrCity"
                        required
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                        className="w-full py-2 border-b border-muted-foreground/35 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                        placeholder="e.g. Malkajgiri"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label htmlFor="addrDistrict" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">District</label>
                      <input
                        id="addrDistrict"
                        required
                        value={addrDistrict}
                        onChange={(e) => setAddrDistrict(e.target.value)}
                        className="w-full py-2 border-b border-muted-foreground/35 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                        placeholder="e.g. Medchal"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="addrPincode" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Pincode</label>
                      <input
                        id="addrPincode"
                        required
                        value={addrPincode}
                        onChange={(e) => setAddrPincode(e.target.value)}
                        className="w-full py-2 border-b border-muted-foreground/35 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                        placeholder="e.g. 500047"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="addrContact" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Contact Number</label>
                    <input
                      id="addrContact"
                      required
                      type="tel"
                      value={addrContact}
                      onChange={(e) => setAddrContact(e.target.value)}
                      className="w-full py-2 border-b border-muted-foreground/35 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                      placeholder="e.g. +91 9876543210"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="addrEmail" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Email Address (Optional)</label>
                    <input
                      id="addrEmail"
                      type="email"
                      value={addrEmail}
                      onChange={(e) => setAddrEmail(e.target.value)}
                      className="w-full py-2 border-b border-muted-foreground/35 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                      placeholder="e.g. customer@gmail.com"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="addrAlternative" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Alternative Number (Optional)</label>
                    <input
                      id="addrAlternative"
                      type="tel"
                      value={addrAlternative}
                      onChange={(e) => setAddrAlternative(e.target.value)}
                      className="w-full py-2 border-b border-muted-foreground/35 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                      placeholder="e.g. +91 9111222333"
                    />
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="flex-1 py-3 border border-border text-foreground text-xs uppercase tracking-widest hover:bg-muted/40 transition-colors font-medium rounded-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingAddress}
                      className="flex-1 py-3 bg-accent text-accent-foreground text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 font-medium rounded-sm flex items-center justify-center"
                    >
                      {isSavingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Delivery Address"}
                    </button>
                  </div>
                </form>
              ) : (
                /* Saved Locations List */
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-border/60">
                    <h3 className="text-sm uppercase tracking-widest font-semibold text-foreground">Select Shipping Location</h3>
                    <button
                      onClick={() => setIsAddingAddress(true)}
                      className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-4 h-4" /> Add New Address
                    </button>
                  </div>

                  {isLoadingAddresses ? (
                    <div className="py-12 flex justify-center">
                      <Loader2 className="w-8 h-8 text-accent animate-spin" />
                    </div>
                  ) : savedAddresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {savedAddresses.map(addr => (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-5 border rounded-sm cursor-pointer transition-all flex flex-col justify-between ${
                            selectedAddressId === addr.id
                              ? "border-accent bg-accent/5 ring-1 ring-accent"
                              : "border-border/60 hover:border-border-foreground/45 bg-muted/5"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                                <MapPin className="w-4 h-4 text-accent" />
                                <span>{addr.name}</span>
                              </div>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                selectedAddressId === addr.id ? "border-accent bg-accent" : "border-border"
                              }`}>
                                {selectedAddressId === addr.id && <Check className="w-2.5 h-2.5 text-accent-foreground" />}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1 pl-6 leading-relaxed">
                              <p>{addr.fullAddress}</p>
                              <p>Landmark: {addr.landmark}</p>
                              <p>{addr.city}, {addr.district} - {addr.pincode}</p>
                              <p className="text-foreground font-medium mt-2">Ph: {addr.contactNumber}</p>
                              {addr.alternativeMobile && <p>Alt: {addr.alternativeMobile}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 border border-dashed border-border text-center text-sm text-muted-foreground font-light py-16">
                      No delivery addresses saved. Please add a shipping location address to continue.
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-6 border-t border-border/60">
                    <Link to="/cart" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1.5">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Cart
                    </Link>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep("payment")}
                      disabled={!selectedAddressId}
                      className="px-8 py-3.5 bg-accent text-accent-foreground text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 font-medium rounded-sm flex items-center gap-1.5"
                    >
                      <span>Proceed to Payment</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Payment options */}
          {checkoutStep === "payment" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <button 
                  onClick={() => setCheckoutStep("address")}
                  className="p-1.5 hover:bg-muted rounded-full transition-colors mr-1"
                  aria-label="Back to Address Selection"
                >
                  <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <h3 className="text-sm uppercase tracking-widest font-semibold text-foreground">Select Payment Method</h3>
              </div>

              {/* COD / QR Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("UPI_QR")}
                  className={`p-5 border rounded-sm flex flex-col items-center justify-center gap-3 transition-all ${
                    paymentMethod === "UPI_QR" 
                      ? "border-accent bg-accent/5 ring-1 ring-accent" 
                      : "border-border/60 hover:border-border-foreground/30 bg-muted/5"
                  }`}
                >
                  <QrCode className={`w-8 h-8 ${paymentMethod === "UPI_QR" ? "text-accent" : "text-muted-foreground"}`} />
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">Scan UPI QR Code</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Pay online instantly</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("COD")}
                  className={`p-5 border rounded-sm flex flex-col items-center justify-center gap-3 transition-all ${
                    paymentMethod === "COD" 
                      ? "border-accent bg-accent/5 ring-1 ring-accent" 
                      : "border-border/60 hover:border-border-foreground/30 bg-muted/5"
                  }`}
                >
                  <CreditCard className={`w-8 h-8 ${paymentMethod === "COD" ? "text-accent" : "text-muted-foreground"}`} />
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">Cash on Delivery (COD)</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Pay cash at delivery time</p>
                  </div>
                </button>
              </div>

              {paymentMethod === "UPI_QR" ? (
                /* UPI QR Form */
                <form onSubmit={handlePlaceOrder} className="space-y-6">
                  <div className="border border-border/60 p-6 bg-muted/5 rounded-sm flex flex-col md:flex-row items-center justify-around gap-6">
                    <div className="bg-white p-3 border border-border/40 shadow-sm rounded-sm shrink-0">
                      <img src={qrCodeUrl} alt="UPI QR Code Payment" className="w-[180px] h-[180px]" />
                    </div>
                    <div className="space-y-2 text-center md:text-left">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold block">Scan with any UPI App</span>
                      <p className="text-sm font-semibold text-foreground">Amount: ₹{subtotal.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">UPI ID: <span className="font-mono text-accent font-semibold">{upiId}</span></p>
                      <p className="text-[10px] text-muted-foreground/80 leading-relaxed max-w-xs mt-2">
                        Scan the code, complete the transaction in your GPay / PhonePe / Paytm / BHIM app, and paste the transaction details below.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label htmlFor="payerName" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Payer Account Name</label>
                      <input
                        id="payerName"
                        required
                        value={payerName}
                        onChange={(e) => setPayerName(e.target.value)}
                        className="w-full py-2 border-b border-muted-foreground/35 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                        placeholder="Name registered in your bank account"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="transactionId" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Transaction ID / Reference ID</label>
                      <input
                        id="transactionId"
                        required
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full py-2 border-b border-muted-foreground/35 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                        placeholder="e.g. UPI Ref: 306288472911"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="referenceNumber" className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">UTR Number</label>
                      <input
                        id="referenceNumber"
                        required
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        className="w-full py-2 border-b border-muted-foreground/35 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                        placeholder="e.g. UTR384729221"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep("address")}
                      className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground font-semibold"
                    >
                      Back to Address
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingOrder}
                      className="px-8 py-3.5 bg-accent text-accent-foreground text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 font-medium rounded-sm flex items-center justify-center"
                    >
                      {isSubmittingOrder ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving Order...
                        </>
                      ) : (
                        "Complete Payment & Place Order"
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* COD Info */
                <div className="space-y-6">
                  <div className="p-6 bg-muted/40 border border-border/40 rounded-sm text-sm text-muted-foreground leading-relaxed text-center">
                    Cash on Delivery (COD) selected. You will pay the total amount of <span className="font-semibold text-foreground">₹{subtotal.toFixed(2)}</span> in cash to the delivery executive when the parcel arrives at your address.
                  </div>
                  
                  <div className="flex justify-between items-center pt-6 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep("address")}
                      className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground font-semibold"
                    >
                      Back to Address
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePlaceOrder()}
                      disabled={isSubmittingOrder}
                      className="px-8 py-3.5 bg-accent text-accent-foreground text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 font-medium rounded-sm flex items-center justify-center"
                    >
                      {isSubmittingOrder ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...
                        </>
                      ) : (
                        "Place Order (Cash on Delivery)"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Order items summary (4 cols on lg) */}
        <div className="lg:col-span-4 bg-white border border-border/80 p-6 shadow-sm rounded-sm space-y-6">
          <h2 className="text-xs uppercase tracking-widest text-foreground font-semibold">Your Items</h2>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1 border-t border-b border-border/40 py-4">
            {items.map(item => (
              <div key={item.slug} className="flex gap-4 items-center">
                <img src={item.image} alt={item.name} className="w-12 h-12 object-cover bg-white border border-border/40 rounded-sm shrink-0" />
                <div className="flex-1 text-xs">
                  <h4 className="font-medium text-foreground truncate max-w-[150px]">{item.name}</h4>
                  <p className="text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                </div>
                <span className="text-xs font-semibold text-foreground">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Shipping</span>
              <span className="text-green-600 font-semibold">FREE</span>
            </div>
            <div className="flex justify-between text-sm text-foreground pt-3 border-t border-border/60">
              <span className="font-medium">Total</span>
              <span className="font-bold text-base">₹{subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
