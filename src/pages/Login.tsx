import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Hexagon, Mail, Lock, Eye, EyeOff, ArrowRight, Zap,
  MessageCircle, Radar, Smartphone, Link2, Bell
} from 'lucide-react';

export default function Login() {
  const { login, requestPasswordReset, resendConfirmation } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [helperLoading, setHelperLoading] = useState<'reset' | 'resend' | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Informe e-mail e senha'); return; }
    setLoading(true);
    setNeedsConfirmation(false);
    const { error } = await login(email, password);
    if (error) {
      if (error.toLowerCase().includes('email_not_confirmed') || error.toLowerCase().includes('email not confirmed')) {
        setNeedsConfirmation(true);
        toast.error('E-mail não confirmado. Verifique sua caixa de entrada.');
      } else {
        toast.error('Credenciais inválidas: ' + error);
      }
    } else {
      setNeedsConfirmation(false);
      toast.success('Bem-vindo ao OpGrid');
      // Invalidate cached auth-profile so route guards fetch fresh role data
      await queryClient.invalidateQueries({ queryKey: ['auth-profile'] });
      // Wait briefly for the auth state to propagate
      await new Promise(r => setTimeout(r, 500));
      // Re-fetch to determine correct redirect
      const authData = await queryClient.fetchQuery<any>({
        queryKey: ['auth-profile'],
        staleTime: 0,
      });
      const isPrestador = authData?.roles?.includes('prestador') && !authData?.canAccessApp;
      navigate(isPrestador ? '/prestador/inicio' : '/app/painel');
    }
    setLoading(false);
  };

  const handlePasswordReset = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      toast.error('Informe seu e-mail para redefinir a senha.');
      return;
    }

    setHelperLoading('reset');
    const { error } = await requestPasswordReset(normalizedEmail);

    if (error) {
      toast.error('Não foi possível enviar o link de redefinição: ' + error);
    } else {
      toast.success('Link de redefinição enviado para seu e-mail.');
    }

    setHelperLoading(null);
  };

  const handleResendConfirmation = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      toast.error('Informe seu e-mail para reenviar a confirmação.');
      return;
    }

    setHelperLoading('resend');
    const { error } = await resendConfirmation(normalizedEmail);

    if (error) {
      toast.error('Não foi possível reenviar a confirmação: ' + error);
    } else {
      setNeedsConfirmation(true);
      toast.success('E-mail de confirmação reenviado com sucesso.');
    }

    setHelperLoading(null);
  };

  const differentials = [
    { icon: MessageCircle, number: '01', title: 'Solicitação via WhatsApp', desc: 'Cliente pede guincho pelo WhatsApp. Dados coletados, valor calculado e proposta enviada automaticamente.', accent: 'from-success/20 to-success/5', iconColor: 'text-success' },
    { icon: Bell, number: '02', title: 'Sirene na central', desc: 'Quando a solicitação chega no sistema, toca uma sirene sonora na central operacional.', accent: 'from-destructive/20 to-destructive/5', iconColor: 'text-destructive' },
    { icon: Radar, number: '03', title: 'Despacho automático', desc: 'Sistema localiza os 2 prestadores mais próximos e aptos. Primeiro que aceita, ganha a OS.', accent: 'from-primary/20 to-primary/5', iconColor: 'text-primary' },
    { icon: Bell, number: '04', title: 'Sirene no prestador', desc: 'Quando a oferta chega no celular do prestador, toca uma sirene de alerta.', accent: 'from-warning/20 to-warning/5', iconColor: 'text-warning' },
    { icon: Smartphone, number: '05', title: 'Portal do prestador por link', desc: 'Sem app. O prestador recebe um link, aceita a OS e gerencia o atendimento pelo navegador.', accent: 'from-info/20 to-info/5', iconColor: 'text-info' },
    { icon: Link2, number: '06', title: 'Acompanhamento do cliente', desc: 'O cliente recebe um link para acompanhar em tempo real: mapa, ETA, status e timeline.', accent: 'from-accent/20 to-accent/5', iconColor: 'text-accent' },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-[520px] bg-gradient-to-b from-[hsl(228,36%,6%)] via-[hsl(228,36%,8%)] to-[hsl(228,36%,12%)] flex-col justify-between p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '20px 20px' }} />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute top-20 -left-20 w-60 h-60 bg-success/8 rounded-full blur-[80px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-primary/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-primary/20">
              <Hexagon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight">OpGrid</span>
              <p className="text-[9px] opacity-40 font-semibold uppercase tracking-[0.2em]">Guincho & Assistência 24h</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-5 flex-1 flex flex-col justify-center -mt-4">
          <div className="mb-2">
            <p className="text-xl font-bold leading-tight tracking-tight">Operação completa<br />sem nenhum app</p>
            <p className="text-xs text-white/40 mt-2 leading-relaxed max-w-[380px]">
              Do WhatsApp do cliente ao link do prestador — toda a jornada acontece sem download, sem fricção, com despacho inteligente automático.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {differentials.map((d, i) => (
              <div key={d.number} className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-all">
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${d.accent} flex items-center justify-center shrink-0`}>
                    <d.icon className={`h-4 w-4 ${d.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-white/20">{d.number}</span>
                      <p className="text-[11px] font-semibold text-white/90 leading-tight">{d.title}</p>
                    </div>
                    <p className="text-[9px] text-white/30 leading-relaxed mt-1">{d.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex gap-8 pt-4 border-t border-white/5">
            {[{ v: 'Zero', l: 'Apps para baixar' }, { v: '< 3min', l: 'Tempo de despacho' }, { v: '100%', l: 'Via WhatsApp + Link' }].map(s => (
              <div key={s.l}><p className="text-sm font-bold text-primary">{s.v}</p><p className="text-[8px] text-white/25 uppercase tracking-wider font-semibold mt-0.5">{s.l}</p></div>
            ))}
          </div>
          <p className="text-[9px] text-white/15 mt-4">© 2026 OpGrid. Plataforma operacional de guincho e assistência 24h.</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-[400px] space-y-5 animate-fade-in">
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-2 justify-center lg:justify-start mb-4 lg:hidden">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center">
                <Hexagon className="h-4.5 w-4.5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight">OpGrid</span>
                <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Guincho & Assistência 24h</p>
              </div>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Acesse a central</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Plataforma operacional com despacho inteligente</p>
          </div>

          <div className="lg:hidden flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <Zap className="h-4 w-4 text-primary shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">Operação 100% sem app.</span> WhatsApp → Sirene → Despacho automático → Link do prestador → Acompanhamento do cliente.
            </p>
          </div>

          <Card className="shadow-premium-lg border-border/50">
            <CardContent className="pt-5 pb-5 px-6">
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input type="email" placeholder="seu@email.com" className="pl-9 h-9" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-9 pr-9 h-9" value={password} onChange={e => setPassword(e.target.value)} />
                    <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-9 font-semibold text-[13px]" disabled={loading}>
                  {loading ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Entrando...</span> : <>Entrar na central <ArrowRight className="h-3.5 w-3.5 ml-1" /></>}
                </Button>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-[11px] font-medium">
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={helperLoading !== null}
                      className="text-primary transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {helperLoading === 'reset' ? 'Enviando link...' : 'Esqueci minha senha'}
                    </button>

                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={helperLoading !== null}
                      className="text-primary transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {helperLoading === 'resend' ? 'Reenviando...' : 'Reenviar confirmação'}
                    </button>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    Não recebeu o e-mail? Digite seu e-mail acima para reenviar a confirmação ou recuperar a senha.
                  </p>

                  {needsConfirmation && (
                    <div className="rounded-lg border border-warning/20 bg-warning/5 px-3 py-2">
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        O acesso do prestador depende da confirmação do e-mail. Se a mensagem não chegou, use o link de reenviar confirmação.
                      </p>
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-[10px] text-muted-foreground/40 text-center">Use suas credenciais cadastradas no sistema</p>
        </div>
      </div>
    </div>
  );
}
