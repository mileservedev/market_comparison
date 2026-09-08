export interface CampaignProduct {
  id: string;
  name: string;
  accent: string;
  accentRgb: string;
  diagramFilter?: string;
}

export interface CampaignFeature {
  id: string;
  name: string;
  hint: string;
}

export interface Campaign {
  slug: string;
  selectorLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  subject: string;
  diagram: string;
  mapClass: 'map-shoe' | 'map-suv';
  products: [CampaignProduct, CampaignProduct];
  features: CampaignFeature[];
}

export const campaigns: Record<string, Campaign> = {
  'running-shoes': {
    slug: 'running-shoes',
    selectorLabel: 'adidas vs Nike shoes',
    eyebrow: 'Running shoe showdown',
    title: 'Every feature. One clear winner.',
    description:
      'Tap a feature on either shoe to cast your preference. Your first choice for each feature is final.',
    subject: 'running shoe',
    diagram: '/shoe-sections-six.png',
    mapClass: 'map-shoe',
    products: [
      {
        id: 'stride',
        name: 'adidas',
        accent: '#f4b740',
        accentRgb: '244 183 64',
      },
      {
        id: 'velocity',
        name: 'Nike',
        accent: '#ff5147',
        accentRgb: '255 81 71',
        diagramFilter: 'hue-rotate(-38deg) saturate(1.35)',
      },
    ],
    features: [
      { id: 'style', name: 'Style', hint: 'Form & silhouette' },
      { id: 'fit', name: 'Fit', hint: 'Lockdown & sizing' },
      { id: 'color', name: 'Color', hint: 'Palette & finish' },
      { id: 'comfort', name: 'Comfort', hint: 'Cushioning & ride' },
      { id: 'pricing', name: 'Pricing', hint: 'Value for money' },
      { id: 'availability', name: 'Availability', hint: 'Ease of purchase' },
    ],
  },
  'suv-showdown': {
    slug: 'suv-showdown',
    selectorLabel: 'Hyundai vs Honda SUVs',
    eyebrow: 'SUV showdown',
    title: 'Two SUVs. Five decisive qualities.',
    description:
      'Choose the SUV you prefer for each section. You can vote only once per feature in this campaign.',
    subject: 'SUV',
    diagram: '/suv-sections.svg',
    mapClass: 'map-suv',
    products: [
      {
        id: 'hyundai',
        name: 'Hyundai',
        accent: '#4da3ff',
        accentRgb: '77 163 255',
        diagramFilter: 'hue-rotate(155deg) saturate(1.45)',
      },
      {
        id: 'honda',
        name: 'Honda',
        accent: '#ff5147',
        accentRgb: '255 81 71',
        diagramFilter: 'hue-rotate(-38deg) saturate(1.35)',
      },
    ],
    features: [
      { id: 'style', name: 'Style', hint: 'Exterior design' },
      { id: 'comfort', name: 'Comfort', hint: 'Cabin & ride quality' },
      { id: 'power', name: 'Power', hint: 'Engine performance' },
      { id: 'handling', name: 'Handling', hint: 'Control & road manners' },
      { id: 'price', name: 'Price', hint: 'Value for money' },
    ],
  },
};

export const campaignList = Object.values(campaigns).map(
  ({ slug, selectorLabel }) => ({ slug, selectorLabel }),
);

export function getCampaign(slug: string) {
  return campaigns[slug];
}
