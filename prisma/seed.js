import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const initialProducts = [
  {
    slug: "spring-blade",
    name: "Men's Moss Stitch Cardigan",
    price: 50,
    image: "/products/spring-blade.jpg",
    category: "men",
    description: "Hand-knitted from locally sourced wool using a textured moss stitch pattern. The relaxed silhouette drapes naturally, with hand-carved wooden buttons and ribbed cuffs for a refined finish.",
  },
  {
    slug: "classic-set",
    name: "Men's Cable Knit Sweater",
    price: 50,
    image: "/products/classic-set.jpg",
    category: "men",
    description: "A timeless cable knit pullover crafted from undyed heritage wool. Each twist and braid is worked by hand, creating a rich surface texture that softens beautifully with wear.",
  },
  {
    slug: "country-feast-set",
    name: "Women's Merino Scarf Set",
    price: 50,
    image: "/products/country-feast-set.jpg",
    category: "women",
    description: "A coordinated set of two generously sized scarves in complementary earth tones. Knitted from extra-fine merino for a soft hand feel, with hand-twisted fringe detailing.",
  },
  {
    slug: "earth-sky-planter",
    name: "Kids' Alpaca Beanie",
    price: 40,
    originalPrice: 50,
    image: "/products/earth-sky-planter.jpg",
    badge: "sale",
    category: "kids",
    description: "A cozy ribbed beanie knitted from a baby alpaca and wool blend. Lightweight yet warm, with a gently slouched crown and folded brim that fits all head sizes.",
  },
  {
    slug: "golden-blush-cup",
    name: "Women's Ribbed Wool Vest",
    price: 50,
    image: "/products/golden-blush-cup.jpg",
    category: "women",
    description: "A versatile layering piece in a deep rib knit, crafted from medium-weight lambswool. The V-neck and clean armholes make it perfect over a shirt or worn alone in warmer months.",
  },
  {
    slug: "harvest-moon-cup",
    name: "Men's Chunky Pullover",
    price: 50,
    image: "/products/harvest-moon-cup.jpg",
    availability: "Only 4 available",
    category: "men",
    description: "Our most substantial knit — a chunky-gauge pullover worked in a bold herringbone pattern. Made from hand-dyed wool in our signature rust colorway, with dropped shoulders and a relaxed fit.",
  },
  {
    slug: "milk-dip-cup",
    name: "Women's Cashmere Wrap",
    price: 50,
    image: "/products/milk-dip-cup.jpg",
    category: "women",
    description: "An oversized wrap knitted from pure Mongolian cashmere in a delicate stockinette stitch. Finished with a subtle fringe edge, this piece is as soft as it is elegant.",
  },
  {
    slug: "salt-spout",
    name: "Kids' Heritage Mittens",
    price: 50,
    image: "/products/salt-spout.jpg",
    badge: "sold-out",
    category: "kids",
    description: "Traditional stranded colourwork mittens inspired by Nordic knitting heritage. Knitted from sturdy Shetland wool in natural undyed shades for a piece that tells a story.",
  },
  {
    slug: "golden-mist-pair",
    name: "Handwoven Leather Sandals",
    price: 50,
    image: "/products/golden-mist-pair.jpg",
    category: "footwear",
    description: "Open-toe sandals with hand-braided vegetable-tanned leather straps on a stitched cork footbed. Molded by wear, they age into a personal fit unique to every step.",
  },
  {
    slug: "atelier-loafers",
    name: "Atelier Suede Loafers",
    price: 120,
    image: "/products/salt-spout.jpg",
    category: "footwear",
    description: "Soft suede penny loafers with a hand-stitched apron toe and leather sole. Understated, versatile, and made to be worn barefoot in warmer months.",
  },
  {
    slug: "linen-play-set",
    name: "Kids' Linen Play Set",
    price: 65,
    image: "/products/spring-blade.jpg",
    category: "kids",
    description: "A breathable two-piece set in washed linen. Elasticated waist, roomy fit, and reinforced knees for full days of play.",
  }
];

async function seed() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log("Connected to database. Seeding products...");

    // Clear existing products
    await client.query('DELETE FROM "Product";');
    console.log("Deleted existing products.");

    for (const p of initialProducts) {
      await client.query(
        `INSERT INTO "Product" (id, slug, name, price, "originalPrice", image, description, badge, availability, category)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9);`,
        [p.slug, p.name, p.price, p.originalPrice || null, p.image, p.description, p.badge || null, p.availability || null, p.category]
      );
      console.log(`Seeded: ${p.name}`);
    }

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Seeding error:", error);
  } finally {
    await client.end();
  }
}

seed();
