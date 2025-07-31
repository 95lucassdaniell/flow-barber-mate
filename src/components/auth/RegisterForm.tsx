import React, { useState } from "react";
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
    console.log('=== INICIANDO CADASTRO HÍBRIDO ===');
    
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
      // Primeiro, criar o usuário
      console.log('Criando usuário...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/register?confirmed=true`,
          data: {
            full_name: formData.ownerName,
          }
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData?.user) {
        throw new Error("Falha na criação do usuário");
      }

      console.log('Usuário criado:', authData.user.id);

      // Verificar se email precisa ser confirmado
      if (!authData.session) {
        console.log('Email precisa ser confirmado - aguardando confirmação');
        setStep(3); // Novo step para confirmação
        toast({
          title: "Confirme seu email",
          description: "Enviamos um link de confirmação para seu email. Clique no link para continuar.",
        });
        return;
      }

      // Se chegou aqui, sessão foi estabelecida - prosseguir com criação da barbearia
      await createBarbershopAndProfile(authData.user.id);

    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Erro desconhecido ao criar conta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createBarbershopAndProfile = async (userId: string) => {
    console.log('Criando barbearia...');
    
    const barbershopData = {
      name: formData.businessName,
      slug: formData.businessSlug,
      address: `${formData.address}, ${formData.city}${formData.state ? `, ${formData.state}` : ''}`,
      phone: formData.phone,
      email: formData.email,
      created_by: userId,
      opening_hours: {
        monday: { open: "09:00", close: "18:00" },
        tuesday: { open: "09:00", close: "18:00" },
        wednesday: { open: "09:00", close: "18:00" },
        thursday: { open: "09:00", close: "18:00" },
        friday: { open: "09:00", close: "18:00" },
        saturday: { open: "09:00", close: "18:00" },
        sunday: { open: "09:00", close: "18:00" }
      }
    };

    const { data: barbershop, error: barbershopError } = await supabase
      .from('barbershops')
      .insert(barbershopData)
      .select()
      .single();

    if (barbershopError) {
      throw new Error(`Erro ao criar barbearia: ${barbershopError.message}`);
    }

    console.log('Criando perfil...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        full_name: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        barbershop_id: barbershop.id,
        role: 'admin'
      });

    if (profileError) {
      throw new Error(`Erro ao criar perfil: ${profileError.message}`);
    }

    console.log('Cadastro realizado com sucesso!');
    toast({
      title: "Sucesso!",
      description: "Conta criada com sucesso! Redirecionando...",
    });

    setTimeout(() => {
      navigate('/app');
    }, 1500);
  };

  const resendConfirmationEmail = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/register?confirmed=true`
        }
      });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao reenviar email de confirmação",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email reenviado",
          description: "Um novo email de confirmação foi enviado",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao reenviar email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailConfirmed = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log("Email confirmado - finalizando cadastro");
        await createBarbershopAndProfile(session.user.id);
      }
    } catch (error) {
      console.error("Erro ao finalizar cadastro após confirmação:", error);
      toast({
        title: "Erro",
        description: "Erro ao finalizar cadastro. Tente fazer login.",
        variant: "destructive",
      });
    }
  };

  // Verificar se voltou da confirmação de email
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('confirmed') === 'true') {
      handleEmailConfirmed();
    }
  }, []);

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
            {step === 1 ? "Criar sua conta" : step === 2 ? "Dados da barbearia" : "Confirme seu email"}
          </h1>
          <p className="text-muted-foreground">
            {step === 1 ? "Teste grátis por 14 dias" : step === 2 ? "Configure sua barbearia" : "Verifique seu email"}
          </p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>
              {step === 3 ? "Confirmação de Email" : `Passo ${step} de 2`}
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? "Primeiro, vamos criar sua conta pessoal" 
                : step === 2 
                ? "Agora configure os dados da sua barbearia"
                : "Verifique seu email para continuar"
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
            ) : step === 2 ? (
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
            ) : (
              // Step 3: Confirmação de email
              <div className="space-y-4 text-center">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Confirme seu email</h3>
                  <p className="text-muted-foreground">
                    Enviamos um link de confirmação para <strong>{formData.email}</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Clique no link no seu email para finalizar o cadastro
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resendConfirmationEmail}
                  disabled={loading}
                >
                  Reenviar email de confirmação
                </Button>
              </div>
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