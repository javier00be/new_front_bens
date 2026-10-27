import { useState, useEffect, useRef, useMemo } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Heart, X, Minus, Plus, Trash2, User, LogOut, Menu, Search, ArrowRight, Tag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";
import { getAllProducts } from "@/features/erp/products/services/products.service";
import type { Product } from "@/features/erp/products/types/Products.type";
import logo from "../assets/images/logos/logoHori.png";

// ─── Cart Drawer ───────────────────────────────────────────────────────────────

const CartDrawer = () => {
    const { items, removeItem, updateQuantity, total, count, isOpen, setIsOpen } = useCart();
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleCheckout = () => {
        setIsOpen(false);
        if (user) navigate("/checkout");
        else navigate("/login?redirect=/checkout");
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <div>
                        <h2 className="font-bold text-slate-900 text-lg">Tu carrito</h2>
                        <p className="text-xs text-slate-500">{count} {count === 1 ? "producto" : "productos"}</p>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                        <X className="w-4 h-4 text-slate-600" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                                <ShoppingCart className="w-7 h-7 text-slate-300" />
                            </div>
                            <p className="font-semibold text-slate-500 text-sm">Tu carrito está vacío</p>
                            <p className="text-xs text-slate-400 mt-1">Agrega productos para continuar.</p>
                            <button
                                onClick={() => { setIsOpen(false); navigate("/catalog"); }}
                                className="mt-4 text-sm font-semibold text-indigo-600 hover:underline"
                            >
                                Ver catálogo
                            </button>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={`${item.productId}-${item.tallaId}-${item.colorId}`} className="flex gap-3">
                                {/* Imagen */}
                                <div className="w-16 h-16 rounded-xl bg-slate-100 shrink-0 overflow-hidden">
                                    {item.imagenUrl ? (
                                        <img src={item.imagenUrl} alt={item.nombre} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">👕</div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{item.nombre}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        {item.tallaNombre && <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{item.tallaNombre}</span>}
                                        {item.colorNombre && <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{item.colorNombre}</span>}
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => updateQuantity(item.productId, item.tallaId, item.colorId, -1)} className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-6 text-center text-sm font-semibold">{item.cantidad}</span>
                                            <button onClick={() => updateQuantity(item.productId, item.tallaId, item.colorId, 1)} className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-900">S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                                            <button onClick={() => removeItem(item.productId, item.tallaId, item.colorId)} className="w-6 h-6 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="px-6 py-5 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-600 text-sm">Subtotal</span>
                            <span className="font-bold text-lg text-slate-900">S/ {total.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-slate-400">Envío y descuentos se calculan al finalizar.</p>
                        <button
                            onClick={handleCheckout}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                        >
                            Finalizar compra
                        </button>
                        <button
                            onClick={() => { setIsOpen(false); navigate("/catalog"); }}
                            className="w-full text-sm text-slate-500 hover:text-slate-700 font-medium text-center transition-colors"
                        >
                            Seguir comprando
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000/api";

const resolveImage = (src?: string) => {
    if (!src) return undefined;
    if (src.startsWith("http")) return src;
    return `${API_BASE.replace("/api", "")}/${src.replace(/^\//, "")}`;
};

const getPrecioFinal = (p: Product): number => {
    const precio = Number(p.precio);
    const descuento = Number(p.valorDescuento);
    if (p.tipoDescuento === "PORCENTAJE") return precio * (1 - descuento / 100);
    if (p.tipoDescuento === "VALOR_FIJO") return Math.max(0, precio - descuento);
    return precio;
};

// ─── GlobalSearchBar ──────────────────────────────────────────────────────────

const GlobalSearchBar = ({ mobile = false, onCloseMobile }: { mobile?: boolean; onCloseMobile?: () => void }) => {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        getAllProducts()
            .then((prods) => setProducts(prods.filter((p) => p.estado === "ACTIVO")))
            .catch(() => {});
    }, []);

    // Cerrar al hacer clic afuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const trimmed = query.trim().toLowerCase();

    const { matchingProducts, matchingCategories, totalMatches } = useMemo(() => {
        if (!trimmed) return { matchingProducts: [], matchingCategories: [], totalMatches: 0 };

        const matched = products.filter(
            (p) =>
                p.nombre.toLowerCase().includes(trimmed) ||
                p.descripcion?.toLowerCase().includes(trimmed) ||
                p.categoria?.nombre.toLowerCase().includes(trimmed)
        );

        // Categorías únicas que coinciden
        const catsMap = new Map<number, string>();
        products.forEach((p) => {
            if (p.categoria && p.categoria.nombre.toLowerCase().includes(trimmed)) {
                catsMap.set(p.categoria.id, p.categoria.nombre);
            }
        });

        return {
            matchingProducts: matched.slice(0, 5),
            matchingCategories: Array.from(catsMap.entries()).slice(0, 3),
            totalMatches: matched.length,
        };
    }, [products, trimmed]);

    const handleSelectProduct = (id: number) => {
        setIsOpen(false);
        setQuery("");
        if (onCloseMobile) onCloseMobile();
        navigate(`/product/${id}`);
    };

    const handleSelectCategory = (catId: number) => {
        setIsOpen(false);
        setQuery("");
        if (onCloseMobile) onCloseMobile();
        navigate(`/catalog?categoria=${catId}`);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setIsOpen(false);
            if (onCloseMobile) onCloseMobile();
            navigate(`/catalog?q=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <div ref={containerRef} className={`relative ${mobile ? "w-full" : "w-full max-w-xs lg:max-w-sm"}`}>
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (query.trim()) setIsOpen(true);
                    }}
                    placeholder="Buscar prendas, categorías..."
                    className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100/90 hover:bg-slate-100 focus:bg-white rounded-full border border-slate-200 focus:border-slate-400 focus:outline-none transition-all text-slate-800 placeholder:text-slate-400 shadow-2xs"
                />
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                {query && (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery("");
                            setIsOpen(false);
                        }}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                        <X size={12} />
                    </button>
                )}
            </form>

            {/* Dropdown con sugerencias en vivo */}
            {isOpen && trimmed.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                    {/* Categorías sugeridas si hay coincidencia */}
                    {matchingCategories.length > 0 && (
                        <div className="p-3 bg-slate-50/80 border-b border-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                                Categorías sugeridas
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {matchingCategories.map(([catId, catName]) => (
                                    <button
                                        key={catId}
                                        type="button"
                                        onClick={() => handleSelectCategory(catId)}
                                        className="text-[11px] font-medium bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                                    >
                                        <Tag size={11} className="text-slate-400" />
                                        {catName}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Lista de productos */}
                    <div className="py-2">
                        {totalMatches === 0 ? (
                            <div className="p-5 text-center">
                                <p className="text-xs text-slate-500 mb-2">
                                    No encontramos prendas para <span className="font-bold text-slate-800">"{query}"</span>
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsOpen(false);
                                        navigate("/catalog");
                                    }}
                                    className="text-xs font-semibold text-slate-900 underline hover:text-slate-700"
                                >
                                    Explorar todo el catálogo
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="px-3 pb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Prendas encontradas ({totalMatches})
                                    </span>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {matchingProducts.map((p) => {
                                        const finalPrice = getPrecioFinal(p);
                                        const hasDiscount =
                                            p.tipoDescuento !== "SIN_DESCUENTO" && Number(p.valorDescuento) > 0;
                                        const img = resolveImage(p.imagenes?.[0]);

                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => handleSelectProduct(p.id)}
                                                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50/80 flex items-center gap-3 transition-colors group"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0 overflow-hidden flex items-center justify-center border border-slate-100">
                                                    {img ? (
                                                        <img
                                                            src={img}
                                                            alt={p.nombre}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                        />
                                                    ) : (
                                                        <span className="text-base select-none">👕</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-slate-800 group-hover:text-slate-950 truncate">
                                                        {p.nombre}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {p.categoria && (
                                                            <span className="text-[10px] text-slate-400 uppercase font-medium">
                                                                {p.categoria.nombre}
                                                            </span>
                                                        )}
                                                        <span className="text-[11px] font-bold text-slate-900">
                                                            S/ {finalPrice.toFixed(2)}
                                                        </span>
                                                        {hasDiscount && (
                                                            <span className="text-[10px] text-slate-400 line-through">
                                                                S/ {Number(p.precio).toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Botón ver todos los resultados */}
                                <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-900 hover:bg-slate-100 transition-colors"
                                    >
                                        <span>Ver todos los resultados ({totalMatches})</span>
                                        <ArrowRight size={13} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────

const Navbar = () => {
    const { count, setIsOpen } = useCart();
    const { count: favCount } = useFavorites();
    const { user, logout } = useAuth();
    const location = useLocation();
    const [scrolled,  setScrolled]  = useState(false);
    const [menuOpen,  setMenuOpen]  = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const isHome = location.pathname === "/";
    // Hero is light beige (#f5f0eb) — always use dark text/logo; only go transparent bg on homepage before scroll
    const navBg = scrolled || !isHome ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100" : "bg-white/80 backdrop-blur-sm";

    const links = [
        { label: "Inicio",      to: "/"        },
        { label: "Catálogo",    to: "/catalog"  },
        { label: "Nosotros",    to: "/#about"   },
    ];

    return (
        <header className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${navBg}`}>
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
                {/* Logo */}
                <Link to="/" className="shrink-0">
                    <img src={logo} alt="Bens" className="h-10 w-auto object-contain" />
                </Link>

                {/* Links — desktop */}
                <nav className="hidden md:flex items-center gap-6">
                    {links.map(l => (
                        <Link key={l.to} to={l.to} className="text-xs font-semibold uppercase tracking-widest transition-colors text-slate-500 hover:text-slate-800">
                            {l.label}
                        </Link>
                    ))}
                </nav>

                {/* Global Search Bar — desktop */}
                <div className="hidden md:block flex-1 max-w-sm mx-2">
                    <GlobalSearchBar />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Mobile search toggle */}
                    <button
                        onClick={() => setMobileSearchOpen(v => !v)}
                        className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-100 text-slate-600"
                        title="Buscar prendas"
                    >
                        <Search className="w-4 h-4" />
                    </button>

                    {/* Favorites */}
                    <Link
                        to="/favorites"
                        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-rose-50 text-slate-600 hover:text-rose-500"
                        title="Mis Favoritos"
                    >
                        <Heart className={`w-4 h-4 transition-transform hover:scale-110 ${favCount > 0 ? "fill-rose-500 text-rose-500" : ""}`} />
                        {favCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                                {favCount > 9 ? "9+" : favCount}
                            </span>
                        )}
                    </Link>

                    {/* Cart */}
                    <button
                        onClick={() => setIsOpen(true)}
                        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-100 text-slate-600"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        {count > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-slate-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {count > 9 ? "9+" : count}
                            </span>
                        )}
                    </button>

                    {/* Auth */}
                    {user ? (
                        <div className="flex items-center gap-1.5">
                            <Link
                                to="/profile"
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50 transition-all text-xs font-semibold text-slate-800"
                                title="Mi Perfil y Direcciones"
                            >
                                <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold uppercase">
                                    {user.correo[0]}
                                </div>
                                <span className="hidden sm:inline max-w-[100px] truncate">
                                    {user.correo.split("@")[0]}
                                </span>
                            </Link>
                            <button
                                onClick={logout}
                                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-rose-50 text-slate-500 hover:text-rose-600"
                                title="Cerrar sesión"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                            <User className="w-3.5 h-3.5" /> Ingresar
                        </Link>
                    )}

                    {/* Mobile menu */}
                    <button
                        onClick={() => setMenuOpen(v => !v)}
                        className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-100 text-slate-600"
                    >
                        <Menu className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Mobile search bar dropdown */}
            {mobileSearchOpen && (
                <div className="md:hidden bg-white border-t border-slate-100 px-6 py-3 shadow-md animate-in slide-in-from-top-2 duration-150">
                    <GlobalSearchBar mobile onCloseMobile={() => setMobileSearchOpen(false)} />
                </div>
            )}

            {/* Mobile menu */}
            {menuOpen && (
                <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-2">
                    {links.map(l => (
                        <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
                            {l.label}
                        </Link>
                    ))}
                    <Link to="/favorites" onClick={() => setMenuOpen(false)} className="flex items-center justify-between py-2 text-sm font-semibold text-slate-700 hover:text-rose-600">
                        <span className="flex items-center gap-2">
                            <Heart className={`w-4 h-4 ${favCount > 0 ? "fill-rose-500 text-rose-500" : ""}`} />
                            Mis Favoritos
                        </span>
                        {favCount > 0 && (
                            <span className="text-xs bg-rose-100 text-rose-600 font-bold px-2 py-0.5 rounded-full">
                                {favCount}
                            </span>
                        )}
                    </Link>
                    {user ? (
                        <Link to="/profile" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-semibold text-slate-900">
                            Mi Perfil & Direcciones
                        </Link>
                    ) : (
                        <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-semibold text-indigo-600">
                            Iniciar sesión
                        </Link>
                    )}
                </div>
            )}
        </header>
    );
};

