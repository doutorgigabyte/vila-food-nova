import { User, Store, Bike } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProfileType = "customer" | "merchant" | "driver";

interface ProfileTypeSelectorProps {
  value: ProfileType;
  onChange: (value: ProfileType) => void;
}

const profileOptions = [
  {
    id: "customer" as ProfileType,
    label: "Cliente",
    description: "Fazer pedidos e compras",
    icon: User,
  },
  {
    id: "merchant" as ProfileType,
    label: "Lojista",
    description: "Vender produtos e serviços",
    icon: Store,
  },
  {
    id: "driver" as ProfileType,
    label: "Entregador",
    description: "Fazer entregas",
    icon: Bike,
  },
];

export const ProfileTypeSelector = ({ value, onChange }: ProfileTypeSelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" id="profile-type-label">
        Tipo de conta
      </label>
      <div
        role="radiogroup"
        aria-labelledby="profile-type-label"
        className="grid grid-cols-3 gap-2"
      >
        {profileOptions.map((option) => {
          const isSelected = value === option.id;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              id={`profile-${option.id}`}
              onClick={() => onChange(option.id)}
              className={cn(
                "rounded-lg border bg-card text-card-foreground shadow-sm cursor-pointer transition-all duration-200 hover:border-primary/50 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected && "ring-2 ring-primary border-primary bg-primary/5"
              )}
            >
              <div className="p-3 text-center">
                <div
                  className={cn(
                    "mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium">{option.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
