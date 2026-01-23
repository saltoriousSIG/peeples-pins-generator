import axios from "axios";
import { Router } from "express";
import { VeniceClient } from "../clients/VeniceClient.js";
import { ReplicateClient } from "../clients/ReplicateClient.js";
import { PinataClient } from "../clients/PinataClient.js";
import { Messages } from "../clients/VeniceClient.js";
import { peeplesBadgeResponseFormat } from "../utils.js";
import authenticate from "../middleware/middleware.js";

const router = Router();

const BASE_TEMPLATE_URL = "https://replicate.delivery/pbxt/OObEh99quqdbeVpamO3N5pLGA4MG0vQba3KdEGF6jl3GLGWq/8e1bgm0fn5rmw0cvcr7aqkf304.jpg";

const PFP_ANALYZER_SYSTEM_PROMPT = `You create Peeples Donuts style cartoon character descriptions based on users' profile pictures and bios.

=== PEEPLES DONUTS CHARACTER STYLE ===
Reference the style guide images showing the Peeples universe:
- Friendly, warm cartoon characters with soft rounded features
- Big expressive eyes, warm smiles, rosy cheeks
- Full-bodied characters with personality and energy
- Anthropomorphic donuts with cute faces and limbs
- Warm inviting color palettes - cream, peach, coral, pastels, warm browns
- Playful community energy - characters look friendly and approachable
- Characters can hold props (donuts, tools, coins, gadgets)
- Think: friendly neighborhood donut shop employees and customers

=== YOUR TASK ===
Look at the user's PFP and bio, then create a CHARACTER description that:
1. Captures their visual identity from their PFP (colors, style, key features)
2. Reflects their vibe from their bio (builder, artist, degen, OG, etc.)
3. Includes personality through pose, expression, and props
4. Maintains the Peeples Donuts friendly cartoon aesthetic

=== VIBE DETECTION ===
Read the bio and determine their vibe:
- **Builders/engineers** → tool belt, wrench, laptop, maker energy
- **Degens/traders** → rocket, charts, high energy, crypto coins floating
- **OGs** (fid < 5000) → vintage vibes, wise, golden accessories
- **Artists/creatives** → paintbrush, palette, creative props
- **Pixel art PFP** → pixel-style character, retro gaming aesthetic
- **Crypto/web3** → floating ETH coins, blockchain elements
- **Nouns/CC0** → Nouns glasses ⌐◨-◨, bold colors
- **Martial arts/sports** → gi, athletic gear, disciplined pose
- **Chill/casual** → relaxed pose, coffee, laid-back energy

=== OUTPUT FORMAT ===
You MUST output valid JSON only, no other text:

{
  "character": "Full character description with appearance, outfit, pose, props, and energy - 30-50 words",
  "vibe": "5-10 word energy/personality summary",
  "pfpStyle": "contained | breaking-out",
  "artStyle": "pixel-art | soft-cartoon | clean-vector | retro-mascot"
}

**pfpStyle options:**
- "contained": Character fits neatly inside circular PFP (default, ~70% of badges)
- "breaking-out": Character partially extends beyond circle border for dynamic effect (~30% of badges)

**artStyle** should match the user's PFP style:
- If pixel art PFP → "pixel-art"
- If illustrated/cartoon PFP → "soft-cartoon" or "retro-mascot"
- If clean/modern PFP → "clean-vector"

=== EXAMPLES ===

**Input:** Pixel art ninja robot with cyan eyes + Bio: "builder, ninja, BJJ"
**Output:**
{"character": "Pixel-style ninja robot character with cyan glowing eyes and straw hat, wearing black gi with tool belt, holding wrench in one hand and sprinkled donut in other, confident stance with rosy cheeks", "vibe": "Technical ninja builder, disciplined maker", "pfpStyle": "contained", "artStyle": "pixel-art"}

**Input:** Photo of person in cowboy hat + Bio: "builder, AI researcher, donut dealer, BJJ purple belt"
**Output:**
{"character": "Cheerful cowboy builder with tan hat and short beard, wearing white gi with purple belt and tool belt over it, holding glazed donut triumphantly, warm smile with rosy cheeks, floating ETH coins and wrenches around him", "vibe": "Desert builder, frontier maker, martial artist", "pfpStyle": "breaking-out", "artStyle": "soft-cartoon"}

**Input:** Green frog character + Bio: "artist, donut lover, community builder"
**Output:**
{"character": "Friendly green frog character with big expressive eyes and wide smile, wearing donut-patterned apron, balancing tray of colorful donuts on head, sprinkles falling around, excited happy energy", "vibe": "Creative community artist, donut enthusiast", "pfpStyle": "breaking-out", "artStyle": "soft-cartoon"}

**Input:** Abstract geometric PFP + Bio: "crypto OG, early Farcaster adopter"
**Output:**
{"character": "Distinguished crypto elder with wise expression, wearing vintage leather jacket with golden donut pin, arms crossed confidently, subtle golden glow, floating vintage Farcaster logo nearby", "vibe": "Legendary OG, wise veteran", "pfpStyle": "contained", "artStyle": "clean-vector"}

=== CRITICAL RULES ===
- Output ONLY valid JSON, no markdown, no explanation
- Character should have PERSONALITY - pose, props, energy
- Extract visual style from their PFP (pixel art = pixel character, etc.)
- Include at least one donut-related element
- Keep warm, friendly Peeples aesthetic
- Use "breaking-out" style for dynamic/energetic vibes
- Match artStyle to the user's actual PFP style`;

