import { Star } from 'lucide-react';
import { ReviewsList } from '@/components/reviews';

interface StoreReviewsSectionProps {
  establishmentId: string;
  establishmentName: string;
}

const StoreReviewsSection = ({ establishmentId, establishmentName }: StoreReviewsSectionProps) => {
  return (
    <section className="py-6 px-4">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
        Avaliações
      </h3>

      <ReviewsList establishmentId={establishmentId} limit={5} />
    </section>
  );
};

export default StoreReviewsSection;
