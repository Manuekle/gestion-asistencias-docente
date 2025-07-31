'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value: string; // Expected format: "HH:mm"
  onChange: (value: string) => void;
  className?: string;
}

const generateTimeOptions = (max: number, step: number = 1) => {
  return Array.from({ length: Math.ceil(max / step) }, (_, i) => {
    const value = (i * step).toString().padStart(2, '0');
    return {
      value,
      label: value,
    };
  });
};

const hours = generateTimeOptions(24);
const minutes = generateTimeOptions(60);

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [hour, minute] = value ? value.split(':') : ['00', '00'];

  const handleHourChange = (newHour: string) => {
    onChange(`${newHour}:${minute}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    onChange(`${hour}:${newMinute}`);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Clock className="h-4 w-4" />
      <Select value={hour} onValueChange={handleHourChange}>
        <SelectTrigger className="w-[80px]">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          {hours.map(h => (
            <SelectItem key={h.value} value={h.value}>
              {h.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span>:</span>
      <Select value={minute} onValueChange={handleMinuteChange}>
        <SelectTrigger className="w-[80px]">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map(m => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
