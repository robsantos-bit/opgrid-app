import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecoveryLink, setIsRecoveryLink] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const searchParams = new URLSearchParams(window.location.search);
    const isRecovery = hashParams.get('type') === 'recovery' || searchParams.get('type') === 'recovery';

    setIsRecoveryLink(isRecovery);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isRecoveryLink) {
      toast.error('Abra este fluxo a partir do e-mail de recuperação.');
      return;
    }

    if (password.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error('Não foi possível atualizar a senha: ' + error.message);
      setLoading(false);
      return;
    }

    toast.success('Senha atualizada com sucesso.');
    navigate('/conecte-se', { replace: true });
  };

  return (
    <main className="min-h-screen bg-background px-5 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
        <Card className="w-full border-border/50 shadow-premium-lg">
          <CardHeader className="space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl">Redefinir senha</CardTitle>
              <CardDescription>
                Crie uma nova senha para voltar a acessar o portal do prestador com segurança.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {isRecoveryLink ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite a nova senha"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirmar senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Salvando nova senha...' : 'Salvar nova senha'}
                </Button>
              </form>
            ) : (
              <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                Este link de redefinição é inválido ou expirou. Solicite um novo link na tela de login.
              </div>
            )}

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/conecte-se', { replace: true })}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o login
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}