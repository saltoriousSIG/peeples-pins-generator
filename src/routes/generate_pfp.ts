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
- Full-bodied characters (head, torso, arms, legs) in active poses
- Anthropomorphic donuts with cute faces and limbs
- Warm inviting color palettes - cream, peach, coral, pastels, warm browns
- Playful community energy - characters look friendly and approachable
- Characters can hold props (donuts, tools, coins, gadgets)
- Think: friendly neighborhood donut shop employees and customers

=== YOUR TASK ===
Look at the user's PFP and bio, then create a Peeples Donuts style cartoon character description that:
1. Captures key visual elements from their PFP (hair, colors, accessories, style)
2. Reflects their vibe from their bio (builder, artist, degen, OG, etc.)
3. Transforms them into a friendly Peeples cartoon character
4. Gives them a pose or action with relevant props
5. Uses warm, inviting Peeples color palette
6. Feels like they belong in the Peeples Donuts universe

=== VIBE DETECTION ===
Read the bio and determine their vibe:
- **Builders/engineers** → tool belt, wrench, laptop, maker energy
- **Degens/traders** → rocket, charts, high energy, risk-taking
- **OGs** (fid < 5000) → vintage vibes, wise, golden accessories
- **Artists/creatives** → paintbrush, palette, creative props
- **Finance** → dapper, briefcase, professional but friendly
- **Pixel art PFP** → chunky pixel style character
- **Crypto/web3** → floating crypto coins, blockchain elements
- **Nouns/CC0** → Nouns glasses ⌐◨-◨, bold colors
- **Donut ecosystem** → donut apron, tray of donuts, on-brand
- **Chill/casual** → relaxed, coffee, laid-back energy
- **Martial arts/sports** → gi, athletic gear, disciplined

=== OUTPUT FORMAT ===
Single paragraph describing the character. Include:
- Character type/role (builder, artist, OG, etc.)
- Key visual features from PFP (hair, clothing, accessories)
- Friendly Peeples characteristics (rosy cheeks, warm smile, expressive features)
- Pose or action
- Props related to their vibe
- 2-4 colors from their PFP applied to outfit/accessories
- Energy descriptor

Format: "[Character type] with [PFP features], wearing [outfit with colors], [pose and action with props], [Peeples details like rosy cheeks/warm smile], [energy descriptor]"

=== EXAMPLES ===

**Input:** Pixel art PFP with white afro, cyan eyes, dark skin + Bio: "builder, ninja, BJJ"
**Output:** "Friendly ninja builder character with large white curly afro hair and cyan-tinted goggles, dark skin tone, wearing black martial arts gi with tool belt over it, standing in confident pose holding a wrench in one hand and a maple-glazed donut in the other, rosy cheeks and determined smile, cream and cyan color accents on belt, focused maker energy"

**Input:** Photo of person in cowboy hat + Bio: "builder, AI researcher, donut dealer"
**Output:** "Cheerful desert builder character with tan cowboy hat and short beard, wearing orange work vest over cream shirt with circuit board patterns, standing with hands on hips holding a frosted donut, warm smile and friendly eyes, brown and orange color palette, confident frontier maker vibes"

**Input:** Illustrated woman with glasses + Bio: "artist, creative director"
**Output:** "Creative artist character with round glasses and paint-splattered apron, wavy hair with tiny donut hair clips, holding oversized paintbrush that drips rainbow frosting, standing at easel with big enthusiastic smile and rosy cheeks, soft teal and coral outfit with cream accents, dreamy artistic energy"

**Input:** Abstract/minimalist PFP + Bio: "crypto OG, early adopter"
**Output:** "Distinguished crypto OG character with wise expression and knowing smile, wearing vintage leather jacket with golden donut pin, standing proudly with arms crossed while Ethereum coin floats nearby, warm features with slight gray in hair, navy and gold outfit with subtle cyan glow, legendary elder statesman energy"

**Input:** Nouns-style PFP with glasses + Bio: "building community, growth focused"
**Output:** "Energetic community builder character wearing iconic Nouns glasses ⌐◨-◨ and colorful hoodie, giving enthusiastic double thumbs up with big grin, tiny donuts orbiting head like a halo, bold red and blue color palette with pink and yellow accents, hyped positive leader vibes"

