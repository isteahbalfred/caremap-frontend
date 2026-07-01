import { dispatchAskAssistant } from '../../utils/events';

interface AskAssistantButtonProps {
  /** Message envoyé automatiquement au chatbot au clic */
  message: string;
  label?: string;
  className?: string;
}

export function AskAssistantButton({
  message,
  label = "Demander à l'assistant",
  className = '',
}: AskAssistantButtonProps) {
  return (
    <button
      onClick={() => dispatchAskAssistant(message)}
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-primary-200 text-primary-700 hover:bg-primary-50 rounded-lg font-medium transition-colors ${className}`}
    >
      🤖 {label}
    </button>
  );
}