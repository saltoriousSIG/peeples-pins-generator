import dotenv from "dotenv";
dotenv.config();
export const PORT = process.env.PORT || 8080;
export const AUTH_TOKEN = process.env.AUTH_TOKEN;

export type JsonSchema = {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
};

export const peeplesBadgeResponseFormat: JsonSchema = {
  type: "json_schema",
  json_schema: {
    name: "peeples_badge",
    strict: true,
    schema: {
      type: "object",
      properties: {
        seed: {
          type: "integer",
        },
        header: {
          type: "object",
          properties: {
            text: { type: "string" },
            fontColor: { type: "string" },
            fontEffect: {
              type: "string",
              enum: [
                "none",
                "embossed",
                "shadow-drop",
                "chrome-shine",
                "vintage-worn",
              ],
            },
          },
          required: ["text", "fontColor", "fontEffect"],
          additionalProperties: false,
        },
        donut: {
          type: "object",
          properties: {
            style: {
              type: "string",
              enum: [
                "classic-glazed",
                "old-fashioned",
                "boston-cream",
                "jelly-filled",
                "cruller",
                "bear-claw",
                "cake-donut",
                "french-cruller",
                "apple-fritter",
                "donut-hole-stack",
              ],
            },
            glaze: {
              type: "string",
              enum: [
                "pink-strawberry",
                "vanilla-white",
                "chocolate",
                "maple",
                "blueberry",
                "mint-green",
                "galaxy-swirl",
                "gold-metallic",
                "matcha",
                "none",
              ],
            },
            toppings: {
              type: "string",
              enum: [
                "rainbow-sprinkles",
                "chocolate-sprinkles",
                "crushed-oreo",
                "coconut-flakes",
                "pixel-bits",
                "bacon-bits",
                "nuts",
                "powdered-sugar",
                "cinnamon-sugar",
                "none",
              ],
            },
            drizzle: {
              type: "string",
              enum: [
                "none",
                "chocolate",
                "caramel",
                "white-chocolate",
                "strawberry",
              ],
            },
            special: {
              type: "string",
              enum: [
                "none",
                "8-bit-style",
                "holographic",
                "gold-leaf",
                "rainbow-sparkle",
              ],
            },
          },
          required: ["style", "glaze", "toppings", "drizzle", "special"],
          additionalProperties: false,
        },
        badge: {
          type: "object",
          properties: {
            material: {
              type: "string",
              enum: [
                "glossy-enamel",
                "matte-enamel",
                "holographic",
                "brushed-metal",
                "gold-chrome",
                "wood-grain",
                "recycled-paper",
                "leather",
                "frosted-glass",
                "carbon-fiber",
              ],
            },
            baseColor: { type: "string" },
            edgeStyle: {
              type: "string",
              enum: ["chrome", "gold", "bronze", "rainbow", "black-nickel"],
            },
          },
          required: ["material", "baseColor", "edgeStyle"],
          additionalProperties: false,
        },
        nameplate: {
          type: "object",
          properties: {
            username: { type: "string" },
            displayName: { type: "string" },
            backgroundColor: { type: "string" },
            fontFamily: {
              type: "string",
              enum: [
                "retro-script",
                "pixel-mono",
                "clean-sans",
                "typewriter",
                "handwritten",
                "bold-condensed",
                "neon-tubes",
                "stencil-military",
                "groovy-70s",
                "arcade-pixel",
                "western-slab",
                "art-deco-display",
              ],
            },
            fontColor: { type: "string" },
          },
          required: [
            "username",
            "displayName",
            "backgroundColor",
            "fontFamily",
            "fontColor",
          ],
          additionalProperties: false,
        },
        avatar: {
          type: "object",
          properties: {
            pfpDescription: { type: "string" },
            artStyle: {
              type: "string",
              enum: [
                "clean-vector",
                "pixel-art",
                "watercolor",
                "graffiti-street",
                "art-deco",
                "cyberpunk-neon",
                "soft-cartoon",
                "retro-mascot",
                "nouns-chunky",
              ],
            },
          },
          required: ["pfpDescription", "artStyle"],
          additionalProperties: false,
        },
        flairSlots: {
          type: "object",
          properties: {
            emptyColor: { type: "string" },
          },
          required: ["emptyColor"],
          additionalProperties: false,
        },
        lanyard: {
          type: "object",
          properties: {
            color: { type: "string" },
            material: {
              type: "string",
              enum: ["fabric", "satin", "chain", "pixel-ribbon", "leather"],
            },
          },
          required: ["color", "material"],
          additionalProperties: false,
        },
        background: {
          type: "object",
          properties: {
            color: { type: "string" },
          },
          required: ["color"],
          additionalProperties: false,
        },
        vibe: {
          type: "object",
          properties: {
            mood: {
              type: "string",
              enum: [
                "builder-focused",
                "degen-energy",
                "chill-vibes",
                "og-status",
                "artist-soul",
                "newcomer-fresh",
                "finance-bro",
                "pixel-punk",
                "nouns-cc0",
                "donut-maxi",
              ],
            },
            wear: {
              type: "string",
              enum: ["fresh", "well-used", "vintage", "pristine"],
            },
            rarity: {
              type: "string",
              enum: ["common", "uncommon", "rare", "legendary"],
            },
          },
          required: ["mood", "wear", "rarity"],
          additionalProperties: false,
        },
        nanoBananaPrompt: {
          type: "string",
        },
      },
      required: [
        "seed",
        "header",
        "donut",
        "badge",
        "nameplate",
        "avatar",
        "flairSlots",
        "lanyard",
        "background",
        "vibe",
        "nanoBananaPrompt",
      ],
      additionalProperties: false,
    },
  },
};