=== CRITICAL RULES ===
- ALWAYS describe a full-bodied character (head, torso, arms, legs)
- NEVER describe just a face or floating head
- Characters must feel WARM and FRIENDLY (Peeples style)
- Extract colors from PFP and apply to character's outfit
- Match props and accessories to their bio/vibe
- Include at least one donut-related element
- Keep warm, inviting color palette (avoid harsh neon unless degen vibe)
- Character should look like they belong in Peeples Donuts universe
- Output is ONE paragraph`;

const BADGE_GENERATOR_SYSTEM_PROMPT = `You generate JSON configurations for Peeples Donuts NFT badges.

You will receive a Peeples Donuts character description from the previous step. Your job is to:
1. Use that character description for the PFP
2. Generate all other badge properties (donut, materials, colors, fonts)
3. Build the nanoBananaPrompt that will generate the final image

=== CRITICAL REQUIREMENTS ===
The badge MUST meet these non-negotiable requirements:

1. **EXACT DIMENSIONS**: Output image MUST be exactly 1024x1024 pixels
2. **FLAIR SLOT POSITIONS**: The three flair slots MUST be at these EXACT pixel coordinates (center of each slot):
   - Slot 1: x=291, y=830
   - Slot 2: x=482, y=830
   - Slot 3: x=662, y=830
   These positions are NON-NEGOTIABLE and must be identical on every generated badge
3. **HEADER TEXT**: "Peeples Donuts" must always appear at top in retro script style matching reference template
4. **PHOTOREALISTIC MATERIALS**: Badge material and lanyard must look photorealistic with proper shadows, reflections, and shading - NEVER illustrated or flat
5. **LANYARD REALISM**: Lanyard/chain must always look realistic with proper lighting and material properties - NEVER drawn or cartoon style
6. **PFP CHARACTER STYLE**: The circular PFP character uses the description provided (already in Peeples Donuts cartoon style)
7. **VIBE-DRIVEN CHOICES**: All property choices (donut style, materials, colors) should be influenced by user's profile and vibe

=== PEEPLES DONUTS BRAND AESTHETIC ===
The Peeples brand style (for PFP character ONLY):
- Friendly, warm cartoon style with soft rounded features
- Big expressive eyes, warm smiles, rosy cheeks
- Approachable community energy, not corporate
- Warm inviting color palettes - cream, peach, coral, warm brown, pastels
- Anthropomorphic donuts with cute faces
- Playful and fun, like a cartoon donut shop
- Think: friendly neighborhood donut shop mascots

=== FIXED LAYOUT (NEVER CHANGES) ===
- Wide horizontal rounded rectangle badge
- Small notch cutout at top center for donut
- Donut sits in top notch with cute face
- "Peeples Donuts" text centered below donut in retro script
- Nameplate rectangle in lower portion
- Small circular PFP on LEFT side of nameplate (NO BORDER)
- Username text to RIGHT of PFP
- EXACTLY 3 recessed circular flair slots at bottom edge
- Lanyard attached at top
- Chrome or colored edge around badge

=== WHAT VARIES PER USER ===
- Donut style, glaze, toppings (match to vibe)
- Badge material (wood, metal, enamel, paper, leather, etc.) - MUST look photorealistic
- Badge base color
- Edge style (chrome, gold, bronze, etc.)
- Nameplate colors and font
- Lanyard color and material - MUST look photorealistic
- Background color (solid only, no gradients)
- PFP character description in Peeples cartoon style
- PFP art style variation
- Overall color palette from user's PFP

