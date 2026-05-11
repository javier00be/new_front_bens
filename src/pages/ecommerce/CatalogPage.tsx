import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ShoppingCart, Heart, Star, Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { getAllProducts } from "@/features/erp/products/services/products.service";
import { getCategories }  from "@/features/erp/products/services/categories.service";
import type { Product }   from "@/features/erp/products/types/Products.type";
import { useCart }        from "@/contexts/CartContext";

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

type SortOption = "relevance" | "price-asc" | "price-desc" | "newest";

const SORT_LABELS: Record<SortOption, string> = {
    relevance:  "Relevancia",
    "price-asc":  "Precio: menor a mayor",
    "price-desc": "Precio: mayor a menor",
    newest:     "Más recientes",
};

// ─── StarRating ───────────────────────────────────────────────────────────────

const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} size={10} className={s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"} />
        ))}
    </div>
);

// ─── ProductCard ──────────────────────────────────────────────────────────────

const ProductCard = ({ product }: { product: Product }) => {
    const [wished, setWished] = useState(false);
    const { addItem } = useCart();

    const precioFinal    = getPrecioFinal(product);
    const tieneDescuento = product.tipoDescuento !== "SIN_DESCUENTO" && product.valorDescuento > 0;
    const pctDescuento   = tieneDescuento && product.tipoDescuento === "PORCENTAJE" ? product.valorDescuento : null;
    const imagen         = resolveImage(product.imagenes?.[0]);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        addItem({
            productId:   product.id,
            nombre:      product.nombre,
            precio:      precioFinal,
            imagenUrl:   imagen,
            tallaId:     product.tallas?.[0]?.id ?? null,
            tallaNombre: product.tallas?.[0]?.nombre,
            colorId:     product.colores?.[0]?.id ?? null,
            colorNombre: product.colores?.[0]?.nombre,
            cantidad:    1,
        });
    };

    return (
        <Link to={`/product/${product.id}`} className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 hover:-translate-y-1 block">
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

            <div className="h-56 bg-slate-50 flex items-center justify-center overflow-hidden">
                {imagen ? (
                    <img src={imagen} alt={product.nombre} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <span className="text-6xl select-none">👕</span>
                )}
            </div>

            <div className="p-4 space-y-2">
                {product.categoria && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.categoria.nombre}</p>
                )}
                <h3 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2 group-hover:text-slate-900">{product.nombre}</h3>
                <StarRating rating={4.5} />

                {/* Color swatches preview */}
                {product.colores && product.colores.length > 0 && (
                    <div className="flex items-center gap-1 pt-0.5">
                        {product.colores.slice(0, 4).map(c => (
                            <span key={c.id} className="w-3 h-3 rounded-full border border-slate-200 bg-slate-200" title={c.nombre} />
                        ))}
                        {product.colores.length > 4 && (
                            <span className="text-[10px] text-slate-400">+{product.colores.length - 4}</span>
                        )}
                    </div>
                )}

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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
        <div className="h-56 bg-slate-100" />
        <div className="p-4 space-y-2">
            <div className="h-3 w-16 bg-slate-100 rounded" />
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-3 w-20 bg-slate-100 rounded" />
            <div className="h-9 w-full bg-slate-100 rounded-xl mt-1" />
        </div>
    </div>
);

// ─── CatalogPage ──────────────────────────────────────────────────────────────

