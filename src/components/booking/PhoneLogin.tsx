import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phone, MessageCircle } from 'lucide-react';
import { usePhoneAuth } from '@/hooks/usePhoneAuth';

interface PhoneLoginProps {
  barbershopSlug: string;
  onSuccess: () => void;
}

export const PhoneLogin = ({ barbershopSlug, onSuccess }: PhoneLoginProps) => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [countdown, setCountdown] = useState(0);
  
  const { sendVerificationCode, verifyCode, isLoading, error, clearError } = usePhoneAuth();

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 11) {
      return;
    }

    const success = await sendVerificationCode(cleanPhone, barbershopSlug);
    if (success) {
      setStep('code');
      setCountdown(300); // 5 minutes
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (code.length !== 6) {
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const success = await verifyCode(cleanPhone, code, barbershopSlug);
    if (success) {
      onSuccess();
    }
  };

  const handleResendCode = async () => {
    clearError();
    const cleanPhone = phone.replace(/\D/g, '');
    const success = await sendVerificationCode(cleanPhone, barbershopSlug);
    if (success) {
      setCountdown(300);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Phone className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {step === 'phone' ? 'Entre com seu telefone' : 'Digite o código'}
          </CardTitle>
          <p className="text-muted-foreground">
            {step === 'phone' 
              ? 'Vamos enviar um código via WhatsApp para confirmar seu número'
              : 'Digite o código de 6 dígitos enviado via WhatsApp'
            }
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <Input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  maxLength={15}
                  className="text-center text-lg"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading || phone.replace(/\D/g, '').length !== 11}
              >
                {isLoading ? 'Enviando...' : (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Enviar código
                  </div>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-wider"
                  required
                />
              </div>
              
              {countdown > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Código expira em {formatTime(countdown)}
                </p>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? 'Verificando...' : 'Confirmar código'}
              </Button>
              
              <div className="text-center">
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={handleResendCode}
                  disabled={isLoading || countdown > 0}
                  className="text-sm"
                >
                  {countdown > 0 ? `Reenviar em ${formatTime(countdown)}` : 'Reenviar código'}
                </Button>
              </div>
              
              <div className="text-center">
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={() => setStep('phone')}
                  className="text-sm text-muted-foreground"
                >
                  Alterar número
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};