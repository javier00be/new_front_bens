import { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
    productId:   number;
    nombre:      string;
    precio:      number;
    imagenUrl?:  string;
    tallaId?:    number | null;
    tallaNombre?: string;
    colorId?:    number | null;
    colorNombre?: string;
    cantidad:    number;
}

interface CartContextType {
    items:          CartItem[];
    addItem:        (item: CartItem) => void;
    removeItem:     (productId: number, tallaId?: number | null, colorId?: number | null) => void;
    updateQuantity: (productId: number, tallaId: number | null | undefined, colorId: number | null | undefined, delta: number) => void;
    clearCart:      () => void;
    total:          number;
    count:          number;
    isOpen:         boolean;
    setIsOpen:      (v: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

const KEY = "bens_cart";

const sameItem = (a: CartItem, productId: number, tallaId?: number | null, colorId?: number | null) =>
    a.productId === productId && a.tallaId === tallaId && a.colorId === colorId;

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [items,   setItems]   = useState<CartItem[]>(() => {
        try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
    });
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)); }, [items]);

    const addItem = (item: CartItem) => {
        setItems(prev => {
            const idx = prev.findIndex(i => sameItem(i, item.productId, item.tallaId, item.colorId));
            if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], cantidad: updated[idx].cantidad + item.cantidad };
                return updated;
            }
            return [...prev, item];
        });
        setIsOpen(true);
    };

    const removeItem = (productId: number, tallaId?: number | null, colorId?: number | null) =>
        setItems(prev => prev.filter(i => !sameItem(i, productId, tallaId, colorId)));

    const updateQuantity = (productId: number, tallaId: number | null | undefined, colorId: number | null | undefined, delta: number) =>
        setItems(prev => prev
            .map(i => sameItem(i, productId, tallaId, colorId) ? { ...i, cantidad: i.cantidad + delta } : i)
            .filter(i => i.cantidad > 0)
        );

    const clearCart = () => setItems([]);

    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const count = items.reduce((s, i) => s + i.cantidad, 0);

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, count, isOpen, setIsOpen }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within CartProvider");
    return ctx;
};
