import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GenericModal, ConfirmModal } from "@/components/shared/GenericModal";
import {
    Users, UserPlus, UserCog, Pencil, Trash2,
    Mail, Shield, Search, X, ShieldCheck, ShoppingBag,
} from "lucide-react";
import { useUsers } from "../hooks/useUsers";
import type { User, CreateUserDto, UpdateUserDto, UserRol } from "../types/users.type";
import { sileo } from "sileo";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROL_LABEL: Record<UserRol, string> = {
    ADMINISTRADOR: "Administrador",
    VENDEDOR:      "Vendedor",
    CLIENTE:       "Cliente",
};

const ROL_STYLE: Record<UserRol, string> = {
    ADMINISTRADOR: "bg-rose-50 text-rose-700 border border-rose-200",
    VENDEDOR:      "bg-blue-50 text-blue-700 border border-blue-200",
    CLIENTE:       "bg-slate-50 text-slate-500 border border-slate-200",
};

const ROL_ICON: Record<UserRol, React.ReactNode> = {
    ADMINISTRADOR: <ShieldCheck className="w-3 h-3" />,
    VENDEDOR:      <UserCog className="w-3 h-3" />,
    CLIENTE:       <ShoppingBag className="w-3 h-3" />,
};

const STAFF_ROLES: UserRol[] = ["ADMINISTRADOR", "VENDEDOR"];

// ─── Add User Form ─────────────────────────────────────────────────────────────

interface AddUserFormProps {
    onSubmit: (dto: CreateUserDto) => Promise<void>;
    onCancel: () => void;
}

const AddUserForm = ({ onSubmit, onCancel }: AddUserFormProps) => {
    const [correo,    setCorreo]    = useState("");
    const [password,  setPassword]  = useState("");
    const [confirm,   setConfirm]   = useState("");
    const [isSaving,  setIsSaving]  = useState(false);
    const [errors,    setErrors]    = useState<{ correo?: string; password?: string; confirm?: string }>({});

    const validate = () => {
        const e: typeof errors = {};
        if (!correo.trim())                          e.correo   = "El correo es obligatorio.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) e.correo = "Correo inválido.";
        if (!password)                               e.password = "La contraseña es obligatoria.";
        else if (password.length < 6)                e.password = "Mínimo 6 caracteres.";
        if (password !== confirm)                    e.confirm  = "Las contraseñas no coinciden.";
        return e;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setIsSaving(true);
        await onSubmit({ correo: correo.trim(), password });
        setIsSaving(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Info banner */}
            <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                <UserCog className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 leading-relaxed">
                    El usuario será creado con el rol <strong>Vendedor</strong>. Puedes cambiarlo después desde la tabla.
                </p>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="correo">Correo electrónico <span className="text-rose-400">*</span></Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        id="correo"
                        type="email"
                        value={correo}
                        onChange={e => { setCorreo(e.target.value); setErrors(p => ({ ...p, correo: undefined })); }}
                        className="pl-10"
                        placeholder="usuario@empresa.com"
                    />
                </div>
                {errors.correo && <p className="text-xs text-rose-500">{errors.correo}</p>}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña <span className="text-rose-400">*</span></Label>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined, confirm: undefined })); }}
                    placeholder="Mínimo 6 caracteres"
                />
                {errors.password && <p className="text-xs text-rose-500">{errors.password}</p>}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirmar contraseña <span className="text-rose-400">*</span></Label>
                <Input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: undefined })); }}
                    placeholder="Repite la contraseña"
                />
                {errors.confirm && <p className="text-xs text-rose-500">{errors.confirm}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? "Creando..." : "Crear Usuario"}</Button>
            </div>
        </form>
    );
};

// ─── Edit User Modal ───────────────────────────────────────────────────────────

interface EditUserModalProps {
    user: User;
    onSave: (dto: UpdateUserDto) => Promise<void>;
    onClose: () => void;
}

