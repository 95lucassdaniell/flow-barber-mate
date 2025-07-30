import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/barberflow-logo.png";

const RegisterForm = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Dados pessoais
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    
    // Dados da barbearia
    businessName: "",
    businessSlug: "",
    address: "",
    city: "",
    state: "",
    workingHours: "08:00-18:00",
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === "businessName" && { businessSlug: generateSlug(value) })
    }));
  };

  const handleNextStep = () => {
    if (step === 1) {
      // Validação básica do step 1
      if (!formData.ownerName || !formData.email || !formData.password || !formData.phone) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos para continuar.",
          variant: "destructive",
        });
        return;
      }

      if (!validateEmail(formData.email)) {
        toast({
          title: "E-mail inválido",
          description: "Digite um e-mail válido.",
          variant: "destructive",
        });
        return;
      }

      if (!validatePassword(formData.password)) {
        toast({
          title: "Senha muito fraca",
          description: "A senha deve ter pelo menos 6 caracteres.",
          variant: "destructive",
        });
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Senhas não conferem",
          description: "As senhas digitadas são diferentes.",
          variant: "destructive",
        });
        return;
      }
    }
    
    setStep(2);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSubmit = async () => {
    // Validação do step 2
    if (!formData.businessName || !formData.address || !formData.city) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos da barbearia.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Iniciando processo de registro...');

      // 1. Criar usuário no Supabase Auth
      console.log('Criando usuário...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.ownerName,
            phone: formData.phone,
          }
        }
      });

      if (authError) {
        console.error('Erro ao criar usuário:', authError);
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Erro ao criar usuário");
      }

      console.log('Usuário criado com sucesso:', authData.user.id);

      // 2. Aguardar para garantir que a sessão seja estabelecida
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 3. Criar a barbearia
      console.log('Criando barbearia...');
      const { data: barbershopData, error: barbershopError } = await supabase
        .from('barbershops')
        .insert([
          {
            name: formData.businessName,
            slug: formData.businessSlug,
            address: `${formData.address}, ${formData.city}${formData.state ? `, ${formData.state}` : ''}`,
            phone: formData.phone,
            email: formData.email,
            created_by: authData.user.id,
            opening_hours: {
              monday: { open: "09:00", close: "18:00" },
              tuesday: { open: "09:00", close: "18:00" },
              wednesday: { open: "09:00", close: "18:00" },
              thursday: { open: "09:00", close: "18:00" },
              friday: { open: "09:00", close: "18:00" },
              saturday: { open: "09:00", close: "18:00" },
              sunday: { open: "09:00", close: "18:00" }
            }
          }
        ])
        .select()
        .single();

      if (barbershopError) {
        console.error('Erro ao criar barbearia:', barbershopError);
        
        // Handle specific duplicate slug error
        if (barbershopError.code === '23505' && barbershopError.message.includes('slug')) {
          throw new Error("Este nome de barbearia já está em uso. Tente outro nome.");
        }
        
        throw new Error("Erro ao criar barbearia: " + barbershopError.message);
      }

      console.log('Barbearia criada com sucesso:', barbershopData.id);

      // 4. Criar o perfil do usuário como admin
      console.log('Criando perfil...');
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: authData.user.id,
            barbershop_id: barbershopData.id,
            full_name: formData.ownerName,
            email: formData.email,
            phone: formData.phone,
            role: 'admin'
          }
        ]);

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
        throw new Error("Erro ao criar perfil: " + profileError.message);
      }

      console.log('Perfil criado com sucesso');

      toast({
        title: "Conta criada com sucesso!",
        description: `Bem-vindo ao BarberFlow, ${formData.ownerName}!`,
      });

      // Redirecionamento para o dashboard da barbearia
      navigate(`/app/${formData.businessSlug}`);
      
    } catch (error: any) {
      console.error('Erro no registro:', error);
      
      // Tratamento específico de erros
      let errorMessage = error.message || "Ocorreu um erro inesperado. Tente novamente.";
      
      if (error.message.includes("User already registered")) {
        errorMessage = "Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.";
      } else if (error.message.includes("duplicate key value") || error.message.includes("já está em uso")) {
        errorMessage = "Este nome de barbearia já está em uso. Tente outro nome.";
      } else if (error.message.includes("For security purposes")) {
        errorMessage = "Muitas tentativas de cadastro. Aguarde alguns segundos e tente novamente.";
      } else if (error.message.includes("406") || error.message.includes("Not Acceptable")) {
        errorMessage = "Erro de permissão. Tente novamente em alguns instantes.";
      }
      
      toast({
        title: "Erro ao criar conta",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src={logo} alt="BarberFlow" className="w-10 h-10" />
            <span className="text-2xl font-bold">BarberFlow</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {step === 1 ? "Criar sua conta" : "Dados da barbearia"}
          </h1>
          <p className="text-muted-foreground">
            {step === 1 ? "Teste grátis por 14 dias" : "Configure sua barbearia"}
          </p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>
              Passo {step} de 2
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? "Primeiro, vamos criar sua conta pessoal" 
                : "Agora configure os dados da sua barbearia"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 ? (
              // Step 1: Dados pessoais
              <>
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Seu nome completo *</Label>
                  <Input
                    id="ownerName"
                    placeholder="Carlos Silva"
                    value={formData.ownerName}
                    onChange={(e) => handleInputChange("ownerName", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="carlos@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp *</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  />
                </div>

                <Button onClick={handleNextStep} className="w-full" disabled={loading}>
                  Próximo Passo
                </Button>
              </>
            ) : (
              // Step 2: Dados da barbearia
              <>
                <div className="space-y-2">
                  <Label htmlFor="businessName">Nome da barbearia *</Label>
                  <Input
                    id="businessName"
                    placeholder="Barbearia Navalha de Ouro"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessSlug">URL personalizada</Label>
                  <div className="flex items-center text-sm">
                    <span className="text-muted-foreground mr-1">barberflow.com/</span>
                    <Input
                      id="businessSlug"
                      value={formData.businessSlug}
                      onChange={(e) => handleInputChange("businessSlug", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço *</Label>
                  <Input
                    id="address"
                    placeholder="Rua das Flores, 123"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      placeholder="São Paulo"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      placeholder="SP"
                      value={formData.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workingHours">Horário de funcionamento</Label>
                  <Input
                    id="workingHours"
                    placeholder="08:00-18:00"
                    value={formData.workingHours}
                    onChange={(e) => handleInputChange("workingHours", e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1" disabled={loading}>
                    Voltar
                  </Button>
                  <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
                    {loading ? "Criando..." : "Criar Barbearia"}
                  </Button>
                </div>
              </>
            )}

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Fazer login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterForm;