import { Check, X } from 'lucide-react';
import { passwordRequirements, validatePassword, getPasswordStrength } from '@/lib/passwordValidation';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export const PasswordStrengthIndicator = ({ password, showRequirements = true }: PasswordStrengthIndicatorProps) => {
  const { passedCount, requirements } = validatePassword(password);
  const strength = getPasswordStrength(passedCount);

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Força da senha</span>
          <span className={cn(
            "font-medium",
            strength.percentage <= 25 && "text-destructive",
            strength.percentage === 50 && "text-yellow-500",
            strength.percentage === 75 && "text-blue-500",
            strength.percentage === 100 && "text-green-500"
          )}>
            {strength.label}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", strength.color)}
            style={{ width: `${strength.percentage}%` }}
          />
        </div>
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <ul className="space-y-1">
          {passwordRequirements.map((req, index) => {
            const result = requirements.find((r) => r.id === req.id);
            const passed = result?.passed ?? false;

            return (
              <li
                key={req.id}
                className={cn(
                  "flex items-center gap-2 text-xs transition-colors",
                  passed ? "text-green-600" : "text-muted-foreground"
                )}
              >
                {passed ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <X className="h-3 w-3 text-muted-foreground/50" />
                )}
                {req.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
