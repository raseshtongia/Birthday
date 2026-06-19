import styles from './ThemeToggle.module.css';
import type { ThemeMode } from './useTheme';

type ThemeToggleProps = {
  value: ThemeMode;
  onChange: (themeMode: ThemeMode) => void;
};

const options: Array<{ value: ThemeMode; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

function ThemeToggle({ value, onChange }: ThemeToggleProps) {
  return (
    <div className={styles.toggle} aria-label="Theme mode">
      {options.map((option) => (
        <button
          className={value === option.value ? styles.active : ''}
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default ThemeToggle;
