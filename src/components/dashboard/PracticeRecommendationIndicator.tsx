import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, Lightbulb } from "lucide-react";
import { RECOMMENDED_VALUES } from "@/hooks/useDeliveryConfig";

interface PracticeRecommendationIndicatorProps {
  type: 'commission' | 'base_fee' | 'fee_per_km';
  value: number;
  commissionType?: 'percentage' | 'fixed';
}

type Level = 'good' | 'attention' | 'review';

interface Evaluation {
  level: Level;
  message: string;
  recommendation: string;
}

const evaluateCommission = (value: number, type: 'percentage' | 'fixed'): Evaluation => {
  if (type === 'fixed') {
    if (value >= 3 && value <= 8) {
      return {
        level: 'good',
        message: 'Prática recomendada',
        recommendation: `Valor fixo justo para o entregador.`
      };
    } else if (value >= 2 && value < 3) {
      return {
        level: 'attention',
        message: 'Valor baixo',
        recommendation: 'Considere aumentar para atrair mais entregadores.'
      };
    } else if (value > 8) {
      return {
        level: 'attention',
        message: 'Valor alto',
        recommendation: 'Pode impactar sua margem de lucro.'
      };
    } else {
      return {
        level: 'review',
        message: 'Valor muito baixo',
        recommendation: `Recomendamos pelo menos R$ 3,00 por entrega.`
      };
    }
  }

  // Percentage evaluation
  if (value >= 15 && value <= 30) {
    return {
      level: 'good',
      message: 'Prática recomendada',
      recommendation: `Valor ideal: ${RECOMMENDED_VALUES.driver_commission_percentage}% equilibra ganhos do entregador e do estabelecimento.`
    };
  } else if ((value >= 10 && value < 15) || (value > 30 && value <= 50)) {
    return {
      level: 'attention',
      message: value < 15 ? 'Comissão baixa' : 'Comissão alta',
      recommendation: value < 15 
        ? 'Pode dificultar encontrar entregadores disponíveis.'
        : 'Você pode estar pagando mais que o necessário.'
    };
  } else {
    return {
      level: 'review',
      message: value < 10 ? 'Comissão muito baixa' : 'Comissão muito alta',
      recommendation: value < 10
        ? `Recomendamos pelo menos 15%. Ideal: ${RECOMMENDED_VALUES.driver_commission_percentage}%`
        : `Recomendamos no máximo 50%. Ideal: ${RECOMMENDED_VALUES.driver_commission_percentage}%`
    };
  }
};

const evaluateBaseFee = (value: number): Evaluation => {
  if (value >= 3 && value <= 8) {
    return {
      level: 'good',
      message: 'Prática recomendada',
      recommendation: `Taxa base ideal: R$ ${RECOMMENDED_VALUES.base_fee.toFixed(2)}`
    };
  } else if (value >= 2 && value < 3) {
    return {
      level: 'attention',
      message: 'Taxa baixa',
      recommendation: 'Pode não cobrir custos mínimos de deslocamento.'
    };
  } else if (value > 8 && value <= 12) {
    return {
      level: 'attention',
      message: 'Taxa alta',
      recommendation: 'Pode afastar clientes em pedidos próximos.'
    };
  } else if (value < 2) {
    return {
      level: 'review',
      message: 'Taxa muito baixa',
      recommendation: `Recomendamos pelo menos R$ 3,00. Ideal: R$ ${RECOMMENDED_VALUES.base_fee.toFixed(2)}`
    };
  } else {
    return {
      level: 'review',
      message: 'Taxa muito alta',
      recommendation: `Considere reduzir. Ideal: R$ ${RECOMMENDED_VALUES.base_fee.toFixed(2)}`
    };
  }
};

const evaluateFeePerKm = (value: number): Evaluation => {
  if (value >= 1 && value <= 2.5) {
    return {
      level: 'good',
      message: 'Prática recomendada',
      recommendation: `Taxa por km ideal: R$ ${RECOMMENDED_VALUES.fee_per_km.toFixed(2)}`
    };
  } else if (value >= 0.5 && value < 1) {
    return {
      level: 'attention',
      message: 'Taxa baixa',
      recommendation: 'Pode não compensar entregas mais distantes.'
    };
  } else if (value > 2.5 && value <= 4) {
    return {
      level: 'attention',
      message: 'Taxa alta',
      recommendation: 'Entregas distantes podem ficar muito caras.'
    };
  } else if (value < 0.5) {
    return {
      level: 'review',
      message: 'Taxa muito baixa',
      recommendation: `Recomendamos pelo menos R$ 1,00/km. Ideal: R$ ${RECOMMENDED_VALUES.fee_per_km.toFixed(2)}`
    };
  } else {
    return {
      level: 'review',
      message: 'Taxa muito alta',
      recommendation: `Considere reduzir. Ideal: R$ ${RECOMMENDED_VALUES.fee_per_km.toFixed(2)}`
    };
  }
};

export const PracticeRecommendationIndicator = ({ 
  type, 
  value, 
  commissionType = 'percentage' 
}: PracticeRecommendationIndicatorProps) => {
  let evaluation: Evaluation;

  switch (type) {
    case 'commission':
      evaluation = evaluateCommission(value, commissionType);
      break;
    case 'base_fee':
      evaluation = evaluateBaseFee(value);
      break;
    case 'fee_per_km':
      evaluation = evaluateFeePerKm(value);
      break;
  }

  const levelConfig = {
    good: {
      icon: CheckCircle2,
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-600 dark:text-green-400',
      iconColor: 'text-green-500'
    },
    attention: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      iconColor: 'text-yellow-500'
    },
    review: {
      icon: XCircle,
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-600 dark:text-red-400',
      iconColor: 'text-red-500'
    }
  };

  const config = levelConfig[evaluation.level];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border",
      config.bgColor,
      config.borderColor
    )}>
      <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", config.iconColor)} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", config.textColor)}>
          {evaluation.message}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <Lightbulb className="w-3 h-3" />
          {evaluation.recommendation}
        </p>
      </div>
    </div>
  );
};

// Helper function to format distance display
export const formatDistance = (kmValue: number): string => {
  if (kmValue < 1) {
    return `${Math.round(kmValue * 1000)}m`;
  }
  return `${kmValue} km`;
};