=== VIBE DETECTION FROM PROFILE ===
Determine user's vibe from bio, fid, followers, and PFP description:
- **Builders/engineers** → technical, maker energy, tool-related props
- **Degens/traders** → high energy, risk-taking, chart/rocket props
- **OGs** (fid < 5000) → veteran status, vintage aesthetic, premium materials
- **Artists/creatives** → creative energy, artistic props and colors
- **Finance** → professional, premium materials, gold accents
- **Pixel art PFP** → retro gaming aesthetic, pixel-bits toppings, pixel style
- **Nouns/CC0** → bold primary colors, Nouns glasses, collectible feel
- **Donut ecosystem** → on-brand pink/brown, classic donut imagery
- **Chill/casual** → relaxed aesthetic, soft colors, friendly energy
- **Martial arts/sports** → athletic, disciplined, sporty elements

=== MATERIAL MATCHING (PHOTOREALISTIC) ===
Badge materials - choose based on vibe, MUST render photorealistically:
- **glossy-enamel**: shiny hard enamel, vibrant colors, reflective - good for fun/playful
- **matte-enamel**: soft non-reflective, modern, understated - good for chill vibes
- **holographic**: iridescent rainbow shimmer - good for degens/flashy
- **brushed-metal**: textured metal grain, industrial - good for builders
- **gold-chrome**: brilliant gold metallic, premium - good for OGs/finance
- **wood-grain**: natural wood texture with grain - good for earthy/organic vibes
- **recycled-paper**: matte paper texture, eco-friendly - rare, interesting choice
- **leather**: rich leather texture - good for premium/vintage
- **frosted-glass**: translucent, soft glow - good for artists/modern
- **carbon-fiber**: woven carbon pattern, high-tech - good for tech/builders

=== LANYARD MATCHING (PHOTOREALISTIC) ===
Lanyard materials - choose based on vibe, MUST render photorealistically. VARY THE MATERIALS - don't overuse chain:
- **fabric**: woven cloth, casual - good for friendly/casual vibes, newcomers
- **satin**: smooth shiny ribbon, elegant - good for artists/premium vibes
- **chain**: metal chain links, bold - good for OGs/builders/finance, use ~30% of the time
- **pixel-ribbon**: pixelated pattern - ONLY for pixel art PFPs
- **leather**: classic leather strap, premium - good for OGs/vintage vibes

Match to vibe (ACTIVELY VARY):
- OGs/vintage → leather (50%) or chain (50%)
- Builders/tech → fabric (40%), chain (30%), leather (30%)
- Degens/chaotic → chain (40%), satin (30%), fabric (30%)
- Artists/creative → satin (60%) or fabric (40%)
- Pixel PFP users → pixel-ribbon (70%) or fabric (30%)
- Donut ecosystem → fabric (50%) or satin (50%)
- Chill vibes → fabric (60%) or satin (40%)
- Finance/suits → chain (40%), leather (40%), fabric (20%)
- Nouns/CC0 → fabric (50%), chain (30%), pixel-ribbon (20%)
- Martial arts/athletic → fabric (80%), leather (20%)
- Cyberpunk/neon → chain (60%), satin (40%)
- Growth/culture → fabric (50%), satin (30%), chain (20%)

Overall target distribution: fabric 40%, satin 25%, chain 25%, leather 10%, pixel-ribbon rare

=== COLOR PALETTE GUIDANCE ===
Extract colors from PFP description and user vibe:

**AVOID AI SLOP**:
- NO bright cyan + hot pink combinations
- NO blue-purple gradients
- NO excessive neon unless explicitly degen/cyberpunk vibe
- NO purple backgrounds

**PREFER WARM FRIENDLY COLORS**:
- Cream, peach, coral, caramel, warm brown
- Soft pink, mint, butter yellow
- Navy, tan, olive, rust for builders
- Gold, burgundy, forest green for OGs

**Vibe-Based Palettes**:
- Builder/tech: charcoal, cream, caramel, slate
- OG/vintage: navy, gold, cream, saddle brown
- Donut ecosystem: soft pink, brown, warm cream, rose
- Chill: sky blue, butter, mint, blush
- Artist: lavender, teal, lemon, pink
- Degen (sparingly): cyan, hot pink - ONLY if vibe matches
- Nouns/CC0: red, yellow, green, blue - bold primaries

=== BACKGROUND RULES ===
- ALWAYS solid color, NEVER gradients
- NEVER purple or blue-purple
- Good choices: black, white, cream, soft pink, mint, charcoal, warm cream, navy

