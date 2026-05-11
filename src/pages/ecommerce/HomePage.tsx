import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, Star, Zap, Shield, Truck, RefreshCw, ChevronRight, ArrowRight } from "lucide-react";
import { getAllProducts } from "@/features/erp/products/services/products.service";
import { getCategories }  from "@/features/erp/products/services/categories.service";
import type { Product }   from "@/features/erp/products/types/Products.type";
import { useCart }        from "@/contexts/CartContext";
import modelGalata    from "../../assets/images/clothes/model_galata.png";
import frontGalaBeige from "../../assets/images/gala/front_gala_beige.png";
import galaAzul       from "../../assets/images/gala/gala_azul.png";
import galaBlanco     from "../../assets/images/gala/gala_blanco.png";
import promoBanner    from "../../assets/images/banners/banner.png";

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
    if (p.tipoDescuento === "PORCENTAJE")  return precio * (1 - descuento / 100);
    if (p.tipoDescuento === "VALOR_FIJO")  return Math.max(0, precio - descuento);
    return precio;
};

const CATEGORY_COLORS = [
    "from-violet-500 to-purple-600",
    "from-rose-400 to-pink-600",
    "from-amber-400 to-orange-500",
    "from-emerald-400 to-teal-600",
    "from-sky-400 to-blue-600",
    "from-fuchsia-400 to-pink-500",
];

const CATEGORY_EMOJIS: Record<string, string> = {
    CAMISAS: "👔", PANTALONES: "👖", VESTIDOS: "👗", POLOS: "👕",
    CHAQUETAS: "🧥", ACCESORIOS: "💍", default: "🛍️",
};

const perks = [
    { icon: Truck,     title: "Envío gratis",      desc: "En pedidos +S/150",    color: "text-emerald-500" },
    { icon: Shield,    title: "Compra segura",      desc: "Pagos 100% protegidos", color: "text-sky-500"    },
    { icon: RefreshCw, title: "30 días de cambios", desc: "Sin preguntas",         color: "text-violet-500" },
    { icon: Zap,       title: "Soporte 24/7",       desc: "Siempre disponibles",   color: "text-amber-500"  },
];

// ─── Star Rating ──────────────────────────────────────────────────────────────

const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} size={11} className={s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"} />
        ))}
    </div>
);

// ─── Product Card ─────────────────────────────────────────────────────────────

const ProductCard = ({ product }: { product: Product }) => {
    const [wished,  setWished]  = useState(false);
    const { addItem } = useCart();
    const navigate    = useNavigate();

    const precioFinal    = getPrecioFinal(product);
    const tieneDescuento = product.tipoDescuento !== "SIN_DESCUENTO" && product.valorDescuento > 0;
    const pctDescuento   = tieneDescuento && product.tipoDescuento === "PORCENTAJE" ? product.valorDescuento : null;
    const imagen         = resolveImage(product.imagenes?.[0]);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        addItem({
            productId:  product.id,
            nombre:     product.nombre,
            precio:     precioFinal,
            imagenUrl:  imagen,
            tallaId:    product.tallas?.[0]?.id ?? null,
            tallaNombre: product.tallas?.[0]?.nombre,
            colorId:    product.colores?.[0]?.id ?? null,
            colorNombre: product.colores?.[0]?.nombre,
            cantidad:   1,
        });
    };

    return (
        <Link to={`/product/${product.id}`} className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 hover:-translate-y-1 block">
            {/* Badges */}
            {tieneDescuento && (
                <span className="absolute top-3 left-3 z-10 text-[10px] font-bold px-2 py-1 rounded-full bg-rose-500 text-white">
                    {pctDescuento ? `-${pctDescuento}%` : "Oferta"}
                </span>
            )}
            <button
                onClick={e => { e.preventDefault(); setWished(w => !w); }}
                className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 rounded-full shadow flex items-center justify-center transition-transform hover:scale-110"
            >
                <Heart size={14} className={wished ? "fill-rose-500 text-rose-500" : "text-slate-400"} />
            </button>

            {/* Image */}
            <div className="h-52 bg-slate-50 flex items-center justify-center overflow-hidden">
                {imagen ? (
                    <img src={imagen} alt={product.nombre} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <span className="text-6xl select-none">👕</span>
                )}
            </div>

            {/* Info */}
            <div className="p-4 space-y-2">
                {product.categoria && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.categoria.nombre}</p>
                )}
                <h3 className="font-semibold text-slate-800 text-sm leading-tight group-hover:text-slate-900 line-clamp-2">{product.nombre}</h3>
                <StarRating rating={4.5} />
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-base font-bold text-slate-900">S/ {precioFinal.toFixed(2)}</span>
                        {tieneDescuento && (
                            <span className="text-xs text-slate-400 line-through">S/ {Number(product.precio).toFixed(2)}</span>
                        )}
                    </div>
                </div>
                <button
                    onClick={handleAddToCart}
                    className="w-full mt-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
                >
                    <ShoppingCart size={13} /> Agregar al carrito
                </button>
            </div>
        </Link>
    );
};

// ─── Skeleton card ────────────────────────────────────────────────────────────

const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
        <div className="h-52 bg-slate-100" />
        <div className="p-4 space-y-2">
            <div className="h-3 w-16 bg-slate-100 rounded" />
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-3 w-20 bg-slate-100 rounded" />
            <div className="h-9 w-full bg-slate-100 rounded-xl mt-1" />
        </div>
    </div>
);

// ─── HomePage ─────────────────────────────────────────────────────────────────

