import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string | null;
};

type Ctx = {
  items: CartItem[];
  add: (i: CartItem) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "haytam-shop-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const add = useCallback((i: CartItem) => {
    setItems((prev) => {
      const ex = prev.find((p) => p.id === i.id);
      if (ex) return prev.map((p) => (p.id === i.id ? { ...p, qty: p.qty + i.qty } : p));
      return [...prev, i];
    });
  }, []);

  const remove = useCallback((id: string) => setItems((p) => p.filter((x) => x.id !== id)), []);
  const setQty = useCallback(
    (id: string, qty: number) =>
      setItems((p) => p.map((x) => (x.id === id ? { ...x, qty: Math.max(1, qty) } : x))),
    []
  );
  const clear = useCallback(() => setItems([]), []);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartCtx.Provider value={{ items, add, remove, setQty, clear, total, count }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}
