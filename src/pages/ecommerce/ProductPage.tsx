import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
    ShoppingCart,
    Heart,
    Star,
    ChevronLeft,
    ChevronRight,
    Shield,
    Truck,
    RefreshCw,
    Check,
    Minus,
    Plus,
    Flame,
    Sparkles,
    MessageSquare,
    Send,
    User as UserIcon,
    ArrowRight,
    SlidersHorizontal,
    List,
    ArrowUpDown,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Video as VideoIcon,
    FileText,
    ExternalLink,
} from "lucide-react";
import {
    getProductById,
    getBestSellers,
    getRelatedProducts,
} from "@/features/erp/products/services/products.service";
import {
    getReviewsByProduct,
    createProductReview,
    type ReviewItem,
    type ReviewStats,
} from "@/features/ecommerce/reviews/services/reviews.service";
import type { Product } from "@/features/erp/products/types/Products.type";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000/api";

const resolveImage = (src?: string) => {
    if (!src) return undefined;
    if (src.startsWith("http")) return src;
    return `${API_BASE.replace("/api", "")}/${src.replace(/^\//, "")}`;
};

const isLight = (hex: string): boolean => {
    const c = hex.trim().replace("#", "");
    if (c.length < 6) return true;
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
};

const aplicarDescuento = (precio: number, p: Product): number => {
    const descuento = Number(p.valorDescuento);
    if (p.tipoDescuento === "PORCENTAJE") return precio * (1 - descuento / 100);
    if (p.tipoDescuento === "VALOR_FIJO") return Math.max(0, precio - descuento);
    return precio;
};

const getYoutubeEmbedUrl = (url?: string): string | null => {
    if (!url) return null;
    try {
        if (url.includes("youtube.com/watch")) {
            const v = new URL(url).searchParams.get("v");
            return v ? `https://www.youtube.com/embed/${v}?autoplay=1&mute=1&loop=1&playlist=${v}` : null;
        }
        if (url.includes("youtu.be/")) {
            const id = url.split("youtu.be/")[1]?.split("?")[0];
            return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}` : null;
        }
        if (url.includes("youtube.com/shorts/")) {
            const id = url.split("youtube.com/shorts/")[1]?.split("?")[0];
            return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}` : null;
        }
    } catch {
        return null;
    }
    return null;
};

// ─── StarRating ───────────────────────────────────────────────────────────────

const StarRating = ({ rating, count }: { rating: number; count?: number }) => (
    <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    size={14}
                    className={s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}
                />
            ))}
        </div>
        <span className="text-sm font-semibold text-slate-700">{rating.toFixed(1)}</span>
        {count !== undefined && <span className="text-xs text-slate-400">({count} reseñas)</span>}
    </div>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = () => (
    <div className="min-h-screen bg-white pt-20 animate-pulse">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-slate-100 rounded-3xl" />
            <div className="space-y-4 py-4">
                <div className="h-4 w-24 bg-slate-100 rounded" />
                <div className="h-9 w-3/4 bg-slate-100 rounded" />
                <div className="h-6 w-32 bg-slate-100 rounded" />
                <div className="h-20 w-full bg-slate-100 rounded" />
                <div className="h-12 w-full bg-slate-100 rounded-xl" />
            </div>
        </div>
    </div>
);

// ─── Product Card Reutilizable para Carrusel / Rejilla ────────────────────────

interface ProductCardProps {
    item: Product;
    badgeText?: string;
}

