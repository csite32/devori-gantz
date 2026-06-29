/**
 * Tiny "remember me" helper.
 *
 * Supabase JS is configured with persistSession: true, so by default the
 * session survives tab close (in localStorage). When the user UNCHECKS
 * "remember me" we mark the tab as session-only: a `beforeunload` listener
 * signs them out so a fresh tab opens at /auth.
 *
 * We never store or read the password itself.
 */
import { supabase } from "@/integrations/supabase/client";

const FLAG_KEY = "lovable.session.ephemeral";

let installed = false;

export function applyRememberMe(remember: boolean) {
  if (typeof window === "undefined") return;
  if (remember) {
    sessionStorage.removeItem(FLAG_KEY);
    return;
  }
  sessionStorage.setItem(FLAG_KEY, "1");
  if (installed) return;
  installed = true;
  window.addEventListener("beforeunload", () => {
    if (sessionStorage.getItem(FLAG_KEY) === "1") {
      // Best-effort: clears the persisted token from localStorage.
      void supabase.auth.signOut();
    }
  });
}
