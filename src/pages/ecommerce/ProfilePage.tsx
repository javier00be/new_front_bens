import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    User,
    Mail,
    Phone,
    FileText,
    MapPin,
    Bell,
    Camera,
    Plus,
    Trash2,
    CheckCircle2,
    Check,
    Save,
    AlertCircle,
    ArrowLeft,
    LogOut,
    ShieldCheck,
    ExternalLink,
    Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
    getProfile,
    updateProfile,
    type UserProfile,
} from "@/features/ecommerce/profile/services/profile.service";
import {
    getMyAddresses,
    createAddress,
    setPrimaryAddress,
    deleteAddress,
    type Address,
    type CreateAddressDto,
} from "@/features/ecommerce/profile/services/addresses.service";
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    type NotificationItem,
} from "@/features/ecommerce/profile/services/notifications.service";
import { sileo } from "sileo";

export function ProfilePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Pestaña activa: "datos" | "direcciones" | "notificaciones"
    const [activeTab, setActiveTab] = useState<"datos" | "direcciones" | "notificaciones">("datos");

    // Estados de perfil
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);

    // Campos de formulario de datos
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [telefono, setTelefono] = useState("");
    const [documento, setDocumento] = useState("");
    const [fotoPreview, setFotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Estados de direcciones
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [savingAddress, setSavingAddress] = useState(false);
    const [newAddress, setNewAddress] = useState<CreateAddressDto>({
        alias: "Casa",
        direccion: "",
        departamento: "Lima",
        provincia: "Lima",
        distrito: "",
        referencia: "",
        esPrincipal: false,
    });

    // Estados de notificaciones
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    // Cargar perfil completo
    const loadProfileData = async () => {
        try {
            setLoadingProfile(true);
            const data = await getProfile();
            setProfile(data);
            setNombre(data.cliente?.nombre || "");
            setApellido(data.cliente?.apellido || "");
            setTelefono(data.cliente?.telefono || "");
            setDocumento(data.cliente?.documento || "");
            setFotoPreview(data.cliente?.foto || data.foto || null);
        } catch (err) {
            console.error("Error al cargar perfil:", err);
            sileo.error({ title: "Error", description: "No se pudieron cargar tus datos de perfil." });
        } finally {
            setLoadingProfile(false);
        }
    };

    // Cargar direcciones
    const loadAddresses = async () => {
        try {
            setLoadingAddresses(true);
            const list = await getMyAddresses();
            setAddresses(list);
        } catch (err) {
            console.error("Error al cargar direcciones:", err);
        } finally {
            setLoadingAddresses(false);
        }
    };

    // Cargar notificaciones
    const loadNotifications = async () => {
        try {
            setLoadingNotifications(true);
            const list = await getNotifications();
            setNotifications(list);
        } catch (err) {
            console.error("Error al cargar notificaciones:", err);
        } finally {
            setLoadingNotifications(false);
        }
    };

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }
        loadProfileData();
        loadAddresses();
        loadNotifications();
    }, [user]);

    // Manejar subida de foto
    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            sileo.warning({ title: "Imagen muy pesada", description: "Selecciona una foto menor a 5MB." });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setFotoPreview(base64);
        };
        reader.readAsDataURL(file);
    };

    // Guardar cambios de perfil
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            const updated = await updateProfile({
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                telefono: telefono.trim() || undefined,
                documento: documento.trim() || undefined,
                foto: fotoPreview || undefined,
            });
            setProfile(updated);
            sileo.success({ title: "Perfil actualizado", description: "Tus datos han sido guardados exitosamente." });
        } catch (err) {
            console.error("Error al guardar perfil:", err);
            sileo.error({ title: "Error", description: "No se pudo actualizar tu perfil." });
        } finally {
            setSavingProfile(false);
        }
    };

    // Crear dirección
    const handleCreateAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAddress.direccion.trim() || !newAddress.distrito.trim()) {
            sileo.warning({ title: "Campos incompletos", description: "Por favor ingresa la dirección y distrito." });
            return;
        }
        setSavingAddress(true);
        try {
            await createAddress(newAddress);
            sileo.success({ title: "Dirección guardada", description: "Tu dirección ha sido añadida a tu libreta." });
            setShowAddressModal(false);
            setNewAddress({
                alias: "Casa",
                direccion: "",
                departamento: "Lima",
                provincia: "Lima",
                distrito: "",
                referencia: "",
                esPrincipal: false,
            });
            await loadAddresses();
        } catch (err) {
            console.error("Error al crear dirección:", err);
            sileo.error({ title: "Error", description: "No se pudo registrar la dirección." });
        } finally {
            setSavingAddress(false);
        }
    };

    // Establecer dirección como principal
    const handleSetPrimary = async (id: number) => {
        try {
            await setPrimaryAddress(id);
            sileo.success({ title: "Dirección principal", description: "Has cambiado tu dirección preferida." });
            await loadAddresses();
        } catch (err) {
            console.error("Error al cambiar dirección principal:", err);
            sileo.error({ title: "Error", description: "No se pudo actualizar la dirección principal." });
        }
    };

    // Eliminar dirección
    const handleDeleteAddress = async (id: number) => {
        if (!confirm("¿Seguro que deseas eliminar esta dirección?")) return;
        try {
            await deleteAddress(id);
            sileo.success({ title: "Dirección eliminada", description: "La dirección fue quitada de tu libreta." });
            await loadAddresses();
        } catch (err) {
            console.error("Error al eliminar dirección:", err);
            sileo.error({ title: "Error", description: "No se pudo eliminar la dirección." });
        }
    };

    // Marcar notificación como leída
    const handleReadNotification = async (id: number) => {
        try {
            await markNotificationAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
            );
        } catch (err) {
            console.error("Error al marcar leída:", err);
        }
    };

    // Marcar todas las notificaciones como leídas
    const handleReadAllNotifications = async () => {
        try {
            await markAllNotificationsAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
            sileo.success({ title: "Notificaciones", description: "Todas las notificaciones marcadas como leídas." });
        } catch (err) {
            console.error("Error al marcar todas:", err);
        }
    };

    const unreadCount = notifications.filter((n) => !n.leida).length;

    if (loadingProfile) {
        return (
            <div className="min-h-screen bg-slate-50 pt-28 pb-16 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-500 font-medium">Cargando tu perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/60 pt-24 pb-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                {/* ── Breadcrumb & Top Action ── */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft size={14} />
                        Volver a la tienda
                    </Link>

                    {user?.rol === "ADMINISTRADOR" && (
                        <Link
                            to="/admin"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
                        >
                            Panel de Administración ERP
                            <ExternalLink size={12} />
                        </Link>
                    )}
                </div>

                {/* ── Header Card de Perfil Limpio (Sin portada oscura) ── */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden mb-8">
                    {/* Información del usuario y Avatar interactivo */}
                    <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                        <div className="flex items-center gap-5">
                            {/* Avatar con botón de cambiar foto */}
                            <div className="relative group shrink-0">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden shadow-xs">
                                    {fotoPreview ? (
                                        <img
                                            src={fotoPreview}
                                            alt={nombre || user?.correo}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-900 text-white flex items-center justify-center text-2xl sm:text-3xl font-extrabold uppercase">
                                            {nombre ? nombre[0] : user?.correo[0] || "U"}
                                        </div>
                                    )}
                                </div>

                                {/* Botón flotante para cambiar foto */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                    title="Cambiar foto de perfil"
                                >
                                    <Camera size={14} />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePhotoSelect}
                                />
                            </div>

                            {/* Nombres, Correo y Rol */}
                            <div>
                                <div className="flex flex-wrap items-center gap-2.5 mb-1">
                                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                                        {nombre && apellido
                                            ? `${nombre} ${apellido}`
                                            : nombre || user?.correo.split("@")[0]}
                                    </h1>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <ShieldCheck size={12} />
                                        {user?.rol === "ADMINISTRADOR" ? "Administrador" : "Cliente"}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <Mail size={13} className="text-slate-400" />
                                    {profile?.correo}
                                </p>
                            </div>
                        </div>

                        {/* Botón cerrar sesión */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <button
                                type="button"
                                onClick={logout}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                            >
                                <LogOut size={14} />
                                Cerrar sesión
                            </button>
                        </div>
                    </div>

                    {/* Barra de pestañas */}
                    <div className="flex border-t border-slate-100 bg-slate-50/50 px-6 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setActiveTab("datos")}
                            className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                                activeTab === "datos"
                                    ? "border-slate-900 text-slate-900 bg-white"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <User size={14} />
                            Mis Datos
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("direcciones")}
                            className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                                activeTab === "direcciones"
                                    ? "border-slate-900 text-slate-900 bg-white"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <MapPin size={14} />
                            Direcciones
                            {addresses.length > 0 && (
                                <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                                    {addresses.length}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("notificaciones")}
                            className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                                activeTab === "notificaciones"
                                    ? "border-slate-900 text-slate-900 bg-white"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <Bell size={14} />
                            Notificaciones
                            {unreadCount > 0 && (
                                <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white animate-pulse">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* ═════════════════════════════════════════════════════════════════════════ */}
                {/* ── PESTAÑA 1: MIS DATOS PERSONALES ──                                   */}
                {/* ═════════════════════════════════════════════════════════════════════════ */}
                {activeTab === "datos" && (
                    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8">
                        <div className="max-w-2xl">
                            <h2 className="text-lg font-bold text-slate-900 mb-1">
                                Información de tu cuenta
                            </h2>
                            <p className="text-xs text-slate-500 mb-6">
                                Actualiza tus datos de contacto y facturación para tus próximas compras.
                            </p>

                            <form onSubmit={handleSaveProfile} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Nombres
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={nombre}
                                                onChange={(e) => setNombre(e.target.value)}
                                                placeholder="Ej. Juan Carlos"
                                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                                                required
                                            />
                                            <User size={15} className="absolute left-3 top-3 text-slate-400" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Apellidos
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={apellido}
                                                onChange={(e) => setApellido(e.target.value)}
                                                placeholder="Ej. Pérez Quispe"
                                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                                                required
                                            />
                                            <User size={15} className="absolute left-3 top-3 text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Correo Electrónico
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                value={profile?.correo || ""}
                                                disabled
                                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
                                            />
                                            <Mail size={15} className="absolute left-3 top-3 text-slate-400" />
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">El correo está vinculado a tu cuenta de acceso.</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Teléfono / WhatsApp
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="tel"
                                                value={telefono}
                                                onChange={(e) => setTelefono(e.target.value)}
                                                placeholder="Ej. 987654321"
                                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                                            />
                                            <Phone size={15} className="absolute left-3 top-3 text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Documento de Identidad (DNI / RUC / CE)
                                    </label>
                                    <div className="relative max-w-sm">
                                        <input
                                            type="text"
                                            value={documento}
                                            onChange={(e) => setDocumento(e.target.value)}
                                            placeholder="Ej. 72345678"
                                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all font-mono"
                                        />
                                        <FileText size={15} className="absolute left-3 top-3 text-slate-400" />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                                        <Sparkles size={14} className="text-amber-500" />
                                        Tus datos se guardan cifrados con seguridad Bens.
                                    </span>
                                    <button
                                        type="submit"
                                        disabled={savingProfile}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-sm hover:shadow disabled:opacity-50"
                                    >
                                        <Save size={14} />
                                        {savingProfile ? "Guardando..." : "Guardar cambios"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ═════════════════════════════════════════════════════════════════════════ */}
                {/* ── PESTAÑA 2: MIS DIRECCIONES ──                                        */}
                {/* ═════════════════════════════════════════════════════════════════════════ */}
                {activeTab === "direcciones" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Libreta de direcciones
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Guarda tus direcciones de casa, trabajo o familiares para recibir tus pedidos.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowAddressModal(true)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-xs"
                            >
                                <Plus size={14} />
                                Nueva dirección
                            </button>
                        </div>

                        {loadingAddresses ? (
                            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                                <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-xs text-slate-500">Cargando direcciones...</p>
                            </div>
                        ) : addresses.length === 0 ? (
                            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                                    <MapPin size={24} />
                                </div>
                                <h3 className="text-sm font-bold text-slate-800 mb-1">
                                    Aún no tienes direcciones registradas
                                </h3>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                                    Agrega tu primera dirección para agilizar la entrega de tus pedidos y envíos a domicilio.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowAddressModal(true)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all"
                                >
                                    <Plus size={14} />
                                    Agregar mi primera dirección
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {addresses.map((addr) => (
                                    <div
                                        key={addr.id}
                                        className={`relative bg-white rounded-2xl p-5 border transition-all ${
                                            addr.esPrincipal
                                                ? "border-slate-900 shadow-sm ring-1 ring-slate-900/10"
                                                : "border-slate-200/90 hover:border-slate-300"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 uppercase tracking-wider">
                                                {addr.alias}
                                            </span>

                                            {addr.esPrincipal ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                    <CheckCircle2 size={12} />
                                                    Principal
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetPrimary(addr.id)}
                                                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-800 transition-colors"
                                                >
                                                    Hacer principal
                                                </button>
                                            )}
                                        </div>

                                        <p className="text-sm font-bold text-slate-900 leading-snug mb-1">
                                            {addr.direccion}
                                        </p>

                                        <p className="text-xs text-slate-600 mb-2">
                                            {addr.distrito}, {addr.provincia} - {addr.departamento}
                                        </p>

                                        {addr.referencia && (
                                            <p className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded-lg mb-3">
                                                Ref: {addr.referencia}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                                            <span className="text-[10px] text-slate-400">
                                                {addr.createdAt
                                                    ? new Date(addr.createdAt).toLocaleDateString()
                                                    : "Registrada"}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteAddress(addr.id)}
                                                className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                                                title="Eliminar dirección"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ═════════════════════════════════════════════════════════════════════════ */}
                {/* ── PESTAÑA 3: NOTIFICACIONES ──                                         */}
                {/* ═════════════════════════════════════════════════════════════════════════ */}
                {activeTab === "notificaciones" && (
                    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Centro de notificaciones
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Novedades sobre tus pedidos, promociones y avisos del sistema.
                                </p>
                            </div>

                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleReadAllNotifications}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all"
                                >
                                    <Check size={14} />
                                    Marcar todas como leídas
                                </button>
                            )}
                        </div>

                        {loadingNotifications ? (
                            <div className="py-12 text-center">
                                <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-xs text-slate-500">Cargando notificaciones...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-12 text-center text-slate-400">
                                <Bell size={32} className="mx-auto mb-2 text-slate-300" />
                                <p className="text-xs">No tienes notificaciones pendientes.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => !n.leida && handleReadNotification(n.id)}
                                        className={`py-4 px-3 sm:px-4 rounded-2xl flex items-start justify-between gap-4 transition-all cursor-pointer ${
                                            n.leida
                                                ? "opacity-75 hover:bg-slate-50/70"
                                                : "bg-indigo-50/30 hover:bg-indigo-50/60"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                                    n.tipo === "PROMO"
                                                        ? "bg-amber-100 text-amber-700"
                                                        : n.tipo === "PEDIDO"
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-indigo-100 text-indigo-700"
                                                }`}
                                            >
                                                <Bell size={16} />
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                                        {n.titulo}
                                                    </h4>
                                                    {!n.leida && (
                                                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                                                    {n.mensaje}
                                                </p>
                                                <span className="text-[10px] text-slate-400 mt-1.5 block">
                                                    {new Date(n.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        {n.enlace && (
                                            <Link
                                                to={n.enlace}
                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 shrink-0 self-center hidden sm:block"
                                            >
                                                Ver más →
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ═════════════════════════════════════════════════════════════════════════ */}
            {/* ── MODAL PARA AGREGAR DIRECCIÓN ──                                      */}
            {/* ═════════════════════════════════════════════════════════════════════════ */}
            {showAddressModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="font-bold text-slate-900 text-base">
                                Agregar nueva dirección
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowAddressModal(false)}
                                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleCreateAddress} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Alias de la dirección
                                </label>
                                <input
                                    type="text"
                                    value={newAddress.alias}
                                    onChange={(e) => setNewAddress({ ...newAddress, alias: e.target.value })}
                                    placeholder="Ej. Casa, Trabajo, Depa"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Dirección (Calle, Av, Jr, Nro)
                                </label>
                                <input
                                    type="text"
                                    value={newAddress.direccion}
                                    onChange={(e) => setNewAddress({ ...newAddress, direccion: e.target.value })}
                                    placeholder="Ej. Av. Larco 123 Dpto 402"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Distrito
                                    </label>
                                    <input
                                        type="text"
                                        value={newAddress.distrito}
                                        onChange={(e) => setNewAddress({ ...newAddress, distrito: e.target.value })}
                                        placeholder="Ej. Miraflores"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Provincia
                                    </label>
                                    <input
                                        type="text"
                                        value={newAddress.provincia}
                                        onChange={(e) => setNewAddress({ ...newAddress, provincia: e.target.value })}
                                        placeholder="Ej. Lima"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Departamento
                                    </label>
                                    <input
                                        type="text"
                                        value={newAddress.departamento}
                                        onChange={(e) => setNewAddress({ ...newAddress, departamento: e.target.value })}
                                        placeholder="Ej. Lima"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Referencia de entrega (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={newAddress.referencia || ""}
                                    onChange={(e) => setNewAddress({ ...newAddress, referencia: e.target.value })}
                                    placeholder="Ej. Frente al parque, reja negra"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                />
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer pt-1">
                                <input
                                    type="checkbox"
                                    checked={newAddress.esPrincipal}
                                    onChange={(e) => setNewAddress({ ...newAddress, esPrincipal: e.target.checked })}
                                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                />
                                <span className="text-xs text-slate-700 font-medium">
                                    Establecer como dirección principal de entrega
                                </span>
                            </label>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddressModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingAddress}
                                    className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
                                >
                                    {savingAddress ? "Guardando..." : "Guardar dirección"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
