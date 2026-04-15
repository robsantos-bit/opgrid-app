import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Hexagon, Bell, Smartphone, CheckCircle2, MapPin, ArrowRight, Shield
} from 'lucide-react';

const steps = [
  {
    icon: Bell,
    title: 'Sirene de alerta',
    desc: 'Quando uma oferta chegar, uma sirene tocará no seu celular. Mantenha o volume ligado!',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
  },
  {
    icon: Smartphone,
    title: 'Tudo pelo navegador',
    desc: 'Você não precisa baixar nenhum app. Todo o portal funciona direto pelo link no navegador.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: MapPin,
    title: 'Aceite ofertas próximas',
    desc: 'O sistema encontra as ofertas mais próximas de você. O primeiro que aceitar, leva a OS.',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  {
    icon: CheckCircle2,
    title: 'Checklist digital',
    desc: 'Na coleta e entrega, preencha o checklist com fotos e assinatura — tudo digital.',
    color: 'text-info',
    bg: 'bg-info/10',
  },
  {
    icon: Shield,
    title: 'Disponibilidade',
    desc: 'Mantenha seu status como "Ativo" para receber ofertas. Após cada OS, você volta automaticamente.',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
];

export default function BoasVindasPrestador() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/prestador/inicio', { replace: true });
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-5">
      <div className="w-full max-w-lg space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center">
            <Hexagon className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bem-vindo ao OpGrid!</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sua conta está pronta. Veja como funciona antes de começar.
            </p>
          </div>
        </div>

        {/* Steps */}
        <Card className="border-border/50 shadow-premium-lg">
          <CardContent className="pt-5 pb-4 px-5 space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                <div className={`w-9 h-9 rounded-lg ${step.bg} flex items-center justify-center shrink-0`}>
                  <step.icon className={`h-4.5 w-4.5 ${step.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* CTA */}
        <Button onClick={handleStart} className="w-full h-11 font-semibold text-sm" size="lg">
          Começar a usar o portal
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>

        <p className="text-[10px] text-muted-foreground/50 text-center">
          Você pode acessar essas informações novamente no menu do portal.
        </p>
      </div>
    </main>
  );
}
