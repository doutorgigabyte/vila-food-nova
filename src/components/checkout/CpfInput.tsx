/**
 * CpfInput - Campo de CPF com máscara
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Check, AlertCircle } from 'lucide-react';

interface CpfInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function validateCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false; // All same digits
  
  // Validation algorithm
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[10])) return false;
  
  return true;
}

export function CpfInput({ value, onChange, required }: CpfInputProps) {
  const [touched, setTouched] = useState(false);
  const digits = value.replace(/\D/g, '');
  const isComplete = digits.length === 11;
  const isValid = isComplete && validateCpf(value);
  const showError = touched && isComplete && !isValid;

  return (
    <div className="space-y-2">
      <Label htmlFor="cpf" className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-muted-foreground" />
        CPF {required ? '' : '(opcional)'}
      </Label>
      <div className="relative">
        <Input
          id="cpf"
          type="text"
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={value}
          onChange={(e) => onChange(formatCpf(e.target.value))}
          onBlur={() => setTouched(true)}
          className={`pr-10 ${showError ? 'border-destructive' : isValid ? 'border-green-500' : ''}`}
        />
        {isComplete && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-destructive" />
            )}
          </div>
        )}
      </div>
      {showError && (
        <p className="text-xs text-destructive">CPF inválido</p>
      )}
      <p className="text-xs text-muted-foreground">
        Para emissão de nota fiscal
      </p>
    </div>
  );
}
