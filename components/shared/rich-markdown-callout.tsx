import {
  Lightbulb,
  AlertTriangle,
  Info,
  AlertOctagon,
  MessageCircle,
} from 'lucide-react';
import type { ReactNode } from 'react';

type CalloutType = 'note' | 'tip' | 'warning' | 'caution' | 'important';

const calloutConfig: Record<
  CalloutType,
  { icon: typeof Info; label: string }
> = {
  note: { icon: Info, label: 'Note' },
  tip: { icon: Lightbulb, label: 'Tip' },
  warning: { icon: AlertTriangle, label: 'Warning' },
  caution: { icon: AlertOctagon, label: 'Caution' },
  important: { icon: MessageCircle, label: 'Important' },
};

interface RichCalloutProps {
  type: CalloutType;
  children: ReactNode;
}

export function RichCallout({ type, children }: RichCalloutProps) {
  const config = calloutConfig[type] ?? calloutConfig.note;
  const Icon = config.icon;

  return (
    <div className={`markdown-alert markdown-alert-${type}`}>
      <div className="markdown-alert-title">
        <Icon className="h-4 w-4" />
        {config.label}
      </div>
      <div>{children}</div>
    </div>
  );
}
