import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { Truck, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Informe o e-mail'); return; }
    if (login(email, password)) {
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } else {
      toast.error('Credenciais inválidas. Use um dos e-mails demo.');
    }
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Link de recuperação enviado para ${resetEmail} (simulado)`);
    setShowReset(false);
    setResetEmail('');
  };

  if (showReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center space-y-2 pb-2">
            <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Truck className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Recuperar Senha</h1>
            <p className="text-sm text-muted-foreground">Informe seu e-mail para receber o link de recuperação</p>
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
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <Truck className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Gestor de Tarifas</h1>
          <p className="text-sm text-muted-foreground">Faça login para acessar o sistema</p>
        </CardHeader>
        <CardContent>
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
              <Label htmlFor="password">Senha</Label>
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
            <Button type="submit" className="w-full">Entrar</Button>
            <Button type="button" variant="link" className="w-full text-sm" onClick={() => setShowReset(true)}>
              Esqueci minha senha
            </Button>
          </form>

          <div className="mt-6 rounded-lg bg-muted p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Credenciais Demo</p>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium text-foreground">Admin:</span> <span className="text-muted-foreground">admin@demo.com</span></p>
              <p><span className="font-medium text-foreground">Prestador:</span> <span className="text-muted-foreground">prestador@demo.com</span></p>
              <p className="text-xs text-muted-foreground italic">Qualquer senha funciona</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
