import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    ShoppingCart,
    Heart,
    Star,
    Search,
    SlidersHorizontal,
    X,
    ChevronDown,
    Check,
    Tag,
    Filter,
    RotateCcw,
    Layers,
    Sparkles,
    ShieldCheck,
    Truck,
} from "lucide-react";
import { getAllProducts } from "@/features/erp/products/services/products.service";
import { getCategories }  from "@/features/erp/products/services/categories.service";
import type { Product }   from "@/features/erp/products/types/Products.type";
import { useCart }        from "@/contexts/CartContext";
import { useFavorites }   from "@/contexts/FavoritesContext";
import promoBanner        from "../../assets/images/banners/banner.png";

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
    relevance:    "Relevancia",
    "price-asc":  "Precio: menor a mayor",
    "price-desc": "Precio: mayor a menor",
    newest:       "Más recientes",
};

// ─── StarRating ───────────────────────────────────────────────────────────────

const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
            <Star
                key={s}
                size={11}
                className={
                    s <= Math.round(rating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-slate-200 text-slate-200"
                }
            />
        ))}
    </div>
);

// ─── ProductCard ──────────────────────────────────────────────────────────────

const ProductCard = ({ product }: { product: Product }) => {
    const { isFavorite, toggleFavorite } = useFavorites();
    const wished = isFavorite(product.id);
    const { addItem } = useCart();

    const precioFinal    = getPrecioFinal(product);
    const tieneDescuento = product.tipoDescuento !== "SIN_DESCUENTO" && Number(product.valorDescuento) > 0;
    const pctDescuento   = tieneDescuento && product.tipoDescuento === "PORCENTAJE" ? Number(product.valorDescuento) : null;
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
        <Link
            to={`/product/${product.id}`}
            className="group relative bg-white rounded-2xl shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 hover:-translate-y-1 flex flex-col justify-between"
        >
            <div>
                {/* Badges superiores */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                    {tieneDescuento && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-xs">
                            {pctDescuento ? `-${pctDescuento}%` : "Oferta"}
                        </span>
                    )}
                </div>

                {/* Botón Favorito */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(product.id);
                    }}
                    className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-xs rounded-full shadow-xs flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                    title={wished ? "Quitar de favoritos" : "Guardar en favoritos"}
                >
                    <Heart
                        size={14}
                        className={wished ? "fill-rose-500 text-rose-500" : "text-slate-400"}
                    />
                </button>

                {/* Imagen del producto */}
                <div className="h-56 sm:h-60 bg-slate-50 flex items-center justify-center overflow-hidden relative">
                    {imagen ? (
                        <img
                            src={imagen}
                            alt={product.nombre}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <span className="text-6xl select-none">👕</span>
                    )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-1.5">
                    {product.categoria && (
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                            {product.categoria.nombre}
                            {product.marca && ` · ${product.marca.nombre}`}
                        </p>
                    )}

                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-slate-950 transition-colors line-clamp-1">
                        {product.nombre}
                    </h3>

                    {/* Muestrario de colores */}
                    {product.colores && product.colores.length > 0 && (
                        <div className="flex gap-1 py-0.5">
                            {product.colores.slice(0, 4).map((c) => (
                                <span
                                    key={c.id}
                                    className="w-3 h-3 rounded-full border border-slate-200"
                                    style={{ backgroundColor: c.nombre }}
                                    title={c.nombre}
                                />
                            ))}
                            {product.colores.length > 4 && (
                                <span className="text-[9px] text-slate-400 font-mono">
                                    +{product.colores.length - 4}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Precio */}
                    <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-base font-extrabold text-slate-900">
                            S/ {precioFinal.toFixed(2)}
                        </span>
                        {tieneDescuento && (
                            <span className="text-xs text-slate-400 line-through">
                                S/ {Number(product.precio).toFixed(2)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Botón agregar al carrito */}
            <div className="p-4 pt-0">
                <button
                    onClick={handleAddToCart}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors active:scale-98 shadow-xs"
                >
                    <ShoppingCart size={13} />
                    Agregar al carrito
                </button>
            </div>
        </Link>
    );
};

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
        <div className="h-56 bg-slate-100" />
        <div className="p-4 space-y-2">
            <div className="h-3 w-16 bg-slate-100 rounded" />
            <div className="h-4 w-3/4 bg-slate-100 rounded" />
            <div className="h-4 w-20 bg-slate-100 rounded" />
            <div className="h-9 w-full bg-slate-100 rounded-xl mt-3" />
        </div>
    </div>
);

// ─── CatalogPage ──────────────────────────────────────────────────────────────

export function CatalogPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [allProducts,  setAllProducts]  = useState<Product[]>([]);
    const [categories,   setCategories]   = useState<{ id: number; nombre: string }[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [sortOpen,     setSortOpen]     = useState(false);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    // Parámetros de URL
    const qParam        = searchParams.get("q") ?? "";
    const catParam      = searchParams.get("categoria") ?? "";
    const sortParam     = (searchParams.get("sort") ?? "relevance") as SortOption;
    const priceMinParam = searchParams.get("minPrice") ?? "";
    const priceMaxParam = searchParams.get("maxPrice") ?? "";
    const discountParam = searchParams.get("ofertas") === "true";

    // Estados locales para inputs
    const [searchInput, setSearchInput]   = useState(qParam);
    const [minPriceInput, setMinPriceInput] = useState(priceMinParam);
    const [maxPriceInput, setMaxPriceInput] = useState(priceMaxParam);

    useEffect(() => {
        Promise.all([getAllProducts(), getCategories()])
            .then(([prods, cats]) => {
                setAllProducts(prods.filter((p) => p.estado === "ACTIVO"));
                setCategories(cats);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        setSearchInput(qParam);
        setMinPriceInput(priceMinParam);
        setMaxPriceInput(priceMaxParam);
    }, [qParam, priceMinParam, priceMaxParam]);

    const activeCategory = categories.find((c) => String(c.id) === catParam);

    // Conteo de productos por categoría
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        allProducts.forEach((p) => {
            if (p.categoria) {
                const id = String(p.categoria.id);
                counts[id] = (counts[id] || 0) + 1;
            }
        });
        return counts;
    }, [allProducts]);

    // Filtrado de productos
    const filtered = useMemo(() => {
        let list = [...allProducts];

        // Filtro por categoría
        if (catParam) {
            list = list.filter((p) => String(p.categoria?.id) === catParam);
        }

        // Filtro por texto
        if (qParam) {
            const q = qParam.toLowerCase();
            list = list.filter(
                (p) =>
                    p.nombre.toLowerCase().includes(q) ||
                    p.descripcion?.toLowerCase().includes(q) ||
                    p.categoria?.nombre.toLowerCase().includes(q)
            );
        }

        // Filtro por precio mínimo
        if (priceMinParam) {
            const min = parseFloat(priceMinParam);
            if (!isNaN(min)) list = list.filter((p) => getPrecioFinal(p) >= min);
        }

        // Filtro por precio máximo
        if (priceMaxParam) {
            const max = parseFloat(priceMaxParam);
            if (!isNaN(max)) list = list.filter((p) => getPrecioFinal(p) <= max);
        }

        // Filtro solo ofertas
        if (discountParam) {
            list = list.filter(
                (p) => p.tipoDescuento !== "SIN_DESCUENTO" && Number(p.valorDescuento) > 0
            );
        }

        // Ordenamiento
        switch (sortParam) {
            case "price-asc":
                list.sort((a, b) => getPrecioFinal(a) - getPrecioFinal(b));
                break;
            case "price-desc":
                list.sort((a, b) => getPrecioFinal(b) - getPrecioFinal(a));
                break;
            case "newest":
                list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
                break;
        }

        return list;
    }, [allProducts, catParam, qParam, priceMinParam, priceMaxParam, discountParam, sortParam]);

    const setParam = (key: string, value: string) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set(key, value);
        else next.delete(key);
        setSearchParams(next);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setParam("q", searchInput.trim());
    };

    const handleApplyPriceFilter = () => {
        const next = new URLSearchParams(searchParams);
        if (minPriceInput.trim()) next.set("minPrice", minPriceInput.trim());
        else next.delete("minPrice");
        if (maxPriceInput.trim()) next.set("maxPrice", maxPriceInput.trim());
        else next.delete("maxPrice");
        setSearchParams(next);
    };

    const handleQuickPrice = (min: string, max: string) => {
        setMinPriceInput(min);
        setMaxPriceInput(max);
        const next = new URLSearchParams(searchParams);
        if (min) next.set("minPrice", min); else next.delete("minPrice");
        if (max) next.set("maxPrice", max); else next.delete("maxPrice");
        setSearchParams(next);
    };

    const clearFilters = () => {
        setSearchParams(new URLSearchParams());
        setSearchInput("");
        setMinPriceInput("");
        setMaxPriceInput("");
    };

    const hasFilters = !!qParam || !!catParam || !!priceMinParam || !!priceMaxParam || discountParam;

    return (
        <div className="min-h-screen bg-slate-50/70 pt-16 pb-20">
            {/* ═════════════════════════════════════════════════════════════════════ */}
            {/* ── PORTADA HERO DEL CATÁLOGO ──                                     */}
            {/* ═════════════════════════════════════════════════════════════════════ */}
            <div className="relative bg-slate-950 text-white overflow-hidden py-14 sm:py-20 border-b border-slate-800">
                {/* Imagen de fondo sutil con overlay */}
                <div className="absolute inset-0 z-0 opacity-20 mix-blend-luminosity">
                    <img
                        src={promoBanner}
                        alt="Catálogo Bens"
                        className="w-full h-full object-cover object-center filter blur-xs scale-105"
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-indigo-950/80 z-0" />

                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold uppercase tracking-widest text-indigo-300 border border-white/10 mb-3">
                            <Sparkles size={12} className="text-indigo-400" />
                            Colección Oficial 2026
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3 leading-tight">
                            Catálogo Exclusivo
                        </h1>
                        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mb-6">
                            Descubre nuestra selección de alta confección textil. Prendas diseñadas con telas premium, cortes precisos y durabilidad incomparable.
                        </p>

                        {/* Beneficios clave en badges horizontales */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                            <div className="flex items-center gap-1.5">
                                <Truck size={14} className="text-emerald-400" />
                                <span>Envíos a todo el Perú</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck size={14} className="text-indigo-400" />
                                <span>Calidad 100% Garantizada</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Tag size={14} className="text-rose-400" />
                                <span>Precios de fábrica</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════════════ */}
            {/* ── CONTENIDO PRINCIPAL: PRODUCTOS (IZQ) Y FILTROS VERTICALES (DER) ── */}
            {/* ═════════════════════════════════════════════════════════════════════ */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Barra superior de estado y botón móvil de filtros */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200/80">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            {activeCategory ? activeCategory.nombre : "Todas las Prendas"}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Mostrando {filtered.length} {filtered.length === 1 ? "producto disponible" : "productos disponibles"}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Selector de Ordenamiento */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setSortOpen((v) => !v)}
                                className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:border-slate-400 transition-colors shadow-2xs"
                            >
                                <SlidersHorizontal size={13} className="text-slate-500" />
                                <span className="hidden sm:inline text-slate-400">Ordenar por:</span>
                                {SORT_LABELS[sortParam]}
                                <ChevronDown size={13} className="text-slate-400" />
                            </button>
                            {sortOpen && (
                                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5">
                                    {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => {
                                                setParam("sort", opt);
                                                setSortOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 transition-colors ${
                                                sortParam === opt
                                                    ? "font-bold text-slate-900 bg-slate-50"
                                                    : "text-slate-600"
                                            }`}
                                        >
                                            {SORT_LABELS[opt]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Botón para abrir filtros en pantallas móviles */}
                        <button
                            type="button"
                            onClick={() => setMobileFilterOpen(true)}
                            className="lg:hidden flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs"
                        >
                            <Filter size={13} />
                            Filtros
                            {hasFilters && <span className="w-2 h-2 rounded-full bg-rose-400" />}
                        </button>
                    </div>
                </div>

                {/* Badges de filtros aplicados */}
                {hasFilters && (
                    <div className="flex items-center gap-2 mb-6 flex-wrap">
                        <span className="text-xs font-semibold text-slate-400">Filtros activos:</span>
                        {qParam && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white text-xs font-medium rounded-full">
                                "{qParam}"
                                <button type="button" onClick={() => { setSearchInput(""); setParam("q", ""); }}>
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        {activeCategory && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white text-xs font-medium rounded-full">
                                {activeCategory.nombre}
                                <button type="button" onClick={() => setParam("categoria", "")}>
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        {(priceMinParam || priceMaxParam) && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white text-xs font-medium rounded-full">
                                S/ {priceMinParam || "0"} - S/ {priceMaxParam || "∞"}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMinPriceInput("");
                                        setMaxPriceInput("");
                                        const next = new URLSearchParams(searchParams);
                                        next.delete("minPrice");
                                        next.delete("maxPrice");
                                        setSearchParams(next);
                                    }}
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        {discountParam && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 text-white text-xs font-medium rounded-full">
                                Solo ofertas
                                <button type="button" onClick={() => setParam("ofertas", "")}>
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline ml-2"
                        >
                            Limpiar todo
                        </button>
                    </div>
                )}

                {/* ── Layout Grid: Filtros Verticales a la Izquierda | Productos al lado Derecho ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 space-y-6">
                        <div className="space-y-6">
                            {/* Cabecera del panel de filtros */}
                            <div className="flex items-center gap-2 pb-3 border-b border-slate-200/70">
                                <Filter size={16} className="text-slate-900" />
                                <h3 className="text-sm font-bold text-slate-900">
                                    Filtros
                                </h3>
                            </div>

                            {/* 1. Categorías en lista vertical */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                                    <span>Categorías</span>
                                    <Layers size={13} className="text-slate-400" />
                                </label>
                                <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                                    <button
                                        type="button"
                                        onClick={() => setParam("categoria", "")}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                                            !catParam
                                                ? "bg-slate-900 text-white font-bold"
                                                : "text-slate-600 hover:bg-slate-100"
                                        }`}
                                    >
                                        <span>Todas las categorías</span>
                                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${!catParam ? "bg-white/20 text-white" : "bg-slate-200/60 text-slate-600"}`}>
                                            {allProducts.length}
                                        </span>
                                    </button>

                                    {categories.map((c) => {
                                        const isSelected = catParam === String(c.id);
                                        const count = categoryCounts[String(c.id)] || 0;
                                        return (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => setParam("categoria", String(c.id))}
                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                                                    isSelected
                                                        ? "bg-slate-900 text-white font-bold"
                                                        : "text-slate-600 hover:bg-slate-100"
                                                }`}
                                            >
                                                <span className="truncate">{c.nombre}</span>
                                                <span
                                                    className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                                                        isSelected
                                                            ? "bg-white/20 text-white"
                                                            : "bg-slate-200/60 text-slate-600"
                                                    }`}
                                                >
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 3. Filtro de Rango de Precio */}
                            <div className="pt-3 border-t border-slate-200/70">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                    Rango de Precio (S/)
                                </label>

                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div>
                                        <input
                                            type="number"
                                            value={minPriceInput}
                                            onChange={(e) => setMinPriceInput(e.target.value)}
                                            placeholder="Mínimo"
                                            className="w-full px-2.5 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            value={maxPriceInput}
                                            onChange={(e) => setMaxPriceInput(e.target.value)}
                                            placeholder="Máximo"
                                            className="w-full px-2.5 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleApplyPriceFilter}
                                    className="w-full py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors mb-2"
                                >
                                    Aplicar rango
                                </button>

                                {/* Opciones de precio rápido */}
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        { label: "< S/ 30", min: "", max: "30" },
                                        { label: "S/ 30 - 60", min: "30", max: "60" },
                                        { label: "> S/ 60", min: "60", max: "" },
                                    ].map((r) => (
                                        <button
                                            key={r.label}
                                            type="button"
                                            onClick={() => handleQuickPrice(r.min, r.max)}
                                            className="text-[11px] px-2 py-0.5 rounded-lg border border-slate-200 hover:border-slate-400 text-slate-600 bg-white"
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 4. Filtro solo con Descuento */}
                            <div className="pt-3 border-t border-slate-200/70">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={discountParam}
                                        onChange={(e) =>
                                            setParam("ofertas", e.target.checked ? "true" : "")
                                        }
                                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4"
                                    />
                                    <span className="text-xs font-semibold text-slate-700">
                                        Solo prendas con descuento
                                    </span>
                                </label>
                            </div>
                        </div>
                    </aside>

                    {/* ═════════════════════════════════════════════════════════════════ */}
                    {/* ── COLUMNA DERECHA: PRODUCTOS (lg:col-span-8 xl:col-span-9) ─── */}
                    {/* ═════════════════════════════════════════════════════════════════ */}
                    <div className="lg:col-span-8 xl:col-span-9">
                        {loading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <SkeletonCard key={i} />
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                                    <Search size={28} />
                                </div>
                                <h3 className="text-base font-bold text-slate-800 mb-1">
                                    No se encontraron productos
                                </h3>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                                    No hay prendas que coincidan con los criterios seleccionados. Prueba modificando los filtros de búsqueda.
                                </p>
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
                                >
                                    Ver todo el catálogo
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
                                {filtered.map((p) => (
                                    <ProductCard key={p.id} product={p} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* ── MODAL DRAWER DE FILTROS EN MÓVIL ──                           */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {mobileFilterOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end lg:hidden">
                    <div className="w-full max-w-xs bg-white h-full p-6 overflow-y-auto space-y-6 shadow-2xl animate-in slide-in-from-right duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Filter size={15} /> Filtros de Catálogo
                            </h3>
                            <button
                                type="button"
                                onClick={() => setMobileFilterOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={18} />
                            </button>
                        </div>



                        {/* Categorías móvil */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2">
                                Categorías
                            </label>
                            <div className="space-y-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setParam("categoria", "");
                                        setMobileFilterOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs ${
                                        !catParam ? "bg-slate-900 text-white font-bold" : "text-slate-600"
                                    }`}
                                >
                                    Todas
                                </button>
                                {categories.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                            setParam("categoria", String(c.id));
                                            setMobileFilterOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs ${
                                            catParam === String(c.id)
                                                ? "bg-slate-900 text-white font-bold"
                                                : "text-slate-600"
                                        }`}
                                    >
                                        {c.nombre}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Solo descuentos móvil */}
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={discountParam}
                                    onChange={(e) =>
                                        setParam("ofertas", e.target.checked ? "true" : "")
                                    }
                                    className="rounded border-slate-300 text-slate-900"
                                />
                                <span className="text-xs text-slate-700 font-medium">
                                    Solo con descuento
                                </span>
                            </label>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    clearFilters();
                                    setMobileFilterOpen(false);
                                }}
                                className="w-1/2 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                            >
                                Limpiar
                            </button>
                            <button
                                type="button"
                                onClick={() => setMobileFilterOpen(false)}
                                className="w-1/2 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl"
                            >
                                Aplicar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
