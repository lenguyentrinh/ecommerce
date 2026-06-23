# Epic 2: Product Catalog & Discovery

Shoppers can browse the home page, explore category pages, search by keyword, filter results, and read full product detail pages.

## Story 2.1: Product Entity, API & Seed Data

As a shopper,
I want the product catalogue to exist in the database with real data,
So that I can browse, search, and view product details.

**Acceptance Criteria:**

**Given** the NestJS backend needs a `ProductsModule`
**When** the module is scaffolded
**Then** a `Product` entity exists with fields: `id`, `name`, `description`, `price` (decimal), `stockQuantity` (int), `category` (string), `imageKeys` (string[] — S3/Cloudinary keys, never full URLs), `isActive` (boolean, default true), `deletedAt` (nullable, `@DeleteDateColumn` for soft delete), `createdAt`, `updatedAt`; a TypeORM migration creates the `products` table; `synchronize: false` is confirmed

**Given** the products table exists
**When** the seed script runs
**Then** at least 20 sample products exist across 3 categories (Fashion, Electronics, Lifestyle) with realistic names, descriptions, prices, and stock quantities; `imageKeys` contains placeholder keys that resolve to local placeholder images

**Given** the `ProductsController` is created
**When** `GET /api/products` is called
**Then** it returns a paginated list `{ data: Product[], total, page, limit }`; supports query params: `category`, `search` (text), `minPrice`, `maxPrice`, `inStock` (boolean), `sort` (`price_asc`, `price_desc`, `newest`, `popularity`); page and category queries hit DB indexes

**Given** `GET /api/products/:id` is called with a valid product ID
**When** the product exists and is active
**Then** it returns the full product object with image URLs generated at read time (not stored); if the product is soft-deleted or inactive it returns 404

**Given** `GET /api/products/categories` is called
**When** the endpoint responds
**Then** it returns a list of distinct active category names

## Story 2.2: Home Page & Category Pages

As a shopper,
I want to land on a beautiful home page and browse products by category,
So that I can discover what Oren offers without knowing exactly what I'm looking for.

**Acceptance Criteria:**

**Given** the shopper visits `/`
**When** the Next.js Server Component renders (SSR)
**Then** the page shows: a hero/banner section (Oren styling — large image, Display LG headline, primary CTA button); a featured products section (first 8 active products from API); a category navigation row (chips/pills for each category); `generateMetadata()` returns a meaningful page title and Open Graph description; LCP target < 2.5s

**Given** the shopper visits `/categories/[name]`
**When** the SSR page renders
**Then** a filtered product grid shows products for that category; the category name appears as a Headline MD heading; `generateMetadata()` sets title and OG tags for the category; an empty state shows "No products in this category yet" if no results

**Given** a product grid renders on any page
**When** the data is loading
**Then** 4–6 skeleton cards (Warm Beige placeholder, 16px radius, 4:5 aspect ratio) fade in as placeholders; they fade out and real cards fade in once data loads

**Given** the shopper scrolls the product grid on mobile
**When** they approach the bottom of the current page
**Then** the next page of products loads automatically (infinite scroll); a subtle loading indicator appears between batches; no visible pagination buttons exist

**Given** the shopper is on a product grid page
**When** they see a product card
**Then** the card shows: 4:5 aspect image (16px radius, Warm Beige bg placeholder), product name (16px/600), price (16px/400/Warm Gray); on desktop hover: "Add to Cart" CTA fades in (300ms), image zooms 1.02×; on mobile: a persistent subtle CTA button is shown; out-of-stock products show a disabled "Out of Stock" label instead

## Story 2.3: Product Detail Page (PDP)

As a shopper,
I want to view a full product page with images, details, and the option to add to my cart,
So that I can make an informed purchase decision.

**Acceptance Criteria:**

**Given** the shopper navigates to `/products/[id]`
**When** the Next.js SSR page renders
**Then** `generateMetadata()` returns the product name as title and description as OG description; the page layout on desktop: 60% image gallery (left), 40% info panel (right, Warm White bg, 32px padding); on mobile: full-width image gallery stacked above info; LCP < 2.5s

**Given** the product has multiple images
**When** the image gallery renders
**Then** the main image displays at full width (16px radius); thumbnail navigation allows switching the main image; images use Next.js `<Image>` component with correct `remotePatterns` config for S3/Cloudinary domain

**Given** the info panel renders
**When** the shopper views the product details
**Then** it shows: product name (Headline MD — 24px/600/+0.03em), price (Body MD — 16px/400/Warm Gray), stock status indicator, "Styling Notes" description (Body LG — 18px/400/lh-1.6, editorial paragraphs), trust elements ("Free shipping over $150 • 30-day returns"), a primary pill "Add to Cart" button (full-width on mobile, half-width on desktop)

**Given** the product has size or color variants
**When** the variant selector renders
**Then** pill chip selectors appear (uppercase tracked Label SM); selected variant shows Muted Blush fill / Soft Clay border; clicking a variant updates any price difference in real time

**Given** the product is out of stock
**When** the info panel renders
**Then** the "Add to Cart" button is replaced by "Out of Stock" (Sand fill, Warm Gray text, `cursor: not-allowed`); the shopper cannot add it to cart

**Given** the product ID does not exist or is soft-deleted
**When** the page attempts to load
**Then** a 404 page renders with an Oren-styled message and a link back to the home page

## Story 2.4: Search Bar & Filter/Sort UI

As a shopper,
I want to search for products by keyword and filter/sort the results,
So that I can quickly find exactly what I'm looking for.

**Acceptance Criteria:**

**Given** any page in the shopper experience
**When** the page renders
**Then** a sticky search bar is visible (Warm White bg, hairline border, Soft Clay focus border, 44px+ height, z-index 10); on mobile it stays visible while scrolling; an X clear button appears when text is entered

**Given** the shopper types a search query and submits
**When** the results page (`/search?q=<query>`) renders
**Then** `GET /api/products?search=<query>` is called; matching products appear in the grid layout; the result count shows "Showing X of Y results"; if no results: empty state "No results found. Try a different search or browse categories." with a link to home

**Given** the shopper is on a search results or category page
**When** the filter panel is opened
**Then** filter options appear: Price Range (min–max inputs), Category (checkboxes), In Stock only (toggle); a Sort dropdown offers: Price: Low to High, Price: High to Low, Newest, Most Popular; applied filters are shown as dismissible chips above the grid; "Clear all" resets all filters

**Given** the shopper applies filters
**When** filter values change
**Then** the product grid refreshes with filtered results; query params update in the URL (shareable/bookmarkable); filter state persists on page refresh

**Given** search results are loading
**When** the API call is in flight
**Then** skeleton cards appear; a "Searching…" indicator is shown; if the API takes > 2s an error shows "Something went wrong. Please try again." with a retry button

---
