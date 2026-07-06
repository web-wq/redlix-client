import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, Phone, Mail, MapPin } from "lucide-react";
import { CATEGORIES } from "@/data/products";

export default function Footer() {
  return (
    <footer className="bg-background py-16 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1.2fr] gap-12">
          <div>
            <h3 className="text-2xl font-light tracking-wide text-foreground mb-3">Miracle Collections</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Apparel and footwear for the whole family, made with care.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="https://chat.whatsapp.com/C4XWYqZ3shP8bWGHawr944?s=cl&p=a&ilr=0" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <svg
                  className="w-[18px] h-[18px] fill-current text-muted-foreground hover:text-foreground transition-colors"
                  viewBox="0 0 448 512"
                >
                  <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.2-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/invites/contact/?utm_source=ig_contact_invite&utm_medium=copy_link&utm_content=108ys3ua" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram className="w-[18px] h-[18px] text-muted-foreground hover:text-foreground transition-colors" />
              </a>
              <a href="https://www.facebook.com/share/1BtTzur1wx/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook className="w-[18px] h-[18px] text-muted-foreground hover:text-foreground transition-colors" />
              </a>
              <a href="https://youtube.com/@miraclecollections-b1f?si=CCu3-v-ZvekkVJUZ" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <Youtube className="w-[18px] h-[18px] text-muted-foreground hover:text-foreground transition-colors" />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-widest text-foreground mb-1">Shop</p>
            {CATEGORIES.map(c => (
              <Link key={c.slug} to={`/shop?category=${c.slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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
            <p className="text-xs uppercase tracking-widest text-foreground mb-1">Contact</p>
            <a href="mailto:miraclecollections581@gmail.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="w-4 h-4 shrink-0" />
              <span className="truncate">miraclecollections581@gmail.com</span>
            </a>
            <a href="tel:9346277009" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Phone className="w-4 h-4 shrink-0" />
              <span>9346277009</span>
            </a>
            <div className="flex items-start gap-2 text-sm text-muted-foreground mt-1">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold text-foreground">Address:</p>
                <p>18-206, Near Hanumanpet Bus Stop,</p>
                <p>Malkajgiri, Telangana 500047</p>
              </div>
            </div>
            
            <div className="mt-2 rounded-lg overflow-hidden border border-border h-[130px] w-full">
              <iframe
                src="https://maps.google.com/maps?q=18-206,%20Near%20Hanumanpet%20Bus%20Stop,%20Malkajgiri,%20Telangana%20500047&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                title="Miracle Collections Location Map"
              ></iframe>
            </div>
            <a 
              href="https://share.google/mRgXdrLpcYVrEMNZT" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-accent hover:underline flex items-center gap-1 mt-1"
            >
              Open in Google Maps
            </a>
          </div>
        </div>

        <p className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground">
          © {new Date().getFullYear()} Miracle Collections. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
