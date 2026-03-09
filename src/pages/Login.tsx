import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
    await new Promise(r => setTimeout(r, 600));
    if (login(email, password)) {
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } else {
      toast.error('Credenciais inválidas. Use um dos e-mails demo.');
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
        <Card className="w-full max-w-md animate-fade-in shadow-lg">
          <CardHeader className="text-center space-y-3 pb-2">
            <div className="mx-auto w-14 h-14 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <Truck className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Recuperar Senha</h1>
            <p className="text-sm text-muted-foreground">Informe seu e-mail para receber o link</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="reset-email" type="email" placeholder="seu@email.com" className="pl-10"
                    value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" className="w-full">Enviar link</Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setShowReset(false)}>
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
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <Truck className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">GTP</h1>
          <p className="text-sm text-muted-foreground">Gestor de Tarifas e Prestadores</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="seu@email.com" className="pl-10"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <button type="button" className="text-xs text-primary hover:underline" onClick={() => setShowReset(true)}>
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10"
                    value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
                {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-muted/50 border-dashed">
          <CardContent className="pt-4 pb-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acesso Demonstração</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="justify-start text-xs h-auto py-2" onClick={() => handleQuickLogin('admin@demo.com')}>
                <div className="text-left">
                  <p className="font-medium">Administrador</p>
                  <p className="text-muted-foreground text-[10px]">admin@demo.com</p>
                </div>
              </Button>
              <Button variant="outline" size="sm" className="justify-start text-xs h-auto py-2" onClick={() => handleQuickLogin('prestador@demo.com')}>
                <div className="text-left">
                  <p className="font-medium">Prestador</p>
                  <p className="text-muted-foreground text-[10px]">prestador@demo.com</p>
                </div>
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">Qualquer senha funciona</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
