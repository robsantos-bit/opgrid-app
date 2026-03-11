import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Lock, Shield, Users, Settings } from 'lucide-react';

interface PerfilPermissao {
  perfil: string;
  modulos: Record<string, boolean>;
}

const MODULOS = ['Painel', 'Solicitações', 'Atendimentos', 'Despacho', 'Mapa', 'Prestadores', 'Faturamento', 'Tarifas', 'Configurações', 'Usuários'];

const INITIAL: PerfilPermissao[] = [
  { perfil: 'Administrador', modulos: Object.fromEntries(MODULOS.map(m => [m, true])) },
  { perfil: 'Operador', modulos: { Painel: true, Solicitações: true, Atendimentos: true, Despacho: true, Mapa: true, Prestadores: true, Faturamento: false, Tarifas: false, Configurações: false, Usuários: false } },
  { perfil: 'Financeiro', modulos: { Painel: true, Solicitações: false, Atendimentos: true, Despacho: false, Mapa: false, Prestadores: true, Faturamento: true, Tarifas: true, Configurações: false, Usuários: false } },
];

const perfilIcon = (p: string) => {
  switch (p) { case 'Administrador': return Shield; case 'Operador': return Users; default: return Settings; }
};

export default function AdminPermissoes() {
  const [perfis, setPerfis] = useState(INITIAL);

  const handleToggle = (perfilIdx: number, modulo: string) => {
    if (perfis[perfilIdx].perfil === 'Administrador') { toast.info('Permissões do administrador não podem ser alteradas.'); return; }
    setPerfis(prev => prev.map((p, i) => i === perfilIdx ? { ...p, modulos: { ...p.modulos, [modulo]: !p.modulos[modulo] } } : p));
    toast.success('Permissão atualizada.');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Permissões</h1>
          <p>Configure perfis de acesso e controle de permissões por módulo</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {perfis.map(p => {
          const Icon = perfilIcon(p.perfil);
          const active = Object.values(p.modulos).filter(Boolean).length;
          return (
            <Card key={p.perfil}><CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="h-5 w-5 text-primary" /></div>
              <div><p className="font-semibold text-[13px]">{p.perfil}</p><p className="text-[11px] text-muted-foreground">{active}/{MODULOS.length} módulos</p></div>
            </CardContent></Card>
          );
        })}
      </div>

      <Card><CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-[13px] font-medium text-muted-foreground flex items-center gap-2"><Lock className="h-3.5 w-3.5" />Matriz de Permissões</CardTitle></CardHeader><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Módulo</TableHead>
            {perfis.map(p => <TableHead key={p.perfil} className="text-[11px] uppercase tracking-wider font-semibold text-center">{p.perfil}</TableHead>)}
          </TableRow></TableHeader>
          <TableBody>
            {MODULOS.map(m => (
              <TableRow key={m} className="table-row-hover">
                <TableCell className="font-semibold text-[13px]">{m}</TableCell>
                {perfis.map((p, i) => (
                  <TableCell key={p.perfil} className="text-center">
                    <Switch checked={p.modulos[m]} onCheckedChange={() => handleToggle(i, m)} disabled={p.perfil === 'Administrador'} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
