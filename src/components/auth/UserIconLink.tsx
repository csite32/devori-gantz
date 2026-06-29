import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import userAsset from "@/assets/icons/user-3.svg.asset.json";

/**
 * Header user icon.
 * Visual must stay identical to the original static <button> in HeroSection:
 *   <button aria-label="..." className="transition-opacity hover:opacity-70">
 *     <img src={userAsset.url} alt="" className="w-8 h-8 md:w-[51px] md:h-[51px]" />
 *   </button>
 *
 * Functional behavior only:
 *   - signed-out users  -> /auth
 *   - signed-in users   -> /dashboard
 */
export function UserIconLink() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <Link
      to={signedIn ? "/dashboard" : "/auth"}
      aria-label={signedIn ? "האזור האישי" : "כניסה לחשבון"}
      className="transition-opacity hover:opacity-70"
    >
      <img src={userAsset.url} alt="" className="w-8 h-8 md:w-[51px] md:h-[51px]" />
    </Link>
  );
}