export function CatalogPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [allProducts,  setAllProducts]  = useState<Product[]>([]);
    const [categories,   setCategories]   = useState<{ id: number; nombre: string }[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [showFilters,  setShowFilters]  = useState(false);
    const [sortOpen,     setSortOpen]     = useState(false);

    const qParam  = searchParams.get("q") ?? "";
    const catParam = searchParams.get("categoria") ?? "";
    const sortParam = (searchParams.get("sort") ?? "relevance") as SortOption;

    const [searchInput, setSearchInput] = useState(qParam);

    useEffect(() => {
        Promise.all([
            getAllProducts(),
            getCategories(),
        ]).then(([prods, cats]) => {
            setAllProducts(prods.filter(p => p.estado === "ACTIVO"));
            setCategories(cats);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    // Keep search input in sync with URL param
    useEffect(() => { setSearchInput(qParam); }, [qParam]);

    const activeCategory = categories.find(c => String(c.id) === catParam);

    const filtered = useMemo(() => {
        let list = [...allProducts];

        if (catParam) list = list.filter(p => String(p.categoria?.id) === catParam);

        if (qParam) {
            const q = qParam.toLowerCase();
            list = list.filter(p =>
                p.nombre.toLowerCase().includes(q) ||
                p.descripcion?.toLowerCase().includes(q) ||
                p.categoria?.nombre.toLowerCase().includes(q)
            );
        }

        switch (sortParam) {
            case "price-asc":  list.sort((a, b) => getPrecioFinal(a) - getPrecioFinal(b)); break;
            case "price-desc": list.sort((a, b) => getPrecioFinal(b) - getPrecioFinal(a)); break;
            case "newest":     list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")); break;
        }

        return list;
    }, [allProducts, catParam, qParam, sortParam]);

    const setParam = (key: string, value: string) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set(key, value); else next.delete(key);
        setSearchParams(next);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setParam("q", searchInput.trim());
    };

    const clearFilters = () => {
        setSearchParams(new URLSearchParams());
        setSearchInput("");
    };

    const hasFilters = !!qParam || !!catParam;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* ── Header ── */}
            <div className="bg-white border-b border-slate-100 pt-20">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <h1 className="text-3xl font-black text-slate-900 mb-1">Catálogo</h1>
                    <p className="text-sm text-slate-500">
                        {loading ? "Cargando productos..." : `${filtered.length} ${filtered.length === 1 ? "producto" : "productos"}`}
                        {activeCategory && <span className="ml-1 text-slate-700 font-medium">en {activeCategory.nombre}</span>}
                    </p>
                </div>

                {/* Category pills */}
                <div className="max-w-7xl mx-auto px-6 pb-5">
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        <button
                            onClick={() => setParam("categoria", "")}
                            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${!catParam ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                            Todo
                        </button>
                        {categories.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setParam("categoria", String(c.id))}
                                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${catParam === String(c.id) ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                            >
                                {c.nombre}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* ── Toolbar ── */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            placeholder="Buscar productos..."
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800 placeholder-slate-400"
                        />
                        {searchInput && (
                            <button type="button" onClick={() => { setSearchInput(""); setParam("q", ""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </form>

                    {/* Sort */}
                    <div className="relative">
                        <button
                            onClick={() => setSortOpen(v => !v)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:border-slate-400 transition-colors"
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            {SORT_LABELS[sortParam]}
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        {sortOpen && (
                            <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1">
                                {(Object.keys(SORT_LABELS) as SortOption[]).map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => { setParam("sort", opt); setSortOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${sortParam === opt ? "font-semibold text-slate-900" : "text-slate-600"}`}
                                    >
                                        {SORT_LABELS[opt]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mobile filter toggle */}
                    <button
                        onClick={() => setShowFilters(v => !v)}
                        className="sm:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700"
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5" /> Filtros
                    </button>
                </div>

                {/* Active filters */}
                {hasFilters && (
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                        {qParam && (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white text-xs font-medium rounded-full">
                                "{qParam}"
                                <button onClick={() => { setSearchInput(""); setParam("q", ""); }}><X className="w-3 h-3" /></button>
                            </span>
                        )}
                        {activeCategory && (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white text-xs font-medium rounded-full">
                                {activeCategory.nombre}
                                <button onClick={() => setParam("categoria", "")}><X className="w-3 h-3" /></button>
                            </span>
                        )}
                        <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-slate-800 underline">
                            Limpiar filtros
                        </button>
                    </div>
                )}

                {/* ── Grid ── */}
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <span className="text-6xl mb-4">🔍</span>
                        <h3 className="text-lg font-bold text-slate-700 mb-1">Sin resultados</h3>
                        <p className="text-sm text-slate-500 mb-4">No encontramos productos con esos filtros.</p>
                        <button onClick={clearFilters} className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl">
                            Ver todo el catálogo
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {filtered.map(p => <ProductCard key={p.id} product={p} />)}
                    </div>
                )}
            </div>
        </div>
    );
}