const EditUserModal = ({ user, onSave, onClose }: EditUserModalProps) => {
    const [correo,   setCorreo]  = useState(user.correo);
    const [rol,      setRol]     = useState<UserRol>(user.rol === "CLIENTE" ? "VENDEDOR" : user.rol);
    const [isSaving, setIsSaving] = useState(false);
    const [correoErr, setCorreoErr] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!correo.trim()) { setCorreoErr("El correo es obligatorio."); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) { setCorreoErr("Correo inválido."); return; }
        setIsSaving(true);
        await onSave({ correo: correo.trim(), rol });
        setIsSaving(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
                <Label>Correo electrónico <span className="text-rose-400">*</span></Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        type="email"
                        value={correo}
                        onChange={e => { setCorreo(e.target.value); setCorreoErr(""); }}
                        className="pl-10"
                        placeholder="usuario@empresa.com"
                    />
                </div>
                {correoErr && <p className="text-xs text-rose-500">{correoErr}</p>}
            </div>

            <div className="space-y-1.5">
                <Label>Rol</Label>
                <Select value={rol} onValueChange={v => setRol(v as UserRol)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {STAFF_ROLES.map(r => (
                            <SelectItem key={r} value={r}>{ROL_LABEL[r]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">La contraseña no puede modificarse desde aquí.</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar cambios"}</Button>
            </div>
        </form>
    );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const UsersDashboard = () => {
    const { users, isLoading, addUser, editUser, removeUser } = useUsers();
    const [isCreateOpen,  setIsCreateOpen]  = useState(false);
    const [editingUser,   setEditingUser]   = useState<User | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
    const [isDeleting,    setIsDeleting]    = useState(false);
    const [search,        setSearch]        = useState("");

    const filtered = users.filter(u =>
        u.correo.toLowerCase().includes(search.toLowerCase()) ||
        ROL_LABEL[u.rol]?.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = async (dto: CreateUserDto) => {
        const created = await addUser(dto);
        if (created) {
            sileo.success({ title: "Usuario creado", description: `"${created.correo}" fue registrado como Vendedor.` });
            setIsCreateOpen(false);
        } else {
            sileo.error({ title: "Error", description: "No se pudo crear el usuario. El correo puede estar en uso." });
        }
    };

    const handleEdit = async (dto: UpdateUserDto) => {
        if (!editingUser) return;
        const updated = await editUser(editingUser.id, dto);
        if (updated) {
            sileo.success({ title: "Usuario actualizado", description: `"${updated.correo}" guardado correctamente.` });
            setEditingUser(null);
        } else {
            sileo.error({ title: "Error", description: "No se pudo actualizar el usuario." });
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setIsDeleting(true);
        const ok = await removeUser(confirmDelete.id);
        if (ok) sileo.success({ title: "Usuario eliminado", description: `"${confirmDelete.correo}" fue eliminado.` });
        else    sileo.error({ title: "Error", description: "No se pudo eliminar el usuario." });
        setIsDeleting(false);
        setConfirmDelete(null);
    };

    const adminCount   = users.filter(u => u.rol === "ADMINISTRADOR").length;
    const vendorCount  = users.filter(u => u.rol === "VENDEDOR").length;
    const clientCount  = users.filter(u => u.rol === "CLIENTE").length;

    return (
        <div className="space-y-6 pb-8">

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-800 via-slate-700 to-slate-900 px-8 py-7 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(148,163,184,0.15),transparent_60%)]" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">Sistema</p>
                        <h1 className="text-2xl font-bold text-white">Usuarios</h1>
                        <p className="text-slate-400 text-sm mt-1">Gestiona los accesos y roles del sistema.</p>
                    </div>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-lg backdrop-blur-sm"
                    >
                        <UserPlus className="w-4 h-4 mr-2" /> Nuevo Usuario
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Total usuarios",    value: users.length,  color: "slate",  bg: "bg-slate-100",  icon: <Users className="w-4 h-4 text-slate-600" /> },
                    { label: "Administradores",   value: adminCount,    color: "rose",   bg: "bg-rose-50",    icon: <Shield className="w-4 h-4 text-rose-600" /> },
                    { label: "Vendedores",         value: vendorCount,   color: "blue",   bg: "bg-blue-50",    icon: <UserCog className="w-4 h-4 text-blue-600" /> },
                    { label: "Clientes (web)",     value: clientCount,   color: "slate",  bg: "bg-slate-50",   icon: <ShoppingBag className="w-4 h-4 text-slate-400" /> },
                ].map(({ label, value, color, bg, icon }) => (
                    <Card key={label} className="border-0 shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            <div className="flex items-stretch">
                                <div className={`w-1.5 bg-${color}-500 rounded-l-xl shrink-0`} />
                                <div className="flex-1 px-4 py-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide leading-tight">{label}</p>
                                        <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
                                    </div>
                                    <p className={`text-2xl font-bold text-${color}-700 tabular-nums`}>{value}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabla */}
            <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="px-6 py-4 border-b border-slate-100 bg-white">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por correo o rol..."
                                className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 rounded-xl"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            {search && (
                                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 shrink-0">{filtered.length} usuario{filtered.length !== 1 ? "s" : ""}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Cargando usuarios...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                <Users className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500 mb-4">
                                {search ? `Sin resultados para "${search}"` : "Sin usuarios registrados"}
                            </p>
                            {!search && (
                                <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                                    <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Crear usuario
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/80">
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Correo</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rol</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Creado</th>
                                        <th className="px-3 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filtered.map(u => {
                                        const isClient = u.rol === "CLIENTE";
                                        return (
                                            <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                                        <span className="font-medium text-slate-800 text-sm">{u.correo}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${ROL_STYLE[u.rol]}`}>
                                                        {ROL_ICON[u.rol]}
                                                        {ROL_LABEL[u.rol]}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-sm text-slate-500">
                                                        {new Date(u.createdAt).toLocaleDateString("es-PE", {
                                                            day: "2-digit", month: "short", year: "numeric",
                                                        })}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-4">
                                                    {isClient ? (
                                                        <span className="text-[11px] text-slate-400 italic px-2">Ecommerce</span>
                                                    ) : (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => setEditingUser(u)}
                                                                className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors"
                                                                title="Editar"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmDelete(u)}
                                                                className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-colors"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal crear */}
            <GenericModal
                title="Nuevo Usuario"
                description="El usuario se creará con el rol Vendedor."
                isOpen={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            >
                <AddUserForm
                    onSubmit={handleAdd}
                    onCancel={() => setIsCreateOpen(false)}
                />
            </GenericModal>

            {/* Modal editar */}
            <GenericModal
                title="Editar Usuario"
                description={editingUser?.correo ?? ""}
                isOpen={!!editingUser}
                onOpenChange={open => { if (!open) setEditingUser(null); }}
            >
                {editingUser && (
                    <EditUserModal
                        user={editingUser}
                        onSave={handleEdit}
                        onClose={() => setEditingUser(null)}
                    />
                )}
            </GenericModal>

            {/* Confirm eliminar */}
            <ConfirmModal
                isOpen={!!confirmDelete}
                onOpenChange={open => { if (!open) setConfirmDelete(null); }}
                title="Eliminar usuario"
                confirmLabel="Eliminar"
                variant="danger"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                description={
                    <>¿Eliminar al usuario <strong className="text-slate-800">"{confirmDelete?.correo}"</strong>? Esta acción no se puede deshacer.</>
                }
            />
        </div>
    );
};

export default UsersDashboard;
