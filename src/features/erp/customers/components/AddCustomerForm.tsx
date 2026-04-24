import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, CreditCard, User } from "lucide-react";
import type { CreateCustomerDto } from "../types/customers.type";
import { api } from "@/api";
import { sileo } from "sileo";

interface TipoDocumento { id: number; nombre: string; abreviatura: string; }

const schema = z.object({
    tipoDocumentoId: z.number().optional(),
    documento: z.string().min(7, "Mínimo 7 caracteres"),
    nombre:    z.string().min(2, "Mínimo 2 caracteres"),
    apellido:  z.string().min(2, "Mínimo 2 caracteres"),
    correo:    z.string().email("Correo inválido"),
    telefono:  z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface AddCustomerFormProps {
    onSubmit: (dto: CreateCustomerDto) => Promise<void>;
    onCancel: () => void;
}

export const AddCustomerForm = ({ onSubmit, onCancel }: AddCustomerFormProps) => {
    const [isSubmitting,    setIsSubmitting]    = useState(false);
    const [tiposDocumento,  setTiposDocumento]  = useState<TipoDocumento[]>([]);
    const [loadingTipos,    setLoadingTipos]    = useState(true);

    useEffect(() => {
        api.get<TipoDocumento[]>("/type-document")
            .then(r => setTiposDocumento(r.data))
            .catch(() => {})
            .finally(() => setLoadingTipos(false));
    }, []);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { documento: "", nombre: "", apellido: "", correo: "", telefono: "" },
    });

    const onFormSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        try {
            await onSubmit({
                tipoDocumentoId: data.tipoDocumentoId,
                documento: data.documento.trim(),
                nombre:    data.nombre.trim(),
                apellido:  data.apellido.trim(),
                correo:    data.correo.trim(),
                telefono:  data.telefono?.trim() || undefined,
            });
        } catch {
            sileo.error({ title: "Error", description: "Ocurrió un error inesperado." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label>Tipo de documento <span className="text-slate-400 text-xs">(opcional)</span></Label>
                    <Select onValueChange={v => setValue("tipoDocumentoId", Number(v))} disabled={loadingTipos}>
                        <SelectTrigger>
                            <SelectValue placeholder={loadingTipos ? "Cargando..." : "DNI, RUC..."} />
                        </SelectTrigger>
                        <SelectContent>
                            {tiposDocumento.map(t => (
                                <SelectItem key={t.id} value={String(t.id)}>
                                    {t.abreviatura} — {t.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label>Número de documento <span className="text-rose-400">*</span></Label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input placeholder="12345678" className="pl-10" {...register("documento")} />
                    </div>
                    {errors.documento && <p className="text-xs text-rose-500">{errors.documento.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label>Nombre <span className="text-rose-400">*</span></Label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input placeholder="Juan" className="pl-10" {...register("nombre")} />
                    </div>
                    {errors.nombre && <p className="text-xs text-rose-500">{errors.nombre.message}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label>Apellido <span className="text-rose-400">*</span></Label>
                    <Input placeholder="Pérez" {...register("apellido")} />
                    {errors.apellido && <p className="text-xs text-rose-500">{errors.apellido.message}</p>}
                </div>
            </div>

            <div className="space-y-1.5">
                <Label>Correo electrónico <span className="text-rose-400">*</span></Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input type="email" placeholder="juan@correo.com" className="pl-10" {...register("correo")} />
                </div>
                {errors.correo && <p className="text-xs text-rose-500">{errors.correo.message}</p>}
            </div>

            <div className="space-y-1.5">
                <Label>Teléfono <span className="text-slate-400 text-xs">(opcional)</span></Label>
                <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder="999 999 999" className="pl-10" {...register("telefono")} />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : "Guardar Cliente"}
                </Button>
            </div>
        </form>
    );
};
