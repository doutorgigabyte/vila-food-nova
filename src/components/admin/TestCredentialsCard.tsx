import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
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

const TestCredentialsCard = ({ title, credentials, description }: TestCredentialsCardProps) => {
  const [showPasswords, setShowPasswords] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copiado!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPasswords(!showPasswords)}
        >
          {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {credentials.map((cred, index) => (
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
