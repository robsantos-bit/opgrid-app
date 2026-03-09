import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Network, BarChart3, FileCheck, Users, Zap, ChevronRight } from 'lucide-react';

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
    await new Promise(r => setTimeout(r, 600));
    if (login(email, password)) { toast.success('Bem-vindo ao RedeControl!'); navigate('/'); }
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
    { icon: Network, title: 'Rede Credenciada', desc: 'Gestão completa de prestadores com score, homologação e conformidade' },
    { icon: BarChart3, title: 'Inteligência Financeira', desc: 'Visão executiva de custos, faturamento e divergências em tempo real' },
    { icon: FileCheck, title: 'Governança & Auditoria', desc: 'Rastreabilidade total de ações com trilha de auditoria completa' },
    { icon: Users, title: 'Multiempresa & Perfis', desc: 'Controle de acesso por perfil — administrador, operador, financeiro e prestador' },
  ];

  const stats = [
    { label: 'Prestadores gerenciados', value: '8.500+' },
    { label: 'Atendimentos/mês', value: '45.000+' },
    { label: 'Uptime', value: '99.9%' },
  ];

  if (showReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <Card className="w-full max-w-[420px] shadow-premium-xl border-0 animate-fade-in">
          <CardContent className="pt-8 pb-6 px-7">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-3 shadow-premium">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-bold">Recuperar Senha</h1>
              <p className="text-[13px] text-muted-foreground mt-1">Informe seu e-mail para receber o link de recuperação</p>
            </div>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" placeholder="seu@email.com" className="pl-10 h-10" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" className="w-full h-10">Enviar link de recuperação</Button>
              <Button type="button" variant="ghost" className="w-full text-xs" onClick={() => setShowReset(false)}>← Voltar ao login</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — Brand Panel */}
      <div className="hidden lg:flex w-[520px] bg-gradient-to-br from-primary via-primary/95 to-primary/85 flex-col justify-between p-12 text-primary-foreground relative overflow-hidden">
        {/* Decorative patterns */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-20 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="h-5.5 w-5.5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight">RedeControl</span>
              <p className="text-[11px] opacity-70 font-medium">Plataforma de Gestão da Rede Credenciada</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <p className="text-[1.75rem] font-bold leading-tight tracking-tight">Gestão inteligente da sua rede credenciada</p>
            <p className="text-sm opacity-70 mt-3 leading-relaxed">Controle operacional, financeiro e de governança em uma única plataforma para associações, seguradoras e redes de prestadores.</p>
          </div>
          
          <div className="space-y-4">
            {features.map(f => (
              <div key={f.title} className="flex items-start gap-3.5 group">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-white/15 transition-colors">
                  <f.icon className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold">{f.title}</p>
                  <p className="text-[11px] opacity-60 leading-relaxed mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Social proof stats */}
          <div className="flex gap-6 pt-4 border-t border-white/10">
            {stats.map(s => (
              <div key={s.label}>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] opacity-50 uppercase tracking-wider font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <p className="text-[11px] opacity-40">© 2026 RedeControl. Todos os direitos reservados.</p>
          <div className="flex items-center gap-1 text-[11px] opacity-40">
            <Zap className="h-3 w-3" />
            <span>v2.4.0</span>
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30">
        <div className="w-full max-w-[420px] space-y-6 animate-fade-in">
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-2.5 justify-center lg:justify-start mb-5 lg:hidden">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-premium">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">RedeControl</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Acesse sua conta</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Entre com suas credenciais para acessar a plataforma</p>
          </div>

          <Card className="shadow-premium-lg border-border/50">
            <CardContent className="pt-6 pb-6 px-7">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="email" placeholder="seu@email.com" className="pl-10 h-10" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Senha</Label>
                    <button type="button" className="text-[11px] text-primary hover:underline font-medium" onClick={() => setShowReset(true)}>Esqueceu a senha?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10 h-10" value={password} onChange={e => setPassword(e.target.value)} />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-10 font-semibold" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Entrando...</span>
                  ) : (
                    <>Entrar na plataforma <ArrowRight className="h-4 w-4 ml-1" /></>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-dashed border-border/50 shadow-sm">
            <CardContent className="py-4 px-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Acesso Demonstração</p>
                <span className="text-[9px] text-muted-foreground/50 bg-muted px-2 py-0.5 rounded-full font-medium">Ambiente de teste</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Administrador', email: 'admin@demo.com', desc: 'Acesso completo' },
                  { label: 'Operador', email: 'operador@demo.com', desc: 'Operação e rede' },
                  { label: 'Financeiro', email: 'financeiro@demo.com', desc: 'Faturamento e relatórios' },
                  { label: 'Prestador', email: 'prestador@demo.com', desc: 'Visão do prestador' },
                ].map(d => (
                  <button key={d.email} onClick={() => handleQuickLogin(d.email)}
                    className="text-left px-3.5 py-2.5 rounded-lg border bg-card hover:bg-muted/50 hover:border-primary/20 transition-all duration-150 group">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold group-hover:text-primary transition-colors">{d.label}</p>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{d.desc}</p>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/50 text-center">Qualquer senha funciona no ambiente de demonstração</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
