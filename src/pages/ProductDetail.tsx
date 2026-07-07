import { useParams, Navigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import QuantitySelector from "@/components/QuantitySelector";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const { toast } = useToast();

  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  useEffect(() => {
    const fetchProductDetails = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("Product")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (error) throw error;
        
        setProduct(data);
        if (data) {
          setSelectedImage(data.image);
          
          // Pre-select first size if available
          const sizeList = data.sizes ? data.sizes.split(",").filter(Boolean) : [];
          if (sizeList.length > 0) {
            setSelectedSize(sizeList[0]);
          }

          // Fetch up to 3 related products in same category
          const { data: relatedData } = await supabase
            .from("Product")
            .select("*")
            .eq("category", data.category)
            .neq("slug", data.slug)
            .limit(3);

          setRelated(relatedData || []);
        }
      } catch (err) {
        console.error("Error loading product details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchProductDetails();
    }
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--warm-bg))] flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
        <p className="text-sm text-muted-foreground font-light animate-pulse">Loading piece details...</p>
      </div>
    );
  }

  if (!product) {
    return <Navigate to="/shop" replace />;
  }

  const isSoldOut = product.badge === "sold-out";
  const imageList = Array.from(new Set(
    (product.images ? product.images.split("|") : [product.image])
      .map((img: string) => img.trim())
      .filter(Boolean)
  ));
  const sizeList = product.sizes ? product.sizes.split(",").filter(Boolean) : [];

  const handleAddToCart = () => {
    if (isSoldOut) return;
    
    // Append size and variant information to item name in cart
    const displayName = selectedSize 
      ? `${product.name} (${selectedSize})`
      : product.name;

    addItem({ 
      slug: product.slug, 
      name: displayName, 
      price: product.price, 
      image: product.image 
    }, quantity);

    toast({
      title: "Added to cart",
      description: `${quantity}× ${displayName} added to your cart.`,
    });
    setQuantity(1);
  };

  return (
    <div className="bg-[hsl(var(--warm-bg))] min-h-screen">
      <section className="max-w-6xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="text-xs uppercase tracking-widest text-muted-foreground mb-10 flex items-center gap-2">
          <Link to="/shop" className="hover:text-foreground transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-muted-foreground/60">{product.category}</span>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Images Panel */}
          <div className="col-span-1 lg:col-span-7 space-y-4">
            <div className="w-full aspect-[4/5] bg-white border border-border/60 rounded-sm overflow-hidden shadow-sm">
              <img src={selectedImage} alt={product.name} className="w-full h-full object-cover" />
            </div>

            {/* Thumbnails Gallery */}
            {imageList.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {imageList.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`aspect-[4/5] border rounded-sm overflow-hidden transition-all bg-white ${
                      selectedImage === img ? "border-accent ring-1 ring-accent" : "border-border/60 hover:border-border-foreground"
                    }`}
                  >
                    <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Details Panel */}
          <div className="col-span-1 lg:col-span-5 flex flex-col space-y-6">
            <div>
              {product.badge && (
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest bg-accent text-accent-foreground px-2.5 py-1 mb-3 rounded-sm">
                  {product.badge}
                </span>
              )}
              <h1 className="text-2xl md:text-3xl font-light tracking-wide text-foreground uppercase">{product.name}</h1>
              {product.variant && (
                <p className="text-xs text-muted-foreground tracking-wide mt-1.5 uppercase font-medium">{product.variant}</p>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-light text-foreground">₹{product.price}</span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground/60 line-through">₹{product.originalPrice}</span>
              )}
            </div>

            {product.availability && (
              <p className="text-xs tracking-wider text-accent font-semibold uppercase">{product.availability}</p>
            )}

            <hr className="border-border/60" />

            <p className="text-sm leading-relaxed text-muted-foreground font-light">{product.description}</p>

            {/* Size Selector */}
            {sizeList.length > 0 && (
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  Select Size
                </label>
                <div className="flex gap-2">
                  {sizeList.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 h-10 min-w-[2.5rem] font-mono text-xs rounded-sm border flex items-center justify-center transition-all ${
                        selectedSize === size
                          ? "bg-primary text-primary-foreground border-primary font-bold"
                          : "border-border/80 text-foreground hover:border-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <hr className="border-border/60" />

            {!isSoldOut ? (
              <div className="flex items-stretch gap-4">
                <QuantitySelector quantity={quantity} onChange={setQuantity} />
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3 bg-primary text-primary-foreground text-xs uppercase tracking-widest hover:opacity-90 transition-opacity font-medium"
                >
                  Add To Cart
                </button>
              </div>
            ) : (
              <button
                disabled
                className="w-full py-3.5 bg-muted text-muted-foreground text-xs uppercase tracking-widest font-semibold cursor-not-allowed rounded-sm"
              >
                Sold Out
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Related Products Panel */}
      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-20 border-t border-border/40 mt-12">
          <h2 className="text-xl font-light tracking-wide text-foreground uppercase mb-10">You Might Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {related.map(p => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}