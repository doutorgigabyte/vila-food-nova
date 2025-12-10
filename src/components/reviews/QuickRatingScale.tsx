import { cn } from '@/lib/utils';

interface QuickRatingScaleProps {
  value: number | null;
  onChange: (value: number) => void;
  label?: string;
  disabled?: boolean;
}

const QuickRatingScale = ({ value, onChange, label, disabled }: QuickRatingScaleProps) => {
  const getColor = (rating: number) => {
    if (rating <= 3) return 'bg-red-500 hover:bg-red-600 border-red-600';
    if (rating <= 6) return 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600';
    return 'bg-green-500 hover:bg-green-600 border-green-600';
  };

  const getSelectedColor = (rating: number) => {
    if (rating <= 3) return 'bg-red-600 ring-2 ring-red-400 ring-offset-2';
    if (rating <= 6) return 'bg-yellow-600 ring-2 ring-yellow-400 ring-offset-2';
    return 'bg-green-600 ring-2 ring-green-400 ring-offset-2';
  };

  return (
    <div className="space-y-3">
      {label && (
        <p className="text-sm font-medium text-foreground">{label}</p>
      )}
      <div className="flex gap-1.5 justify-between">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
          <button
            key={rating}
            type="button"
            disabled={disabled}
            onClick={() => onChange(rating)}
            className={cn(
              'w-8 h-10 rounded-lg text-white font-semibold text-sm transition-all duration-200 border-2',
              value === rating
                ? getSelectedColor(rating)
                : getColor(rating),
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {rating}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Péssimo</span>
        <span>Excelente</span>
      </div>
    </div>
  );
};

export default QuickRatingScale;
