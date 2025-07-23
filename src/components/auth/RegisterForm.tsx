import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/barberflow-logo.png";

const RegisterForm = () => {
  const [step, setStep] = useState(1);
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

    // TODO: Aqui será a integração com a API
    toast({
      title: "Conta criada com sucesso!",
      description: `Bem-vindo ao BarberFlow, ${formData.ownerName}!`,
    });

    // Simular redirecionamento para o dashboard da barbearia
    navigate(`/dashboard/${formData.businessSlug}`);
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

                <Button onClick={handleNextStep} className="w-full">
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
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Voltar
                  </Button>
                  <Button onClick={handleSubmit} className="flex-1">
                    Criar Barbearia
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