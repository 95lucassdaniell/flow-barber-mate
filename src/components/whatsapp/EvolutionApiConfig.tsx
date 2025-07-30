import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const EvolutionApiConfig = () => {
  const [evolutionUrl, setEvolutionUrl] = useState('');
  const [evolutionKey, setEvolutionKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const testConnection = async () => {
    if (!evolutionUrl || !evolutionKey) {
      toast.error('Preencha todos os campos');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Test connection by trying to get instances list
      const response = await fetch(`${evolutionUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': evolutionKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setTestResult('success');
        toast.success('Conexão com Evolution API estabelecida com sucesso!');
      } else {
        setTestResult('error');
        toast.error('Falha na conexão. Verifique URL e API Key.');
      }
    } catch (error) {
      console.error('Error testing Evolution API:', error);
      setTestResult('error');
      toast.error('Erro ao conectar com Evolution API');
    } finally {
      setTesting(false);
    }
  };

  const saveConfiguration = () => {
    if (testResult !== 'success') {
      toast.error('Teste a conexão primeiro');
      return;
    }

    toast.success('Configuração salva! Configure as variáveis de ambiente no Supabase Dashboard.');
    toast.info(`EVOLUTION_API_URL: ${evolutionUrl}`);
    toast.info(`EVOLUTION_GLOBAL_API_KEY: ${evolutionKey}`);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Configuração Evolution API
        </CardTitle>
        <CardDescription>
          Configure as credenciais da Evolution API para integração com WhatsApp Business.
          Estas configurações devem ser adicionadas como secrets no Supabase Dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="evolution-url">URL da Evolution API</Label>
          <Input
            id="evolution-url"
            placeholder="https://sua-evolution-api.com"
            value={evolutionUrl}
            onChange={(e) => setEvolutionUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="evolution-key">Global API Key</Label>
          <Input
            id="evolution-key"
            type="password"
            placeholder="Sua Global API Key"
            value={evolutionKey}
            onChange={(e) => setEvolutionKey(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={testConnection} 
            disabled={testing || !evolutionUrl || !evolutionKey}
            variant="outline"
            className="flex-1"
          >
            {testing ? 'Testando...' : 'Testar Conexão'}
          </Button>

          {testResult === 'success' && (
            <Button onClick={saveConfiguration} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              Salvar Configuração
            </Button>
          )}
        </div>

        {testResult === 'success' && (
          <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
            <p className="text-sm text-success">
              ✅ Conexão testada com sucesso! Configure as seguintes variáveis no Supabase Dashboard:
            </p>
            <div className="mt-2 space-y-1 text-xs font-mono">
              <div>EVOLUTION_API_URL: {evolutionUrl}</div>
              <div>EVOLUTION_GLOBAL_API_KEY: {evolutionKey}</div>
            </div>
          </div>
        )}

        {testResult === 'error' && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              ❌ Falha na conexão. Verifique se a URL está correta e a API Key é válida.
            </p>
          </div>
        )}

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Próximos passos:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Teste a conexão acima</li>
            <li>Acesse o Supabase Dashboard → Settings → Edge Functions</li>
            <li>Adicione as variáveis de ambiente listadas</li>
            <li>Volte ao WhatsApp Management para gerar o QR Code</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default EvolutionApiConfig;