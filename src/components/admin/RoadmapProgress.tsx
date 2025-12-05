import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  CreditCard, 
  MessageSquare, 
  Palette, 
  Settings, 
  Rocket,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";

interface Phase {
  id: number;
  name: string;
  description: string;
  icon: any;
  status: 'completed' | 'in_progress' | 'pending';
  progress: number;
  tasks: {
    name: string;
    status: 'completed' | 'in_progress' | 'pending';
  }[];
}

const phases: Phase[] = [
  {
    id: 1,
    name: "Dados e Migração",
    description: "Migração de dados do sistema legado",
    icon: Database,
    status: 'completed',
    progress: 100,
    tasks: [
      { name: "Criação de Vilas", status: 'completed' },
      { name: "Vinculação de Estabelecimentos", status: 'completed' },
      { name: "useCreateOrder implementado", status: 'completed' },
      { name: "Migração de Produtos", status: 'completed' },
      { name: "Sincronização de Usuários (Edge Function)", status: 'completed' },
    ]
  },
  {
    id: 2,
    name: "Correções Core",
    description: "Funcionalidades principais do sistema",
    icon: Settings,
    status: 'completed',
    progress: 100,
    tasks: [
      { name: "Checkout funcional", status: 'completed' },
      { name: "Dashboard com dados reais", status: 'completed' },
      { name: "Sistema de pedidos completo", status: 'completed' },
      { name: "Multi-vila checkout", status: 'completed' },
      { name: "Cálculo de frete real (Edge Function)", status: 'completed' },
    ]
  },
  {
    id: 3,
    name: "Integrações de Pagamento",
    description: "Mercado Pago PIX, Cartão e Assinaturas",
    icon: CreditCard,
    status: 'completed',
    progress: 100,
    tasks: [
      { name: "PIX QR Code (Edge Function)", status: 'completed' },
      { name: "Split Payment (Edge Function)", status: 'completed' },
      { name: "Assinaturas SaaS (Edge Function)", status: 'completed' },
      { name: "Webhooks MP", status: 'completed' },
    ]
  },
  {
    id: 4,
    name: "Integração WhatsApp",
    description: "Bot IA com Evolution API + Gemini",
    icon: MessageSquare,
    status: 'completed',
    progress: 100,
    tasks: [
      { name: "Configuração por Estabelecimento", status: 'completed' },
      { name: "Bot de Atendimento IA", status: 'completed' },
      { name: "Webhook WhatsApp", status: 'completed' },
      { name: "Notificações automáticas (Hook)", status: 'completed' },
    ]
  },
  {
    id: 5,
    name: "Ajustes de Layout",
    description: "UX/UI mobile e desktop",
    icon: Palette,
    status: 'completed',
    progress: 100,
    tasks: [
      { name: "Store Mobile", status: 'completed' },
      { name: "Marketplace", status: 'completed' },
      { name: "Checkout Flow", status: 'completed' },
      { name: "Comanda Digital", status: 'completed' },
      { name: "Página de Vilas", status: 'completed' },
      { name: "Dashboard Responsivo", status: 'completed' },
    ]
  },
  {
    id: 6,
    name: "Deploy e Go-Live",
    description: "Testes finais e produção",
    icon: Rocket,
    status: 'in_progress',
    progress: 30,
    tasks: [
      { name: "Testes E2E", status: 'pending' },
      { name: "Preparação de produção", status: 'in_progress' },
      { name: "Go-Live", status: 'pending' },
    ]
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'text-green-500';
    case 'in_progress': return 'text-yellow-500';
    default: return 'text-muted-foreground';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'in_progress': return <Clock className="w-4 h-4 text-yellow-500" />;
    default: return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed': return <Badge className="bg-green-500">Concluído</Badge>;
    case 'in_progress': return <Badge className="bg-yellow-500">Em Progresso</Badge>;
    default: return <Badge variant="secondary">Pendente</Badge>;
  }
};

const RoadmapProgress = () => {
  const totalProgress = Math.round(phases.reduce((acc, p) => acc + p.progress, 0) / phases.length);

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progresso Geral do Desenvolvimento</span>
            <Badge variant="outline" className="text-lg px-4 py-1">{totalProgress}%</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={totalProgress} className="h-3" />
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-500">
                {phases.filter(p => p.status === 'completed').length}
              </p>
              <p className="text-sm text-muted-foreground">Concluídas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">
                {phases.filter(p => p.status === 'in_progress').length}
              </p>
              <p className="text-sm text-muted-foreground">Em Progresso</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-muted-foreground">
                {phases.filter(p => p.status === 'pending').length}
              </p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phases */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {phases.map((phase) => {
          const Icon = phase.icon;
          return (
            <Card key={phase.id} className={`${phase.status === 'in_progress' ? 'border-yellow-500/50' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      phase.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
                      phase.status === 'in_progress' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      'bg-muted'
                    }`}>
                      <Icon className={`w-5 h-5 ${getStatusColor(phase.status)}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">Fase {phase.id}</CardTitle>
                      <p className="text-sm font-medium">{phase.name}</p>
                    </div>
                  </div>
                  {getStatusBadge(phase.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{phase.description}</p>
                <Progress value={phase.progress} className="h-2 mb-3" />
                <div className="space-y-2">
                  {phase.tasks.map((task, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {getStatusIcon(task.status)}
                      <span className={task.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                        {task.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RoadmapProgress;
