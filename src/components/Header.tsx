import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X, Instagram, User, LogOut } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  
];

export default function Header() {
  const { totalItems } = useCart();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user.email ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out" });
    navigate("/");
  };

  const transparent = isHome && !scrolled && !mobileOpen;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        transparent
          ? "bg-transparent border-b border-transparent"
          : "bg-white border-b border-border shadow-sm"
      )}
    >
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Link
          to="/"
          className="flex items-center gap-3"
        >
          <img 
            src="https://ik.imagekit.io/dypkhqxip/cli" 
            alt="Miracle Collections Logo" 
            className="h-9 w-auto object-contain"
          />
          <span
            className={cn(
              "text-2xl font-light tracking-wide transition-colors",
              transparent ? "text-white" : "text-foreground"
            )}
          >
            Miracle Collections
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "text-sm uppercase tracking-wider transition-colors",
                transparent
                  ? "text-white/80 hover:text-white"
                  : "text-muted-foreground hover:text-foreground",
                pathname === link.to && (transparent ? "text-white font-medium" : "text-foreground font-medium")
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-5">
          <a href="https://www.instagram.com/invites/contact/?utm_source=ig_contact_invite&utm_medium=copy_link&utm_content=108ys3ua" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <Instagram className={cn("w-[18px] h-[18px] transition-colors", transparent ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-foreground")} />
          </a>

          {/* Profile / Account */}
          {userEmail ? (
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Account menu" className="outline-none">
                <User className={cn("w-[18px] h-[18px] transition-colors", transparent ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-foreground")} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border border-border p-2 shadow-md">
                <DropdownMenuLabel className="font-normal px-2 py-1.5 border-b border-border/60 mb-1">
                  <span className="block text-xs text-muted-foreground">Signed in as</span>
                  <span className="block truncate text-sm font-medium">{userEmail}</span>
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate("/account?tab=profile")} className="cursor-pointer px-2 py-1.5 text-sm hover:bg-muted/60 transition-colors">
                  Account Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/account?tab=orders")} className="cursor-pointer px-2 py-1.5 text-sm hover:bg-muted/60 transition-colors">
                  Your Orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/account?tab=wishlist")} className="cursor-pointer px-2 py-1.5 text-sm hover:bg-muted/60 transition-colors">
                  Wishlist
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 border-t border-border/60" />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer px-2 py-1.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                  <LogOut className="w-4 h-4 mr-2 inline" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth" aria-label="Sign in">
              <User className={cn("w-[18px] h-[18px] transition-colors", transparent ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-foreground")} />
            </Link>
          )}

          <Link to="/cart" className="relative" aria-label="Shopping cart">
            <ShoppingCart className={cn("w-[18px] h-[18px] transition-colors", transparent ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-foreground")} />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] w-[18px] h-[18px] rounded-full flex items-center justify-center font-medium">
                {totalItems}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-4">
          <Link to={userEmail ? "/account" : "/auth"} aria-label={userEmail ? "Account details" : "Sign in"}>
            <User className={cn("w-5 h-5 transition-colors", transparent ? "text-white" : "text-foreground")} />
          </Link>
          <Link to="/cart" className="relative" aria-label="Shopping cart">
            <ShoppingCart className={cn("w-5 h-5 transition-colors", transparent ? "text-white" : "text-foreground")} />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] w-[18px] h-[18px] rounded-full flex items-center justify-center font-medium">
                {totalItems}
              </span>
            )}
          </Link>
          <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen
              ? <X className={cn("w-6 h-6", transparent ? "text-white" : "text-foreground")} />
              : <Menu className={cn("w-6 h-6", transparent ? "text-white" : "text-foreground")} />
            }
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-border bg-white px-6 py-6 space-y-4">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block text-sm uppercase tracking-wider text-muted-foreground",
                pathname === link.to && "text-foreground font-medium"
              )}
            >
              {link.label}
            </Link>
          ))}
          {!userEmail && (
            <Link
              to="/auth"
              onClick={() => setMobileOpen(false)}
              className="block text-sm uppercase tracking-wider text-muted-foreground"
            >
              Sign in / Create account
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
