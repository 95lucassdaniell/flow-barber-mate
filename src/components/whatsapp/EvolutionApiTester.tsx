import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const EvolutionApiTester = () => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const testEvolutionApi = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      console.log('Testing Evolution API connection...');
      
      const { data, error } = await supabase.functions.invoke('test-evolution-api', {
        body: {}
      });

      console.log('Test response:', { data, error });

      if (error) {
        console.error('Error calling test function:', error);
        setTestResult({
          success: false,
          error: error.message,
          details: error
        });
        toast.error('Erro ao testar Evolution API');
      } else {
        setTestResult(data);
        if (data.success) {
          toast.success('Evolution API está funcionando!');
        } else {
          toast.error('Problema na Evolution API');
        }
      }
    } catch (error) {
      console.error('Error testing Evolution API:', error);
      setTestResult({
        success: false,
        error: error.message
      });
      toast.error('Erro inesperado ao testar API');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Teste de Conexão Evolution API
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testEvolutionApi} 
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Testando...' : 'Testar Conexão'}
        </Button>

        {testResult && (
          <div className={`p-4 rounded-lg border ${
            testResult.success 
              ? 'bg-success/10 border-success/20' 
              : 'bg-destructive/10 border-destructive/20'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <span className={`font-medium ${
                testResult.success ? 'text-success' : 'text-destructive'
              }`}>
                {testResult.success ? 'Conexão OK!' : 'Erro na Conexão'}
              </span>
            </div>
            
            <div className="text-xs font-mono bg-muted p-2 rounded overflow-auto max-h-40">
              <pre>{JSON.stringify(testResult, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EvolutionApiTester;