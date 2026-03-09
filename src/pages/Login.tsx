import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Network, BarChart3, FileCheck } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Informe o e-mail'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    if (login(email, password)) { toast.success('Login realizado com sucesso!'); navigate('/'); }
    else { toast.error('Credenciais inválidas.'); }
    setLoading(false);
  };

  const handleQuickLogin = (demoEmail: string) => { setEmail(demoEmail); setPassword('demo'); };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Link de recuperação enviado para ${resetEmail} (simulado)`);
    setShowReset(false); setResetEmail('');
  };

  const features = [
    { icon: Network, title: 'Rede Credenciada', desc: 'Controle total dos prestadores' },
    { icon: BarChart3, title: 'Visão Executiva', desc: 'KPIs e relatórios em tempo real' },
    { icon: FileCheck, title: 'Governança', desc: 'Auditoria e rastreabilidade' },
  ];

  if (showReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <Card className="w-full max-w-[400px] shadow-xl border-0 animate-fade-in">
          <CardContent className="pt-8 pb-6 px-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-3">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-semibold">Recuperar Senha</h1>
              <p className="text-xs text-muted-foreground mt-1">Informe seu e-mail para receber o link</p>
            </div>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input type="email" placeholder="seu@email.com" className="pl-9" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" className="w-full">Enviar link</Button>
              <Button type="button" variant="ghost" className="w-full text-xs" onClick={() => setShowReset(false)}>Voltar ao login</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — Brand Panel */}
      <div className="hidden lg:flex w-[480px] bg-gradient-to-br from-primary via-primary to-primary/80 flex-col justify-between p-10 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">RedeControl</span>
          </div>
          <p className="text-sm opacity-80 mt-1">Plataforma de Gestão da Rede Credenciada</p>
        </div>
        <div className="relative z-10 space-y-6">
          <p className="text-2xl font-semibold leading-tight">Centralize a gestão da sua rede de prestadores com visibilidade total</p>
          <div className="space-y-4">
            {features.map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-9 h-9 bg-white/15 backdrop-blur-sm rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <f.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs opacity-70">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-[11px] opacity-50">© 2026 RedeControl. Todos os direitos reservados.</p>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px] space-y-6 animate-fade-in">
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-2.5 justify-center lg:justify-start mb-4 lg:hidden">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">RedeControl</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Acesse sua conta</h1>
            <p className="text-sm text-muted-foreground mt-1">Entre com suas credenciais para continuar</p>
          </div>

          <Card className="shadow-lg border-border/50">
            <CardContent className="pt-6 pb-5 px-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input type="email" placeholder="seu@email.com" className="pl-9" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Senha</Label>
                    <button type="button" className="text-[11px] text-primary hover:underline" onClick={() => setShowReset(true)}>Esqueceu a senha?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-9 pr-9" value={password} onChange={e => setPassword(e.target.value)} />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Entrando...' : 'Entrar'}
                  {!loading && <ArrowRight className="h-4 w-4 ml-1" />}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-muted/40 border-dashed border-border/60">
            <CardContent className="py-3.5 px-5 space-y-2.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Acesso Demonstração</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Administrador', email: 'admin@demo.com' },
                  { label: 'Operador', email: 'operador@demo.com' },
                  { label: 'Financeiro', email: 'financeiro@demo.com' },
                  { label: 'Prestador', email: 'prestador@demo.com' },
                ].map(d => (
                  <button key={d.email} onClick={() => handleQuickLogin(d.email)}
                    className="text-left px-3 py-2 rounded-lg border bg-background hover:bg-muted/50 transition-colors">
                    <p className="text-xs font-medium">{d.label}</p>
                    <p className="text-[10px] text-muted-foreground">{d.email}</p>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/60 text-center">Qualquer senha funciona</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
