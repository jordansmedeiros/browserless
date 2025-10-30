'use client';

/**
 * Schedule Frequency Selector
 * Componente para seleção de frequência de agendamento com UI amigável
 */

import { useState, useEffect } from 'react';
import { ScheduleFrequencyType, ScheduleFrequencyConfig } from '@/lib/types/scraping';
import { formatCronDescription, frequencyConfigToCron } from '@/lib/utils/cron-helpers';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface ScheduleFrequencySelectorProps {
  value: ScheduleFrequencyConfig;
  onChange: (config: ScheduleFrequencyConfig) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];
const WEEKDAY_NAMES = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

export function ScheduleFrequencySelector({ value, onChange }: ScheduleFrequencySelectorProps) {
  const [cronDescription, setCronDescription] = useState<string>('');

  // Calcular descrição do cron
  useEffect(() => {
    try {
      const cron = frequencyConfigToCron(value);
      const description = formatCronDescription(cron);
      setCronDescription(description);
    } catch (error) {
      setCronDescription('Configuração inválida');
    }
  }, [value]);

  return (
    <div className="space-y-6">
      <RadioGroup
        value={value.type}
        onValueChange={(type) =>
          onChange({
            type: type as ScheduleFrequencyType,
            ...(type === ScheduleFrequencyType.DAILY && { dailyTime: '09:00' }),
            ...(type === ScheduleFrequencyType.WEEKLY && { weekDays: [1, 2, 3, 4, 5], weeklyTime: '09:00' }),
            ...(type === ScheduleFrequencyType.INTERVAL && { intervalHours: 6 }),
            ...(type === ScheduleFrequencyType.CUSTOM && { customCron: '0 9 * * *' }),
          })
        }
      >
        <div className="space-y-4">
          {/* Diariamente */}
          <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-accent/50 cursor-pointer transition-colors"
            onClick={() =>
              onChange({
                type: ScheduleFrequencyType.DAILY,
                dailyTime: value.dailyTime || '09:00',
              })
            }
          >
            <RadioGroupItem value={ScheduleFrequencyType.DAILY} id="daily" />
            <div className="flex-1 space-y-2">
              <Label htmlFor="daily" className="font-medium cursor-pointer">
                Diariamente
              </Label>
              {value.type === ScheduleFrequencyType.DAILY && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="daily-time" className="text-sm">
                    Horário:
                  </Label>
                  <Select
                    value={value.dailyTime?.split(':')[0] || '09'}
                    onValueChange={(hour) => {
                      const minute = value.dailyTime?.split(':')[1] || '00';
                      onChange({ ...value, dailyTime: `${hour}:${minute}` });
                    }}
                  >
                    <SelectTrigger className="w-20" onClick={(e) => e.stopPropagation()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}h
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>:</span>
                  <Select
                    value={value.dailyTime?.split(':')[1] || '00'}
                    onValueChange={(minute) => {
                      const hour = value.dailyTime?.split(':')[0] || '09';
                      onChange({ ...value, dailyTime: `${hour}:${minute}` });
                    }}
                  >
                    <SelectTrigger className="w-20" onClick={(e) => e.stopPropagation()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MINUTES.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}min
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Semanalmente */}
          <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-accent/50 cursor-pointer transition-colors"
            onClick={() =>
              onChange({
                type: ScheduleFrequencyType.WEEKLY,
                weekDays: value.weekDays || [1, 2, 3, 4, 5],
                weeklyTime: value.weeklyTime || '09:00',
              })
            }
          >
            <RadioGroupItem value={ScheduleFrequencyType.WEEKLY} id="weekly" />
            <div className="flex-1 space-y-3">
              <Label htmlFor="weekly" className="font-medium cursor-pointer">
                Semanalmente
              </Label>
              {value.type === ScheduleFrequencyType.WEEKLY && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm mb-2 block">Dias da semana:</Label>
                    <div className="flex gap-2 flex-wrap">
                      {WEEKDAY_NAMES.map((day) => (
                        <div key={day.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${day.value}`}
                            checked={value.weekDays?.includes(day.value)}
                            onCheckedChange={(checked) => {
                              const currentDays = value.weekDays || [];
                              const newDays = checked
                                ? [...currentDays, day.value]
                                : currentDays.filter((d) => d !== day.value);
                              onChange({ ...value, weekDays: newDays.sort() });
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Label
                            htmlFor={`day-${day.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="weekly-time" className="text-sm">
                      Horário:
                    </Label>
                    <Select
                      value={value.weeklyTime?.split(':')[0] || '09'}
                      onValueChange={(hour) => {
                        const minute = value.weeklyTime?.split(':')[1] || '00';
                        onChange({ ...value, weeklyTime: `${hour}:${minute}` });
                      }}
                    >
                      <SelectTrigger className="w-20" onClick={(e) => e.stopPropagation()}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}h
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>:</span>
                    <Select
                      value={value.weeklyTime?.split(':')[1] || '00'}
                      onValueChange={(minute) => {
                        const hour = value.weeklyTime?.split(':')[0] || '09';
                        onChange({ ...value, weeklyTime: `${hour}:${minute}` });
                      }}
                    >
                      <SelectTrigger className="w-20" onClick={(e) => e.stopPropagation()}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MINUTES.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}min
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* A cada X horas */}
          <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-accent/50 cursor-pointer transition-colors"
            onClick={() =>
              onChange({
                type: ScheduleFrequencyType.INTERVAL,
                intervalHours: value.intervalHours || 6,
              })
            }
          >
            <RadioGroupItem value={ScheduleFrequencyType.INTERVAL} id="interval" />
            <div className="flex-1 space-y-2">
              <Label htmlFor="interval" className="font-medium cursor-pointer">
                A cada X horas
              </Label>
              {value.type === ScheduleFrequencyType.INTERVAL && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="interval-hours" className="text-sm">
                    Intervalo:
                  </Label>
                  <Select
                    value={String(value.intervalHours || 6)}
                    onValueChange={(hours) => onChange({ ...value, intervalHours: Number(hours) })}
                  >
                    <SelectTrigger className="w-32" onClick={(e) => e.stopPropagation()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 6, 8, 12, 24].map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {h} hora{h > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Personalizado */}
          <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-accent/50 cursor-pointer transition-colors"
            onClick={() =>
              onChange({
                type: ScheduleFrequencyType.CUSTOM,
                customCron: value.customCron || '0 9 * * *',
              })
            }
          >
            <RadioGroupItem value={ScheduleFrequencyType.CUSTOM} id="custom" />
            <div className="flex-1 space-y-2">
              <Label htmlFor="custom" className="font-medium cursor-pointer">
                Personalizado (cron)
              </Label>
              {value.type === ScheduleFrequencyType.CUSTOM && (
                <div className="space-y-2">
                  <Input
                    id="custom-cron"
                    value={value.customCron || ''}
                    onChange={(e) => onChange({ ...value, customCron: e.target.value })}
                    placeholder="0 9 * * *"
                    className="font-mono"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <p className="text-xs text-muted-foreground">
                    Formato: minuto hora dia mês dia-da-semana.{' '}
                    <a
                      href="https://crontab.guru/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Ver documentação
                    </a>
                  </p>
                  {value.customCron && cronDescription && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {cronDescription}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </RadioGroup>

      {/* Preview da configuração */}
      {cronDescription && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Frequência
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {cronDescription}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
