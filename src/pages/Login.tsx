import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Truck, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

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
    if (login(email, password)) {
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } else {
      toast.error('Credenciais inválidas.');
    }
    setLoading(false);
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo');
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Link de recuperação enviado para ${resetEmail} (simulado)`);
    setShowReset(false);
    setResetEmail('');
  };

  if (showReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <Card className="w-full max-w-[400px] shadow-xl border-0 animate-fade-in">
          <CardContent className="pt-8 pb-6 px-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-3">
                <Truck className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-semibold">Recuperar Senha</h1>
              <p className="text-xs text-muted-foreground mt-1">Informe seu e-mail para receber o link</p>
            </div>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input type="email" placeholder="seu@email.com" className="pl-9"
                    value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" className="w-full">Enviar link</Button>
              <Button type="button" variant="ghost" className="w-full text-xs" onClick={() => setShowReset(false)}>
                Voltar ao login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-[400px] space-y-5 animate-fade-in">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 mb-3">
            <Truck className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">GTP</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Gestor de Tarifas e Prestadores</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="pt-6 pb-5 px-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input type="email" placeholder="seu@email.com" className="pl-9"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Senha</Label>
                  <button type="button" className="text-[11px] text-primary hover:underline" onClick={() => setShowReset(true)}>
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-9 pr-9"
                    value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}>
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
              <button onClick={() => handleQuickLogin('admin@demo.com')}
                className="text-left px-3 py-2 rounded-lg border bg-background hover:bg-muted/50 transition-colors">
                <p className="text-xs font-medium">Administrador</p>
                <p className="text-[10px] text-muted-foreground">admin@demo.com</p>
              </button>
              <button onClick={() => handleQuickLogin('prestador@demo.com')}
                className="text-left px-3 py-2 rounded-lg border bg-background hover:bg-muted/50 transition-colors">
                <p className="text-xs font-medium">Prestador</p>
                <p className="text-[10px] text-muted-foreground">prestador@demo.com</p>
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/60 text-center">Qualquer senha funciona</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