const RecommendationCard = ({ item, badgeText }: ProductCardProps) => {
    const { isFavorite, toggleFavorite } = useFavorites();
    const { addItem } = useCart();
    const wished = isFavorite(item.id);

    const precioFinal = aplicarDescuento(Number(item.precio), item);
    const tieneDescuento = item.tipoDescuento !== "SIN_DESCUENTO" && Number(item.valorDescuento) > 0;
    const pctDescuento = tieneDescuento && item.tipoDescuento === "PORCENTAJE" ? Number(item.valorDescuento) : null;
    const imagen = resolveImage(item.imagenes?.[0]);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        addItem({
            productId: item.id,
            nombre: item.nombre,
            precio: precioFinal,
            imagenUrl: imagen,
            tallaId: item.tallas?.[0]?.id ?? null,
            tallaNombre: item.tallas?.[0]?.nombre,
            colorId: item.colores?.[0]?.id ?? null,
            colorNombre: item.colores?.[0]?.nombre,
            cantidad: 1,
        });
    };

    return (
        <div className="group relative bg-white rounded-2xl shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 flex flex-col hover:-translate-y-1">
            {/* Badges */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                {badgeText && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                        {badgeText}
                    </span>
                )}
                {tieneDescuento && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-xs">
                        {pctDescuento ? `-${pctDescuento}%` : "Oferta"}
                    </span>
                )}
            </div>

            {/* Wishlist Button */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    toggleFavorite(item.id);
                }}
                className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-xs rounded-full shadow flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                title={wished ? "Quitar de favoritos" : "Guardar en favoritos"}
            >
                <Heart size={14} className={wished ? "fill-rose-500 text-rose-500" : "text-slate-400"} />
            </button>

            {/* Imagen */}
            <Link to={`/product/${item.id}`} className="h-56 bg-slate-50 overflow-hidden flex items-center justify-center">
                {imagen ? (
                    <img
                        src={imagen}
                        alt={item.nombre}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <span className="text-6xl select-none">👕</span>
                )}
            </Link>

            {/* Info */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                    {item.categoria && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.categoria.nombre}</p>
                    )}
                    <Link
                        to={`/product/${item.id}`}
                        className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2 group-hover:text-slate-900"
                    >
                        {item.nombre}
                    </Link>
                </div>

                <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                    <div>
                        <span className="text-sm font-bold text-slate-900">S/ {precioFinal.toFixed(2)}</span>
                        {tieneDescuento && (
                            <span className="ml-1.5 text-xs text-slate-400 line-through">
                                S/ {Number(item.precio).toFixed(2)}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleAddToCart}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 flex items-center justify-center transition-colors"
                        title="Agregar al carrito"
                    >
                        <ShoppingCart size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── ProductPage ──────────────────────────────────────────────────────────────

export function ProductPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addItem } = useCart();
    const { isFavorite, toggleFavorite } = useFavorites();
    const { user } = useAuth();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [activeImage, setActiveImage] = useState(0);
    const [selectedTalla, setSelectedTalla] = useState<number | null>(null);
    const [selectedColor, setSelectedColor] = useState<number | null>(null);
    const [cantidad, setCantidad] = useState(1);
    const [added, setAdded] = useState(false);

    // Estados de recomendaciones y más vendidos
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [bestSellers, setBestSellers] = useState<Product[]>([]);
    const [recommendationTab, setRecommendationTab] = useState<"related" | "bestsellers">("related");

    // Estados de Ficha Técnica y Video Reel
    const [specTab, setSpecTab] = useState<"ficha" | "detalles" | "cambios">("ficha");
    const [isVideoPlaying, setIsVideoPlaying] = useState(true);
    const [isVideoMuted, setIsVideoMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    const togglePlayVideo = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsVideoPlaying(true);
        } else {
            videoRef.current.pause();
            setIsVideoPlaying(false);
        }
    };

    const toggleMuteVideo = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !videoRef.current.muted;
        setIsVideoMuted(videoRef.current.muted);
    };

    // Estados de valoraciones y reseñas
    const [reviewStats, setReviewStats] = useState<ReviewStats>({ reviews: [], average: 5.0, total: 0 });
    const [newRating, setNewRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [newComment, setNewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewMessage, setReviewMessage] = useState<string | null>(null);

    // Modo de visualización: Carrusel horizontal vs Scroll vertical acotado
    const [reviewViewMode, setReviewViewMode] = useState<"carousel" | "scroll">("carousel");
    const reviewsScrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const updateScrollButtons = () => {
        if (!reviewsScrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = reviewsScrollRef.current;
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    };

    const handleScrollReviews = (dir: "left" | "right") => {
        if (!reviewsScrollRef.current) return;
        const offset = dir === "left" ? -360 : 360;
        reviewsScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
        setTimeout(updateScrollButtons, 350);
    };

    // Desglose de estrellas (5 a 1)
    const ratingBreakdown = useMemo(() => {
        const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviewStats.reviews.forEach((r) => {
            const stars = Math.min(5, Math.max(1, Math.round(r.calificacion)));
            counts[stars] = (counts[stars] || 0) + 1;
        });
        return counts;
    }, [reviewStats.reviews]);

    const wished = product ? isFavorite(product.id) : false;

    // Cargar producto principal y datos derivados al cambiar ID
    useEffect(() => {
        if (!id) return;
        setLoading(true);
        const productId = Number(id);

        getProductById(productId)
            .then((data) => {
                setProduct(data);
                const firstInv = data.inventarios?.[0];
                setSelectedTalla(firstInv?.tallaId ?? data.tallas?.[0]?.id ?? null);
                setSelectedColor(firstInv?.colorId ?? data.colores?.[0]?.id ?? null);
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));

        // Cargar productos relacionados
        getRelatedProducts(productId, 4)
            .then(setRelatedProducts)
            .catch((err) => console.error("Error cargando relacionados:", err));

        // Cargar los más vendidos
        getBestSellers(4)
            .then(setBestSellers)
            .catch((err) => console.error("Error cargando más vendidos:", err));

        // Cargar reseñas
        getReviewsByProduct(productId)
            .then(setReviewStats)
            .catch((err) => console.error("Error cargando reseñas:", err));

        // Scroll suave al inicio al cambiar de prenda
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [id]);

    // Tallas únicas derivadas del inventario real
    const tallasDisponibles = useMemo(() => {
        if (!product?.inventarios?.length) return product?.tallas ?? [];
        const seen = new Set<number>();
        return product.inventarios
            .filter((inv) => {
                if (seen.has(inv.tallaId)) return false;
                seen.add(inv.tallaId);
                return true;
            })
            .map((inv) => inv.talla);
    }, [product]);

    // Colores disponibles para la talla seleccionada
    const coloresDisponibles = useMemo(() => {
        if (!product?.inventarios?.length) return product?.colores ?? [];
        const filtrados = selectedTalla
            ? product.inventarios.filter((inv) => inv.tallaId === selectedTalla)
            : product.inventarios;
        const seen = new Set<number>();
        return filtrados
            .filter((inv) => {
                if (seen.has(inv.colorId)) return false;
                seen.add(inv.colorId);
                return true;
            })
            .map((inv) => inv.color);
    }, [product, selectedTalla]);

    // Precio base de la variante seleccionada
    const precioVariante = useMemo(() => {
        if (!product) return 0;
        const inv = product.inventarios?.find((i) => i.tallaId === selectedTalla && i.colorId === selectedColor);
        if (inv && Number(inv.precio) > 0) return Number(inv.precio);
        const byTalla = selectedTalla ? product.inventarios?.find((i) => i.tallaId === selectedTalla) : null;
        if (byTalla && Number(byTalla.precio) > 0) return Number(byTalla.precio);
        return Number(product.precio);
    }, [product, selectedTalla, selectedColor]);

    if (loading) return <Skeleton />;

    if (notFound || !product)
        return (
            <div className="min-h-screen flex flex-col items-center justify-center pt-20 text-center px-6">
                <span className="text-6xl mb-4">😕</span>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Producto no encontrado</h2>
                <p className="text-slate-500 mb-6">Es posible que haya sido removido o el enlace es incorrecto.</p>
                <Link to="/catalog" className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl text-sm">
                    Ver catálogo
                </Link>
            </div>
        );

    const imagenes = (product.imagenes ?? []).map(resolveImage).filter(Boolean) as string[];
    const precioFinal = aplicarDescuento(precioVariante, product);
    const tieneDescuento = product.tipoDescuento !== "SIN_DESCUENTO" && Number(product.valorDescuento) > 0;
    const pctDescuento = tieneDescuento && product.tipoDescuento === "PORCENTAJE" ? Number(product.valorDescuento) : null;

    const selectedTallaObj = tallasDisponibles.find((t) => t.id === selectedTalla);
    const selectedColorObj = coloresDisponibles.find((c) => c.id === selectedColor);

    const handleAddToCart = () => {
        if (!product) return;
        addItem({
            productId: product.id,
            nombre: product.nombre,
            precio: precioFinal,
            imagenUrl: imagenes[0],
            tallaId: selectedTalla,
            tallaNombre: selectedTallaObj?.nombre,
            colorId: selectedColor,
            colorNombre: selectedColorObj?.nombre,
            cantidad,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product || !newComment.trim()) return;

        setSubmittingReview(true);
        setReviewMessage(null);
        try {
            await createProductReview({
                productoId: product.id,
                calificacion: newRating,
                comentario: newComment.trim(),
            });
            setNewComment("");
            setReviewMessage("¡Gracias por tu valoración!");
            setTimeout(() => setReviewMessage(null), 4000);
            // Recargar reseñas
            const stats = await getReviewsByProduct(product.id);
            setReviewStats(stats);
        } catch (err: any) {
            console.error("Error al enviar reseña:", err);
            setReviewMessage("No se pudo publicar tu reseña. Por favor intenta de nuevo.");
            setTimeout(() => setReviewMessage(null), 4000);
        } finally {
            setSubmittingReview(false);
        }
    };

    return (
        <div className="min-h-screen bg-white pt-20">
            <div className="max-w-6xl mx-auto px-6 py-10">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8">
                    <Link to="/" className="hover:text-slate-700 transition-colors">
                        Inicio
                    </Link>
                    <span>/</span>
                    <Link to="/catalog" className="hover:text-slate-700 transition-colors">
                        Catálogo
                    </Link>
                    {product.categoria && (
                        <>
                            <span>/</span>
                            <Link to={`/catalog?categoria=${product.categoria.id}`} className="hover:text-slate-700 transition-colors">
                                {product.categoria.nombre}
                            </Link>
                        </>
                    )}
                    <span>/</span>
                    <span className="text-slate-600 font-medium truncate max-w-[200px]">{product.nombre}</span>
                </nav>

                {/* ── Vista Detalle Principal de la Prenda ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                    {/* ── Imágenes ── */}
                    <div className="space-y-3">
                        <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
                            {imagenes.length > 0 ? (
                                <img
                                    src={imagenes[activeImage] ?? imagenes[0]}
                                    alt={product.nombre}
                                    className="w-full h-full object-cover transition-all duration-300"
                                />
                            ) : (
                                <span className="text-8xl select-none">👕</span>
                            )}
                            {tieneDescuento && (
                                <span className="absolute top-4 left-4 text-xs font-bold px-3 py-1.5 rounded-full bg-rose-500 text-white shadow-sm">
                                    {pctDescuento ? `-${pctDescuento}%` : "Oferta"}
                                </span>
                            )}
                        </div>

                        {imagenes.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {imagenes.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveImage(i)}
                                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                                            activeImage === i ? "border-slate-900 shadow-sm" : "border-transparent opacity-60 hover:opacity-100"
                                        }`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Info y Acciones de Compra ── */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between gap-4 mb-1">
                                {product.categoria ? (
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                        {product.categoria.nombre}
                                        {product.marca && ` · ${product.marca.nombre}`}
                                    </p>
                                ) : (
                                    <div />
                                )}
                                {product.sku && (
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                                        SKU: {product.sku}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-2">
                                {product.nombre}
                            </h1>
                            <StarRating rating={reviewStats.average} count={reviewStats.total} />
                        </div>

                        {/* Precio */}
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-extrabold text-slate-900">
                                S/ {precioFinal.toFixed(2)}
                            </span>
                            {tieneDescuento && (
                                <span className="text-lg text-slate-400 line-through">
                                    S/ {precioVariante.toFixed(2)}
                                </span>
                            )}
                        </div>

                        {/* Descripción */}
                        {product.descripcion && (
                            <p className="text-slate-600 text-sm leading-relaxed">{product.descripcion}</p>
                        )}

                        {/* Selector de Tallas */}
                        {tallasDisponibles.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                    Talla: {selectedTallaObj?.nombre ?? "Selecciona"}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {tallasDisponibles.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setSelectedTalla(t.id)}
                                            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                                selectedTalla === t.id
                                                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                                            }`}
                                        >
                                            {t.nombre}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Selector de Colores */}
                        {coloresDisponibles.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                    Color: {selectedColorObj?.nombre ?? "Selecciona"}
                                </label>
                                <div className="flex flex-wrap gap-2.5 items-center">
                                    {coloresDisponibles.map((c) => {
                                        const light = isLight(c.nombre);
                                        const active = selectedColor === c.id;
                                        return (
                                            <button
                                                key={c.id}
                                                onClick={() => setSelectedColor(c.id)}
                                                title={c.nombre}
                                                style={{ backgroundColor: c.nombre }}
                                                className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${
                                                    active ? "ring-2 ring-offset-2 ring-slate-900 scale-110 shadow-sm" : "border border-slate-200 hover:scale-105"
                                                }`}
                                            >
                                                {active && <Check size={11} className={light ? "text-slate-800" : "text-white"} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Cantidad */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Cantidad</label>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
                                    <button
                                        onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 text-slate-600 transition-colors"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="w-10 text-center font-bold text-sm text-slate-900">{cantidad}</span>
                                    <button
                                        onClick={() => setCantidad((c) => c + 1)}
                                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 text-slate-600 transition-colors"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Acciones principales: Agregar al carrito y Wishlist */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleAddToCart}
                                className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-md ${
                                    added ? "bg-emerald-600 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"
                                }`}
                            >
                                {added ? (
                                    <>
                                        <Check size={16} /> ¡Agregado al carrito!
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart size={16} /> Agregar al carrito
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => product && toggleFavorite(product.id)}
                                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
                                    wished
                                        ? "border-rose-300 bg-rose-50 text-rose-500 shadow-sm"
                                        : "border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-500"
                                }`}
                                title={wished ? "Quitar de favoritos" : "Guardar en favoritos"}
                            >
                                <Heart size={18} className={wished ? "fill-rose-500" : ""} />
                            </button>
                        </div>

                        {/* Beneficios */}
                        <div className="grid grid-cols-3 gap-3 pt-2">
                            {[
                                { icon: Truck, label: "Envío rápido" },
                                { icon: Shield, label: "Compra segura" },
                                { icon: RefreshCw, label: "30 días de cambios" },
                            ].map(({ icon: Icon, label }) => (
                                <div key={label} className="flex flex-col items-center gap-1.5 p-3 bg-slate-50 rounded-xl text-center">
                                    <Icon size={15} className="text-slate-500" />
                                    <p className="text-[10px] font-medium text-slate-600 leading-tight">{label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Botón de asesor por WhatsApp */}
                        <a
                            href={`https://wa.me/51987654321?text=${encodeURIComponent(
                                `¡Hola! Me interesa la prenda "${product.nombre}"${product.sku ? ` (SKU: ${product.sku})` : ""} de S/ ${precioFinal.toFixed(2)}. ¿Tienen stock disponible y asesoría de tallas?`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-center gap-2.5 w-full py-3.5 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.99]"
                        >
                            <svg
                                className="w-5 h-5 fill-current shrink-0 transition-transform group-hover:scale-110"
                                viewBox="0 0 24 24"
                            >
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                            </svg>
                            <span>Conversar con un asesor por WhatsApp</span>
                        </a>
                    </div>
                </div>

                {/* ═════════════════════════════════════════════════════════════════════════ */}
                {/* ── SECCIÓN: FICHA TÉCNICA Y VIDEO REEL DEL PRODUCTO ──                  */}
                {/* ═════════════════════════════════════════════════════════════════════════ */}
                <div className="mt-16 pt-10 border-t border-slate-200">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* ── Columna 1: Pestañas de Ficha Técnica y Tabla (7 cols) ── */}
                        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                            {/* Pestañas (Ficha Técnica | Detalles | Cambios y Devoluciones) */}
                            <div className="flex border-b border-slate-200 bg-slate-50/70 overflow-x-auto">
                                <button
                                    type="button"
                                    onClick={() => setSpecTab("ficha")}
                                    className={`px-5 py-3.5 text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap border-b-2 ${
                                        specTab === "ficha"
                                            ? "bg-white text-slate-900 border-slate-900 font-extrabold shadow-2xs"
                                            : "text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-100/60"
                                    }`}
                                >
                                    FICHA TÉCNICA
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSpecTab("detalles")}
                                    className={`px-5 py-3.5 text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap border-b-2 ${
                                        specTab === "detalles"
                                            ? "bg-white text-slate-900 border-slate-900 font-extrabold shadow-2xs"
                                            : "text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-100/60"
                                    }`}
                                >
                                    DETALLES
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSpecTab("cambios")}
                                    className={`px-5 py-3.5 text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap border-b-2 ${
                                        specTab === "cambios"
                                            ? "bg-white text-slate-900 border-slate-900 font-extrabold shadow-2xs"
                                            : "text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-100/60"
                                    }`}
                                >
                                    CAMBIOS Y DEVOLUCIONES
                                </button>
                            </div>

                            {/* Contenido de la Ficha Técnica / Detalles / Cambios */}
                            <div className="p-6">
                                {specTab === "ficha" && (
                                    <div className="divide-y divide-slate-100 text-xs sm:text-sm">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 py-3 gap-2">
                                            <span className="font-bold text-slate-900 tracking-wide">Marca</span>
                                            <span className="sm:col-span-2 text-slate-700 font-semibold uppercase">
                                                {product.marca?.nombre || "BENS"}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 py-3 gap-2">
                                            <span className="font-bold text-slate-900 tracking-wide">Modelo</span>
                                            <span className="sm:col-span-2 text-slate-700 font-medium uppercase">
                                                {product.modelo || product.sku || "9CY734"}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 py-3 gap-2">
                                            <span className="font-bold text-slate-900 tracking-wide">Entalle</span>
                                            <span className="sm:col-span-2 text-slate-700 font-medium uppercase">
                                                {product.entalle || "MODERN FIT"}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 py-3 gap-2">
                                            <span className="font-bold text-slate-900 tracking-wide">Composición</span>
                                            <span className="sm:col-span-2 text-slate-700 font-medium uppercase">
                                                {product.composicion || "100% ALGODÓN"}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 py-3 gap-2">
                                            <span className="font-bold text-slate-900 tracking-wide">Hecho en</span>
                                            <span className="sm:col-span-2 text-slate-700 font-medium uppercase">
                                                {product.hechoEn || "PERÚ"}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 py-3 gap-2 items-start">
                                            <span className="font-bold text-slate-900 tracking-wide">Información adicional</span>
                                            <span className="sm:col-span-2 text-slate-600 leading-relaxed uppercase text-[11px] sm:text-xs">
                                                {product.cuidado || "LAVAR SOLO A MANO, NO USAR BLANQUEADOR, SECAR TENDIDO SIN ESCURRIR, PLANCHA TEMPERATURA MÁX. 110 °C, NO LAVAR EN SECO."}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {specTab === "detalles" && (
                                    <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                                        <p className="text-slate-800 font-medium">
                                            {product.descripcion || "Prenda de corte sofisticado diseñada con materiales de alto rendimiento para garantizar el mejor confort y elegancia en cada ocasión."}
                                        </p>
                                        <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                                            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Aspectos destacados de confección:</h4>
                                            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
                                                <li>Tejido de textura refinada y resistencia superior contra el desgaste.</li>
                                                <li>Costuras reforzadas en hombros y cuello para conservar su horma original.</li>
                                                <li>Proceso de fijación de color que previene decoloración tras lavados repetidos.</li>
                                                {product.categoria?.nombre && (
                                                    <li>Categoría: <span className="font-semibold text-slate-800">{product.categoria.nombre}</span></li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {specTab === "cambios" && (
                                    <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                                        <div className="flex items-start gap-3 p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-100 text-indigo-950">
                                            <Shield className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-bold text-indigo-950 text-xs sm:text-sm">Garantía de Satisfacción Bens</h4>
                                                <p className="text-xs text-indigo-800/90 mt-0.5">
                                                    Cuentas con hasta 30 días calendario posteriores a tu compra para realizar cambios de talla o prenda.
                                                </p>
                                            </div>
                                        </div>
                                        <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs">
                                            <li>La prenda debe encontrarse en su estado original, con etiquetas y empaques intactos.</li>
                                            <li>No debe presentar manchas, olores ni evidencias de uso o lavado previo.</li>
                                            <li>Presentar comprobante de pago emitido digitalmente al momento de la compra.</li>
                                            <li>Los cambios pueden realizarse en nuestras tiendas oficiales o coordinando recojo a domicilio.</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Columna 2: Video Reel / TikTok del Producto (5 cols) ── */}
                        <div className="lg:col-span-5 flex flex-col justify-between">
                            <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl group aspect-video sm:aspect-[16/10] lg:aspect-[4/3] flex items-center justify-center">
                                {getYoutubeEmbedUrl(product.videoUrl) ? (
                                    <iframe
                                        src={getYoutubeEmbedUrl(product.videoUrl)!}
                                        title={`Reel de Producto - ${product.nombre}`}
                                        className="w-full h-full border-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : product.videoUrl && (product.videoUrl.endsWith(".mp4") || product.videoUrl.endsWith(".webm") || product.videoUrl.startsWith("http")) ? (
                                    <>
                                        <video
                                            ref={videoRef}
                                            src={product.videoUrl}
                                            className="w-full h-full object-cover"
                                            autoPlay
                                            loop
                                            muted={isVideoMuted}
                                            playsInline
                                        />
                                        {/* Overlay controles estilo TikTok / Reel */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none flex flex-col justify-between p-4">
                                            <div className="flex items-center justify-between">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white tracking-wider uppercase border border-white/10">
                                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                                    Reel de Producto
                                                </span>
                                            </div>

                                            <div className="space-y-0.5 pointer-events-auto">
                                                <h4 className="text-white text-xs sm:text-sm font-bold line-clamp-1 drop-shadow">
                                                    {product.nombre}
                                                </h4>
                                                <p className="text-slate-300 text-[11px] line-clamp-1 drop-shadow">
                                                    {product.entalle || "MODERN FIT"} • {product.composicion || "100% Algodón"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Botones de acción flotantes para el video */}
                                        <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
                                            <button
                                                type="button"
                                                onClick={togglePlayVideo}
                                                className="w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md text-white flex items-center justify-center transition-all shadow hover:scale-105 active:scale-95"
                                                title={isVideoPlaying ? "Pausar video" : "Reproducir video"}
                                            >
                                                {isVideoPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={toggleMuteVideo}
                                                className="w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md text-white flex items-center justify-center transition-all shadow hover:scale-105 active:scale-95"
                                                title={isVideoMuted ? "Activar audio" : "Silenciar audio"}
                                            >
                                                {isVideoMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    /* Reproductor Reel interactivo con vista de prenda */
                                    <div className="relative w-full h-full flex flex-col justify-between p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white overflow-hidden">
                                        {product.imagenes?.[0] && (
                                            <img
                                                src={resolveImage(product.imagenes[0])}
                                                alt={product.nombre}
                                                className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-xs scale-105"
                                            />
                                        )}
                                        <div className="relative z-10 flex items-center justify-between">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-bold text-white tracking-wider uppercase border border-white/10">
                                                <VideoIcon size={12} className="text-rose-400" />
                                                Reel de Exhibición
                                            </span>
                                            <span className="text-[10px] text-slate-300 font-mono bg-black/40 px-2 py-0.5 rounded">
                                                HD 1080p
                                            </span>
                                        </div>

                                        <div className="relative z-10 my-auto text-center py-4">
                                            <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                                                <Play size={22} className="text-white ml-1 fill-white" />
                                            </div>
                                            <h4 className="text-sm font-bold text-white mb-1">
                                                {product.nombre}
                                            </h4>
                                            <p className="text-[11px] text-slate-300 max-w-xs mx-auto">
                                                Aprecia la caída de la prenda, costuras y entalle {product.entalle || "MODERN FIT"} en video.
                                            </p>
                                        </div>

                                        <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10 pt-3">
                                            <span>Bens Studio Official Reel</span>
                                            <span className="text-white font-medium flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Reel Activo
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <p className="text-[11px] text-slate-500 text-center mt-2.5 flex items-center justify-center gap-1.5">
                                <VideoIcon size={13} className="text-slate-400" />
                                Video reel horizontal para apreciar textura y entalle en movimiento.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ═════════════════════════════════════════════════════════════════════════ */}
                {/* ── SECCIÓN 1: VALORACIONES Y COMENTARIOS DE USUARIOS ──                */}
                {/* ═════════════════════════════════════════════════════════════════════════ */}
                <div className="mt-20 pt-12 border-t border-slate-200/80">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full mb-2">
                                <Star size={13} className="fill-amber-500 text-amber-500" />
                                Opiniones y Reseñas
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                Valoraciones de nuestros clientes
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                Experiencias reales compartidas por compradores de esta prenda.
                            </p>
                        </div>

                        {/* Tarjeta de promedio con desglose */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-6 self-start md:self-auto shadow-xs">
                            <div className="text-center pr-4 border-r border-slate-200">
                                <div className="text-3xl font-extrabold text-slate-900 leading-none">
                                    {reviewStats.average.toFixed(1)}
                                </div>
                                <div className="flex gap-0.5 justify-center mt-1.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            size={13}
                                            className={
                                                s <= Math.round(reviewStats.average)
                                                    ? "fill-amber-400 text-amber-400"
                                                    : "fill-slate-200 text-slate-200"
                                            }
                                        />
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1 whitespace-nowrap">
                                    {reviewStats.total} {reviewStats.total === 1 ? "opinión" : "opiniones"}
                                </p>
                            </div>

                            {/* Barras de distribución de 5 a 1 estrellas */}
                            <div className="space-y-1 w-32 sm:w-40 text-[10px] text-slate-500">
                                {[5, 4, 3, 2, 1].map((stars) => {
                                    const count = ratingBreakdown[stars] || 0;
                                    const pct = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                                    return (
                                        <div key={stars} className="flex items-center gap-1.5">
                                            <span className="w-2.5 text-right font-medium">{stars}</span>
                                            <Star size={9} className="fill-amber-400 text-amber-400 shrink-0" />
                                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="w-3 text-right text-[9px] text-slate-400">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Formulario pegajoso para dejar valoración */}
                        <div className="lg:col-span-1 bg-slate-50/80 rounded-2xl p-6 border border-slate-100 lg:sticky lg:top-24 shadow-xs">
                            <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
                                <MessageSquare size={16} className="text-slate-600" />
                                Deja tu valoración
                            </h3>
                            <p className="text-xs text-slate-500 mb-4">
                                Cuéntale a otros compradores cómo te quedó la prenda y la calidad de la tela.
                            </p>

                            {user ? (
                                <form onSubmit={handleReviewSubmit} className="space-y-4">
                                    {/* Selector interactivo de estrellas */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tu calificación</label>
                                        <div className="flex gap-1.5">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onMouseEnter={() => setHoverRating(s)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    onClick={() => setNewRating(s)}
                                                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                                                >
                                                    <Star
                                                        size={22}
                                                        className={
                                                            s <= (hoverRating || newRating)
                                                                ? "fill-amber-400 text-amber-400"
                                                                : "fill-slate-200 text-slate-200"
                                                        }
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Comentario */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tu opinión</label>
                                        <textarea
                                            rows={3}
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Excelente confección, la tela es suave y el ajuste es perfecto..."
                                            required
                                            className="w-full text-xs bg-white border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        />
                                    </div>

                                    {reviewMessage && (
                                        <p className="text-xs font-medium text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 transition-all">
                                            {reviewMessage}
                                        </p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={submittingReview || !newComment.trim()}
                                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-all shadow-xs"
                                    >
                                        <Send size={13} />
                                        {submittingReview ? "Publicando..." : "Publicar opinión"}
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center py-4 bg-white rounded-xl border border-slate-100 p-4 space-y-3">
                                    <p className="text-xs text-slate-600">
                                        Debes iniciar sesión con tu cuenta para dejar una reseña.
                                    </p>
                                    <Link
                                        to={`/login?redirect=/product/${product.id}`}
                                        className="inline-block text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-xl transition-colors"
                                    >
                                        Iniciar sesión
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Listado de reseñas con Controles y Carrusel / Scroll */}
                        <div className="lg:col-span-2 space-y-3">
                            {/* Barra de Controles superior de las reseñas */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <div className="text-xs font-bold text-slate-800">
                                    {reviewStats.reviews.length === 0
                                        ? "Opiniones"
                                        : `${reviewStats.reviews.length} ${reviewStats.reviews.length === 1 ? "opinión de clientes" : "opiniones de clientes"}`}
                                </div>

                                {reviewStats.reviews.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        {/* Selector de modo: Carrusel vs Scroll */}
                                        <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                                            <button
                                                onClick={() => setReviewViewMode("carousel")}
                                                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                                                    reviewViewMode === "carousel"
                                                        ? "bg-white text-slate-900 shadow-xs"
                                                        : "text-slate-500 hover:text-slate-700"
                                                }`}
                                                title="Vista carrusel horizontal"
                                            >
                                                <SlidersHorizontal size={12} />
                                                Carrusel
                                            </button>
                                            <button
                                                onClick={() => setReviewViewMode("scroll")}
                                                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                                                    reviewViewMode === "scroll"
                                                        ? "bg-white text-slate-900 shadow-xs"
                                                        : "text-slate-500 hover:text-slate-700"
                                                }`}
                                                title="Vista lista con scroll contenido"
                                            >
                                                <List size={12} />
                                                Lista
                                            </button>
                                        </div>

                                        {/* Flechas de navegación para el carrusel */}
                                        {reviewViewMode === "carousel" && reviewStats.reviews.length > 1 && (
                                            <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                                                <button
                                                    onClick={() => handleScrollReviews("left")}
                                                    className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                                                    title="Anterior"
                                                >
                                                    <ChevronLeft size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleScrollReviews("right")}
                                                    className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                                                    title="Siguiente"
                                                >
                                                    <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Contenido de Reseñas */}
                            {reviewStats.reviews.length === 0 ? (
                                <div className="bg-slate-50/50 rounded-2xl p-10 text-center border border-dashed border-slate-200">
                                    <MessageSquare size={32} className="mx-auto text-slate-300 mb-2" />
                                    <h4 className="text-sm font-semibold text-slate-700">Aún no hay reseñas</h4>
                                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                        Sé el primero en contarnos tu experiencia con esta prenda.
                                    </p>
                                </div>
                            ) : reviewViewMode === "carousel" ? (
                                /* ── Modo 1: Carrusel Horizontal Deslizante ── */
                                <div>
                                    <div
                                        ref={reviewsScrollRef}
                                        onScroll={updateScrollButtons}
                                        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 pb-3 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
                                    >
                                        {reviewStats.reviews.map((rev) => (
                                            <div
                                                key={rev.id}
                                                className="w-[280px] sm:w-[320px] shrink-0 snap-start bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between mb-2.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                                                {rev.cliente?.nombre ? rev.cliente.nombre[0].toUpperCase() : "U"}
                                                            </div>
                                                            <div className="truncate">
                                                                <h5 className="text-xs font-bold text-slate-900 leading-tight truncate">
                                                                    {rev.cliente ? `${rev.cliente.nombre} ${rev.cliente.apellido || ""}` : "Cliente verificado"}
                                                                </h5>
                                                                <span className="text-[10px] text-slate-400">
                                                                    {new Date(rev.createdAt).toLocaleDateString("es-PE", {
                                                                        day: "numeric",
                                                                        month: "short",
                                                                        year: "numeric",
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-0.5 shrink-0">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Star
                                                                    key={s}
                                                                    size={11}
                                                                    className={s <= rev.calificacion ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                                                        "{rev.comentario}"
                                                    </p>
                                                </div>

                                                <div className="pt-2 border-t border-slate-50 flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium">
                                                    <Check size={12} />
                                                    Compra verificada
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-400 text-right mt-1">
                                        Desliza horizontalmente o usa las flechas para explorar más opiniones.
                                    </p>
                                </div>
                            ) : (
                                /* ── Modo 2: Lista con Scroll Interno Acotado (Nunca desborda la página) ── */
                                <div className="max-h-[440px] overflow-y-auto space-y-3 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
                                    {reviewStats.reviews.map((rev) => (
                                        <div
                                            key={rev.id}
                                            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-2.5 transition-all hover:border-slate-200"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                                                        {rev.cliente?.nombre ? rev.cliente.nombre[0].toUpperCase() : "U"}
                                                    </div>
                                                    <div>
                                                        <h5 className="text-xs font-bold text-slate-900 leading-tight">
                                                            {rev.cliente ? `${rev.cliente.nombre} ${rev.cliente.apellido || ""}` : "Cliente verificado"}
                                                        </h5>
                                                        <span className="text-[10px] text-slate-400">
                                                            {new Date(rev.createdAt).toLocaleDateString("es-PE", {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric",
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Star
                                                            key={s}
                                                            size={12}
                                                            className={s <= rev.calificacion ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed pl-10">
                                                {rev.comentario}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ═════════════════════════════════════════════════════════════════════════ */}
                {/* ── SECCIÓN 2: PRODUCTOS MÁS VENDIDOS Y RELACIONADOS ──                 */}
                {/* ═════════════════════════════════════════════════════════════════════════ */}
                <div className="mt-20 pt-12 border-t border-slate-200/80">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                        <div>
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                <Sparkles size={13} className="text-amber-500" />
                                Recomendados para ti
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                Descubre más prendas exclusivas
                            </h2>
                        </div>

                        {/* Selector de pestañas: Relacionados vs Más vendidos */}
                        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                            <button
                                onClick={() => setRecommendationTab("related")}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                    recommendationTab === "related"
                                        ? "bg-white text-slate-900 shadow-xs"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                Prendas similares
                                {relatedProducts.length > 0 && (
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
                                        {relatedProducts.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setRecommendationTab("bestsellers")}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                    recommendationTab === "bestsellers"
                                        ? "bg-white text-slate-900 shadow-xs"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                <Flame size={13} className="text-amber-500" />
                                Los Más Vendidos
                            </button>
                        </div>
                    </div>

                    {/* Rejilla de productos recomendados */}
                    {recommendationTab === "related" ? (
                        relatedProducts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {relatedProducts.map((item) => (
                                    <RecommendationCard key={item.id} item={item} />
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center bg-slate-50/60 rounded-2xl border border-slate-100">
                                <p className="text-xs text-slate-400">
                                    No hay más prendas en esta categoría por el momento.
                                </p>
                            </div>
                        )
                    ) : (
                        bestSellers.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {bestSellers.map((item) => (
                                    <RecommendationCard key={item.id} item={item} badgeText="🔥 Top Ventas" />
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center bg-slate-50/60 rounded-2xl border border-slate-100">
                                <p className="text-xs text-slate-400">
                                    No se encontraron productos populares en este momento.
                                </p>
                            </div>
                        )
                    )}
                </div>

                {/* Enlace para volver */}
                <div className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
                    >
                        <ChevronLeft size={16} /> Volver a la página anterior
                    </button>
                    <Link
                        to="/catalog"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900"
                    >
                        Ver todo el catálogo
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
