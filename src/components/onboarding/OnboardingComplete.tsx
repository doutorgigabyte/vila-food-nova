import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  PartyPopper, 
  Store, 
  LayoutDashboard, 
  Package,
  MessageCircle,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";
import { toast } from "sonner";

interface OnboardingCompleteProps {
  slug: string;
  establishmentName: string;
}

const nextSteps = [
  {
    icon: Package,
    title: "Adicionar mais produtos",
    description: "Complete seu cardápio com todos os itens",
    link: "produtos",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: CreditCard,
    title: "Configurar pagamentos",
    description: "Conecte o Mercado Pago para receber",
    link: "configuracoes",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: MessageCircle,
    title: "Ativar WhatsApp",
    description: "Receba pedidos automaticamente",
    link: "whatsapp",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
];

export const OnboardingComplete = ({ slug, establishmentName }: OnboardingCompleteProps) => {
  const [copied, setCopied] = useState(false);
  const storeUrl = `${window.location.origin}/loja/${slug}`;
  const dashboardUrl = `/painel/${slug}`;

  // Celebration confetti
  useEffect(() => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#ff4757", "#ffa502", "#2ed573"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#ff4757", "#ffa502", "#2ed573"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full space-y-6"
      >
        {/* Success Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-4"
          >
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl md:text-3xl font-bold mb-2"
          >
            🎉 Parabéns!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground"
          >
            <span className="font-semibold text-foreground">{establishmentName}</span> 
            {" "}foi criada com sucesso!
          </motion.p>
        </div>

        {/* Store Link Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Sua loja está em:</p>
                  <p className="font-medium text-sm truncate">{storeUrl}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyLink}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 gap-3"
        >
          <Button asChild size="lg" className="w-full">
            <Link to={dashboardUrl}>
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Acessar Painel
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link to={`/loja/${slug}`} target="_blank">
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Loja
            </Link>
          </Button>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <PartyPopper className="w-4 h-4 text-primary" />
            Próximos passos
          </h3>

          <div className="space-y-2">
            {nextSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <Link to={`${dashboardUrl}/${step.link}`}>
                  <Card className="p-3 hover:bg-muted/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${step.bgColor}`}>
                        <step.icon className={`w-4 h-4 ${step.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{step.title}</p>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
