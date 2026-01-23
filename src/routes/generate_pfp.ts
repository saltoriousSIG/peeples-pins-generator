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
- Anthropomorphic donuts with cute faces and limbs
- Warm inviting color palettes - cream, peach, coral, pastels, warm browns
- Playful community energy - characters look friendly and approachable
- Think: friendly neighborhood donut shop employees and customers

=== YOUR TASK ===
Look at the user's PFP and bio, then create TWO descriptions:

1. **face** (for the small badge PFP - MAX 20 words): 
   - ONLY head/face features: hair style, hair color, skin tone, facial expression, glasses, hat, facial hair
   - NO body, NO pose, NO props, NO actions, NO full character
   - This will be rendered as a TINY thumbnail, so only visible facial features matter

2. **vibe** (for badge styling - MAX 10 words):
   - Their energy/personality in a few words for badge material/color choices

=== VIBE DETECTION ===
Read the bio and determine their vibe:
- **Builders/engineers** → maker energy, technical
- **Degens/traders** → high energy, risk-taking
- **OGs** (fid < 5000) → vintage vibes, wise
- **Artists/creatives** → creative, artistic
- **Pixel art PFP** → retro, pixelated style
- **Crypto/web3** → blockchain focused
- **Nouns/CC0** → bold colors, collectible
- **Chill/casual** → relaxed, laid-back
- **Martial arts/sports** → disciplined, athletic

=== OUTPUT FORMAT ===
You MUST output valid JSON only, no other text:

{
  "face": "15-20 word description of face/head ONLY - hair, skin, expression, accessories on head",
  "vibe": "5-10 word energy/personality summary"
}

=== EXAMPLES ===

**Input:** Pixel art PFP with white afro, cyan eyes, dark skin + Bio: "builder, ninja, BJJ"
**Output:**
{"face": "Friendly face with large white curly afro, dark skin, cyan-tinted goggles on forehead, warm determined smile, rosy cheeks", "vibe": "Technical ninja builder, maker energy, disciplined"}

**Input:** Photo of person in cowboy hat + Bio: "builder, AI researcher, donut dealer"
**Output:**
{"face": "Cheerful face with tan cowboy hat, short brown beard, friendly eyes, warm genuine smile, light skin", "vibe": "Desert builder, frontier maker, friendly professional"}

**Input:** Illustrated woman with glasses + Bio: "artist, creative director"
**Output:**
{"face": "Creative face with round glasses, wavy auburn hair with tiny donut hair clips, big enthusiastic smile, rosy cheeks", "vibe": "Artistic dreamer, creative energy, warm"}

**Input:** Robot/pixel character PFP + Bio: "crypto OG, early adopter"
**Output:**
{"face": "Pixel-style robot face with glowing cyan eyes, metallic gray head, friendly LED smile, antenna on top", "vibe": "Crypto OG, legendary veteran, wise elder"}

=== CRITICAL RULES ===
- Output ONLY valid JSON, no markdown, no explanation
- face description is for a TINY circular thumbnail - only describe what's visible in a small headshot
- NO full body descriptions in face
- NO poses or actions in face
- NO props being held in face (only worn accessories like hats/glasses)
- Extract key colors from PFP for the face description
- Keep face under 25 words maximum
- Keep vibe under 12 words maximum`;

const BADGE_GENERATOR_SYSTEM_PROMPT = `You generate JSON configurations for Peeples Donuts NFT badges.

You will receive a FACE description and VIBE summary from the previous step. Your job is to:
1. Use the FACE description for the tiny PFP thumbnail
2. Use the VIBE to inform badge styling choices
3. Generate a nanoBananaPrompt that creates the EXACT layout shown in reference

=== CRITICAL LAYOUT REQUIREMENTS ===
The badge MUST match this EXACT layout (refer to reference image):

**BADGE SHAPE**: Wide HORIZONTAL rounded rectangle - wider than tall
**ASPECT RATIO**: 1:1 final output, but badge itself is horizontal/landscape orientation within that square

**LAYOUT FROM TOP TO BOTTOM:**
1. LANYARD: Attached at top center
2. DONUT NOTCH: Small semicircle cutout at top center, pixel donut sits here
3. HEADER TEXT: "Peeples Donuts" in retro script, centered below donut
4. NAMEPLATE BAR: Horizontal rectangle containing:
   - LEFT SIDE: Small circular PFP (THUMBNAIL - just a face, like a passport photo)
   - RIGHT SIDE: Username text
5. FLAIR HOLES: Exactly 3 small circular recessed holes at bottom edge, evenly spaced

**WHAT THE PFP IS NOT:**
- NOT a large illustration
- NOT a full-body character
- NOT a scene with background
- NOT a trading card image
- It's a TINY circular headshot, like a profile picture or passport photo

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
- NO bright cyan + hot pink combos
- NO purple backgrounds
- NO excessive neon (unless degen vibe)

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
Use this EXACT structure, filling in the bracketed values:

"Product photography of a photorealistic employee ID badge. CRITICAL: This is an ID BADGE, not a trading card.

