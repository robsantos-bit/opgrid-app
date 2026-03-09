import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Hexagon, Mail, Lock, Eye, EyeOff, ArrowRight, Network, BarChart3, FileCheck, Users, ChevronRight, Shield, Zap, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Informe o e-mail'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    if (login(email, password)) { toast.success('Bem-vindo ao OpGrid'); navigate('/'); }
    else { toast.error('Credenciais inválidas.'); }
    setLoading(false);
  };

  const handleQuickLogin = (demoEmail: string) => { setEmail(demoEmail); setPassword('demo'); };

  const capabilities = [
    { icon: Network, label: 'Gestão da Rede', desc: 'Controle completo de prestadores com score, homologação e conformidade' },
    { icon: BarChart3, label: 'Inteligência Financeira', desc: 'Visão executiva de custos, divergências e faturamento em tempo real' },
    { icon: FileCheck, label: 'Governança', desc: 'Rastreabilidade total de ações com trilha de auditoria completa' },
    { icon: Shield, label: 'Controle de Acesso', desc: 'Perfis granulares — admin, operações, financeiro e prestador' },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-[480px] bg-gradient-to-b from-primary via-primary/95 to-primary/85 flex-col justify-between p-10 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-white/5 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/15 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Hexagon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">OpGrid</span>
              <p className="text-[10px] opacity-60 font-medium uppercase tracking-wider">Inteligência Operacional</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <p className="text-2xl font-bold leading-tight tracking-tight">A plataforma que governa sua rede operacional</p>
            <p className="text-[13px] opacity-60 mt-2.5 leading-relaxed">Controle de prestadores, tarifação, operações e faturamento em um único hub para associações, seguradoras e redes credenciadas.</p>
          </div>

          <div className="space-y-3">
            {capabilities.map(c => (
              <div key={c.label} className="flex items-start gap-3 group">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <c.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold">{c.label}</p>
                  <p className="text-[11px] opacity-50 leading-relaxed mt-0.5">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-5 pt-3 border-t border-white/10">
            {[{ v: '12.000+', l: 'Prestadores' }, { v: '65.000+', l: 'Atendimentos/mês' }, { v: '99.9%', l: 'Uptime' }].map(s => (
              <div key={s.l}>
                <p className="text-base font-bold">{s.v}</p>
                <p className="text-[9px] opacity-40 uppercase tracking-wider font-medium">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <p className="text-[10px] opacity-30">© 2026 OpGrid. Todos os direitos reservados.</p>
          <div className="flex items-center gap-1 text-[10px] opacity-30"><Zap className="h-3 w-3" /><span>v3.0</span></div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-[400px] space-y-5 animate-fade-in">
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-2 justify-center lg:justify-start mb-4 lg:hidden">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                <Hexagon className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold tracking-tight">OpGrid</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Acesse sua conta</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Entre com suas credenciais para acessar a plataforma</p>
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
                  {loading ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Entrando...</span> : <>Entrar <ArrowRight className="h-3.5 w-3.5 ml-1" /></>}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-muted/20 border-dashed border-border/40">
            <CardContent className="py-3 px-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Demo</p>
                <span className="text-[9px] text-muted-foreground/40 bg-muted px-1.5 py-0.5 rounded font-medium">Ambiente de teste</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Admin Master', email: 'admin@demo.com', desc: 'Acesso total' },
                  { label: 'Operações', email: 'operador@demo.com', desc: 'Operação e rede' },
                  { label: 'Financeiro', email: 'financeiro@demo.com', desc: 'Faturamento' },
                  { label: 'Prestador', email: 'prestador@demo.com', desc: 'Visão restrita' },
                ].map(d => (
                  <button key={d.email} onClick={() => handleQuickLogin(d.email)}
                    className="text-left px-3 py-2 rounded-md border bg-card hover:bg-muted/30 hover:border-primary/20 transition-all group">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold group-hover:text-primary transition-colors">{d.label}</p>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/20 group-hover:text-primary/40" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{d.desc}</p>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/40 text-center">Qualquer senha funciona no ambiente demo</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
