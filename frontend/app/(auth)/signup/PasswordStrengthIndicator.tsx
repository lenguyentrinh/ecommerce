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

// Stitch security-bar palette (muted, luxury) — exact hex from the canonical design.
const FILL: Record<Strength, { width: string; color: string }> = {
  empty: { width: '0%', color: '#f1dfd1' },
  weak: { width: '33%', color: '#e0bfba' },
  medium: { width: '66%', color: '#eadecd' },
  strong: { width: '100%', color: '#c8c7be' },
};

const LABELS: Record<Strength, string> = {
  empty: 'Security Level',
  weak: 'Weak',
  medium: 'Medium',
  strong: 'Strong',
};

export default function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = getStrength(password);
  const { width, color } = FILL[strength];

  return (
    <div className="mt-xs">
      <div
        className="h-[2px] w-full overflow-hidden rounded-full bg-sand-dark"
        role="progressbar"
        aria-label={`Password strength: ${LABELS[strength]}`}
      >
        <div
          className="h-full transition-all duration-500"
          style={{ width, backgroundColor: color }}
        />
      </div>
      <p
        className="mt-1 text-[11px] uppercase tracking-wider"
        style={{ color: strength === 'empty' ? 'rgba(96, 95, 87, 0.5)' : color }}
      >
        {LABELS[strength]}
      </p>
    </div>
  );
}
