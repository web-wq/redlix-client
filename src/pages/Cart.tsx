import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import QuantitySelector from "@/components/QuantitySelector";
import { X, ArrowRight } from "lucide-react";

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center space-y-6">
        <h1 className="text-3xl font-light text-foreground tracking-wide">Shopping Cart</h1>
        <p className="text-sm text-muted-foreground">Your shopping cart is currently empty.</p>
        <Link
          to="/shop"
          className="inline-block px-8 py-3.5 bg-accent text-accent-foreground text-xs uppercase tracking-widest hover:opacity-90 transition-opacity font-medium rounded-sm"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-light text-foreground tracking-wide mb-12">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Left Column: Cart items list */}
        <div className="lg:col-span-2 space-y-6">
          {items.map(item => (
            <div key={item.slug} className="flex gap-6 border-b border-border/60 pb-6 items-center">
              <img src={item.image} alt={item.name} className="w-20 h-20 object-cover bg-white border border-border/40 rounded-sm" />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-medium text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">₹{item.price.toFixed(2)}</p>
                  </div>
                  <button onClick={() => removeItem(item.slug)} aria-label="Remove item">
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <QuantitySelector quantity={item.quantity} onChange={q => updateQuantity(item.slug, q)} />
                  <span className="text-sm font-medium text-foreground">Subtotal: ₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Cart summary */}
        <div className="lg:col-span-1 bg-white border border-border/80 p-6 shadow-sm rounded-sm space-y-6">
          <h2 className="text-xs uppercase tracking-widest text-foreground font-semibold">Order Summary</h2>
          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Shipping</span>
              <span className="text-green-600 font-semibold">FREE</span>
            </div>
            <hr className="border-border/40" />
            <div className="flex justify-between text-sm text-foreground pt-1">
              <span className="font-semibold">Estimated Total</span>
              <span className="font-bold text-base">₹{subtotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate("/checkout")}
            className="w-full py-3.5 bg-accent text-accent-foreground text-xs uppercase tracking-widest hover:opacity-90 transition-opacity font-medium rounded-sm flex items-center justify-center gap-2"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="text-[10px] text-muted-foreground leading-relaxed text-center font-light">
            Shipping and taxes computed at checkout step. Free shipping applies across all items.
          </div>
        </div>
      </div>
    </div>
  );
}
