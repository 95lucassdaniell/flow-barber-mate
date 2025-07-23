import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Building, Clock, Mail, Phone, MapPin, Save, Upload, X } from "lucide-react";

const GeneralSettings = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [barbershop, setBarbershop] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    logo_url: "",
    opening_hours: {
      monday: { open: "09:00", close: "18:00" },
      tuesday: { open: "09:00", close: "18:00" },
      wednesday: { open: "09:00", close: "18:00" },
      thursday: { open: "09:00", close: "18:00" },
      friday: { open: "09:00", close: "18:00" },
      saturday: { open: "09:00", close: "18:00" },
      sunday: { open: "09:00", close: "18:00" },
    }
  });

  useEffect(() => {
    if (profile?.barbershop_id) {
      fetchBarbershopData();
    }
  }, [profile]);

  const fetchBarbershopData = async () => {
    try {
      const { data, error } = await supabase
        .from('barbershops')
        .select('*')
        .eq('id', profile!.barbershop_id)
        .single();

      if (error) throw error;

      if (data) {
        setBarbershop({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          logo_url: data.logo_url || "",
          opening_hours: (data.opening_hours as typeof barbershop.opening_hours) || barbershop.opening_hours,
        });
      }
    } catch (error) {
      console.error('Error fetching barbershop data:', error);
    }
  };

  const handleSave = async () => {
    if (!profile?.barbershop_id) {
      toast({
        title: "Erro",
        description: "Barbershop ID não encontrado.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('barbershops')
        .update({
          name: barbershop.name,
          email: barbershop.email,
          phone: barbershop.phone,
          address: barbershop.address,
          logo_url: barbershop.logo_url,
          opening_hours: barbershop.opening_hours,
        })
        .eq('id', profile.barbershop_id);

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "As informações da barbearia foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Error saving barbershop data:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOpeningHours = (day: string, field: 'open' | 'close', value: string) => {
    setBarbershop(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours[day],
          [field]: value,
        }
      }
    }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.barbershop_id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "O arquivo deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingLogo(true);
    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.barbershop_id}-${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('barbershop-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('barbershop-logos')
        .getPublicUrl(fileName);

      // Update barbershop with new logo URL
      setBarbershop(prev => ({ ...prev, logo_url: publicUrl }));

      toast({
        title: "Logo atualizada",
        description: "A logo foi enviada com sucesso.",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload da logo.",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setBarbershop(prev => ({ ...prev, logo_url: "" }));
  };

  const weekDays = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ];

  return (
    <div className="space-y-6">
      {/* Logo da Barbearia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Logo da Barbearia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={barbershop.logo_url} alt="Logo da barbearia" />
                <AvatarFallback className="text-2xl">
                  {barbershop.name ? barbershop.name.charAt(0).toUpperCase() : 'B'}
                </AvatarFallback>
              </Avatar>
              {barbershop.logo_url && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={handleRemoveLogo}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              <div>
                <Label>Enviar Nova Logo</Label>
                <p className="text-sm text-muted-foreground">
                  PNG, JPG até 5MB. Recomendado: 200x200px
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingLogo ? "Enviando..." : "Escolher Arquivo"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações da Barbearia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Informações da Barbearia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Barbearia</Label>
              <Input
                id="name"
                value={barbershop.name}
                onChange={(e) => setBarbershop(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome da barbearia"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  value={barbershop.email}
                  onChange={(e) => setBarbershop(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contato@barbearia.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="phone"
                  value={barbershop.phone}
                  onChange={(e) => setBarbershop(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
                <Textarea
                  id="address"
                  value={barbershop.address}
                  onChange={(e) => setBarbershop(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Rua, número, bairro, cidade - UF"
                  className="pl-10"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horários de Funcionamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horários de Funcionamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weekDays.map((day) => (
              <div key={day.key} className="flex items-center gap-4">
                <div className="w-32">
                  <Label className="text-sm font-medium">{day.label}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={barbershop.opening_hours[day.key]?.open || "09:00"}
                    onChange={(e) => updateOpeningHours(day.key, 'open', e.target.value)}
                    className="w-32"
                  />
                  <span className="text-muted-foreground">às</span>
                  <Input
                    type="time"
                    value={barbershop.opening_hours[day.key]?.close || "18:00"}
                    onChange={(e) => updateOpeningHours(day.key, 'close', e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="min-w-32">
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
};

export default GeneralSettings;