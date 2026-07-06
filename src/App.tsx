import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import About from "./pages/About";
import Contact from "./pages/Contact";

import Cart from "./pages/Cart";
import ProductDetail from "./pages/ProductDetail";
import CoreCollection from "./pages/CoreCollection";
import SetsAndPairs from "./pages/SetsAndPairs";
import Category from "./pages/Category";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AdminAddProduct from "./pages/AdminAddProduct";
import Account from "./pages/Account";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              
              <Route path="/cart" element={<Cart />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/collections/core" element={<CoreCollection />} />
              <Route path="/collections/sets-and-pairs" element={<SetsAndPairs />} />
              <Route path="/category/:slug" element={<Category />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/account" element={<Account />} />
              <Route path="/checkout" element={<Checkout />} />
            </Route>
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/products/new" element={<AdminAddProduct />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
