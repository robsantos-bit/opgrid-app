import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  X, ArrowRight, ArrowLeft, Wifi, Bell, TestTube, MapPin, CheckCircle2, Headphones, BookOpen
} from 'lucide-react';

interface TutorialStep {
  targetId: string;
  title: string;
  description: string;
  icon: React.ElementType;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetId: 'tutorial-btn-online',
    title: 'Botão de Disponibilidade',
    description: 'Clique aqui para ficar Online e começar a receber ofertas de serviço na sua região.',
    icon: Wifi,
    position: 'bottom',
  },
  {
    targetId: 'tutorial-push-area',
    title: 'Notificações Push',
    description: 'Ative as notificações push para receber alertas mesmo com a tela bloqueada ou navegador minimizado.',
    icon: Bell,
    position: 'bottom',
  },
  {
    targetId: 'tutorial-test-siren',
    title: 'Teste a Sirene',
    description: 'Use este botão para testar o som da sirene. Quando uma oferta real chegar, ela tocará automaticamente!',
    icon: TestTube,
    position: 'bottom',
  },
  {
    targetId: 'tutorial-stats',
    title: 'Seus Indicadores',
    description: 'Acompanhe seus atendimentos em andamento e finalizados em tempo real.',
    icon: Headphones,
    position: 'top',
  },
  {
    targetId: 'tutorial-address',
    title: 'Endereço Base',
    description: 'Este é seu endereço de retorno. O sistema usa ele para calcular ofertas próximas a você.',
    icon: MapPin,
    position: 'top',
  },
];

const STORAGE_KEY = 'opgrid_tutorial_done';

export function useTutorial() {
  const [isActive, setIsActive] = useState(false);

  const start = useCallback(() => setIsActive(true), []);
  const stop = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const shouldAutoStart = !localStorage.getItem(STORAGE_KEY);

  return { isActive, start, stop, shouldAutoStart };
}

interface TutorialOverlayProps {
  isActive: boolean;
  onClose: () => void;
}

export default function TutorialOverlay({ isActive, onClose }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = TUTORIAL_STEPS[step];
  const total = TUTORIAL_STEPS.length;

  useEffect(() => {
    if (!isActive) { setStep(0); return; }

    const el = document.getElementById(currentStep?.targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Small delay for scroll to finish
      const t = setTimeout(() => {
        setTargetRect(el.getBoundingClientRect());
      }, 350);
      return () => clearTimeout(t);
    } else {
      setTargetRect(null);
    }
  }, [isActive, step, currentStep?.targetId]);

  // Re-calc on resize
  useEffect(() => {
    if (!isActive) return;
    const handler = () => {
      const el = document.getElementById(currentStep?.targetId);
      if (el) setTargetRect(el.getBoundingClientRect());
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [isActive, currentStep?.targetId]);

  if (!isActive || !currentStep) return null;

  const next = () => {
    if (step < total - 1) setStep(step + 1);
    else onClose();
  };
  const prev = () => { if (step > 0) setStep(step - 1); };

  const Icon = currentStep.icon;

  // Calculate tooltip position
  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 10002,
    maxWidth: 340,
  };

  if (targetRect) {
    const pad = 12;
    switch (currentStep.position) {
      case 'bottom':
        tooltipStyle.top = targetRect.bottom + pad;
        tooltipStyle.left = Math.max(16, targetRect.left + targetRect.width / 2 - 170);
        break;
      case 'top':
        tooltipStyle.bottom = window.innerHeight - targetRect.top + pad;
        tooltipStyle.left = Math.max(16, targetRect.left + targetRect.width / 2 - 170);
        break;
      case 'left':
        tooltipStyle.top = targetRect.top + targetRect.height / 2 - 60;
        tooltipStyle.right = window.innerWidth - targetRect.left + pad;
        break;
      case 'right':
        tooltipStyle.top = targetRect.top + targetRect.height / 2 - 60;
        tooltipStyle.left = targetRect.right + pad;
        break;
    }
  } else {
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  // Ensure tooltip doesn't go off screen
  if (typeof tooltipStyle.left === 'number') {
    tooltipStyle.left = Math.min(tooltipStyle.left, window.innerWidth - 356);
    tooltipStyle.left = Math.max(16, tooltipStyle.left);
  }

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 z-[10000] bg-black/60 transition-opacity"
        onClick={onClose}
      />

      {/* Spotlight cutout */}
      {targetRect && (
        <div
          className="fixed z-[10001] rounded-xl ring-4 ring-primary/60 pointer-events-none"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
          }}
        />
      )}

      {/* Tooltip card */}
      <Card style={tooltipStyle} className="shadow-premium-lg border-primary/30 animate-fade-in">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">{currentStep.title}</p>
                <p className="text-[10px] text-muted-foreground">Passo {step + 1} de {total}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {currentStep.description}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === step ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs" onClick={prev}>
                <ArrowLeft className="h-3 w-3" /> Anterior
              </Button>
            )}
            <Button size="sm" className="flex-1 gap-1 text-xs" onClick={next}>
              {step < total - 1 ? (
                <>Próximo <ArrowRight className="h-3 w-3" /></>
              ) : (
                <>Concluir <CheckCircle2 className="h-3 w-3" /></>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export function TutorialButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onClick}>
      <BookOpen className="h-3.5 w-3.5" />
      Tutorial
    </Button>
  );
}
