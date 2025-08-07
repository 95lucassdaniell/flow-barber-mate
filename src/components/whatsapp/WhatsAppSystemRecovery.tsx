import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Search, 
  Settings, 
  Zap,
  Clock,
  MessageSquare,
  Wifi,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/useAuth'

interface DiagnosisResult {
  instanceStatus: {
    exists: boolean
    status: string
    instanceName: string
    lastUpdate: string
    hasQrCode: boolean
  }
  webhookStatus: {
    configured: boolean
    url: string
  }
  lastMessages: {
    total24h: number
    incoming24h: number
    outgoing24h: number
    lastIncoming: string | null
    lastOutgoing: string | null
  }
  evolutionApiStatus: {
    connected: boolean
    state?: string
    instance?: any
    error?: string
  }
  recommendations: Array<{
    type: 'critical' | 'warning' | 'info'
    message: string
  }>
}

interface RecoveryStep {
  step: string
  status: 'success' | 'failed' | 'pending'
  message: string
}

const WhatsAppSystemRecovery = () => {
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null)
  const [recoverySteps, setRecoverySteps] = useState<RecoveryStep[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveryProgress, setRecoveryProgress] = useState(0)
  const { toast } = useToast()
  const { profile } = useAuth()
  const barbershopId = profile?.barbershop_id

  const runDiagnosis = async () => {
    if (!barbershopId) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-system-recovery', {
        body: {
          action: 'full_diagnosis',
          barbershopId
        }
      })

      if (error) throw error

      setDiagnosis(data.diagnosis)
      toast({
        title: "Diagnóstico concluído",
        description: "Sistema analisado com sucesso",
      })
    } catch (error) {
      console.error('Erro no diagnóstico:', error)
      toast({
        title: "Erro no diagnóstico",
        description: "Falha ao analisar o sistema",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const runRecovery = async () => {
    if (!barbershopId) return

    setIsRecovering(true)
    setRecoveryProgress(0)
    setRecoverySteps([])

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-system-recovery', {
        body: {
          action: 'recover_system',
          barbershopId
        }
      })

      if (error) throw error

      setRecoverySteps(data.steps)
      setRecoveryProgress(100)

      const successSteps = data.steps.filter((step: RecoveryStep) => step.status === 'success').length
      const totalSteps = data.steps.length

      toast({
        title: "Recovery finalizado",
        description: `${successSteps}/${totalSteps} passos executados com sucesso`,
        variant: successSteps === totalSteps ? "default" : "destructive",
      })

      // Executar novo diagnóstico após recovery
      setTimeout(() => {
        runDiagnosis()
      }, 2000)

    } catch (error) {
      console.error('Erro no recovery:', error)
      toast({
        title: "Erro no recovery",
        description: "Falha ao recuperar o sistema",
        variant: "destructive",
      })
    } finally {
      setIsRecovering(false)
    }
  }

  const resetInstance = async () => {
    if (!barbershopId) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-reset-instance', {
        body: { barbershopId }
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: "Reset concluído",
          description: "Instância resetada com sucesso! Execute o diagnóstico novamente.",
        })
        setDiagnosis(null)
        setRecoverySteps([])
      } else {
        toast({
          title: "Erro no reset",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro no reset da instância:', error)
      toast({
        title: "Erro no reset",
        description: "Falha ao resetar instância",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testWebhook = async () => {
    if (!barbershopId) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-system-recovery', {
        body: {
          action: 'test_webhook',
          barbershopId
        }
      })

      if (error) throw error

      toast({
        title: data.success ? "Webhook funcionando" : "Webhook com problemas",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      })
    } catch (error) {
      console.error('Erro no teste de webhook:', error)
      toast({
        title: "Erro no teste",
        description: "Falha ao testar webhook",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-blue-500" />
    }
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  useEffect(() => {
    if (barbershopId) {
      runDiagnosis()
    }
  }, [barbershopId])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sistema de Recovery WhatsApp
          </CardTitle>
          <CardDescription>
            Diagnóstico completo e recuperação automática do sistema WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runDiagnosis} 
              disabled={isLoading || isRecovering}
              variant="outline"
            >
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? 'Analisando...' : 'Executar Diagnóstico'}
            </Button>
            
            <Button 
              onClick={runRecovery} 
              disabled={isLoading || isRecovering || !diagnosis}
              variant="default"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isRecovering ? 'Recuperando...' : 'Executar Recovery'}
            </Button>

            <Button 
              onClick={resetInstance} 
              disabled={isLoading || isRecovering}
              variant="destructive"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Completo
            </Button>

            <Button 
              onClick={testWebhook} 
              disabled={isLoading || isRecovering}
              variant="outline"
            >
              <Wifi className="h-4 w-4 mr-2" />
              Testar Webhook
            </Button>
          </div>

          {isRecovering && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso do Recovery</span>
                <span>{recoveryProgress}%</span>
              </div>
              <Progress value={recoveryProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {diagnosis && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Status da Instância */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Status da Instância
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Existe no Sistema</span>
                <Badge variant={diagnosis.instanceStatus.exists ? "default" : "destructive"}>
                  {diagnosis.instanceStatus.exists ? "Sim" : "Não"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Status Atual</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(diagnosis.instanceStatus.status)}
                  <span className="capitalize">{diagnosis.instanceStatus.status}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>Nome da Instância</span>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {diagnosis.instanceStatus.instanceName || 'N/A'}
                </code>
              </div>

              <div className="flex items-center justify-between">
                <span>QR Code Ativo</span>
                <Badge variant={diagnosis.instanceStatus.hasQrCode ? "destructive" : "default"}>
                  {diagnosis.instanceStatus.hasQrCode ? "Sim (Desconectado)" : "Não"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Status das Mensagens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Mensagens (24h)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Total</span>
                <Badge variant="outline">{diagnosis.lastMessages.total24h}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Recebidas</span>
                <Badge variant={diagnosis.lastMessages.incoming24h > 0 ? "default" : "destructive"}>
                  {diagnosis.lastMessages.incoming24h}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span>Enviadas</span>
                <Badge variant="outline">{diagnosis.lastMessages.outgoing24h}</Badge>
              </div>

              {diagnosis.lastMessages.lastIncoming && (
                <div className="text-sm text-muted-foreground">
                  Última recebida: {new Date(diagnosis.lastMessages.lastIncoming).toLocaleString()}
                </div>
              )}

              {diagnosis.lastMessages.lastOutgoing && (
                <div className="text-sm text-muted-foreground">
                  Última enviada: {new Date(diagnosis.lastMessages.lastOutgoing).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Evolution API */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Evolution API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Conexão</span>
                <Badge variant={diagnosis.evolutionApiStatus.connected ? "default" : "destructive"}>
                  {diagnosis.evolutionApiStatus.connected ? "Conectado" : "Falha"}
                </Badge>
              </div>
              
              {diagnosis.evolutionApiStatus.state && (
                <div className="flex items-center justify-between">
                  <span>Estado WhatsApp</span>
                  <Badge variant={diagnosis.evolutionApiStatus.state === 'open' ? "default" : "destructive"}>
                    {diagnosis.evolutionApiStatus.state}
                  </Badge>
                </div>
              )}

              {diagnosis.evolutionApiStatus.error && (
                <div className="text-sm text-destructive">
                  Erro: {diagnosis.evolutionApiStatus.error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Webhook */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Webhook
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Configurado</span>
                <Badge variant={diagnosis.webhookStatus.configured ? "default" : "destructive"}>
                  {diagnosis.webhookStatus.configured ? "Sim" : "Não"}
                </Badge>
              </div>
              
              {diagnosis.webhookStatus.url && (
                <div className="text-sm text-muted-foreground break-all">
                  URL: {diagnosis.webhookStatus.url}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recomendações */}
      {diagnosis?.recommendations && diagnosis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {diagnosis.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  {getRecommendationIcon(rec.type)}
                  <div className="flex-1">
                    <p className="text-sm">{rec.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Passos do Recovery */}
      {recoverySteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Passos do Recovery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recoverySteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  {getStepIcon(step.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{step.step.replace(/_/g, ' ')}</span>
                      <Badge variant={step.status === 'success' ? 'default' : 'destructive'}>
                        {step.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{step.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default WhatsAppSystemRecovery