EXACT LAYOUT (match reference template):
- Wide horizontal rounded rectangle badge shape (landscape orientation within 1:1 frame)
- [LANYARD_MATERIAL] [LANYARD_COLOR] lanyard attached at top center
- Small notch at top center with [DONUT_STYLE] pixel donut ([GLAZE] glaze, [TOPPINGS], cute kawaii face)
- 'Peeples Donuts' text in retro script font, [HEADER_COLOR], centered below donut
- Horizontal nameplate bar in lower portion with [NAMEPLATE_COLOR] background
- TINY circular PFP on LEFT side of nameplate (PASSPORT PHOTO SIZE - just head/face): [FACE_DESCRIPTION] in friendly Peeples cartoon style
- Username '[USERNAME]' in [FONT_STYLE] font on RIGHT side of nameplate
- Three small recessed circular flair holes at bottom edge, evenly spaced horizontally

MATERIALS: Photorealistic [BADGE_MATERIAL] badge with [BASE_COLOR] base, [EDGE_STYLE] metallic edge trim. Real materials with proper shadows, reflections, lighting.

CRITICAL CONSTRAINTS:
- PFP is THUMBNAIL SIZE (like passport photo) - shows ONLY head and face, no body
- Badge is horizontal/landscape shape, NOT vertical, NOT square
- This is an employee ID badge, NOT an illustrated trading card
- NO scene or background inside the badge
- NO full-body character illustration
- Solid [BACKGROUND_COLOR] background behind badge
- Badge photographed flat, straight-on, centered, no angle

Professional product photography, studio lighting, photorealistic badge materials, cartoon style ONLY for the tiny PFP face."

=== JSON OUTPUT FORMAT ===
Return valid JSON with these fields:
{
  "rarity": "common|uncommon|rare|legendary",
  "donut": {
    "style": "classic-ring|old-fashioned|cruller|filled|twist|maple-bar",
    "glaze": "chocolate|vanilla|strawberry|maple|honey|rainbow",
    "toppings": "sprinkles|nuts|coconut|bacon|oreo|none"
  },
  "badge": {
    "material": "brushed-metal|glossy-enamel|matte-enamel|gold-chrome|wood-grain|leather|holographic",
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
    "faceDescription": "the FACE description provided - head/face only",
    "artStyle": "soft-cartoon|pixel-art|clean-vector|retro-mascot"
  },
  "background": "solid color - cream, charcoal, warm white, soft pink, mint, navy",
  "seed": number,
  "nanoBananaPrompt": "the full prompt built from template above"
}

=== STRICT RULES ===
- header.text MUST be "Peeples Donuts"
- faceDescription should be SHORT - face/head features only
- nanoBananaPrompt MUST emphasize: thumbnail PFP, horizontal badge, ID badge not trading card
- Background MUST be solid color, no gradients
- seed = (fid * 1000) + random 3-digit number`;

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
          text: `Now analyze this user's PFP and create a face description (for tiny badge thumbnail) and vibe summary.

**User Profile:**
- Username: ${user.username}
- Display Name: ${user.display_name}
- Bio: "${user.profile?.bio?.text || ""}"
- Location: ${location}
- Followers: ${user.follower_count}
- FID: ${fid}

Remember: face is for a TINY circular thumbnail - only describe head/face features that would be visible in a small profile picture. No body, no pose, no props being held.

Output valid JSON only:
{"face": "...", "vibe": "..."}`,
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

interface FaceVibeResponse {
  face: string;
  vibe: string;
}

function parseFaceAndVibe(response: string): FaceVibeResponse {
  const cleaned = response.replace(/```json\n?|```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned) as FaceVibeResponse;
  
  if (!parsed.face || !parsed.vibe) {
    throw new Error('Invalid response: missing face or vibe');
  }
  
  return parsed;
}

function buildBadgeGeneratorPrompt(user: any, fid: string, faceDescription: string, vibe: string): Messages {
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
          text: "Here is the reference template showing the EXACT badge layout to match. Notice: horizontal badge shape, small circular PFP on left of nameplate, username on right, three flair holes at bottom:",
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

**FACE Description (use this for the tiny PFP thumbnail - head/face only):**
${faceDescription}

**VIBE Summary (use this to guide material/color choices):**
${vibe}

**CRITICAL REMINDERS:**
1. The PFP is a TINY circular thumbnail showing ONLY the face - like a passport photo
2. The badge shape is HORIZONTAL (wider than tall) - NOT vertical, NOT square
3. This is an employee ID badge - NOT an illustrated trading card
4. The nanoBananaPrompt must emphasize: "thumbnail PFP", "passport photo size", "ID badge not trading card"
5. Match the reference template layout EXACTLY

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

    // Step 1: Generate FACE description and VIBE from PFP and profile
    const pfpAnalyzerPrompt = buildPfpAnalyzerPrompt(user, fid);
    const characterDescriptionResponse = await veniceClient.makeTextGeneration(
      pfpAnalyzerPrompt,
      0.6
    );
    
    // Parse the response to extract FACE and VIBE separately
    const { face, vibe } = parseFaceAndVibe(characterDescriptionResponse.result);

    console.log("Face Description:", face);
    console.log("Vibe:", vibe);

    // Step 2: Generate badge configuration JSON
    const badgeGeneratorPrompt = buildBadgeGeneratorPrompt(user, fid, face, vibe);
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
      faceDescription: face,
      vibe: vibe,
      badgeConfig: badgeConfigJson,
      pinataCid: uploadResponse.cid,
    });
  } catch (error) {
    console.error("Error generating PFP:", error);
    res.status(500).json({ error: "Failed to generate PFP" });
  }
});

export default router;
