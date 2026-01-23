-- Fix existing LandingPage records to have required fields
UPDATE "LandingPage" 
SET 
    "metaTitle" = COALESCE("metaTitle", title, 'Campaign Landing Page'),
    "metaDescription" = COALESCE("metaDescription", 'Spin to win amazing prizes!'),
    "template" = COALESCE("template", 'template_1')
WHERE 
    "metaTitle" IS NULL 
    OR "metaDescription" IS NULL 
    OR "template" IS NULL;
