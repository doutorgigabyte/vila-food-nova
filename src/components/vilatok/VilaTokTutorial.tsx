import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown,
  Hand,
  ShoppingBag,
  Heart,
  MessageCircle,
  Share2,
  Sparkles
} from 'lucide-react';

interface VilaTokTutorialProps {
  onComplete: () => void;
}

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  animation: 'swipe-horizontal' | 'swipe-vertical' | 'tap-product' | 'icons';
}

const steps: TutorialStep[] = [
  {
    id: 1,
    title: "Navegue entre vídeos",
    description: "Deslize para esquerda ou direita para ver mais vídeos",
    animation: 'swipe-horizontal'
  },
  {
    id: 2,
    title: "Mude de loja",
    description: "Deslize para cima ou para baixo para ver outras lojas",
    animation: 'swipe-vertical'
  },
  {
    id: 3,
    title: "Compre direto do vídeo",
    description: "Toque no produto para adicionar ao carrinho",
    animation: 'tap-product'
  },
  {
    id: 4,
    title: "Interaja com o conteúdo",
    description: "Curta, comente e compartilhe seus vídeos favoritos",
    animation: 'icons'
  }
];

export function VilaTokTutorial({ onComplete }: VilaTokTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = steps[currentStep];

  const renderAnimation = () => {
    switch (step.animation) {
      case 'swipe-horizontal':
        return (
          <div className="flex items-center justify-center gap-8">
            <motion.div
              animate={{ x: [-30, 0, -30] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="text-white/80"
            >
              <ChevronLeft className="w-12 h-12" />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center"
            >
              <Hand className="w-8 h-8 text-white" />
            </motion.div>
            <motion.div
              animate={{ x: [30, 0, 30] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="text-white/80"
            >
              <ChevronRight className="w-12 h-12" />
            </motion.div>
          </div>
        );

      case 'swipe-vertical':
        return (
          <div className="flex flex-col items-center justify-center gap-6">
            <motion.div
              animate={{ y: [-20, 0, -20] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="text-white/80"
            >
              <ChevronUp className="w-12 h-12" />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center"
            >
              <Hand className="w-8 h-8 text-white" />
            </motion.div>
            <motion.div
              animate={{ y: [20, 0, 20] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="text-white/80"
            >
              <ChevronDown className="w-12 h-12" />
            </motion.div>
          </div>
        );

      case 'tap-product':
        return (
          <div className="relative">
            <motion.div 
              className="bg-white/95 rounded-xl p-3 flex items-center gap-3 min-w-[200px]"
              animate={{ scale: [1, 0.95, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-foreground font-medium text-sm">Produto</p>
                <p className="text-primary font-bold text-sm">R$ 29,90</p>
              </div>
            </motion.div>
            <motion.div
              className="absolute -bottom-4 -right-4"
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </motion.div>
          </div>
        );

      case 'icons':
        return (
          <div className="flex flex-col items-center gap-4">
            {[
              { Icon: Heart, label: "Curtir", delay: 0 },
              { Icon: MessageCircle, label: "Comentar", delay: 0.2 },
              { Icon: Share2, label: "Compartilhar", delay: 0.4 }
            ].map(({ Icon, label, delay }) => (
              <motion.div
                key={label}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay, duration: 0.3 }}
              >
                <motion.div
                  className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: delay * 2 }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </motion.div>
                <span className="text-white/80 text-sm font-medium">{label}</span>
              </motion.div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6"
    >
      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 text-white/60 hover:text-white text-sm font-medium transition-colors"
      >
        Pular
      </button>

      {/* Step Indicators */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentStep 
                ? 'w-8 bg-primary' 
                : index < currentStep 
                  ? 'w-4 bg-white/60' 
                  : 'w-4 bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Animation Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex flex-col items-center gap-8"
        >
          <div className="h-40 flex items-center justify-center">
            {renderAnimation()}
          </div>

          <div className="text-center space-y-2 max-w-xs">
            <h2 className="text-white text-2xl font-bold">{step.title}</h2>
            <p className="text-white/70 text-base">{step.description}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Action Button */}
      <div className="absolute bottom-8 left-0 right-0 px-6">
        <Button
          onClick={handleNext}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 text-lg rounded-xl"
        >
          {currentStep < steps.length - 1 ? 'Próximo' : 'Entendi!'}
        </Button>
      </div>
    </motion.div>
  );
}
