import type { EntitlementPayload } from '../types';

/**
 * Curated list of Adobe apps that can be dragged onto the grid as entitlements.
 * See https://www.adobe.com/apps/all/all-platforms for reference.
 */
export const ADOBE_ENTITLEMENTS: EntitlementPayload[] = [
    {
        id: 'adobe-express',
        title: 'Adobe Express',
        description: 'Create graphics, photos, and videos quickly.',
        href: 'https://new.express.adobe.com/?showIntentQuiz=false&locale=en-US',
    },
    {
        id: 'adobe-firefly',
        title: 'Adobe Firefly',
        description: 'Generative AI for images and more.',
        href: 'https://firefly.adobe.com/?promoid=L3XTTKDX&locale=en-US&mv=other&mv2=tab',
    },
    {
        id: 'adobe-photoshop',
        title: 'Adobe Photoshop',
        description: 'Image editing and design.',
        href: 'https://photoshop.adobe.com/?promoid=LCDWT9XV&lang=en&mv=other&mv2=tab',
    },
    {
        id: 'adobe-illustrator',
        title: 'Adobe Illustrator',
        description: 'Vector graphics and illustration.',
        href: 'https://illustrator.adobe.com/',
    },
    {
        id: 'adobe-acrobat',
        title: 'Adobe Acrobat',
        description: 'PDFs and documents.',
        href: 'https://acrobat.adobe.com/',
    },
    {
        id: 'adobe-premiere-pro',
        title: 'Adobe Premiere Pro',
        description: 'Video editing.',
        href: 'https://www.adobe.com/products/premiere.html',
    },
];
