'use client';

import MinimalFooter from '../../shared/MinimalFooter';

interface FooterProps {
    footer?: any;
}

export default function Footer({ footer }: FooterProps) {
    return (
        <MinimalFooter 
            footer={footer}
            variant="light"
        />
    );
}
