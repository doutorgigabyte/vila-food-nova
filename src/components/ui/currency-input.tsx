import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  className?: string;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, placeholder = "0,00", className }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(() => 
      value ? value.toFixed(2).replace('.', ',') : ''
    );

    // Update display when external value changes (e.g., form reset)
    React.useEffect(() => {
      if (value !== undefined && value !== null) {
        const formatted = value.toFixed(2).replace('.', ',');
        // Only update if significantly different to avoid cursor issues
        const current = parseFloat(displayValue.replace(',', '.')) || 0;
        if (Math.abs(current - value) > 0.001) {
          setDisplayValue(formatted);
        }
      } else if (value === undefined || value === null) {
        if (displayValue !== '') {
          setDisplayValue('');
        }
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let input = e.target.value;
      
      // Allow only digits and comma
      input = input.replace(/[^\d,]/g, '');
      
      // Ensure only one comma
      const parts = input.split(',');
      if (parts.length > 2) {
        input = parts[0] + ',' + parts.slice(1).join('');
      }
      
      // Limit decimal places to 2
      if (parts.length === 2 && parts[1].length > 2) {
        input = parts[0] + ',' + parts[1].slice(0, 2);
      }
      
      setDisplayValue(input);
      
      // Parse and update form value
      const parsed = parseFloat(input.replace(',', '.'));
      onChange(isNaN(parsed) ? undefined : parsed);
    };

    const handleBlur = () => {
      // Format on blur
      if (displayValue) {
        const parsed = parseFloat(displayValue.replace(',', '.'));
        if (!isNaN(parsed)) {
          setDisplayValue(parsed.toFixed(2).replace('.', ','));
        }
      }
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(className)}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
