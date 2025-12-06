import { Snowflake, Thermometer, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

export type TemperatureOption = 'gelada' | 'ambiente' | 'congelada' | 'in_natura';

interface TemperatureSelectorProps {
  options: TemperatureOption[];
  value: TemperatureOption | null;
  onChange: (temp: TemperatureOption) => void;
  variant?: 'default' | 'compact';
}

const temperatureConfig: Record<TemperatureOption, { label: string; icon: typeof Snowflake; color: string }> = {
  gelada: { label: 'Gelada', icon: Snowflake, color: 'text-blue-500' },
  ambiente: { label: 'Ambiente', icon: Thermometer, color: 'text-orange-500' },
  congelada: { label: 'Congelada', icon: Snowflake, color: 'text-cyan-500' },
  in_natura: { label: 'In Natura', icon: Wind, color: 'text-green-500' },
};

export const TemperatureSelector = ({ 
  options, 
  value, 
  onChange,
  variant = 'default'
}: TemperatureSelectorProps) => {
  if (options.length === 0) return null;

  if (variant === 'compact') {
    return (
      <div className="flex gap-2">
        {options.map((option) => {
          const config = temperatureConfig[option];
          const Icon = config.icon;
          const isSelected = value === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-full border transition-all text-sm",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Icon className={cn("w-4 h-4", isSelected ? "text-primary" : config.color)} />
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <Thermometer className="w-4 h-4" />
        Como prefere receber?
      </h4>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const config = temperatureConfig[option];
          const Icon = config.icon;
          const isSelected = value === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Icon className={cn("w-6 h-6", isSelected ? "text-primary" : config.color)} />
              <span className={cn("font-medium", isSelected && "text-primary")}>
                {config.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const TemperatureBadge = ({ temperature }: { temperature: TemperatureOption }) => {
  const config = temperatureConfig[temperature];
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
      temperature === 'gelada' && "bg-blue-100 text-blue-700",
      temperature === 'ambiente' && "bg-orange-100 text-orange-700",
      temperature === 'congelada' && "bg-cyan-100 text-cyan-700",
      temperature === 'in_natura' && "bg-green-100 text-green-700",
    )}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};
