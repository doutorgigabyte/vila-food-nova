import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Copy, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Credential {
  role: string;
  email: string;
  password: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

interface TestCredentialsCardProps {
  title: string;
  credentials: Credential[];
  description?: string;
}

// Security: Only render in development mode
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

// Security: Validate that emails are test domains only
const isTestEmail = (email: string): boolean => {
  const testDomains = ['test.com', 'example.com', 'teste.com', 'localhost', 'dev.local'];
  return testDomains.some(domain => email.toLowerCase().includes(domain)) || 
         email.toLowerCase().includes('test') ||
         email.toLowerCase().includes('demo');
};

const TestCredentialsCard = ({ title, credentials, description }: TestCredentialsCardProps) => {
  const [showPasswords, setShowPasswords] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Security: Don't render in production
  if (!isDevelopment) {
    return null;
  }

  // Security: Filter out any credentials that look like real emails
  const safeCredentials = credentials.filter(cred => isTestEmail(cred.email));

  if (safeCredentials.length === 0) {
    return null;
  }

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    // Security: Log credential copy for audit trail
    console.info('[Security Audit] Test credentials copied at:', new Date().toISOString());
    toast.success('Copiado!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Card className="border-yellow-500/50 bg-yellow-50/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-yellow-600 border-yellow-500">
            SOMENTE TESTES
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPasswords(!showPasswords)}
          >
            {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 p-2 bg-yellow-100/50 rounded-md text-xs text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
          ⚠️ Estas credenciais são exclusivamente para ambiente de desenvolvimento. Nunca use em produção.
        </div>
        <div className="space-y-3">
          {safeCredentials.map((cred, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{cred.role}</span>
                  {cred.badge && (
                    <Badge variant={cred.badgeVariant || 'secondary'} className="text-xs">
                      {cred.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{cred.email}</p>
                <p className="text-xs font-mono">
                  {showPasswords ? cred.password : '••••••••'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(`${cred.email}\n${cred.password}`, index)}
              >
                {copiedIndex === index ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TestCredentialsCard;
