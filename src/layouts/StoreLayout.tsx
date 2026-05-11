import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, X, Minus, Plus, Trash2, User, LogOut, Menu, Search } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
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

// ─── Navbar ───────────────────────────────────────────────────────────────────

const Navbar = () => {
    const { count, setIsOpen } = useCart();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled,  setScrolled]  = useState(false);
    const [menuOpen,  setMenuOpen]  = useState(false);
    const [searching, setSearching] = useState(false);
    const [query,     setQuery]     = useState("");

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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/catalog?q=${encodeURIComponent(query.trim())}`);
            setSearching(false);
            setQuery("");
        }
    };

    return (
        <header className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${navBg}`}>
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
                {/* Logo */}
                <Link to="/" className="shrink-0">
                    <img src={logo} alt="Bens" className="h-10 w-auto object-contain" />
                </Link>

                {/* Links — desktop */}
                <nav className="hidden md:flex items-center gap-8">
                    {links.map(l => (
                        <Link key={l.to} to={l.to} className="text-xs font-semibold uppercase tracking-widest transition-colors text-slate-500 hover:text-slate-800">
                            {l.label}
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Search toggle */}
                    {searching ? (
                        <form onSubmit={handleSearch} className="flex items-center gap-2">
                            <input
                                autoFocus
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Buscar productos..."
                                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 w-44"
                            />
                            <button type="button" onClick={() => setSearching(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-4 h-4" />
                            </button>
                        </form>
                    ) : (
                        <button onClick={() => setSearching(true)} className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-100 text-slate-600">
                            <Search className="w-4 h-4" />
                        </button>
                    )}

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
                        <div className="flex items-center gap-1">
                            <span className="hidden sm:block text-xs font-medium text-slate-800">{user.correo.split("@")[0]}</span>
                            <button
                                onClick={logout}
                                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-100 text-slate-600"
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

            {/* Mobile menu */}
            {menuOpen && (
                <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-2">
                    {links.map(l => (
                        <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
                            {l.label}
                        </Link>
                    ))}
                    {!user && (
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
