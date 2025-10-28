
'use client';

import { useActionState, useTransition } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { migrateData } from './actions';
import { LoaderCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function MigratePage() {
  const [migrateState, migrateAction] = useActionState(migrateData, { message: '', success: false });
  const [isPending, startTransition] = useTransition();

  const handleMigration = () => {
    startTransition(() => {
      migrateAction();
    });
  };

  return (
    <div>
      <PageHeader title="Ferramenta de Migração de Dados" />
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Migrar Dados do Firestore</CardTitle>
          <CardDescription>
            Use esta ferramenta para copiar os dados (jobs e crew) de um usuário para outro.
            Esta é uma operação única e deve ser usada com cuidado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
            <p><strong>Usuário de Origem:</strong> 7aDfCRJ90HNiN2se655nys4glUX2</p>
            <p><strong>Usuário de Destino:</strong> m2QQbgIIKoQldL7iE4yDR1ItkYL2</p>
          </div>

          <Button onClick={handleMigration} disabled={isPending} className="w-full">
            {isPending ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Migrando...
              </>
            ) : (
              'Iniciar Migração'
            )}
          </Button>

          {migrateState.message && (
             <Alert variant={migrateState.success ? 'default' : 'destructive'}>
                <AlertTitle>{migrateState.success ? 'Sucesso!' : 'Erro!'}</AlertTitle>
                <AlertDescription>
                    {migrateState.message}
                </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
