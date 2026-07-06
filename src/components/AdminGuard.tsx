import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * AdminGuard — wraps any admin-only child component.
 * Checks that the session token in sessionStorage is valid and not expired.
 * Redirects to /admin if the check fails.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("admin_session_token");
    const expiry = sessionStorage.getItem("admin_session_expiry");

    if (!token || !expiry) {
      navigate("/admin", { replace: true });
      return;
    }

    // Verify token is not expired (60 min)
    if (Date.now() > parseInt(expiry, 10)) {
      sessionStorage.removeItem("admin_session_token");
      sessionStorage.removeItem("admin_session_expiry");
      sessionStorage.removeItem("admin_authenticated");
      navigate("/admin", { replace: true });
      return;
    }

    // Verify token structure (must be our signed token)
    const expectedPrefix = "mc_admin_";
    if (!token.startsWith(expectedPrefix)) {
      sessionStorage.clear();
      navigate("/admin", { replace: true });
      return;
    }

    setAllowed(true);
  }, [navigate]);

  if (!allowed) return null;
  return <>{children}</>;
}