export function HomePage() {
    const [currentHeroImage, setCurrentHeroImage] = useState(modelGalata);
    const [products,    setProducts]    = useState<Product[]>([]);
    const [categories,  setCategories]  = useState<{ id: number; nombre: string }[]>([]);
    const [loadingProds, setLoadingProds] = useState(true);
    const thumbnails = [frontGalaBeige, galaAzul, galaBlanco];

    useEffect(() => {
        getAllProducts()
            .then(data => setProducts(data.filter(p => p.estado === "ACTIVO").slice(0, 8)))
            .catch(() => {})
            .finally(() => setLoadingProds(false));
        getCategories()
            .then(data => setCategories(data.slice(0, 6)))
            .catch(() => {});
    }, []);

    return (
        <div className="min-h-screen bg-white">

            {/* ── HERO ── */}
            <section className="relative min-h-screen flex bg-[#f5f0eb]">
                {/* Left */}
                <div className="flex flex-col justify-center px-8 md:px-14 lg:px-20 pt-24 pb-16 w-full lg:w-[50%] z-10">
                    <p className="text-[10px] tracking-[0.3em] uppercase text-slate-500 mb-4">Purpose Collection</p>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.88] text-slate-900 mb-8">
                        PURPOSE<br />
                        <span className="text-slate-400">EDITION</span>
                    </h1>
                    <p className="text-sm leading-relaxed text-slate-500 max-w-sm mb-10">
                        Presentamos nuestra nueva colección, inspirada en la fe, el propósito y la identidad. Diseñada para quienes buscan expresar lo que llevan dentro.
                    </p>
                    <div className="flex items-center gap-4">
                        <Link
                            to="/catalog"
                            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold px-7 py-3.5 rounded-2xl transition-colors"
                        >
                            Ver colección <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link to="/catalog" className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                            Explorar todo
                        </Link>
                    </div>

                    {/* Mobile image */}
                    <div className="lg:hidden w-full mt-10 mb-4">
                        <img src={currentHeroImage} alt="Modelo" className="max-h-[50vh] w-auto mx-auto object-contain" />
                    </div>

                    {/* Thumbnails */}
                    <div className="mt-10 lg:mt-14">
                        <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 mb-3">Galería</p>
                        <div className="flex items-end gap-3">
                            {thumbnails.map((src, i) => (
                                <div
                                    key={i}
                                    onClick={() => setCurrentHeroImage(src)}
                                    className={`w-24 md:w-32 cursor-pointer border-b-2 transition-all duration-300 ${currentHeroImage === src ? "border-slate-900 opacity-100 scale-105" : "border-transparent opacity-50 hover:opacity-80"}`}
                                >
                                    <img src={src} alt={`Vista ${i + 1}`} className="w-full h-auto object-contain" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right — hero image */}
                <div className="hidden lg:flex items-end justify-center w-[50%] pt-16">
                    <img src={currentHeroImage} alt="Purpose Edition" className="w-auto h-[92vh] object-contain object-bottom" />
                </div>

                {/* Scroll hint */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
                    <div className="w-px h-10 bg-slate-900 animate-pulse" />
                    <p className="text-[9px] tracking-[0.3em] uppercase text-slate-700">Scroll</p>
                </div>
            </section>

            {/* ── PERKS ── */}
            <section className="bg-white border-y border-slate-100">
                <div className="max-w-6xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {perks.map(p => (
                        <div key={p.title} className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                                <p.icon size={18} className={p.color} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-800">{p.title}</p>
                                <p className="text-[11px] text-slate-500">{p.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CATEGORIES ── */}
            {categories.length > 0 && (
                <section className="max-w-6xl mx-auto px-6 py-16">
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Explorar</p>
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Categorías</h2>
                        </div>
                        <Link to="/catalog" className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900">
                            Ver todas <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {categories.map((cat, i) => {
                            const emoji = CATEGORY_EMOJIS[cat.nombre.toUpperCase()] ?? CATEGORY_EMOJIS.default;
                            const gradient = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                            return (
                                <Link
                                    key={cat.id}
                                    to={`/catalog?categoria=${cat.id}`}
                                    className="group relative overflow-hidden rounded-2xl aspect-square flex flex-col items-center justify-center gap-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className={`absolute inset-0 bg-linear-to-br ${gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />
                                    <span className="relative text-4xl">{emoji}</span>
                                    <span className="relative text-white font-bold text-sm text-center px-2 leading-tight">{cat.nombre}</span>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── BANNER ── */}
            <section className="max-w-6xl mx-auto px-6 mb-16">
                <Link to="/catalog" className="relative overflow-hidden rounded-3xl shadow-xl group cursor-pointer block">
                    <img src={promoBanner} alt="Oferta Purpose Collection" className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
                </Link>
            </section>

            {/* ── FEATURED PRODUCTS ── */}
            <section className="max-w-6xl mx-auto px-6 pb-16">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Selección</p>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Productos destacados</h2>
                    </div>
                    <Link to="/catalog" className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900">
                        Ver todos <ChevronRight size={16} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {loadingProds
                        ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                        : products.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)
                    }
                </div>
            </section>

            {/* ── NEWSLETTER ── */}
            <section className="bg-slate-900 text-white">
                <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-5">
                    <h2 className="text-2xl md:text-3xl font-bold">¿No quieres perderte nada?</h2>
                    <p className="text-slate-400 text-sm">Suscríbete y recibe las mejores ofertas y novedades directamente en tu correo.</p>
                    <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="tu@email.com"
                            className="flex-1 px-4 py-3 rounded-xl text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                        />
                        <button className="bg-amber-400 hover:bg-amber-300 text-amber-900 font-bold px-6 py-3 rounded-xl shrink-0 transition-colors text-sm">
                            Suscribirme
                        </button>
                    </div>
                    <p className="text-xs text-slate-600">Sin spam. Puedes darte de baja cuando quieras.</p>
                </div>
            </section>
        </div>
    );
}
