import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getAllOverrides,
  type UIOverride,
} from "@/lib/ui-overrides.functions";

type OverridesMap = Record<string, UIOverride>;

type OverridesContextValue = {
  overrides: OverridesMap;
  setLocalOverride: (id: string, next: UIOverride | null) => void;
  refresh: () => Promise<void>;
  reapplyAll: () => void;
  registerElement: (
    id: string,
    section: string | null,
    label: string | null,
  ) => () => void;
  elements: RegisteredElement[];
};

export type RegisteredElement = {
  id: string;
  section: string | null;
  label: string | null;
};

const OverridesContext = createContext<OverridesContextValue | null>(null);

/**
 * Applies overrides globally to any DOM node bearing data-editor-id.
 * Runs on the client only. Uses a MutationObserver so newly-mounted
 * elements pick up their saved styles automatically.
 */
export function OverridesProvider({ children }: { children: ReactNode }) {
  const fetchAll = useServerFn(getAllOverrides);
  const [overrides, setOverrides] = useState<OverridesMap>({});
  const overridesRef = useRef<OverridesMap>({});
  const registryRef = useRef<Map<string, RegisteredElement>>(new Map());
  const [elements, setElements] = useState<RegisteredElement[]>([]);

  overridesRef.current = overrides;

  const refresh = useCallback(async () => {
    try {
      const list = await fetchAll();
      const map: OverridesMap = {};
      for (const o of list) map[o.editor_id] = o;
      setOverrides(map);
    } catch (e) {
      console.warn("[ui-overrides] failed to load", e);
    }
  }, [fetchAll]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const applyToNode = useCallback((node: HTMLElement, id: string) => {
    const o = overridesRef.current[id];
    // Reset previously-applied inline styles we set (tracked via data attr)
    const applied = node.getAttribute("data-editor-applied");
    if (applied) {
      for (const key of applied.split(",")) {
        if (key) node.style.removeProperty(key);
      }
      node.removeAttribute("data-editor-applied");
    }
    if (!o) return;
    const keys: string[] = [];
    for (const [k, v] of Object.entries(o.styles || {})) {
      if (typeof v === "string" && v.length) {
        node.style.setProperty(k, v);
        keys.push(k);
      }
    }
    if (keys.length) node.setAttribute("data-editor-applied", keys.join(","));
    if (o.text_content != null && o.text_content !== "") {
      if (node.getAttribute("data-editor-original-text") == null) {
        node.setAttribute(
          "data-editor-original-text",
          node.textContent ?? "",
        );
      }
      node.textContent = o.text_content;
    } else {
      const orig = node.getAttribute("data-editor-original-text");
      if (orig != null) {
        node.textContent = orig;
        node.removeAttribute("data-editor-original-text");
      }
    }
  }, []);

  // Re-apply everything whenever overrides change
  useEffect(() => {
    if (typeof document === "undefined") return;
    const nodes = document.querySelectorAll<HTMLElement>("[data-editor-id]");
    nodes.forEach((n) => {
      const id = n.getAttribute("data-editor-id");
      if (id) applyToNode(n, id);
    });
  }, [overrides, applyToNode]);

  // Observe DOM to catch newly-mounted editable nodes
  useEffect(() => {
    if (typeof document === "undefined") return;
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          if (n.hasAttribute("data-editor-id")) {
            const id = n.getAttribute("data-editor-id");
            if (id) applyToNode(n, id);
          }
          n.querySelectorAll<HTMLElement>("[data-editor-id]").forEach((el) => {
            const id = el.getAttribute("data-editor-id");
            if (id) applyToNode(el, id);
          });
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [applyToNode]);

  const setLocalOverride = useCallback(
    (id: string, next: UIOverride | null) => {
      setOverrides((prev) => {
        const copy = { ...prev };
        if (next == null) delete copy[id];
        else copy[id] = next;
        return copy;
      });
    },
    [],
  );

  const reapplyAll = useCallback(() => {
    if (typeof document === "undefined") return;
    const nodes = document.querySelectorAll<HTMLElement>("[data-editor-id]");
    nodes.forEach((n) => {
      const id = n.getAttribute("data-editor-id");
      if (id) applyToNode(n, id);
    });
  }, [applyToNode]);

  const registerElement = useCallback(
    (id: string, section: string | null, label: string | null) => {
      registryRef.current.set(id, { id, section, label });
      setElements(Array.from(registryRef.current.values()));
      return () => {
        registryRef.current.delete(id);
        setElements(Array.from(registryRef.current.values()));
      };
    },
    [],
  );

  const value = useMemo(
    () => ({
      overrides,
      setLocalOverride,
      refresh,
      reapplyAll,
      registerElement,
      elements,
    }),
    [overrides, setLocalOverride, refresh, reapplyAll, registerElement, elements],
  );

  return (
    <OverridesContext.Provider value={value}>
      {children}
    </OverridesContext.Provider>
  );
}

export function useOverrides() {
  const ctx = useContext(OverridesContext);
  if (!ctx) throw new Error("useOverrides must be inside OverridesProvider");
  return ctx;
}
