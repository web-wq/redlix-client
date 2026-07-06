import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Mode = "signin" | "signup";

export default function Auth() {
  const [params, setParams] = useSearchParams();
  const initialMode: Mode = params.get("mode") === "signup" ? "signup" : "signin";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const redirect = params.get("redirect") || "/";

  // If already signed in, bounce.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate(redirect, { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate(redirect, { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, redirect]);

  useEffect(() => {
    setMode(params.get("mode") === "signup" ? "signup" : "signin");
  }, [params]);

  const switchMode = (m: Mode) => {
    setParams(m === "signup" ? { mode: "signup" } : {});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth?redirect=${encodeURIComponent(redirect)}` },
        });
        if (error) throw error;
        toast({ title: "Account created", description: "Check your email to confirm your address." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back", description: "You're now signed in." });
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      toast({ title: "Something went wrong", description: err.message ?? String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-0 py-2 border-0 border-b border-border bg-transparent text-foreground text-sm focus:outline-none focus:border-foreground transition-colors";

  return (
    <div className="min-h-[70vh] max-w-md mx-auto px-6 py-24">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 text-center">Miracle Collections</p>
      <h1 className="text-3xl md:text-4xl font-light text-foreground text-center mb-2">
        {mode === "signup" ? "Create your account" : "Welcome back"}
      </h1>
      <p className="text-sm text-muted-foreground text-center mb-10">
        {mode === "signup"
          ? "Sign up to save your favourites and check out faster."
          : "Sign in to your account to continue."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm text-foreground mb-1">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm text-foreground mb-1">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="text-sm text-muted-foreground text-center mt-8">
        {mode === "signup" ? "Already have an account?" : "New to Miracle Collections?"}{" "}
        <button
          type="button"
          onClick={() => switchMode(mode === "signup" ? "signin" : "signup")}
          className="text-foreground underline underline-offset-4 hover:no-underline"
        >
          {mode === "signup" ? "Sign in" : "Create an account"}
        </button>
      </p>

      <p className="text-xs text-muted-foreground text-center mt-6">
        <Link to="/" className="hover:text-foreground transition-colors">← Back to home</Link>
      </p>
    </div>
  );
}