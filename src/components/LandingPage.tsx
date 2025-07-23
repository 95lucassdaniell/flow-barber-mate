import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Scissors, Calendar, MessageCircle, TrendingUp, Users, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-barbershop.jpg";
import logo from "@/assets/barberflow-logo.png";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="BarberFlow" className="w-8 h-8" />
            <span className="text-xl font-bold text-foreground">BarberFlow</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Preços
            </a>
            <Link to="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button variant="hero">Teste Grátis</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-hero-gradient text-primary-foreground">
        <div className="absolute inset-0 bg-black/20"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${heroImage})` }}
        ></div>
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Automatize sua barbearia e 
              <span className="text-accent"> aumente o faturamento</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90">
              O único sistema que realmente preenche sua agenda e reativa clientes automaticamente via WhatsApp
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button variant="hero" size="lg" className="text-lg px-8 py-4">
                  Começar Teste Grátis
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 bg-white/10 border-white/20 text-white hover:bg-white/20">
                Ver Demonstração
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Por que escolher o BarberFlow?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Não é mais um sistema complicado. É o assistente que sua barbearia precisa para crescer.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 bg-card-gradient shadow-elegant hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">WhatsApp Automático</h3>
              <p className="text-muted-foreground">
                Lembretes automáticos, confirmações e campanhas de reativação direto no WhatsApp dos seus clientes.
              </p>
            </Card>

            <Card className="p-6 bg-card-gradient shadow-elegant hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Agenda Inteligente</h3>
              <p className="text-muted-foreground">
                Agenda compartilhada para toda equipe com bloqueios automáticos e controle por profissional.
              </p>
            </Card>

            <Card className="p-6 bg-card-gradient shadow-elegant hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Retenção Automática</h3>
              <p className="text-muted-foreground">
                Campanhas de aniversário e reativação de clientes inativos funcionam sozinhas.
              </p>
            </Card>

            <Card className="p-6 bg-card-gradient shadow-elegant hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Gestão de Equipe</h3>
              <p className="text-muted-foreground">
                Controle de comissões, agendas individuais e níveis de acesso para cada profissional.
              </p>
            </Card>

            <Card className="p-6 bg-card-gradient shadow-elegant hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Financeiro Simplificado</h3>
              <p className="text-muted-foreground">
                Veja seu lucro real em 3 números: faturamento, gastos e sobra no mês.
              </p>
            </Card>

            <Card className="p-6 bg-card-gradient shadow-elegant hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Scissors className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Feito para Barbearias</h3>
              <p className="text-muted-foreground">
                Interface simples, mobile-first e pensada especificamente para o seu negócio.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-hero-gradient text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para encher sua agenda?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Teste grátis por 14 dias. Sem cartão de crédito. Configure em 5 minutos.
          </p>
          <Link to="/register">
            <Button variant="hero" size="lg" className="text-lg px-8 py-4">
              Começar Agora - É Grátis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src={logo} alt="BarberFlow" className="w-6 h-6" />
            <span className="font-semibold">BarberFlow</span>
          </div>
          <p>&copy; 2024 BarberFlow. Transformando barbearias em negócios digitais.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;