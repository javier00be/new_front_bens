import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    ShoppingCart, Package, AlertTriangle, TrendingUp,
    ClipboardList, Factory, ArrowUpRight, Truck,
} from "lucide-react";
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { api } from "@/api";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DashboardStats {
    totalVentas:       number;
    totalPedidos:      number;
    pedidosPendientes: number;
    productosActivos:  number;
    stockBajo:         number;
    ordenesProduccion: number;
    pedidosHoy:        number;
    ventasHoy:         number;
}

interface VentaSerie { mes: string; total: number }
interface PedidoEstado { name: string; value: number; color: string }
interface ProduccionSerie { name: string; completado: number; pendiente: number; enProceso: number }

// ─── Helpers ───────────────────────────────────────────────────────────────────

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const buildVentasSeries = (ventas: { createdAt: string; pedido?: { total?: number } }[]): VentaSerie[] => {
    const ahora = new Date();
    const map: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
        const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
        map[`${d.getFullYear()}-${d.getMonth()}`] = 0;
    }
    ventas.forEach(v => {
        const d = new Date(v.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (key in map) map[key] += Number(v.pedido?.total ?? 0);
    });
    return Object.entries(map).map(([key, total]) => {
        const [year, month] = key.split("-").map(Number);
        return { mes: `${MESES[month]} ${String(year).slice(2)}`, total: Math.round(total * 100) / 100 };
    });
};

const buildEstadosSeries = (pedidos: { estado: string }[]): PedidoEstado[] => {
    const map: Record<string, { color: string }> = {
        PENDIENTE:  { color: "#f59e0b" },
        PROCESANDO: { color: "#3b82f6" },
        PAGADO:     { color: "#10b981" },
        EN_CAMINO:  { color: "#8b5cf6" },
        ENTREGADO:  { color: "#6366f1" },
        CANCELADO:  { color: "#f43f5e" },
    };
    const labels: Record<string, string> = {
        PENDIENTE: "Pendiente", PROCESANDO: "Procesando", PAGADO: "Pagado",
        EN_CAMINO: "En camino", ENTREGADO: "Entregado",  CANCELADO: "Cancelado",
    };
    const counts: Record<string, number> = {};
    pedidos.forEach(p => { counts[p.estado] = (counts[p.estado] ?? 0) + 1; });
    return Object.entries(counts)
        .filter(([, v]) => v > 0)
        .map(([estado, value]) => ({ name: labels[estado] ?? estado, value, color: map[estado]?.color ?? "#94a3b8" }));
};

const buildProduccionSeries = (ordenes: { estado: string; producto?: { nombre: string } }[]): ProduccionSerie[] => {
    const map: Record<string, { completado: number; pendiente: number; enProceso: number }> = {};
    ordenes.forEach(o => {
        const nombre = o.producto?.nombre ?? "Otro";
        if (!map[nombre]) map[nombre] = { completado: 0, pendiente: 0, enProceso: 0 };
        if (o.estado === "COMPLETADO") map[nombre].completado++;
        else if (o.estado === "PENDIENTE") map[nombre].pendiente++;
        else if (o.estado === "EN_PROCESO") map[nombre].enProceso++;
    });
    return Object.entries(map)
        .slice(0, 6)
        .map(([name, v]) => ({ name: name.length > 12 ? name.slice(0, 12) + "…" : name, ...v }));
};

// ─── Custom Tooltip ────────────────────────────────────────────────────────────

const VentasTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-100 shadow-lg rounded-xl px-4 py-3 text-sm">
            <p className="font-semibold text-slate-700 mb-1">{label}</p>
            <p className="text-indigo-600 font-bold">S/ {payload[0].value.toFixed(2)}</p>
        </div>
    );
};

// ─── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonStat = () => (
    <div className="flex items-stretch overflow-hidden rounded-xl border-0 shadow-sm">
        <div className="w-1.5 bg-slate-200 rounded-l-xl shrink-0" />
        <div className="flex-1 px-5 py-4 space-y-2">
            <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
            <div className="h-7 w-16 bg-slate-100 rounded animate-pulse" />
        </div>
    </div>
);

