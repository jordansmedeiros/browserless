/**
 * Componente auxiliar para renderizar células de tabela de processos
 * com formatação específica baseada na família do tribunal
 */

'use client';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ProcessoUnificado, TribunalFamily } from '@/lib/types/scraping';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExternalLink } from 'lucide-react';

interface ProcessoTableCellProps {
  processo: ProcessoUnificado;
  column: string;
  tribunalFamily: TribunalFamily;
}

/**
 * Helper para formatar valores de células
 */
export function formatCellValue(
  value: any,
  column: string,
  processo: ProcessoUnificado
): string {
  if (value === null || value === undefined) {
    return '-';
  }

  // Formatar datas
  if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))) {
    const date = value instanceof Date ? value : new Date(value);
    if (!isNaN(date.getTime())) {
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    }
  }

  // Formatar booleanos
  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não';
  }

  // Truncar strings longas
  if (typeof value === 'string' && value.length > 50) {
    return value.substring(0, 50) + '...';
  }

  return String(value);
}

/**
 * Componente para renderizar células de tabela de processos
 */
export function ProcessoTableCell({
  processo,
  column,
  tribunalFamily,
}: ProcessoTableCellProps) {
  // Obter valor baseado no nome da coluna
  let value: any = null;
  let displayValue: React.ReactNode = null;

  // Mapear colunas para campos do processo
  switch (column) {
    case 'numeroProcesso':
    case 'numero':
      value = processo.numeroProcesso;
      displayValue = (
        <span className="font-mono font-medium">{value || '-'}</span>
      );
      break;

    case 'partes':
      // Para TRT: combinar parte autora e réu
      // Para TJ: usar partes dos metadados ou nomeParteRe
      if (tribunalFamily === 'TJ') {
        value =
          processo.metadados?.partes ||
          processo.nomeParteRe ||
          processo.nomeParteAutora;
      } else {
        const partes = [
          processo.nomeParteAutora,
          processo.nomeParteRe,
        ]
          .filter(Boolean)
          .join(' / ');
        value = partes || '-';
      }
      displayValue =
        value && value.length > 50 ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate max-w-[200px] block">
                  {value}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[300px]">{value}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span>{value || '-'}</span>
        );
      break;

    case 'nomeParteAutora':
      value = processo.nomeParteAutora;
      displayValue =
        value && value.length > 50 ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate max-w-[200px] block">
                  {value}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[300px]">{value}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span>{value || '-'}</span>
        );
      break;

    case 'nomeParteRe':
      value = processo.nomeParteRe;
      displayValue =
        value && value.length > 50 ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate max-w-[200px] block">
                  {value}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[300px]">{value}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span>{value || '-'}</span>
        );
      break;

    case 'orgaoJulgador':
    case 'vara':
      value = processo.orgaoJulgador || processo.metadados?.vara;
      displayValue =
        value && value.length > 50 ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate max-w-[200px] block">
                  {value}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[300px]">{value}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span>{value || '-'}</span>
        );
      break;

    case 'classeJudicial':
      value = processo.classeJudicial;
      displayValue = <span>{value || '-'}</span>;
      break;

    case 'dataAutuacao':
      value = processo.dataAutuacao;
      displayValue = formatCellValue(value, column, processo);
      break;

    case 'dataDistribuicao':
      value = processo.metadados?.dataDistribuicao;
      displayValue = formatCellValue(value, column, processo);
      break;

    case 'dataCienciaParte':
      value = processo.metadados?.dataCienciaParte;
      displayValue = formatCellValue(value, column, processo);
      break;

    case 'dataPrazoLegalParte':
      value = processo.metadados?.dataPrazoLegalParte;
      displayValue = formatCellValue(value, column, processo);
      break;

    case 'prazoVencido':
      value = processo.metadados?.prazoVencido;
      displayValue = (
        <Badge variant={value ? 'destructive' : 'secondary'}>
          {value ? 'Sim' : 'Não'}
        </Badge>
      );
      break;

    case 'dataArquivamento':
      value = processo.metadados?.dataArquivamento;
      displayValue = formatCellValue(value, column, processo);
      break;

    case 'dataInicio':
      value = processo.metadados?.dataInicio;
      if (value) {
        const date = value instanceof Date ? value : new Date(value);
        if (!isNaN(date.getTime())) {
          displayValue = format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
        } else {
          displayValue = '-';
        }
      } else {
        displayValue = '-';
      }
      break;

    case 'dataFim':
      value = processo.metadados?.dataFim;
      if (value) {
        const date = value instanceof Date ? value : new Date(value);
        if (!isNaN(date.getTime())) {
          displayValue = format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
        } else {
          displayValue = '-';
        }
      } else {
        displayValue = '-';
      }
      break;

    case 'urlAudienciaVirtual':
      value = processo.metadados?.urlAudienciaVirtual;
      displayValue = value ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 underline"
        >
          Acessar
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        '-'
      );
      break;

    case 'tipoDescricao':
      value = processo.metadados?.tipoDescricao;
      displayValue = <span>{value || '-'}</span>;
      break;

    case 'regiao':
      value = processo.metadados?.regiao;
      displayValue = value ? (
        <Badge variant="outline">{value}</Badge>
      ) : (
        '-'
      );
      break;

    case 'tipo':
      value = processo.metadados?.tipo;
      displayValue = value ? (
        <Badge variant="outline">{value}</Badge>
      ) : (
        '-'
      );
      break;

    case 'ultimoMovimento':
      value = processo.metadados?.ultimoMovimento;
      if (value) {
        const date = value instanceof Date ? value : new Date(value);
        if (!isNaN(date.getTime())) {
          displayValue = format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
        } else {
          displayValue = String(value);
        }
      } else {
        displayValue = '-';
      }
      break;

    default:
      // Tentar buscar em metadados
      value = processo.metadados?.[column];
      displayValue = formatCellValue(value, column, processo);
  }

  return <>{displayValue}</>;
}