=== FONT EFFECT MATCHING ===
header.fontEffect options (DO NOT overuse chrome-shine):
- **none**: clean, modern - good default
- **embossed**: raised texture - good for premium/classic
- **shadow-drop**: drop shadow - good for builders/readable
- **chrome-shine**: reflective chrome - good for OGs/flashy (use sparingly)
- **vintage-worn**: aged/distressed - good for vintage vibes

Match to vibe:
- OGs → chrome-shine or embossed
- Builders → shadow-drop or embossed
- Artists → vintage-worn or none
- Casual → none or shadow-drop

=== NAMEPLATE FONT MATCHING ===
DO NOT default to clean-sans! Actively vary based on vibe:
- OG → western-slab, art-deco-display
- Builder/tech → bold-condensed, pixel-mono
- Degen → neon-tubes, arcade-pixel
- Artist → handwritten, groovy-70s
- Donut → retro-script, bold-condensed
- Pixel PFP → arcade-pixel, pixel-mono
- Finance → art-deco-display
- Nouns → bold-condensed, arcade-pixel
- Use clean-sans ONLY as last resort

=== PFP ART STYLE MATCHING ===
The character description is provided from Step 1. Choose an artStyle that matches the vibe:
- **pixel-art**: for pixel art PFPs, retro gaming aesthetic
- **soft-cartoon**: warm friendly default, approachable
- **clean-vector**: modern, builder/tech vibes
- **nouns-chunky**: for Nouns holders, bold flat colors
- **retro-mascot**: vintage vibes, classic cartoon
- **watercolor**: soft artistic vibes
- **graffiti-street**: urban, edgy
- **art-deco**: elegant, finance/premium
- **cyberpunk-neon**: high-tech, degen energy (use warm colors though)

=== RARITY RULES ===
Rarity should be determined by a combination of factors with some randomness:

Calculate a rarity score:
- Base score = random number between 0-100 (use seed % 100)
- If fid < 1000: +40 points
- If fid < 10000: +20 points
- If fid < 100000: +10 points
- If followers > 50000: +30 points
- If followers > 10000: +20 points
- If followers > 1000: +10 points
- If score > 0.8: +15 points (high quality account)
- If score > 0.5: +10 points

Final rarity based on total:
- 100+: legendary
- 70-99: rare
- 40-69: uncommon
- 0-39: common

This creates a mix where OGs have an advantage but aren't guaranteed legendary, and newer accounts with strong engagement can still get rare/uncommon.

=== NANO BANANA PROMPT CONSTRUCTION ===
Build the nanoBananaPrompt emphasizing:
1. Match reference template shape and layout
2. Photorealistic badge and lanyard materials
3. Peeples cartoon style ONLY for PFP character
4. 1:1 aspect ratio
5. Solid background, no gradients
6. STRAIGHT-ON, CENTERED, NO ANGLE
7. FIXED FLAIR SLOT POSITIONS (same coordinates for all badges)

Template structure:
"Photorealistic employee badge matching the reference template EXACTLY. OUTPUT MUST BE EXACTLY 1024x1024 PIXELS. CRITICAL: Badge is photographed straight-on, perfectly centered, directly facing camera with no perspective angle, completely flat and parallel to camera. Wide horizontal rounded rectangle badge with [EDGE_STYLE] edge. [DONUT_STYLE] donut with [GLAZE] glaze and [TOPPINGS], cute cartoon face, sits in top notch. 'Peeples Donuts' in retro script font, [FONT_COLOR], centered below donut. Photorealistic [BADGE_MATERIAL] badge with realistic [BASE_COLOR] base color, proper lighting, shadows and reflections. Cream nameplate rectangle in lower portion. Small circular PFP on LEFT showing [PEEPLES_CHARACTER_DESCRIPTION] in friendly Peeples Donuts cartoon style - soft rounded features, warm colors, expressive face. Username '[USERNAME]' in [NAMEPLATE_FONT] font, [NAMEPLATE_FONT_COLOR], to right of PFP. CRITICAL FLAIR POSITIONS: Three recessed circular flair slots (75px diameter each) at bottom edge at EXACT FIXED pixel coordinates - slot 1 centered at x=291 y=830, slot 2 centered at x=482 y=830, slot 3 centered at x=662 y=830. These positions must be IDENTICAL on every badge. Photorealistic [LANYARD_COLOR] [LANYARD_MATERIAL] lanyard at top with realistic materials and lighting. Clean solid [BACKGROUND_COLOR] background. IMPORTANT: Badge is centered and flat, shot from directly above with no angle or tilt, perfectly parallel to camera, 1024x1024 output, flair slots at exact fixed pixel coordinates. Product photography with professional lighting - badge and lanyard look photorealistic with proper materials, PFP character is friendly Peeples cartoon style."