const SkeletonChart = () => (
    <div className="h-52 flex items-end gap-2 px-2 pb-2">
        {[60, 80, 45, 90, 55, 75].map((h, i) => (
            <div key={i} className="flex-1 bg-slate-100 rounded-t animate-pulse" style={{ height: `${h}%` }} />
        ))}
    </div>
);

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export const ERPDashboard = () => {
    const { user } = useAuth();
    const [stats,        setStats]        = useState<DashboardStats | null>(null);
    const [ventasSeries, setVentasSeries] = useState<VentaSerie[]>([]);
    const [estadosSeries,setEstadosSeries]= useState<PedidoEstado[]>([]);
    const [prodSeries,   setProdSeries]   = useState<ProduccionSerie[]>([]);
    const [isLoading,    setIsLoading]    = useState(true);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const [ventas, pedidos, productos, stockBajo, produccion] = await Promise.allSettled([
                    api.get("/sales"),
                    api.get("/orders"),
                    api.get("/products"),
                    api.get("/inventory/low-stock"),
                    api.get("/production"),
                ]);

                const ventasData    = ventas.status    === "fulfilled" ? ventas.value.data    : [];
                const pedidosData   = pedidos.status   === "fulfilled" ? pedidos.value.data   : [];
                const productosData = productos.status === "fulfilled" ? (productos.value.data?.data ?? productos.value.data) : [];
                const stockBajoData = stockBajo.status === "fulfilled" ? stockBajo.value.data : [];
                const produccionData= produccion.status=== "fulfilled" ? produccion.value.data: [];

                const hoy = new Date().toDateString();

                setStats({
                    totalVentas:       ventasData.reduce((s: number, v: { pedido?: { total?: number } }) => s + Number(v.pedido?.total ?? 0), 0),
                    totalPedidos:      pedidosData.length,
                    pedidosPendientes: pedidosData.filter((p: { estado: string }) => p.estado === "PENDIENTE").length,
                    productosActivos:  Array.isArray(productosData) ? productosData.filter((p: { estado: string }) => p.estado === "ACTIVO").length : 0,
                    stockBajo:         stockBajoData.length,
                    ordenesProduccion: produccionData.filter((o: { estado: string }) => o.estado === "EN_PROCESO").length,
                    pedidosHoy:        pedidosData.filter((p: { createdAt: string }) => new Date(p.createdAt).toDateString() === hoy).length,
                    ventasHoy:         ventasData.filter((v: { createdAt: string }) => new Date(v.createdAt).toDateString() === hoy)
                                           .reduce((s: number, v: { pedido?: { total?: number } }) => s + Number(v.pedido?.total ?? 0), 0),
                });

                setVentasSeries(buildVentasSeries(ventasData));
                setEstadosSeries(buildEstadosSeries(pedidosData));
                setProdSeries(buildProduccionSeries(produccionData));
            } catch (err) {
                console.error("Dashboard error:", err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const hora   = new Date().getHours();
    const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";
    const nombre = user?.correo?.split("@")[0] ?? "usuario";

    const kpis = stats ? [
        { label: "Ventas totales",    value: `S/ ${stats.totalVentas.toFixed(2)}`,  sub: `S/ ${stats.ventasHoy.toFixed(2)} hoy`,        color: "indigo",  icon: <TrendingUp className="w-4 h-4 text-indigo-600" /> },
        { label: "Pedidos",           value: stats.totalPedidos,                    sub: `${stats.pedidosHoy} hoy`,                      color: "emerald", icon: <ShoppingCart className="w-4 h-4 text-emerald-600" /> },
        { label: "Pendientes",        value: stats.pedidosPendientes,               sub: "Por confirmar pago",                           color: "amber",   icon: <ClipboardList className="w-4 h-4 text-amber-600" /> },
        { label: "Productos activos", value: stats.productosActivos,                sub: "En catálogo",                                  color: "blue",    icon: <Package className="w-4 h-4 text-blue-600" /> },
        { label: "Stock bajo",        value: stats.stockBajo,                       sub: "Requieren reposición",                         color: "rose",    icon: <AlertTriangle className="w-4 h-4 text-rose-600" /> },
        { label: "Producción activa", value: stats.ordenesProduccion,               sub: "Órdenes en proceso",                           color: "violet",  icon: <Factory className="w-4 h-4 text-violet-600" /> },
    ] : [];

    return (
        <div className="space-y-6 pb-8">

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 px-8 py-7 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.25),transparent_60%)]" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">Panel principal</p>
                        <h1 className="text-2xl font-bold text-white">
                            {saludo}, <span className="text-indigo-300">{nombre}</span>
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            {new Date().toLocaleDateString("es-PE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </p>
                    </div>
                    <div className="hidden md:flex items-center gap-3 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                            <Truck className="w-3.5 h-3.5 text-violet-400" />
                            <span>ERP Textil</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => <SkeletonStat key={i} />)
                    : kpis.map(({ label, value, sub, color, icon }) => (
                        <Card key={label} className="border-0 shadow-sm overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex items-stretch">
                                    <div className={`w-1.5 bg-${color}-500 rounded-l-xl shrink-0`} />
                                    <div className="flex-1 px-5 py-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
                                            <div className={`w-7 h-7 rounded-lg bg-${color}-50 flex items-center justify-center`}>{icon}</div>
                                        </div>
                                        <p className={`text-2xl font-bold text-${color}-700 tabular-nums`}>{value}</p>
                                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                            <ArrowUpRight className="w-3 h-3" />{sub}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                }
            </div>

            {/* Gráficos — fila 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Ventas últimos 6 meses — área */}
                <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden lg:col-span-2">
                    <CardHeader className="px-6 py-4 border-b border-slate-100">
                        <CardTitle className="text-base">Ventas últimos 6 meses</CardTitle>
                        <CardDescription>Acumulado mensual en soles</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-3">
                        {isLoading ? <SkeletonChart /> : (
                            <ResponsiveContainer width="100%" height={210}>
                                <AreaChart data={ventasSeries} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.18} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `S/${v}`} width={52} />
                                    <Tooltip content={<VentasTooltip />} />
                                    <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradVentas)" dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Estado de pedidos — pie */}
                <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="px-6 py-4 border-b border-slate-100">
                        <CardTitle className="text-base">Estado de pedidos</CardTitle>
                        <CardDescription>Distribución actual</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-3">
                        {isLoading ? <SkeletonChart /> : estadosSeries.length === 0 ? (
                            <div className="h-[210px] flex items-center justify-center text-sm text-slate-400">Sin pedidos</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={210}>
                                <PieChart>
                                    <Pie
                                        data={estadosSeries}
                                        cx="50%" cy="45%"
                                        innerRadius={52} outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {estadosSeries.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v, n) => [String(v), String(n)]} />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Gráficos — fila 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Producción por producto — barras */}
                <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="px-6 py-4 border-b border-slate-100">
                        <CardTitle className="text-base">Órdenes de producción</CardTitle>
                        <CardDescription>Por producto y estado</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-3">
                        {isLoading ? <SkeletonChart /> : prodSeries.length === 0 ? (
                            <div className="h-[210px] flex items-center justify-center text-sm text-slate-400">Sin órdenes registradas</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={210}>
                                <BarChart data={prodSeries} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={10}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                    <Bar dataKey="completado" name="Completado" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="enProceso"  name="En proceso" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="pendiente"  name="Pendiente"  fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Actividad reciente */}
                <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="px-6 py-4 border-b border-slate-100">
                        <CardTitle className="text-base">Resumen del sistema</CardTitle>
                        <CardDescription>Estado actual de los módulos</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between py-2">
                                    <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
                                    <div className="h-3 w-12 bg-slate-100 rounded animate-pulse" />
                                </div>
                            ))
                        ) : stats ? [
                            { label: "Ventas confirmadas",    value: `S/ ${stats.totalVentas.toFixed(2)}`,  dot: "bg-indigo-500"  },
                            { label: "Pedidos activos",       value: `${stats.totalPedidos - (stats.pedidosPendientes)}`,          dot: "bg-emerald-500" },
                            { label: "Pedidos por pagar",     value: stats.pedidosPendientes,               dot: "bg-amber-500"   },
                            { label: "Alertas de stock bajo", value: stats.stockBajo,                       dot: stats.stockBajo > 0 ? "bg-rose-500 animate-pulse" : "bg-slate-200" },
                            { label: "Producción en curso",   value: stats.ordenesProduccion,               dot: "bg-violet-500"  },
                            { label: "Productos en catálogo", value: stats.productosActivos,                dot: "bg-blue-500"    },
                        ].map(({ label, value, dot }) => (
                            <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                <div className="flex items-center gap-2.5">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                                    <span className="text-sm text-slate-600">{label}</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-800 tabular-nums">{value}</span>
                            </div>
                        )) : null}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
