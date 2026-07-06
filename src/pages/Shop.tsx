import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { CATEGORIES } from "@/data/products";
import { SlidersHorizontal, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Database Products States
  const [productsList, setProductsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeCategory = searchParams.get("category") || "all";
  const activePriceRange = searchParams.get("priceRange") || "all";
  const activeSort = searchParams.get("sort") || "default";

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("Product")
          .select("*");
        
        if (error) throw error;
        setProductsList(data || []);
      } catch (error: any) {
        console.error("Error loading products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Helper to count items in category
  const getCategoryCount = (slug: string) => {
    return productsList.filter(p => p.category === slug).length;
  };

  // Helper to update search params
  const updateParam = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === "all" || value === "default") {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    setSearchParams(nextParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Apply filters
  let filteredProducts = [...productsList];

  if (activeCategory !== "all") {
    filteredProducts = filteredProducts.filter(p => p.category === activeCategory);
  }

  if (activePriceRange !== "all") {
    if (activePriceRange === "under-50") {
      filteredProducts = filteredProducts.filter(p => p.price < 50);
    } else if (activePriceRange === "50-100") {
      filteredProducts = filteredProducts.filter(p => p.price >= 50 && p.price <= 100);
    } else if (activePriceRange === "over-100") {
      filteredProducts = filteredProducts.filter(p => p.price > 100);
    }
  }

  // Apply sorting
  if (activeSort === "price-asc") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (activeSort === "price-desc") {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (activeSort === "alpha-asc") {
    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  }

  const hasActiveFilters = activeCategory !== "all" || activePriceRange !== "all" || activeSort !== "default";

  const FilterSidebarContent = () => (
    <div className="space-y-8">
      {/* Category filter */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-foreground font-semibold mb-4">Categories</h3>
        <ul className="space-y-3">
          <li>
            <button
              onClick={() => updateParam("category", "all")}
              className={`text-sm tracking-wide transition-colors flex items-center justify-between w-full text-left ${
                activeCategory === "all" ? "text-accent font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>All Pieces</span>
              <span className="text-xs text-muted-foreground/60">({productsList.length})</span>
            </button>
          </li>
          {CATEGORIES.map(cat => (
            <li key={cat.slug}>
              <button
                onClick={() => updateParam("category", cat.slug)}
                className={`text-sm tracking-wide transition-colors flex items-center justify-between w-full text-left ${
                  activeCategory === cat.slug ? "text-accent font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-xs text-muted-foreground/60">({getCategoryCount(cat.slug)})</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <hr className="border-border/60" />

      {/* Price range filter */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-foreground font-semibold mb-4">Price Range</h3>
        <ul className="space-y-3">
          {[
            { label: "All Prices", value: "all" },
            { label: "Under ₹50", value: "under-50" },
            { label: "₹50 - ₹100", value: "50-100" },
            { label: "Over ₹100", value: "over-100" },
          ].map(opt => (
            <li key={opt.value}>
              <button
                onClick={() => updateParam("priceRange", opt.value)}
                className={`text-sm tracking-wide transition-colors flex items-center w-full text-left ${
                  activePriceRange === opt.value ? "text-accent font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <hr className="border-border/60" />

      {/* Sort order filter */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-foreground font-semibold mb-4">Sort By</h3>
        <ul className="space-y-3">
          {[
            { label: "Featured", value: "default" },
            { label: "Price: Low to High", value: "price-asc" },
            { label: "Price: High to Low", value: "price-desc" },
            { label: "Alphabetical: A-Z", value: "alpha-asc" },
          ].map(opt => (
            <li key={opt.value}>
              <button
                onClick={() => updateParam("sort", opt.value)}
                className={`text-sm tracking-wide transition-colors flex items-center w-full text-left ${
                  activeSort === opt.value ? "text-accent font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {hasActiveFilters && (
        <div className="pt-4">
          <button
            onClick={clearAllFilters}
            className="w-full py-2.5 text-xs uppercase tracking-widest text-accent-foreground bg-accent hover:opacity-90 transition-opacity font-medium"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--warm-bg))]">
      <div className="py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-light text-foreground tracking-wide">Shop</h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-24">
        {/* Mobile controls bar */}
        <div className="md:hidden flex items-center justify-between border-b border-border/80 pb-4 mb-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center gap-2 text-sm text-foreground font-light hover:text-accent transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters / Sort</span>
          </button>
          <span className="text-xs text-muted-foreground">
            {filteredProducts.length} {filteredProducts.length === 1 ? "piece" : "pieces"}
          </span>
        </div>

        {/* Desktop Layout grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 items-start">
          {/* Desktop Left Sidebar */}
          <aside className="hidden md:block col-span-1 sticky top-28 self-start bg-white p-6 border border-border/60 shadow-sm rounded-sm">
            <FilterSidebarContent />
          </aside>

          {/* Product Grid Panel */}
          <main className="col-span-1 md:col-span-3">
            <div className="flex justify-between items-center mb-6 hidden md:flex">
              <p className="text-sm text-muted-foreground font-light">
                Showing {filteredProducts.length} {filteredProducts.length === 1 ? "piece" : "pieces"}
              </p>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
                <p className="text-sm text-muted-foreground font-light animate-pulse">Loading catalog...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {filteredProducts.map(product => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center">
                <p className="text-base text-muted-foreground font-light mb-4">
                  No pieces match your selected filters.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2.5 text-xs uppercase tracking-widest bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
                >
                  View All Pieces
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer container */}
          <div className="relative flex flex-col w-full max-w-xs bg-white h-full ml-auto shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between pb-6 border-b border-border/60 mb-6">
              <h2 className="text-base uppercase tracking-wider font-medium text-foreground">Filters</h2>
              <button onClick={() => setMobileOpen(false)} aria-label="Close filters">
                <X className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </div>

            <FilterSidebarContent />
          </div>
        </div>
      )}
    </div>
  );
}
