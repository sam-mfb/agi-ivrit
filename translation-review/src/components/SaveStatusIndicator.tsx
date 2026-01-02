import { useAppSelector } from '@/app/hooks';
import './SaveStatusIndicator.css';

export function SaveStatusIndicator() {
  const saveStatus = useAppSelector((state) => state.translations.saveStatus);

  return (
    <span className={`save-status-text save-status-${saveStatus}`}>
      {getStatusText(saveStatus)}
    </span>
  );
}

function getStatusText(status: string): string {
  switch (status) {
    case 'saved':
      return 'נשמר';
    case 'saving':
      return 'שומר...';
    case 'unsaved':
      return 'יש שינויים';
    default:
      return '';
  }
}