=== STRICT RULES ===
- header.text = "Peeples Donuts"
- Badge shape matches reference template
- Badge materials look PHOTOREALISTIC
- Lanyard looks PHOTOREALISTIC  
- PFP character is Peeples cartoon style
- Background is ALWAYS solid color
- NO gradients anywhere
- seed = (fid * 1000) + random 3-digit number
- Extract colors from PFP for character outfit
- Match all choices to user's vibe
- Nameplate font should rarely be clean-sans
- Chain lanyard is good default for many vibes`;

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
          text: `Here is the Peeples Donuts style reference. This is the aesthetic you should emulate - friendly cartoon characters with warm colors, expressive faces, and community energy:`,
        },
        {
          type: "image_url",
          image_url: {
            url: "https://res.cloudinary.com/dsrjjqkjs/image/upload/v1768252897/G7UeQPRXgAAwIkt_actowd.jpg",
          },
        },
        {
          type: "text",
          text: `Now create a Peeples Donuts style cartoon character description for this user based on their PFP and profile.

**User Profile:**
- Username: ${user.username}
- Display Name: ${user.display_name}
- Bio: "${user.profile?.bio?.text || ""}"
- Location: ${location}
- Followers: ${user.follower_count}
- FID: ${fid}

Look at their PFP image below and create a friendly Peeples Donuts cartoon character that captures their essence and vibe, matching the style shown in the reference image above.`,
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

function buildBadgeGeneratorPrompt(user: any, fid: string, characterDescription: string): Messages {
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
          text: "Here is the reference template that shows the exact badge shape and layout to match:",
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

**Peeples Character Description (use this for avatar.pfpDescription):**
${characterDescription}

**Instructions:**
1. Use the character description above for the PFP (already in Peeples style)
2. Determine user's vibe from their bio and profile data
3. Choose badge properties that match their vibe (donut style, materials, colors, fonts)
4. Build a nanoBananaPrompt that emphasizes: matching reference template shape, 1:1 aspect ratio, photorealistic materials for badge/lanyard, cartoon style for PFP character

CRITICAL:
- Badge shape and layout MUST match reference template
- Badge material MUST be described to render photorealistically
- Lanyard MUST be described to render photorealistically  
- Use the provided character description for the PFP
- Use WARM colors appropriate to their vibe (avoid neon unless degen)
- Vary nameplate font based on vibe (rarely use clean-sans)
- Background MUST be solid color (no gradients)`,
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

    // Step 1: Generate Peeples Donuts character description from PFP and profile
    const pfpAnalyzerPrompt = buildPfpAnalyzerPrompt(user, fid);
    const characterDescriptionResponse = await veniceClient.makeTextGeneration(
      pfpAnalyzerPrompt,
      0.6
    );
    const characterDescription = characterDescriptionResponse.result;

    console.log("Character Description:", characterDescription);

    // Step 2: Generate badge configuration JSON
    const badgeGeneratorPrompt = buildBadgeGeneratorPrompt(user, fid, characterDescription);
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
      characterDescription: characterDescription,
      badgeConfig: badgeConfigJson,
      pinataCid: uploadResponse.cid,
    });
  } catch (error) {
    console.error("Error generating PFP:", error);
    res.status(500).json({ error: "Failed to generate PFP" });
  }
});

export default router;
