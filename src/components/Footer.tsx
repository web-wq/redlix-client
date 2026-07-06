import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import { CATEGORIES } from "@/data/products";

export default function Footer() {
  return (
    <footer className="bg-background py-16 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-12">
          <div>
            <h3 className="text-2xl font-light tracking-wide text-foreground mb-3">Miracle Collections</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Handcrafted apparel and footwear for the whole family, made with care.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram className="w-[18px] h-[18px] text-muted-foreground hover:text-foreground transition-colors" />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-widest text-foreground mb-1">Shop</p>
            {CATEGORIES.map(c => (
              <Link key={c.slug} to={`/category/${c.slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {c.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-widest text-foreground mb-1">Company</p>
            <Link to="/shop" className="text-sm text-muted-foreground hover:text-foreground transition-colors">All Products</Link>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-widest text-foreground mb-1">Support</p>
            <a href="mailto:hello@miraclecollections.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">hello@miraclecollections.com</a>
            <span className="text-sm text-muted-foreground">Mon–Fri, 9am–5pm</span>
          </div>
        </div>

        <p className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground">
          © {new Date().getFullYear()} Miracle Collections. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
