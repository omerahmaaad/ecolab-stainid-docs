// Centralized stain-related data and configurations

export const STAIN_COLORS: Record<string, string> = {
  makeup: "#FF6B9D",
  foundation: "#FEC8D8",
  blood: "#C44569",
  "boot polish": "#2C3E50",
  dirt: "#8B6F47",
  wine: "#722F37",
  coffee: "#6F4E37",
  food: "#FF8C42",
};

export const DEFAULT_STAIN_COLOR = "#0066CC";

export function getStainColor(stainType?: string): string {
  if (!stainType) return DEFAULT_STAIN_COLOR;
  return STAIN_COLORS[stainType.toLowerCase()] || DEFAULT_STAIN_COLOR;
}

export const ALTERNATIVE_TREATMENTS: Record<string, string> = {
  'Mineral Stain': 'Rust & Mineral Remover or Oxalic Acid treatment',
  'Makeup Stain': 'Alcohol-based pre-treatment or Solvent cleaner',
  'Grease/Damage Stain': 'Degreaser or Heavy-duty alkaline cleaner',
  'Lotion Stain': 'Oil-based stain remover or Dish soap pre-treatment',
  'Biological Stain': 'Cold water rinse + Hydrogen peroxide or Ammonia solution',
  'Food Stain': 'Enzyme cleaner or Vinegar solution',
  'Beverage Stain': 'Club soda or White vinegar treatment',
  'Environmental Stain': 'Brush off excess, then laundry detergent',
  'Ink/Dye Stain': 'Rubbing alcohol or Acetone-based remover',
  'Dye Stain': 'Color-safe bleach or Destainer treatment',
  'Body Soil Stain': 'Hot water wash with enzyme detergent or Oxygen bleach',
};

export function getAlternativeTreatment(category: string): string {
  return ALTERNATIVE_TREATMENTS[category] || 'General purpose stain remover';
}

export interface ProductImageMapping {
  keys: string[];
  url: string;
}

export const PRODUCT_IMAGES: ProductImageMapping[] = [
  {
    keys: ["grease", "remover"],
    url: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/9oa1pgizp9658k6g67zef"
  },
  {
    keys: ["enzyme", "boost"],
    url: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/wwjxm6jteztxkfopm8ooh"
  },
  {
    keys: ["multi", "purpose"],
    url: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/aoip1n7q7hpxiknl8xgoo"
  },
  {
    keys: ["makeup", "remover"],
    url: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/swzp20skl7hnaeoxfxb9f"
  },
  {
    keys: ["rust", "remover"],
    url: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/v8ve9qe6ztnw1ubnev8y2"
  },
  {
    keys: ["destainer"],
    url: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/fo08j7lbdrv45grto1diw"
  },
  {
    keys: ["sunscreen", "power"],
    url: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ao1bo9trb78sjkne7z9yb"
  },
  {
    keys: ["laundry", "pad"],
    url: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/k4h3gio4aillrrds4if7o"
  }
];

export function findProductImage(treatmentText: string): string | null {
  const treatmentLower = treatmentText.toLowerCase();

  for (const product of PRODUCT_IMAGES) {
    if (product.keys.every(key => treatmentLower.includes(key))) {
      return product.url;
    }
  }

  return null;
}

export interface StainType {
  name: string;
  category: string;
}

export const STAIN_TYPES_LIST: StainType[] = [
  { name: 'Foundation', category: 'Makeup Stain' },
  { name: 'Iron', category: 'Mineral Stain' },
  { name: 'Sunscreen', category: 'Lotion Stain' },
  { name: 'Abuse - Carbon Black Staining', category: 'Ink/Dye Stain' },
  { name: 'Mascara', category: 'Makeup Stain' },
  { name: 'Lipstick', category: 'Makeup Stain' },
  { name: 'Blood', category: 'Biological Stain' },
  { name: 'Ink/Dye/Hair Dye', category: 'Ink/Dye Stain' },
  { name: 'Food Soil (Grease)', category: 'Grease/Damage Stain' },
  { name: 'Dirt', category: 'Environmental Stain' },
  { name: 'Body Soil/Lotion', category: 'Body Soil Stain' },
];
