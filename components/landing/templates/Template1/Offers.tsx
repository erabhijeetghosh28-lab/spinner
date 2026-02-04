'use client';

import OfferShowcaseCarousel from '../../shared/OfferShowcaseCarousel';

interface OffersProps {
    offers: any[];
}

export default function Offers({ offers }: OffersProps) {
    return (
        <OfferShowcaseCarousel 
            offers={offers}
            variant="light"
        />
    );
}
