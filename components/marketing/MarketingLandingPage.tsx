'use client';

import axios from 'axios';
import { useEffect, useState } from 'react';
import { AnalyticsDashboardMockup } from '../landing/AnalyticsDashboardMockup';
import { ComparisonTableSection } from '../landing/ComparisonTableSection';
import { ContactSection } from '../landing/ContactSection';
import { FeatureShowcase } from '../landing/FeatureShowcase';
import { FeaturesSection } from '../landing/FeaturesSection';
import { Footer } from '../landing/Footer';
import { Header } from '../landing/Header';
import { HeroSection } from '../landing/HeroSection';
import { HowItWorks } from '../landing/HowItWorks';
import { LiveDemoPreview } from '../landing/LiveDemoPreview';
import { PricingSection } from '../landing/PricingSection';
import { ROICalculatorSection } from '../landing/ROICalculatorSection';
import { SecuritySection } from '../landing/SecuritySection';
import { SocialMediaFlow } from '../landing/SocialMediaFlow';
import { TechnicalArchitecture } from '../landing/TechnicalArchitecture';

// Define Plan interface locally for consistency
interface Plan {
    id: string;
    name: string;
    price: number;
    interval: string;
    campaignsPerMonth: number;
    spinsPerMonth: number | null;
    vouchersPerMonth: number | null;
    socialMediaEnabled: boolean;
    isMostPopular: boolean;
    campaignDurationDays: number;
    customBranding: boolean;
    advancedAnalytics: boolean;
}

import { VideoShowcase } from '../landing/VideoShowcase';

export default function MarketingLandingPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await axios.get('/api/admin/super/plans');
                setPlans(response.data.plans || []);
            } catch (error) {
                console.error('Error fetching plans:', error);
                // Fallback to default plans if API fails
                setPlans([
                    { 
                        id: '1', 
                        name: 'Starter', 
                        price: 99900, // 999.00 in paise
                        interval: 'MONTHLY',
                        campaignsPerMonth: 1,
                        spinsPerMonth: null,
                        vouchersPerMonth: 500,
                        socialMediaEnabled: false,
                        isMostPopular: false,
                        campaignDurationDays: 15,
                        customBranding: false,
                        advancedAnalytics: false
                    },
                    { 
                        id: '2', 
                        name: 'Pro', 
                        price: 499900, // 4999.00 in paise
                        interval: 'MONTHLY',
                        campaignsPerMonth: 5,
                        spinsPerMonth: null,
                        vouchersPerMonth: 5000,
                        socialMediaEnabled: true,
                        isMostPopular: true,
                        campaignDurationDays: 30,
                        customBranding: true,
                        advancedAnalytics: false
                    },
                    { 
                        id: '3', 
                        name: 'Enterprise', 
                        price: 0, 
                        interval: 'MONTHLY',
                        campaignsPerMonth: 999,
                        spinsPerMonth: null,
                        vouchersPerMonth: null,
                        socialMediaEnabled: true,
                        isMostPopular: false,
                        campaignDurationDays: 365,
                        customBranding: true,
                        advancedAnalytics: true
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchPlans();
    }, []);
    
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="bg-[#fafbfc] overflow-x-hidden font-sans">
            <Header 
                mobileMenuOpen={mobileMenuOpen} 
                setMobileMenuOpen={setMobileMenuOpen} 
                scrollToSection={scrollToSection} 
            />
            
            <main>
                <HeroSection />
                <VideoShowcase />
                <FeaturesSection />
                <ComparisonTableSection />
                <FeatureShowcase />
                <TechnicalArchitecture />
                <SocialMediaFlow />
                <AnalyticsDashboardMockup />
                <HowItWorks />
                <LiveDemoPreview />
                <PricingSection plans={plans} loading={loading} />
                <ROICalculatorSection />
                <SecuritySection />
                <ContactSection />
            </main>
            
            <Footer scrollToSection={scrollToSection} />
        </div>
    );
}