const BADGE_GENERATOR_SYSTEM_PROMPT = `You generate JSON configurations for Peeples Donuts NFT badges.

You will receive a CHARACTER description, VIBE, PFP STYLE, and ART STYLE from the previous step. Your job is to:
1. Use the character description for the PFP area
2. Use the vibe to inform badge styling choices
3. Handle "breaking-out" style where character extends beyond PFP circle
4. Generate a nanoBananaPrompt that creates the EXACT layout shown in reference

=== CRITICAL LAYOUT REQUIREMENTS ===
The badge MUST match this EXACT layout (refer to reference image):

**BADGE SHAPE**: Wide HORIZONTAL rounded rectangle - wider than tall
**ASPECT RATIO**: 1:1 final output, but badge itself is horizontal/landscape orientation

**LAYOUT FROM TOP TO BOTTOM:**
1. LANYARD: Attached at top center
2. DONUT NOTCH: Small semicircle cutout at top center, pixel donut sits here
3. HEADER TEXT: "Peeples Donuts" in retro script, centered below donut
4. NAMEPLATE BAR: Horizontal rectangle containing:
   - LEFT SIDE: Circular PFP area with character
   - RIGHT SIDE: Username text
5. FLAIR HOLES: Exactly 3 small circular recessed holes at bottom edge, evenly spaced

**PFP STYLES:**
- "contained": Character fits inside circular PFP, clean border
- "breaking-out": Character dynamically extends beyond circle border - parts of character (hat, props, arms) break outside the circle for energetic effect. NO hard circle border visible.

=== MATERIALS (PHOTOREALISTIC) ===
Badge and lanyard must look like REAL physical objects with proper lighting/shadows.

Badge materials (match to vibe):
- **brushed-metal**: industrial, builders
- **glossy-enamel**: fun, playful
- **matte-enamel**: modern, chill
- **gold-chrome**: premium, OGs
- **wood-grain**: earthy, organic
- **leather**: vintage, premium
- **holographic**: degens, flashy
- **carbon-fiber**: tech, builders

Lanyard materials (VARY these - don't always use chain):
- **fabric**: casual, friendly (40% of badges)
- **satin**: elegant, artists (25%)
- **chain**: bold, OGs/builders (25%)
- **leather**: vintage, premium (10%)

=== COLOR GUIDANCE ===
**USE warm, friendly colors:**
- Cream, peach, coral, caramel, warm brown
- Soft pink, mint, butter yellow
- Navy, tan, olive for builders
- Gold, burgundy for OGs

**AVOID AI slop colors:**
- NO bright cyan + hot pink combos (unless degen vibe)
- NO purple backgrounds
- NO excessive neon

=== RARITY CALCULATION ===
Calculate based on:
- Base: random 0-100
- fid < 1000: +40
- fid < 10000: +20  
- fid < 100000: +10
- followers > 50000: +30
- followers > 10000: +20
- followers > 1000: +10

Result: 100+ = legendary, 70-99 = rare, 40-69 = uncommon, 0-39 = common

=== NANO BANANA PROMPT TEMPLATE ===

**For "contained" pfpStyle:**
"Product photography of a photorealistic employee ID badge matching reference template.

LAYOUT: Wide horizontal rounded rectangle badge (landscape within 1:1 frame). [LANYARD_MATERIAL] [LANYARD_COLOR] lanyard at top. Small notch with [DONUT_STYLE] pixel donut ([GLAZE] glaze, [TOPPINGS], kawaii face). 'Peeples Donuts' in retro script, [HEADER_COLOR], centered. 

NAMEPLATE: Horizontal bar with [NAMEPLATE_COLOR] background. LEFT SIDE: Circular PFP showing [CHARACTER_DESCRIPTION] in [ART_STYLE] style, contained within clean circular border. RIGHT SIDE: Username '[USERNAME]' in [FONT_STYLE] font.

Three recessed flair holes at bottom edge. Photorealistic [BADGE_MATERIAL] with [BASE_COLOR], [EDGE_STYLE] trim. Solid [BACKGROUND_COLOR] background. Professional product photography."

**For "breaking-out" pfpStyle:**
"Product photography of a photorealistic employee ID badge matching reference template.

LAYOUT: Wide horizontal rounded rectangle badge (landscape within 1:1 frame). [LANYARD_MATERIAL] [LANYARD_COLOR] lanyard at top. Small notch with [DONUT_STYLE] pixel donut ([GLAZE] glaze, [TOPPINGS], kawaii face). 'Peeples Donuts' in retro script, [HEADER_COLOR], centered.

NAMEPLATE: Horizontal bar with [NAMEPLATE_COLOR] background. LEFT SIDE: Dynamic character [CHARACTER_DESCRIPTION] in [ART_STYLE] style, character BREAKS OUTSIDE the circular PFP area - hat/props/arms extend beyond, NO visible circle border, energetic composition. RIGHT SIDE: Username '[USERNAME]' in [FONT_STYLE] font.

Three recessed flair holes at bottom edge. Photorealistic [BADGE_MATERIAL] with [BASE_COLOR], [EDGE_STYLE] trim. Solid [BACKGROUND_COLOR] background. Professional product photography."

=== JSON OUTPUT FORMAT ===
Return valid JSON with these fields:
{
  "rarity": "common|uncommon|rare|legendary",
  "donut": {
    "style": "classic-ring|old-fashioned|cruller|filled|twist|maple-bar",
    "glaze": "chocolate|vanilla|strawberry|maple|honey|rainbow|galaxy",
    "toppings": "sprinkles|nuts|coconut|bacon|oreo|none|pixel-bits"
  },
  "badge": {
    "material": "brushed-metal|glossy-enamel|matte-enamel|gold-chrome|wood-grain|leather|holographic|carbon-fiber",
    "baseColor": "warm color from palette",
    "edgeStyle": "chrome|gold|bronze|copper|silver"
  },
  "lanyard": {
    "material": "fabric|satin|chain|leather",
    "color": "color that complements badge"
  },
  "header": {
    "text": "Peeples Donuts",
    "fontColor": "color for header text",
    "fontEffect": "none|embossed|shadow-drop|chrome-shine|vintage-worn"
  },
  "nameplate": {
    "backgroundColor": "dark or cream color",
    "font": "bold-condensed|pixel-mono|retro-script|western-slab|arcade-pixel|art-deco-display|clean-sans",
    "fontColor": "contrasting color"
  },
  "avatar": {
    "characterDescription": "the full character description provided",
    "artStyle": "pixel-art|soft-cartoon|clean-vector|retro-mascot",
    "pfpStyle": "contained|breaking-out"
  },
  "background": "solid color - cream, charcoal, warm white, soft pink, mint, navy",
  "seed": number,
  "nanoBananaPrompt": "the full prompt built from template above"
}

=== STRICT RULES ===
- header.text MUST be "Peeples Donuts"
- PFP is on LEFT side of nameplate, username on RIGHT
- Use "breaking-out" template when pfpStyle is "breaking-out"
- Background MUST be solid color, no gradients
- seed = (fid * 1000) + random 3-digit number
- Character should have PERSONALITY - not a generic face`;

