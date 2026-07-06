import { useParams, Navigate } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { CATEGORIES, getProductsByCategory, type Category as CategorySlug } from "@/data/products";

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const meta = CATEGORIES.find(c => c.slug === slug);
  if (!meta) return <Navigate to="/shop" replace />;

  const items = getProductsByCategory(meta.slug as CategorySlug);

  return (
    <div className="min-h-screen bg-[hsl(var(--warm-bg))]">
      <div className="max-w-3xl mx-auto px-6 pt-20 pb-12 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Miracle Collections</p>
        <h1 className="text-4xl md:text-5xl font-light text-foreground mb-4">{meta.label}</h1>
        <p className="text-sm text-muted-foreground">{meta.tagline}</p>
      </div>
      <div className="max-w-7xl mx-auto px-6 pb-24">
        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {items.map(p => <ProductCard key={p.slug} product={p} />)}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-16">New pieces coming soon.</p>
        )}
      </div>
    </div>
  );
}