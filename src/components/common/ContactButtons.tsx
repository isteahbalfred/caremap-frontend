interface ContactButtonsProps {
  phone?: string | null;
  /** Nom de la pharmacie/clinique, utilisé pour préremplir le message WhatsApp */
  name?: string;
  size?: 'sm' | 'md';
  className?: string;
}

// Hypothèse : numéros stockés sans indicatif pays (format local haïtien).
// Ajuste le préfixe si les numéros en base incluent déjà le "509".
function toWhatsAppLink(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, '');
  const withCountryCode = digits.startsWith('509') ? digits : `509${digits}`;
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${withCountryCode}${text}`;
}

export function ContactButtons({ phone, name, size = 'md', className = '' }: ContactButtonsProps) {
  if (!phone) return null;

  const pad = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm';
  const message = name
    ? `Bonjour, je vous contacte depuis CareMap au sujet de ${name}.`
    : 'Bonjour, je vous contacte depuis CareMap.';

  return (
    <div className={`flex gap-2 ${className}`}>
      <a
        href={`tel:${phone}`}
        className={`inline-flex items-center gap-1.5 ${pad} bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors`}
      >
        📞 Appeler
      </a>
      <a
        href={toWhatsAppLink(phone, message)}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 ${pad} bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors`}
      >
        💬 WhatsApp
      </a>
    </div>
  );
}