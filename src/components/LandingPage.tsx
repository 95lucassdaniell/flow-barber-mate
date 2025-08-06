import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  MessageCircle, 
  Calendar, 
  TrendingUp, 
  Users, 
  Clock, 
  Scissors, 
  Eye,
  BarChart3,
  Sparkles,
  Check,
  X,
  Star,
  Shield,
  Phone,
  Mail,
  Play,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-barbershop.jpg";
const logo = "https://res.cloudinary.com/dghn7y0xb/image/upload/v1754334824/salao.ai_l17xsc.png";
import usePageTitle from "@/hooks/usePageTitle";

const LandingPage = () => {
  usePageTitle();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-lg z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="Salão.ai" className="w-[150px] h-auto" />
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#ai-features" className="text-muted-foreground hover:text-foreground transition-colors">
              IA Preditiva
            </a>
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
              <Button variant="hero">Teste Grátis 14 dias</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background text-foreground">
        <div className="absolute inset-0 bg-hero-gradient opacity-5"></div>
        <div className="absolute inset-0 bg-cover bg-center opacity-10 grayscale" style={{
          backgroundImage: `url(${heroImage})`
        }}></div>
        
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-accent/10 text-accent border-accent/20">
              <Sparkles className="w-4 h-4 mr-2" />
              IA que Realmente Funciona
            </Badge>
            
            <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight">
              A Única <span className="text-accent">IA</span> que Realmente
              <br />
              <span className="bg-hero-gradient bg-clip-text text-transparent">Enche sua Agenda</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-muted-foreground max-w-3xl mx-auto">
              Sistema inteligente com automações que trabalham 24h para o seu salão. 
              <strong className="text-foreground"> Previsões precisas, clientes reativados automaticamente e agenda sempre cheia.</strong>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/register">
                <Button variant="hero" size="lg" className="text-lg px-8 py-4">
                  <Brain className="w-5 h-5 mr-2" />
                  Começar Teste Grátis 14 dias
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                <Play className="w-5 h-5 mr-2" />
                Ver IA em Ação
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-accent/20 border-2 border-background flex items-center justify-center text-xs font-bold">
                      {i}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">+500 salões crescendo com nossa IA</span>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Check className="w-4 h-4 text-accent" />
                  <span>Sem cartão de crédito</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Check className="w-4 h-4 text-accent" />
                  <span>Setup em 5 minutos</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Check className="w-4 h-4 text-accent" />
                  <span>Suporte completo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Credibility Section */}
      <section className="py-16 bg-secondary/30 border-t">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-4">Resultados Reais de Salões Reais</h2>
            <p className="text-muted-foreground">Veja o que nossos clientes alcançaram com a IA do Salão.ai</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="p-6 text-center bg-card-gradient shadow-elegant">
              <div className="text-3xl font-bold text-accent mb-2">+67%</div>
              <div className="text-sm text-muted-foreground">Aumento no faturamento médio</div>
            </Card>
            <Card className="p-6 text-center bg-card-gradient shadow-elegant">
              <div className="text-3xl font-bold text-accent mb-2">89%</div>
              <div className="text-sm text-muted-foreground">Taxa de ocupação da agenda</div>
            </Card>
            <Card className="p-6 text-center bg-card-gradient shadow-elegant">
              <div className="text-3xl font-bold text-accent mb-2">3x</div>
              <div className="text-sm text-muted-foreground">Mais clientes reativados</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-destructive/10 text-destructive border-destructive/20">
                  <X className="w-4 h-4 mr-2" />
                  O Problema
                </Badge>
                <h2 className="text-3xl font-bold mb-6 text-destructive">
                  Sua agenda vazia não é por acaso
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start space-x-3">
                    <X className="w-5 h-5 text-destructive mt-1 flex-shrink-0" />
                    <span>Clientes não voltam e você não sabe porquê</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <X className="w-5 h-5 text-destructive mt-1 flex-shrink-0" />
                    <span>Horários vagos que poderiam estar gerando receita</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <X className="w-5 h-5 text-destructive mt-1 flex-shrink-0" />
                    <span>Sem previsibilidade para planejar o futuro</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <X className="w-5 h-5 text-destructive mt-1 flex-shrink-0" />
                    <span>Dependência total do seu tempo para crescer</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
                  <Brain className="w-4 h-4 mr-2" />
                  Nossa IA Resolve
                </Badge>
                <h2 className="text-3xl font-bold mb-6">
                  Como nossa IA transforma seu salão
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                    <span>Prevê exatamente quando clientes vão cancelar e os reativa automaticamente</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                    <span>Otimiza sua agenda para maximizar ocupação e lucro</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                    <span>Prevê seu faturamento dos próximos 30 dias com 94% de precisão</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                    <span>Trabalha 24h automatizando crescimento enquanto você dorme</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section id="ai-features" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
              <Brain className="w-4 h-4 mr-2" />
              Inteligência Artificial
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              A IA Mais Avançada para Salões
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Não é apenas um sistema. É um assistente inteligente que aprende com seu negócio e toma decisões para maximizar seus resultados.
            </p>
          </div>

          <Tabs defaultValue="predictive" className="max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-12 h-28">
              <TabsTrigger value="predictive" className="text-center p-4">
                <div>
                  <Brain className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-semibold">IA Preditiva</div>
                </div>
              </TabsTrigger>
              <TabsTrigger value="automation" className="text-center p-4">
                <div>
                  <MessageCircle className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-semibold">Automações</div>
                </div>
              </TabsTrigger>
              <TabsTrigger value="optimization" className="text-center p-4">
                <div>
                  <TrendingUp className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-semibold">Otimização</div>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="predictive" className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4">Previsões que Realmente Funcionam</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <BarChart3 className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                      <span><strong>Faturamento dos próximos 30 dias</strong> - Precisão de 94%</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Eye className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                      <span><strong>Clientes em risco de cancelamento</strong> - Identifica 15 dias antes</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                      <span><strong>Melhores horários para cada cliente</strong> - Aumenta taxa de comparecimento</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <TrendingUp className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                      <span><strong>Oportunidades de aumento de ticket</strong> - Sugere serviços complementares</span>
                    </li>
                  </ul>
                </div>
                <Card className="p-6 bg-card-gradient shadow-elegant">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-accent mb-2">R$ 12.847</div>
                    <div className="text-sm text-muted-foreground mb-4">Previsão para próximos 30 dias</div>
                    <div className="flex items-center justify-center space-x-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-accent" />
                      <span>+23% vs mês anterior</span>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="automation" className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4">WhatsApp que Trabalha Sozinho</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <MessageCircle className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                      <span><strong>Lembretes automáticos</strong> - Reduz faltas em 78%</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Users className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                      <span><strong>Reativação de clientes inativos</strong> - 3x mais efetivo</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                      <span><strong>Campanhas de aniversário</strong> - 67% de taxa de conversão</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                      <span><strong>Promoções em horários vazios</strong> - Preenche 89% dos gaps</span>
                    </li>
                  </ul>
                </div>
                <Card className="p-6 bg-card-gradient shadow-elegant">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-accent" />
                      </div>
                      <div className="text-sm">
                        <div className="font-semibold">Olá Maria! Lembrete do seu horário amanhã às 14h 😊</div>
                        <div className="text-muted-foreground">Enviado automaticamente</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-accent" />
                      </div>
                      <div className="text-sm">
                        <div className="font-semibold">João, sentimos sua falta! Que tal agendar?</div>
                        <div className="text-muted-foreground">Reativação automática</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="optimization" className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4">Otimização Contínua dos Resultados</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <TrendingUp className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                      <span><strong>Preços dinâmicos</strong> - Ajusta automaticamente para maximizar lucro</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                      <span><strong>Agenda otimizada</strong> - Reduz tempo ocioso em 45%</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Users className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                      <span><strong>Matching cliente-profissional</strong> - Melhora satisfação</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <BarChart3 className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                      <span><strong>Relatórios de performance</strong> - Insights acionáveis diários</span>
                    </li>
                  </ul>
                </div>
                <Card className="p-6 bg-card-gradient shadow-elegant">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Taxa de Ocupação</span>
                      <span className="text-accent font-bold">89%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-accent h-2 rounded-full" style={{width: '89%'}}></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Ticket Médio</span>
                      <span className="text-accent font-bold">R$ 87</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-accent h-2 rounded-full" style={{width: '72%'}}></div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Complete Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Sistema Completo para Gestão Inteligente
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Além da IA, você tem todas as ferramentas para gerenciar seu salão de forma moderna e eficiente.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 bg-card-gradient shadow-elegant hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Agenda Inteligente</h3>
              <p className="text-muted-foreground">
                Agenda compartilhada com bloqueios automáticos, controle por profissional e sincronização em tempo real.
              </p>
            </Card>

            <Card className="p-6 bg-card-gradient shadow-elegant hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">CRM Completo</h3>
              <p className="text-muted-foreground">
                Histórico completo dos clientes, preferências, lembretes de aniversário e segmentação automática.
              </p>
            </Card>

            <Card className="p-6 bg-card-gradient shadow-elegant hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Financeiro Simplificado</h3>
              <p className="text-muted-foreground">
                Controle de comissões, relatórios de faturamento e visão clara do lucro em tempo real.
              </p>
            </Card>

            <Card className="p-6 bg-card-gradient shadow-elegant hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Scissors className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Gestão de Serviços</h3>
              <p className="text-muted-foreground">
                Catálogo completo de serviços, preços dinâmicos e combos automáticos para aumentar ticket.
              </p>
            </Card>

            <Card className="p-6 bg-card-gradient shadow-elegant hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Avaliações Automáticas</h3>
              <p className="text-muted-foreground">
                Coleta automática de feedback dos clientes e gestão da reputação online.
              </p>
            </Card>

            <Card className="p-6 bg-card-gradient shadow-elegant hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Segurança Total</h3>
              <p className="text-muted-foreground">
                Dados protegidos com criptografia, backup automático e conformidade com LGPD.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Escolha o Plano Ideal para seu Salão
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Todos os planos incluem teste grátis de 14 dias, setup completo e suporte. Cancele quando quiser.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Plano Essencial */}
            <Card className="p-6 bg-card shadow-elegant">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Essencial</h3>
                <p className="text-muted-foreground mb-4">Para salões iniciantes</p>
                <div className="text-4xl font-bold mb-2">R$ 97<span className="text-lg text-muted-foreground">/mês</span></div>
                <Badge variant="secondary">Mais Popular</Badge>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <span>Agenda inteligente para até 2 profissionais</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <span>WhatsApp básico (lembretes automáticos)</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <span>Relatórios essenciais de faturamento</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <span>CRM básico de clientes</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <span>Suporte via chat</span>
                </li>
              </ul>
              
              <Link to="/register" className="block">
                <Button variant="outline" className="w-full">
                  Começar Teste Grátis
                </Button>
              </Link>
            </Card>

            {/* Plano Profissional */}
            <Card className="p-6 bg-hero-gradient text-primary-foreground shadow-glow border-2 border-accent relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent text-accent-foreground">
                Recomendado
              </Badge>
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Profissional</h3>
                <p className="text-primary-foreground/80 mb-4">Para salões em crescimento</p>
                <div className="text-4xl font-bold mb-2">R$ 197<span className="text-lg text-primary-foreground/80">/mês</span></div>
                <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
                  IA Completa
                </Badge>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <span><strong>Tudo do Essencial +</strong></span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <span>IA Preditiva completa (previsões + otimizações)</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <span>WhatsApp avançado (reativação + campanhas)</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <span>Até 5 profissionais</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <span>Relatórios avançados e insights</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <span>Suporte prioritário via WhatsApp</span>
                </li>
              </ul>
              
              <Link to="/register" className="block">
                <Button variant="secondary" className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  Começar Teste Grátis
                </Button>
              </Link>
            </Card>

            {/* Plano Premium */}
            <Card className="p-6 bg-card shadow-elegant">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Premium</h3>
                <p className="text-muted-foreground mb-4">Para redes e salões grandes</p>
                <div className="text-4xl font-bold mb-2">R$ 297<span className="text-lg text-muted-foreground">/mês</span></div>
                <Badge variant="secondary">Recursos Exclusivos</Badge>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <span><strong>Tudo do Profissional +</strong></span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <span>Profissionais ilimitados</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <span>API personalizada para integrações</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <span>Relatórios customizados</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <span>Múltiplas unidades</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <span>Consultoria mensal dedicada</span>
                </li>
              </ul>
              
              <Link to="/register" className="block">
                <Button variant="outline" className="w-full">
                  Começar Teste Grátis
                </Button>
              </Link>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Dúvidas sobre qual plano escolher? Fale conosco!
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="ghost" size="sm">
                <Phone className="w-4 h-4 mr-2" />
                (11) 99999-9999
              </Button>
              <Button variant="ghost" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                contato@salao.ai
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-16 bg-background border-t">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <Shield className="w-16 h-16 text-accent mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Garantia de 30 Dias</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Se em 30 dias você não ver resultados reais no seu salão, devolvemos 100% do seu dinheiro. 
              Sem perguntas, sem burocracia.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Setup Gratuito</h3>
                <p className="text-sm text-muted-foreground">Nossa equipe configura tudo para você</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Treinamento Incluído</h3>
                <p className="text-sm text-muted-foreground">Sua equipe aprende a usar em 1 dia</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Suporte Dedicado</h3>
                <p className="text-sm text-muted-foreground">Estamos aqui sempre que precisar</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-hero-gradient text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto para Transformar seu Salão?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Junte-se a centenas de salões que já triplicaram seu faturamento com nossa IA. 
            <br />
            <strong>Teste grátis por 14 dias. Sem cartão. Sem compromisso.</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button variant="secondary" size="lg" className="text-lg px-12 py-4 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Brain className="w-5 h-5 mr-2" />
                Começar Agora - É Grátis
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 flex items-center justify-center space-x-6 text-sm opacity-80">
            <div className="flex items-center space-x-1">
              <Check className="w-4 h-4" />
              <span>14 dias grátis</span>
            </div>
            <div className="flex items-center space-x-1">
              <Check className="w-4 h-4" />
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center space-x-1">
              <Check className="w-4 h-4" />
              <span>Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img src={logo} alt="Salão.ai" className="w-32 h-auto mb-4" />
              <p className="text-muted-foreground">
                A primeira IA especializada em salões de beleza do Brasil. 
                Transformando negócios em sucesso.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#ai-features" className="hover:text-foreground transition-colors">IA Preditiva</a></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Integração</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Tutoriais</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status do Sistema</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>(11) 99999-9999</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>contato@salao.ai</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 Salão.ai. Todos os direitos reservados. Transformando salões em negócios digitais inteligentes.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;