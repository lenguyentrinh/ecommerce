/**
 * Seed data for the product catalogue.
 *
 * `imageKeys` are storage object keys only (filenames). They resolve to the
 * local placeholder SVGs under `frontend/public/images/placeholders/` via the
 * read-time URL generation in ProductsService (PRODUCT_IMAGE_BASE_URL).
 */
export interface ProductSeed {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  category: string;
  imageKeys: string[];
  isActive?: boolean;
}

const fashionImg = ['fashion-1.svg', 'fashion-2.svg'];
const electronicsImg = ['electronics-1.svg', 'electronics-2.svg'];
const lifestyleImg = ['lifestyle-1.svg', 'lifestyle-2.svg'];

export const productSeeds: ProductSeed[] = [
  // ── Fashion ──────────────────────────────────────────────────────────────
  {
    name: 'Silk Wrap Midi Dress',
    description:
      'A fluid silk midi cut on the bias, finished with a self-tie waist. Drapes effortlessly from desk to dinner.',
    price: 189.0,
    stockQuantity: 24,
    category: 'Fashion',
    imageKeys: fashionImg,
  },
  {
    name: 'Oversized Wool Blazer',
    description:
      'A relaxed, double-breasted blazer in Italian wool. Structured shoulders, soft lapel, endlessly layerable.',
    price: 245.0,
    stockQuantity: 16,
    category: 'Fashion',
    imageKeys: fashionImg,
  },
  {
    name: 'High-Rise Tailored Trousers',
    description:
      'Pleated, high-rise trousers with a clean break. Cut from a crisp, recycled poly blend that holds its line.',
    price: 128.0,
    stockQuantity: 40,
    category: 'Fashion',
    imageKeys: fashionImg,
  },
  {
    name: 'Cashmere Crewneck Sweater',
    description:
      'Grade-A Mongolian cashmere knit to a mid-weight gauge. Warm, weightless, and impossibly soft.',
    price: 165.0,
    stockQuantity: 30,
    category: 'Fashion',
    imageKeys: fashionImg,
  },
  {
    name: 'Pleated Satin Skirt',
    description:
      'A bias-cut satin skirt with knife pleats that catch the light. Sits at the natural waist.',
    price: 98.0,
    stockQuantity: 0,
    category: 'Fashion',
    imageKeys: fashionImg,
  },
  {
    name: 'Linen Button-Down Shirt',
    description:
      'A breezy, garment-washed linen shirt with a relaxed collar. Your warm-weather staple.',
    price: 79.0,
    stockQuantity: 52,
    category: 'Fashion',
    imageKeys: fashionImg,
  },
  {
    name: 'Leather Ankle Boots',
    description:
      'Hand-finished Spanish leather boots on a stacked block heel. Almond toe, side zip.',
    price: 215.0,
    stockQuantity: 12,
    category: 'Fashion',
    imageKeys: fashionImg,
  },

  // ── Electronics ──────────────────────────────────────────────────────────
  {
    name: 'Wireless Noise-Cancelling Headphones',
    description:
      'Over-ear headphones with adaptive ANC and 40-hour battery. Memory-foam cups for all-day comfort.',
    price: 299.0,
    stockQuantity: 35,
    category: 'Electronics',
    imageKeys: electronicsImg,
  },
  {
    name: 'Smart Fitness Watch',
    description:
      'A lightweight tracker with continuous heart-rate, GPS, and a 7-day battery. AMOLED always-on display.',
    price: 179.0,
    stockQuantity: 48,
    category: 'Electronics',
    imageKeys: electronicsImg,
  },
  {
    name: 'Portable Bluetooth Speaker',
    description:
      '360° sound in a pocketable, IP67-rated body. 18 hours of playback and USB-C fast charge.',
    price: 89.0,
    stockQuantity: 60,
    category: 'Electronics',
    imageKeys: electronicsImg,
  },
  {
    name: 'Mechanical Keyboard 75%',
    description:
      'A hot-swappable 75% board with gasket mount and PBT keycaps. Wired or wireless, satisfyingly tactile.',
    price: 139.0,
    stockQuantity: 22,
    category: 'Electronics',
    imageKeys: electronicsImg,
  },
  {
    name: '4K Webcam',
    description:
      'A 4K UHD webcam with HDR and an AI auto-framing sensor. Dual mics with noise reduction.',
    price: 119.0,
    stockQuantity: 0,
    category: 'Electronics',
    imageKeys: electronicsImg,
  },
  {
    name: 'Fast Wireless Charging Pad',
    description:
      'A slim 15W Qi pad with a non-slip surface and over-temperature protection. Case-friendly.',
    price: 39.0,
    stockQuantity: 90,
    category: 'Electronics',
    imageKeys: electronicsImg,
  },
  {
    name: 'USB-C Hub 8-in-1',
    description:
      'Expand one USB-C port into HDMI 4K, Ethernet, SD, and three USB-A. Aluminium shell stays cool.',
    price: 64.0,
    stockQuantity: 44,
    category: 'Electronics',
    imageKeys: electronicsImg,
  },

  // ── Lifestyle ────────────────────────────────────────────────────────────
  {
    name: 'Ceramic Pour-Over Coffee Set',
    description:
      'A hand-glazed ceramic dripper and carafe set. Brews a clean, bright cup, one pour at a time.',
    price: 72.0,
    stockQuantity: 28,
    category: 'Lifestyle',
    imageKeys: lifestyleImg,
  },
  {
    name: 'Linen Bedding Bundle',
    description:
      'Stonewashed French linen in a calming oat tone. A duvet cover and two pillowcases that soften with every wash.',
    price: 199.0,
    stockQuantity: 18,
    category: 'Lifestyle',
    imageKeys: lifestyleImg,
  },
  {
    name: 'Soy Wax Scented Candle',
    description:
      'A 60-hour soy candle in fig and cedar. Poured into a reusable amber glass vessel.',
    price: 34.0,
    stockQuantity: 75,
    category: 'Lifestyle',
    imageKeys: lifestyleImg,
  },
  {
    name: 'Bamboo Bath Caddy',
    description:
      'An extendable bamboo tray with a book rest and glass holder. Water-resistant and foldable.',
    price: 48.0,
    stockQuantity: 33,
    category: 'Lifestyle',
    imageKeys: lifestyleImg,
  },
  {
    name: 'Wool Throw Blanket',
    description:
      'A chunky, oversized throw in 100% lambswool. Earthy herringbone weave with fringed edges.',
    price: 119.0,
    stockQuantity: 20,
    category: 'Lifestyle',
    imageKeys: lifestyleImg,
  },
  {
    name: 'Stoneware Dinner Set (4)',
    description:
      'A reactive-glaze stoneware set for four — plates and bowls, each piece subtly unique. Dishwasher safe.',
    price: 145.0,
    stockQuantity: 14,
    category: 'Lifestyle',
    imageKeys: lifestyleImg,
  },
  {
    name: 'Matte Glass Water Bottle',
    description:
      'A 750ml borosilicate glass bottle with a protective silicone sleeve and leak-proof bamboo lid.',
    price: 29.0,
    stockQuantity: 110,
    category: 'Lifestyle',
    imageKeys: lifestyleImg,
  },
];