function buildPfpAnalyzerPrompt(user: any, fid: string): Messages {
  const location = user.profile?.location?.address
    ? `${user.profile.location.address.city || "Unknown"}, ${user.profile.location.address.state || "Unknown"}`
    : "Unknown";

  return [
    {
      role: "system",
      content: PFP_ANALYZER_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Here is the Peeples Donuts style reference. This is the aesthetic you should emulate for the face - friendly cartoon style with warm colors and expressive features:`,
        },
        {
          type: "image_url",
          image_url: {
            url: "https://res.cloudinary.com/dsrjjqkjs/image/upload/v1768252897/G7UeQPRXgAAwIkt_actowd.jpg",
          },
        },
        {
          type: "text",
          text: `Now analyze this user's PFP and create a character description for their badge.

**User Profile:**
- Username: ${user.username}
- Display Name: ${user.display_name}
- Bio: "${user.profile?.bio?.text || ""}"
- Location: ${location}
- Followers: ${user.follower_count}
- FID: ${fid}

Create a full character with personality - pose, props, energy. Match the art style to their PFP (pixel art = pixel character, etc.).

Output valid JSON only:
{"character": "...", "vibe": "...", "pfpStyle": "contained|breaking-out", "artStyle": "..."}`,
        },
        {
          type: "image_url",
          image_url: {
            url: user.pfp_url,
          },
        },
      ],
    },
  ];
}

interface CharacterResponse {
  character: string;
  vibe: string;
  pfpStyle: "contained" | "breaking-out";
  artStyle: "pixel-art" | "soft-cartoon" | "clean-vector" | "retro-mascot";
}

function parseCharacterResponse(response: string): CharacterResponse {
  const cleaned = response.replace(/```json\n?|```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned) as CharacterResponse;
  
  if (!parsed.character || !parsed.vibe) {
    throw new Error('Invalid response: missing character or vibe');
  }
  
  // Defaults if not provided
  parsed.pfpStyle = parsed.pfpStyle || "contained";
  parsed.artStyle = parsed.artStyle || "soft-cartoon";
  
  return parsed;
}

function buildBadgeGeneratorPrompt(user: any, fid: string, characterData: CharacterResponse): Messages {
  const location = user.profile?.location?.address
    ? {
        city: user.profile.location.address.city || "Unknown",
        state: user.profile.location.address.state || "Unknown",
      }
    : { city: "Unknown", state: "Unknown" };

  const bioText = (user.profile?.bio?.text || "").replace(/"/g, '\\"').replace(/\n/g, " ");

  return [
    {
      role: "system",
      content: BADGE_GENERATOR_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Here is the reference template showing the EXACT badge layout to match. Notice: horizontal badge shape, circular PFP on LEFT side of nameplate, username on RIGHT, three flair holes at bottom:",
        },
        {
          type: "image_url",
          image_url: {
            url: BASE_TEMPLATE_URL,
          },
        },
        {
          type: "text",
          text: `Generate a Peeples Donuts badge configuration for this user.

**User Data:**
\`\`\`json
{
  "fid": ${fid},
  "username": "${user.username}",
  "display_name": "${user.display_name}",
  "profile": {
    "bio": {
      "text": "${bioText}"
    },
    "location": {
      "address": {
        "city": "${location.city}",
        "state": "${location.state}"
      }
    }
  },
  "follower_count": ${user.follower_count}
}
\`\`\`

**Character Description:**
${characterData.character}

**Vibe:** ${characterData.vibe}

**PFP Style:** ${characterData.pfpStyle}
${characterData.pfpStyle === "breaking-out" ? "- Character should dynamically extend beyond the circular PFP border for energetic effect" : "- Character fits neatly inside the circular PFP area"}

**Art Style:** ${characterData.artStyle}

**CRITICAL LAYOUT REQUIREMENTS:**
1. Badge shape is HORIZONTAL (wider than tall) - match reference template
2. PFP circle is on the LEFT side of the nameplate
3. Username text is on the RIGHT side of the nameplate  
4. Three flair holes at the bottom
5. The character goes in the small circular PFP area - NOT as a large illustration taking over the badge

Generate the JSON configuration with all fields including the nanoBananaPrompt.`,
        },
      ],
    },
  ];
}

