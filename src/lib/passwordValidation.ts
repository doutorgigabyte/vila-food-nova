export interface PasswordRequirement {
  id: string;
  label: string;
  validator: (password: string) => boolean;
}

export const passwordRequirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'Mínimo 8 caracteres',
    validator: (password) => password.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'Uma letra maiúscula',
    validator: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    label: 'Uma letra minúscula',
    validator: (password) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    label: 'Um número',
    validator: (password) => /[0-9]/.test(password),
  },
  {
    id: 'special',
    label: 'Um caractere especial (!@#$%^&*)',
    validator: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
];

export const validatePassword = (password: string): { isValid: boolean; passedCount: number; requirements: { id: string; passed: boolean }[] } => {
  const results = passwordRequirements.map((req) => ({
    id: req.id,
    passed: req.validator(password),
  }));

  const passedCount = results.filter((r) => r.passed).length;
  const isValid = passedCount === passwordRequirements.length;

  return { isValid, passedCount, requirements: results };
};

export const getPasswordStrength = (passedCount: number): { label: string; color: string; percentage: number } => {
  if (passedCount === 0) return { label: '', color: 'bg-muted', percentage: 0 };
  if (passedCount <= 2) return { label: 'Fraca', color: 'bg-destructive', percentage: 25 };
  if (passedCount <= 3) return { label: 'Média', color: 'bg-yellow-500', percentage: 50 };
  if (passedCount <= 4) return { label: 'Boa', color: 'bg-blue-500', percentage: 75 };
  return { label: 'Forte', color: 'bg-green-500', percentage: 100 };
};