// ─── Footer ───────────────────────────────────────────────────────────────────

const Footer = () => (
    <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                <div className="md:col-span-2">
                    <img src={logo} alt="Bens" className="h-8 w-auto brightness-0 invert mb-4" />
                    <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                        Moda textil de calidad con propósito. Diseñada para quienes buscan expresar lo que llevan dentro.
                    </p>
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Tienda</p>
                    <div className="space-y-2">
                        {["Catálogo", "Novedades", "Ofertas"].map(l => (
                            <Link key={l} to="/catalog" className="block text-sm text-slate-400 hover:text-white transition-colors">{l}</Link>
                        ))}
                    </div>
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Ayuda</p>
                    <div className="space-y-2">
                        {["Mis pedidos", "Devoluciones", "Contacto"].map(l => (
                            <span key={l} className="block text-sm text-slate-400">{l}</span>
                        ))}
                    </div>
                </div>
            </div>
            <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} Bens. Todos los derechos reservados.</p>
                <p className="text-xs text-slate-600">Hecho en Perú 🇵🇪</p>
            </div>
        </div>
    </footer>
);

// ─── Layout ───────────────────────────────────────────────────────────────────

export const StoreLayout = () => (
    <div className="min-h-screen flex flex-col">
        <Navbar />
        <CartDrawer />
        <main className="flex-1">
            <Outlet />
        </main>
        <Footer />
    </div>
);
