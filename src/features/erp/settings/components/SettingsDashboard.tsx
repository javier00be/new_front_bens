import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmModal } from "@/components/shared/GenericModal";
import { api } from "@/api";
import { sileo } from "sileo";
import {
    FileText, Tag, Layers, Ruler, CreditCard,
    Plus, Pencil, Trash2, Check, X, Settings,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SimpleItem { id: number; nombre: string; createdAt?: string; }
interface TipoDocItem { id: number; nombre: string; abreviatura: string; }

type TabKey = 'tipo-documento' | 'categorias' | 'marcas' | 'tallas' | 'medios-pago';

// ─── Sección genérica (solo "nombre") ────────────────────────────────────────

interface SimpleConfigSectionProps {
    endpoint: string;
    label: string;
    placeholder: string;
}

const SimpleConfigSection = ({ endpoint, label, placeholder }: SimpleConfigSectionProps) => {
    const [items,         setItems]         = useState<SimpleItem[]>([]);
    const [isLoading,     setIsLoading]     = useState(true);
    const [newNombre,     setNewNombre]     = useState("");
    const [isAdding,      setIsAdding]      = useState(false);
    const [editingId,     setEditingId]     = useState<number | null>(null);
    const [editNombre,    setEditNombre]    = useState("");
    const [isSaving,      setIsSaving]      = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<SimpleItem | null>(null);
    const [isDeleting,    setIsDeleting]    = useState(false);

    const fetch = useCallback(() => {
        setIsLoading(true);
        api.get<SimpleItem[]>(endpoint)
            .then(r => setItems(r.data))
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, [endpoint]);

    useEffect(() => { fetch(); }, [fetch]);

    const handleAdd = async () => {
        if (!newNombre.trim()) return;
        setIsSaving(true);
        try {
            const r = await api.post<SimpleItem>(endpoint, { nombre: newNombre.trim() });
            setItems(prev => [...prev, r.data]);
            setNewNombre("");
            setIsAdding(false);
            sileo.success({ title: `${label} creada`, description: `"${r.data.nombre}" fue agregada.` });
        } catch {
            sileo.error({ title: "Error", description: `No se pudo crear. Verifica que no exista ya.` });
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = async (id: number) => {
        if (!editNombre.trim()) return;
        setIsSaving(true);
        try {
            const r = await api.patch<SimpleItem>(`${endpoint}/${id}`, { nombre: editNombre.trim() });
            setItems(prev => prev.map(i => i.id === id ? r.data : i));
            setEditingId(null);
            sileo.success({ title: `${label} actualizada`, description: `"${r.data.nombre}" guardada.` });
        } catch {
            sileo.error({ title: "Error", description: "No se pudo actualizar." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`${endpoint}/${confirmDelete.id}`);
            setItems(prev => prev.filter(i => i.id !== confirmDelete.id));
            sileo.success({ title: `${label} eliminada`, description: `"${confirmDelete.nombre}" fue eliminada.` });
        } catch {
            sileo.error({ title: "Error", description: "No se pudo eliminar. Puede estar en uso." });
        } finally {
            setIsDeleting(false);
            setConfirmDelete(null);
        }
    };

    return (
        <div className="space-y-3">
            {/* Add row */}
            {isAdding ? (
                <div className="flex items-center gap-2">
                    <Input
                        autoFocus
                        value={newNombre}
                        onChange={e => setNewNombre(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setIsAdding(false); }}
                        placeholder={placeholder}
                        className="h-9 text-sm"
                    />
                    <Button size="sm" onClick={handleAdd} disabled={isSaving || !newNombre.trim()} className="px-3">
                        <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setIsAdding(false); setNewNombre(""); }} className="px-3">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAdding(true)}
                    className="text-xs h-8 border-dashed"
                >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Agregar {label.toLowerCase()}
                </Button>
            )}

            {/* List */}
            {isLoading ? (
                <div className="flex items-center gap-2 py-4 text-slate-400 text-sm">
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                    Cargando...
                </div>
            ) : items.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">Sin registros. Agrega el primero.</p>
            ) : (
                <div className="divide-y divide-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50/80 transition-colors">
                            {editingId === item.id ? (
                                <>
                                    <Input
                                        autoFocus
                                        value={editNombre}
                                        onChange={e => setEditNombre(e.target.value)}
                                        onKeyDown={e => { if (e.key === "Enter") handleEdit(item.id); if (e.key === "Escape") setEditingId(null); }}
                                        className="h-7 text-sm flex-1"
                                    />
                                    <button
                                        onClick={() => handleEdit(item.id)}
                                        disabled={isSaving}
                                        className="w-7 h-7 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="w-7 h-7 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="flex-1 text-sm font-medium text-slate-700">{item.nombre}</span>
                                    <button
                                        onClick={() => { setEditingId(item.id); setEditNombre(item.nombre); }}
                                        className="w-7 h-7 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors"
                                        title="Editar"
                                    >
                                        <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => setConfirmDelete(item)}
                                        className="w-7 h-7 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <ConfirmModal
                isOpen={!!confirmDelete}
                onOpenChange={open => { if (!open) setConfirmDelete(null); }}
                title={`Eliminar ${label.toLowerCase()}`}
                confirmLabel="Eliminar"
                variant="danger"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                description={<>¿Eliminar <strong className="text-slate-800">"{confirmDelete?.nombre}"</strong>? Puede fallar si está en uso.</>}
            />
        </div>
    );
};

// ─── Sección TipoDocumento (nombre + abreviatura) ─────────────────────────────

const TipoDocumentoSection = () => {
    const [items,         setItems]         = useState<TipoDocItem[]>([]);
    const [isLoading,     setIsLoading]     = useState(true);
    const [isAdding,      setIsAdding]      = useState(false);
    const [newNombre,     setNewNombre]     = useState("");
    const [newAbrev,      setNewAbrev]      = useState("");
    const [editingId,     setEditingId]     = useState<number | null>(null);
    const [editNombre,    setEditNombre]    = useState("");
    const [editAbrev,     setEditAbrev]     = useState("");
    const [isSaving,      setIsSaving]      = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<TipoDocItem | null>(null);
    const [isDeleting,    setIsDeleting]    = useState(false);

    useEffect(() => {
        api.get<TipoDocItem[]>("/type-document")
            .then(r => setItems(r.data))
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, []);

    const handleAdd = async () => {
        if (!newNombre.trim() || !newAbrev.trim()) {
            sileo.warning({ title: "Campos requeridos", description: "Nombre y abreviatura son obligatorios." });
            return;
        }
        setIsSaving(true);
        try {
            const r = await api.post<TipoDocItem>("/type-document", {
                nombre: newNombre.trim(),
                abreviatura: newAbrev.trim().toUpperCase(),
            });
            setItems(prev => [...prev, r.data]);
            setNewNombre(""); setNewAbrev(""); setIsAdding(false);
            sileo.success({ title: "Tipo creado", description: `"${r.data.abreviatura}" fue agregado.` });
        } catch {
            sileo.error({ title: "Error", description: "No se pudo crear. Verifica que no exista ya." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = async (id: number) => {
        if (!editNombre.trim() || !editAbrev.trim()) return;
        setIsSaving(true);
        try {
            const r = await api.patch<TipoDocItem>(`/type-document/${id}`, {
                nombre: editNombre.trim(),
                abreviatura: editAbrev.trim().toUpperCase(),
            });
            setItems(prev => prev.map(i => i.id === id ? r.data : i));
            setEditingId(null);
            sileo.success({ title: "Tipo actualizado", description: `"${r.data.abreviatura}" guardado.` });
        } catch {
            sileo.error({ title: "Error", description: "No se pudo actualizar." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/type-document/${confirmDelete.id}`);
            setItems(prev => prev.filter(i => i.id !== confirmDelete.id));
            sileo.success({ title: "Tipo eliminado", description: `"${confirmDelete.abreviatura}" fue eliminado.` });
        } catch {
            sileo.error({ title: "Error", description: "No se pudo eliminar. Puede estar en uso." });
        } finally {
            setIsDeleting(false);
            setConfirmDelete(null);
        }
    };

    return (
        <div className="space-y-3">
            {isAdding ? (
                <div className="flex items-center gap-2">
                    <Input
                        autoFocus
                        value={newAbrev}
                        onChange={e => setNewAbrev(e.target.value)}
                        placeholder="Abrev. (DNI, RUC...)"
                        className="h-9 text-sm w-36"
                    />
                    <Input
                        value={newNombre}
                        onChange={e => setNewNombre(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setIsAdding(false); }}
                        placeholder="Nombre completo"
                        className="h-9 text-sm flex-1"
                    />
                    <Button size="sm" onClick={handleAdd} disabled={isSaving} className="px-3">
                        <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setIsAdding(false); setNewNombre(""); setNewAbrev(""); }} className="px-3">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                <Button size="sm" variant="outline" onClick={() => setIsAdding(true)} className="text-xs h-8 border-dashed">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Agregar tipo de documento
                </Button>
            )}

            {isLoading ? (
                <div className="flex items-center gap-2 py-4 text-slate-400 text-sm">
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                    Cargando...
                </div>
            ) : items.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">Sin registros.</p>
            ) : (
                <div className="divide-y divide-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50/80 transition-colors">
                            {editingId === item.id ? (
                                <>
                                    <Input
                                        autoFocus
                                        value={editAbrev}
                                        onChange={e => setEditAbrev(e.target.value)}
                                        className="h-7 text-sm w-28"
                                        placeholder="Abrev."
                                    />
                                    <Input
                                        value={editNombre}
                                        onChange={e => setEditNombre(e.target.value)}
                                        onKeyDown={e => { if (e.key === "Enter") handleEdit(item.id); if (e.key === "Escape") setEditingId(null); }}
                                        className="h-7 text-sm flex-1"
                                        placeholder="Nombre"
                                    />
                                    <button onClick={() => handleEdit(item.id)} disabled={isSaving} className="w-7 h-7 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors">
                                        <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => setEditingId(null)} className="w-7 h-7 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md w-20 text-center shrink-0">
                                        {item.abreviatura}
                                    </span>
                                    <span className="flex-1 text-sm text-slate-700">{item.nombre}</span>
                                    <button
                                        onClick={() => { setEditingId(item.id); setEditNombre(item.nombre); setEditAbrev(item.abreviatura); }}
                                        className="w-7 h-7 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors"
                                    >
                                        <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => setConfirmDelete(item)}
                                        className="w-7 h-7 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <ConfirmModal
                isOpen={!!confirmDelete}
                onOpenChange={open => { if (!open) setConfirmDelete(null); }}
                title="Eliminar tipo de documento"
                confirmLabel="Eliminar"
                variant="danger"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                description={<>¿Eliminar <strong className="text-slate-800">"{confirmDelete?.abreviatura}"</strong>? Puede fallar si está en uso.</>}
            />
        </div>
    );
};

// ─── Tabs config ──────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; icon: React.ReactNode; description: string }[] = [
    { key: "tipo-documento", label: "Tipos de Documento", icon: <FileText className="w-4 h-4" />,  description: "DNI, RUC, CE, Pasaporte..." },
    { key: "categorias",     label: "Categorías",         icon: <Tag className="w-4 h-4" />,        description: "Categorías de productos" },
    { key: "marcas",         label: "Marcas",             icon: <Layers className="w-4 h-4" />,     description: "Marcas de productos" },
    { key: "tallas",         label: "Tallas",             icon: <Ruler className="w-4 h-4" />,      description: "S, M, L, XL..." },
    { key: "medios-pago",    label: "Medios de Pago",     icon: <CreditCard className="w-4 h-4" />, description: "Efectivo, Yape, Tarjeta..." },
];

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const SettingsDashboard = () => {
    const [activeTab, setActiveTab] = useState<TabKey>("tipo-documento");
    const active = TABS.find(t => t.key === activeTab)!;

    return (
        <div className="space-y-6 pb-8">

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-800 via-slate-700 to-slate-800 px-8 py-7 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(148,163,184,0.15),transparent_60%)]" />
                <div className="relative">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">Sistema</p>
                    <div className="flex items-center gap-3">
                        <Settings className="w-6 h-6 text-slate-300" />
                        <h1 className="text-2xl font-bold text-white">Configuración</h1>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">Administra los valores base del sistema: documentos, categorías, tallas y más.</p>
                </div>
            </div>

            <div className="flex gap-6">
                {/* Sidebar nav */}
                <div className="w-56 shrink-0">
                    <nav className="space-y-1">
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors text-sm ${
                                    activeTab === tab.key
                                        ? "bg-slate-900 text-white shadow-sm"
                                        : "text-slate-600 hover:bg-slate-100"
                                }`}
                            >
                                <span className={activeTab === tab.key ? "text-slate-300" : "text-slate-400"}>
                                    {tab.icon}
                                </span>
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <Card className="border border-slate-100 shadow-sm rounded-2xl">
                        <CardContent className="p-6">
                            <div className="mb-5">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-slate-500">{active.icon}</span>
                                    <h2 className="text-base font-semibold text-slate-800">{active.label}</h2>
                                </div>
                                <p className="text-xs text-slate-400">{active.description}</p>
                            </div>

                            {activeTab === "tipo-documento" && <TipoDocumentoSection />}
                            {activeTab === "categorias" && (
                                <SimpleConfigSection endpoint="/categories" label="Categoría" placeholder="Ej: CAMISAS, VESTIDOS..." />
                            )}
                            {activeTab === "marcas" && (
                                <SimpleConfigSection endpoint="/brand" label="Marca" placeholder="Ej: BENS, PREMIUM..." />
                            )}
                            {activeTab === "tallas" && (
                                <SimpleConfigSection endpoint="/size" label="Talla" placeholder="Ej: S, M, L, XL..." />
                            )}
                            {activeTab === "medios-pago" && (
                                <SimpleConfigSection endpoint="/payment-method" label="Medio de pago" placeholder="Ej: EFECTIVO, YAPE..." />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SettingsDashboard;
