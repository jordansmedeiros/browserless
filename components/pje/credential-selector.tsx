'use client';

import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Key, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { CredencialWithRelations } from '@/lib/types';

interface CredentialSelectorProps {
  credentials: CredencialWithRelations[];
  selectedCredentialId: string | null;
  onSelect: (credentialId: string) => void;
}

export function CredentialSelector({
  credentials,
  selectedCredentialId,
  onSelect,
}: CredentialSelectorProps) {
  // Group credentials by escritório > advogado
  const credentialsByFirmAndLawyer = useMemo(() => {
    const grouped: Record<
      string,
      Record<string, { advogado: any; credentials: CredencialWithRelations[] }>
    > = {};

    credentials.forEach((cred) => {
      const firmName = cred.advogado?.escritorio?.nome || 'Sem escritório';
      const lawyerId = cred.advogado.id;

      if (!grouped[firmName]) {
        grouped[firmName] = {};
      }

      if (!grouped[firmName][lawyerId]) {
        grouped[firmName][lawyerId] = {
          advogado: cred.advogado,
          credentials: [],
        };
      }

      grouped[firmName][lawyerId].credentials.push(cred);
    });

    return grouped;
  }, [credentials]);

  if (credentials.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <Key className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
        <h3 className="text-lg font-semibold mb-1">Nenhuma credencial disponível</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Você precisa cadastrar credenciais antes de criar raspagens
        </p>
        <a
          href="/pje/credentials"
          className="text-sm text-primary hover:underline"
        >
          Ir para página de credenciais →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RadioGroup
        value={selectedCredentialId || ''}
        onValueChange={onSelect}
        className="space-y-4 max-h-[50vh] overflow-y-auto pr-2"
      >
        {Object.entries(credentialsByFirmAndLawyer).map(([firmName, lawyers]) => (
          <div key={firmName} className="space-y-3">
            {/* Firm Header */}
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground sticky top-0 bg-background py-1 z-10">
              <Building2 className="w-4 h-4" />
              <span>{firmName}</span>
            </div>

            {/* Lawyers and their credentials */}
            {Object.entries(lawyers).map(([lawyerId, { advogado, credentials: lawyerCredentials }]) => (
              <div key={lawyerId} className="ml-6 space-y-2">
                {/* Lawyer Header */}
                <div className="text-sm font-medium text-muted-foreground">
                  OAB/{advogado.oabUf} {advogado.oabNumero} - {advogado.nome}
                </div>

                {/* Lawyer's Credentials */}
                <div className="ml-4 space-y-2">
                  {lawyerCredentials.map((credential) => {
                    const isSelected = selectedCredentialId === credential.id;
                    const tribunalCount = credential.tribunais?.length || 0;
                    const hasValidation = credential.tribunais?.some((t) => t.validadoEm);

                    return (
                      <Card
                        key={credential.id}
                        className={`cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-primary/50 hover:bg-accent'
                        } ${!credential.ativa ? 'opacity-60' : ''}`}
                        onClick={() => credential.ativa && onSelect(credential.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            {/* Radio Button */}
                            <RadioGroupItem
                              value={credential.id}
                              id={credential.id}
                              disabled={!credential.ativa}
                              className="mt-0.5"
                            />

                            {/* Content */}
                            <div className="flex-1 space-y-1.5">
                              {/* Credential Info - primeira linha */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {credential.descricao ? (
                                    <span className="text-sm font-medium italic text-muted-foreground truncate">
                                      {credential.descricao}
                                    </span>
                                  ) : (
                                    <span className="text-sm font-medium text-muted-foreground">
                                      Credencial
                                    </span>
                                  )}
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    | {tribunalCount} tribunal{tribunalCount !== 1 ? 'is' : ''}
                                  </span>
                                </div>

                                {/* Status Badges */}
                                <div className="flex gap-1.5 flex-shrink-0">
                                  {credential.ativa ? (
                                    <Badge variant="default" className="text-xs h-5">
                                      Ativa
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs h-5">
                                      Inativa
                                    </Badge>
                                  )}
                                  {hasValidation && (
                                    <Badge variant="outline" className="text-xs h-5 gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Validada
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Tribunal Summary - only show if has tribunals */}
                              {tribunalCount > 0 && credential.tribunais && (
                                <div className="flex flex-wrap gap-1">
                                  {credential.tribunais.slice(0, 4).map((t) => (
                                    <Badge
                                      key={t.id}
                                      variant="outline"
                                      className="text-xs h-5 px-1.5"
                                    >
                                      {t.tribunalConfig?.tribunal?.codigo || 'N/A'}
                                    </Badge>
                                  ))}
                                  {tribunalCount > 4 && (
                                    <Badge variant="outline" className="text-xs h-5 px-1.5">
                                      +{tribunalCount - 4}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Warning if no tribunals - only show message when count is 0 */}
                              {tribunalCount === 0 && (
                                <div className="flex items-center gap-1 text-xs text-amber-600">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Nenhum tribunal configurado</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </RadioGroup>

      {/* Summary */}
      {selectedCredentialId && (
        <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          {(() => {
            const selected = credentials.find((c) => c.id === selectedCredentialId);
            if (!selected) return null;
            return (
              <p className="text-sm">
                <span className="font-medium text-foreground">Selecionada:</span>{' '}
                OAB/{selected.advogado.oabUf} {selected.advogado.oabNumero} - {selected.advogado.nome}
                {selected.descricao && <span className="text-muted-foreground"> ({selected.descricao})</span>}
              </p>
            );
          })()}
        </div>
      )}
    </div>
  );
}
