import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Barbershop {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface BarbershopModalProps {
  barbershop?: Barbershop | null;
  onClose: (shouldRefresh?: boolean) => void;
}

export default function BarbershopModal({ barbershop, onClose }: BarbershopModalProps) {
  const [formData, setFormData] = useState({
    name: barbershop?.name || "",
    slug: barbershop?.slug || "",
    email: barbershop?.email || "",
    phone: barbershop?.phone || "",
    address: barbershop?.address || "",
    status: barbershop?.status || "active",
    plan: barbershop?.plan || "basic",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: !barbershop ? generateSlug(name) : prev.slug
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast({
        title: "Erro",
        description: "Nome e slug são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (barbershop) {
        // Update existing barbershop
        const { error } = await supabase
          .from('barbershops')
          .update({
            name: formData.name,
            slug: formData.slug,
            email: formData.email || null,
            phone: formData.phone || null,
            address: formData.address || null,
            status: formData.status,
            plan: formData.plan,
          })
          .eq('id', barbershop.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Barbearia atualizada com sucesso",
        });
      } else {
        // Check if slug is unique
        const { data: existing } = await supabase
          .from('barbershops')
          .select('id')
          .eq('slug', formData.slug)
          .single();

        if (existing) {
          toast({
            title: "Erro",
            description: "Este slug já está em uso",
            variant: "destructive",
          });
          return;
        }

        // Create new barbershop
        const { error } = await supabase
          .from('barbershops')
          .insert({
            name: formData.name,
            slug: formData.slug,
            email: formData.email || null,
            phone: formData.phone || null,
            address: formData.address || null,
            status: formData.status,
            plan: formData.plan,
          });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Barbearia criada com sucesso",
        });
      }

      onClose(true);
    } catch (error) {
      console.error('Error saving barbershop:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar barbearia",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Barbearia *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Nome da barbearia"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            placeholder="slug-da-barbearia"
            required
          />
          <p className="text-xs text-muted-foreground">
            URL: /dashboard/{formData.slug}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="contato@barbearia.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          placeholder="Endereço completo da barbearia"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="suspended">Suspenso</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="plan">Plano</Label>
          <Select value={formData.plan} onValueChange={(value) => setFormData(prev => ({ ...prev, plan: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Básico</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onClose()}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : barbershop ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}