type Strength = 'empty' | 'weak' | 'medium' | 'strong';

function getStrength(password: string): Strength {
  if (!password) return 'empty';
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isLong = password.length >= 8;
  if (!isLong) return 'weak';
  if (hasUpper && hasNumber && hasSpecial) return 'strong';
  if (hasUpper || hasNumber) return 'medium';
  return 'weak';
}

const BAR_COLORS: Record<Strength, string[]> = {
  empty: ['bg-warm-beige', 'bg-warm-beige', 'bg-warm-beige'],
  weak: ['bg-error', 'bg-warm-beige', 'bg-warm-beige'],
  medium: ['bg-alert', 'bg-alert', 'bg-warm-beige'],
  strong: ['bg-success', 'bg-success', 'bg-success'],
};

const LABELS: Record<Strength, string> = {
  empty: '',
  weak: 'Weak',
  medium: 'Medium',
  strong: 'Strong',
};

export default function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = getStrength(password);
  const colors = BAR_COLORS[strength];
  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1" aria-label={`Password strength: ${LABELS[strength] || 'none'}`}>
        {colors.map((color, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${color}`}
          />
        ))}
      </div>
      {strength !== 'empty' && (
        <span className="text-label-sm text-warm-gray">{LABELS[strength]}</span>
      )}
    </div>
  );
}
