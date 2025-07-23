import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/barberflow-logo.png";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha e-mail e senha para continuar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Fazer login com Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Erro ao fazer login");
      }

      // Buscar perfil do usuário para obter a barbearia
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          barbershops (
            slug
          )
        `)
        .eq('user_id', authData.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Perfil não encontrado. Entre em contato com o suporte.");
      }

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta ao BarberFlow!",
      });

      // Redirecionar para o dashboard da barbearia do usuário
      const barbershopSlug = (profile.barbershops as any)?.slug;
      if (barbershopSlug) {
        navigate(`/dashboard/${barbershopSlug}`);
      } else {
        throw new Error("Barbearia não encontrada");
      }

    } catch (error: any) {
      console.error('Erro no login:', error);
      
      // Tratamento de erros específicos
      let errorMessage = "Ocorreu um erro inesperado. Tente novamente.";
      
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "E-mail ou senha incorretos.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Confirme seu e-mail antes de fazer login.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro no login",
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
          <h1 className="text-2xl font-bold mb-2">Entrar na sua conta</h1>
          <p className="text-muted-foreground">
            Acesse o painel da sua barbearia
          </p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Fazer Login</CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="text-center pt-6 border-t mt-6">
              <p className="text-sm text-muted-foreground">
                Ainda não tem uma conta?{" "}
                <Link to="/register" className="text-primary hover:underline">
                  Criar conta grátis
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;