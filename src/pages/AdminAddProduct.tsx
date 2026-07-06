import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminAddProduct() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authentication check: Redirect to admin if not authenticated
  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin_authenticated");
    if (authStatus !== "true") {
      toast({
        title: "Access Denied",
        description: "Please sign in to access the admin portal.",
        variant: "destructive"
      });
      navigate("/admin");
    }
  }, [navigate, toast]);

  // Form States
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [category, setCategory] = useState("men");
  const [stock, setStock] = useState("");
  const [variant, setVariant] = useState("");
  const [description, setDescription] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]); // base64 strings
  const [isSaving, setIsSaving] = useState(false);

  const sizeOptions = ["S", "M", "L", "XL", "XXL"];

  const handleSizeToggle = (size: string) => {
    setSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);

    if (uploadedImages.length + fileArray.length > 4) {
      toast({
        title: "Limit exceeded",
        description: "You can upload up to 4 images only (different angles).",
        variant: "destructive"
      });
      return;
    }

    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setUploadedImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedImages.length === 0) {
      toast({
        title: "Missing images",
        description: "Please upload at least 1 image for the product.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // Create slug
      const cleanSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") + "-" + Math.floor(1000 + Math.random() * 9000);

      const mainImage = uploadedImages[0];
      const allImagesString = uploadedImages.join("|");
      const sizesString = sizes.join(",");

      const { error } = await supabase
        .from("Product")
        .insert({
          id: crypto.randomUUID(),
          slug: cleanSlug,
          name: name,
          price: parseFloat(price),
          originalPrice: originalPrice ? parseFloat(originalPrice) : null,
          image: mainImage,
          description: description,
          availability: stock || "In Stock",
          category: category,
          sizes: sizesString,
          variant: variant,
          images: allImagesString,
          badge: originalPrice ? "sale" : null
        });

      if (error) throw error;

      toast({
        title: "Product Saved Successfully",
        description: `${name} has been added to your store.`,
      });

      // Redirect back to admin dashboard tab products
      navigate("/admin?tab=products");
    } catch (error: any) {
      toast({
        title: "Error saving product",
        description: error.message || "Failed to save the new product.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--warm-bg))] px-6 md:px-12 py-12">
      <div className="max-w-5xl mx-auto bg-white border border-border/80 p-8 md:p-10 shadow-sm rounded-sm">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-8">
          <Link to="/admin?tab=overview" className="hover:text-foreground transition-colors">Admin</Link>
          <span>/</span>
          <Link to="/admin?tab=products" className="hover:text-foreground transition-colors">Products</Link>
          <span>/</span>
          <span className="text-foreground font-medium">New Product</span>
        </nav>

        <h1 className="text-3xl font-light text-foreground tracking-wide border-b border-border/60 pb-5 mb-8">
          Add New Product
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Column: Form Inputs */}
          <div className="space-y-6">
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                Name of Item
              </label>
              <input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full py-2 border-b border-muted-foreground/35 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                placeholder="e.g. Designer Saree"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label htmlFor="price" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  Cost (Price in ₹)
                </label>
                <input
                  id="price"
                  required
                  type="number"
                  min="0"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full py-2 border-b border-muted-foreground/35 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                  placeholder="e.g. 2999"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="originalPrice" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  Offer (Original Price)
                </label>
                <input
                  id="originalPrice"
                  type="number"
                  min="0"
                  step="any"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full py-2 border-b border-muted-foreground/35 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                  placeholder="e.g. 3999"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label htmlFor="category" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full py-2 border-b border-muted-foreground/35 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                >
                  <option value="men">Men's Wear</option>
                  <option value="women">Women's Wear</option>
                  <option value="kids">Kids' Wear</option>
                  <option value="footwear">Sandals & Shoes</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="stock" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  Stock Available
                </label>
                <input
                  id="stock"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full py-2 border-b border-muted-foreground/35 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                  placeholder="e.g. In Stock, Only 3 left"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="variant" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                Look and Variant
              </label>
              <input
                id="variant"
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                className="w-full py-2 border-b border-muted-foreground/35 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                placeholder="e.g. Navy Blue / Hand-embroidered look"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold block">
                Select Available Sizes
              </label>
              <div className="flex gap-4 pt-1">
                {sizeOptions.map(size => (
                  <label key={size} className="flex items-center gap-1.5 cursor-pointer text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={sizes.includes(size)}
                      onChange={() => handleSizeToggle(size)}
                      className="w-4 h-4 rounded-sm border-border text-accent focus:ring-accent"
                    />
                    <span className="font-mono text-xs">{size}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="description" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                Description
              </label>
              <textarea
                id="description"
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full py-2 border-b border-muted-foreground/35 bg-transparent text-sm focus:outline-none focus:border-accent transition-colors text-foreground resize-none"
                placeholder="Write detailed product descriptions here..."
              />
            </div>
          </div>

          {/* Right Column: Drag & Drop Multi-Image Upload */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-3 flex-1 flex flex-col">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                Upload Product Images (Up to 4 angles)
              </label>

              {/* Drag and Drop Container */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border/80 hover:border-accent/80 transition-colors p-10 rounded-sm text-center flex flex-col items-center justify-center gap-2 cursor-pointer bg-muted/10 h-48"
              >
                <Upload className="w-10 h-10 text-muted-foreground/80" />
                <p className="text-xs text-foreground">Drag & drop files here, or click to browse</p>
                <p className="text-[10px] text-muted-foreground">PNG, JPG formats (Max 4 photos)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* Uploaded Previews */}
              <div className="grid grid-cols-4 gap-3 mt-4 flex-1">
                {uploadedImages.map((img, index) => (
                  <div key={index} className="relative aspect-square border border-border rounded-sm overflow-hidden bg-muted/20">
                    <img src={img} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                      aria-label="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-accent text-accent-foreground text-[8px] uppercase tracking-widest py-0.5 text-center font-bold">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 4 - uploadedImages.length) }).map((_, i) => (
                  <div key={i} className="border border-border/40 border-dashed rounded-sm aspect-square flex items-center justify-center text-muted-foreground/30 text-xs">
                    {uploadedImages.length + i + 1}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-border/60">
              <Link
                to="/admin?tab=products"
                className="flex-1 py-3.5 border border-border text-foreground text-xs uppercase tracking-widest hover:bg-muted/40 transition-colors font-medium text-center"
              >
                Back to Catalog
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-3.5 bg-accent text-accent-foreground text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 font-medium flex items-center justify-center gap-2 text-center"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Product"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
