import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone, CreditCard, Building2, AlignLeft } from "lucide-react";
import type { CreateSupplierDto } from "../types/suppliers.type";
import { sileo } from "sileo";

const supplierSchema = z.object({
    documento:   z.string().min(8, "Mínimo 8 caracteres"),
    nombre:      z.string().min(2, "Mínimo 2 caracteres"),
    descripcion: z.string().optional(),
    correo:      z.string().email("Correo inválido"),
    telefono:    z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface AddSupplierFormProps {
    onSubmit: (dto: CreateSupplierDto) => Promise<void>;
    onCancel: () => void;
}

export const AddSupplierForm = ({ onSubmit, onCancel }: AddSupplierFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SupplierFormValues>({
        resolver: zodResolver(supplierSchema),
        defaultValues: { documento: "", nombre: "", descripcion: "", correo: "", telefono: "" },
    });

    const onFormSubmit = async (data: SupplierFormValues) => {
        setIsSubmitting(true);
        try {
            await onSubmit({
                documento:   data.documento.trim(),
                nombre:      data.nombre.trim(),
                descripcion: data.descripcion?.trim() || undefined,
                correo:      data.correo.trim(),
                telefono:    data.telefono?.trim() || undefined,
            });
        } catch {
            sileo.error({ title: "Error", description: "Ocurrió un error inesperado." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pt-1">
            <div className="space-y-1.5">
                <Label htmlFor="documento">RUC / Documento <span className="text-rose-400">*</span></Label>
                <div className="relative">
                    <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input id="documento" placeholder="20123456789" className="pl-10" {...register("documento")} />
                </div>
                {errors.documento && <p className="text-xs text-rose-500">{errors.documento.message}</p>}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="nombre">Razón Social / Nombre <span className="text-rose-400">*</span></Label>
                <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input id="nombre" placeholder="Empresa S.A.C." className="pl-10" {...register("nombre")} />
                </div>
                {errors.nombre && <p className="text-xs text-rose-500">{errors.nombre.message}</p>}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="descripcion">Descripción <span className="text-slate-400 text-xs">(opcional)</span></Label>
                <div className="relative">
                    <AlignLeft className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input id="descripcion" placeholder="Notas o rubro del proveedor" className="pl-10" {...register("descripcion")} />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="correo">Correo electrónico <span className="text-rose-400">*</span></Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input id="correo" type="email" placeholder="contacto@empresa.com" className="pl-10" {...register("correo")} />
                </div>
                {errors.correo && <p className="text-xs text-rose-500">{errors.correo.message}</p>}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="telefono">Teléfono <span className="text-slate-400 text-xs">(opcional)</span></Label>
                <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input id="telefono" placeholder="999 999 999" className="pl-10" {...register("telefono")} />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : "Guardar Proveedor"}
                </Button>
            </div>
        </form>
    );
};
