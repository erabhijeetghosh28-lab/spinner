'use client';

import MinimalFooter from '../../shared/MinimalFooter';

interface FooterProps {
    footer?: any;
    tenantSlug?: string;
}

export default function Footer({ footer, tenantSlug }: FooterProps) {
    const rulesUrl = tenantSlug ? `/${tenantSlug}/rules` : footer?.rulesUrl;
    return (
        <MinimalFooter 
            footer={{ ...footer, rulesUrl }}
            variant="light"
        />
    );
}