router.get("/:fid", authenticate, async (req, res) => {
  try {
    const { fid } = req.params;

    if (!fid || !Number(fid)) {
      return res.status(400).json({ error: "FID parameter is required" });
    }

    const veniceClient = new VeniceClient();
    const replicateClient = new ReplicateClient();
    const pinataClient = PinataClient.getInstance();

    // Fetch user data from Neynar
    const {
      data: { users },
    } = await axios.get(
      `https://api.neynar.com/v2/farcaster/user/bulk/?fids=${fid}`,
      {
        headers: {
          "x-api-key": process.env.NEYNAR_API_KEY,
        },
      }
    );

    if (!users || users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    // Step 1: Generate character description from PFP and profile
    const pfpAnalyzerPrompt = buildPfpAnalyzerPrompt(user, fid);
    const characterDescriptionResponse = await veniceClient.makeTextGeneration(
      pfpAnalyzerPrompt,
      0.6
    );
    
    // Parse the response to extract character data
    const characterData = parseCharacterResponse(characterDescriptionResponse.result);

    console.log("Character:", characterData.character);
    console.log("Vibe:", characterData.vibe);
    console.log("PFP Style:", characterData.pfpStyle);
    console.log("Art Style:", characterData.artStyle);

    // Step 2: Generate badge configuration JSON
    const badgeGeneratorPrompt = buildBadgeGeneratorPrompt(user, fid, characterData);
    const badgeConfigResponse = await veniceClient.makeTextGeneration(
      badgeGeneratorPrompt,
      0.7,
      peeplesBadgeResponseFormat
    );
    const badgeConfigJson = JSON.parse(badgeConfigResponse.result);

    console.log("Badge Config:", JSON.stringify(badgeConfigJson, null, 2));

    // Step 3: Generate image with Nano Banana
    const pfpImageUrl = await replicateClient.generate(
      JSON.stringify(badgeConfigJson),
      BASE_TEMPLATE_URL
    );

    console.log("Generated PFP Image URL:", pfpImageUrl);

    //upload to pinata and get the cid;
    const uploadResponse = await pinataClient.uploadImage(pfpImageUrl, user.username);

    res.status(200).json({
      imageUrl: pfpImageUrl,
      characterData: characterData,
      badgeConfig: badgeConfigJson,
      pinataCid: uploadResponse.cid,
    });
  } catch (error) {
    console.error("Error generating PFP:", error);
    res.status(500).json({ error: "Failed to generate PFP" });
  }
});

export default router;
