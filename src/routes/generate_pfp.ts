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

const PFP_ANALYZER_SYSTEM_PROMPT = `Analyze the user's PFP and bio to create a cartoon character for their badge.

Output JSON only:
{
  "character": "Simple character description - who they are, key visual features, 15-20 words max",
  "style": "pixel-art OR cartoon",
  "colors": ["primary color", "secondary color"]
}

Rules:
- If PFP is pixel art, style = "pixel-art"
- If PFP is photo/illustration, style = "cartoon"
- Extract 2 main colors from their PFP
- Character should reflect their bio (builder = tools, artist = creative, etc.)
- Keep description SHORT

Example:
{"character": "Ninja robot with straw hat holding wrench and donut, cyan glowing eyes", "style": "pixel-art", "colors": ["cyan", "black"]}`;

const BADGE_GENERATOR_SYSTEM_PROMPT = `Generate a JSON config for a Peeples Donuts badge. Keep the nanoBananaPrompt SHORT (under 80 words).

BADGE LAYOUT (match reference):
- Horizontal badge (wider than tall)
- Pixel donut in top notch
- "Peeples Donuts" header
- Nameplate: circular PFP on LEFT, username on RIGHT
- 3 flair holes at bottom

FIELD MAPPING:
- avatar.pfpDescription = the character description provided
- avatar.artStyle = "pixel-art" if style is pixel-art, else "soft-cartoon"
- nameplate.username = user's username
- nameplate.displayName = user's display name or username
- header.text = "Peeples Donuts" (always)
- Use the provided colors to influence badge.baseColor, lanyard.color, background.color

RARITY (by fid):
- fid < 1000: legendary
- fid < 10000: rare
- fid < 50000: uncommon
- else: common

NANO BANANA PROMPT (SHORT, ~60 words max):
"Peeples Donuts badge, horizontal. [GLAZE] pixel donut with face in top notch. 'Peeples Donuts' header. Nameplate: [PFP_DESCRIPTION] in [ART_STYLE] style in left circle, '[USERNAME]' text on right. 3 flair holes at bottom. [MATERIAL] [BASE_COLOR] badge, [LANYARD_COLOR] [LANYARD_MATERIAL] lanyard. Solid [BACKGROUND] background."

RULES:
- PFP on LEFT side of nameplate, username on RIGHT
- background.color = solid color only (cream, pink, charcoal, mint, white)
- seed = fid * 1000 + random 3 digits
- nanoBananaPrompt must be under 80 words`;

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
          text: `Analyze this user and create their badge character.

Username: ${user.username}
Bio: "${user.profile?.bio?.text || ""}"
FID: ${fid}

Output JSON: {"character": "...", "style": "pixel-art|cartoon", "colors": ["...", "..."]}`,
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
  style: "pixel-art" | "cartoon";
  colors: [string, string];
}

function parseCharacterResponse(response: string): CharacterResponse {
  const cleaned = response.replace(/```json\n?|```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned) as CharacterResponse;
  
  if (!parsed.character || !parsed.style || !parsed.colors) {
    throw new Error('Invalid response: missing required fields');
  }
  
  return parsed;
}

function buildBadgeGeneratorPrompt(user: any, fid: string, characterData: CharacterResponse): Messages {
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
          text: "Reference badge layout:",
        },
        {
          type: "image_url",
          image_url: {
            url: BASE_TEMPLATE_URL,
          },
        },
        {
          type: "text",
          text: `Generate badge config.

User:
- username: "${user.username}"
- displayName: "${user.display_name || user.username}"
- fid: ${fid}
- followers: ${user.follower_count}

Character (use for avatar.pfpDescription):
"${characterData.character}"

Style (use for avatar.artStyle):
${characterData.style === "pixel-art" ? "pixel-art" : "soft-cartoon"}

Colors (use to influence badge/lanyard/background colors):
${characterData.colors.join(", ")}

Output JSON with SHORT nanoBananaPrompt (under 80 words).`,
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
    console.log("Style:", characterData.style);
    console.log("Colors:", characterData.colors);

    // Step 2: Generate badge configuration JSON
    const badgeGeneratorPrompt = buildBadgeGeneratorPrompt(user, fid, characterData);
    const badgeConfigResponse = await veniceClient.makeTextGeneration(
      badgeGeneratorPrompt,
      0.7,
      peeplesBadgeResponseFormat
    );
    const badgeConfigJson = JSON.parse(badgeConfigResponse.result);
    
    // Force correct values that the LLM keeps getting wrong
    badgeConfigJson.header.text = "Peeples Donuts";
    badgeConfigJson.nameplate.username = user.username;
    badgeConfigJson.nameplate.displayName = user.display_name || user.username;
    badgeConfigJson.avatar.artStyle = "pixel-art";
    
    // Force nanoBananaPrompt to have correct structure
    const pfpDesc = badgeConfigJson.avatar.pfpDescription;
    const badgeMaterial = badgeConfigJson.badge.material;
    const badgeColor = badgeConfigJson.badge.baseColor;
    const lanyardColor = badgeConfigJson.lanyard.color;
    const lanyardMaterial = badgeConfigJson.lanyard.material;
    const bgColor = badgeConfigJson.background.color;
    const donutGlaze = badgeConfigJson.donut.glaze;
    
    badgeConfigJson.nanoBananaPrompt = `Peeples Donuts employee badge, wide horizontal rectangle shape. ${lanyardMaterial} ${lanyardColor} lanyard at top. ${donutGlaze} pixel art donut with kawaii face sitting in top notch. "Peeples Donuts" retro script text below donut. Nameplate bar: small circular PFP on left containing ${pfpDesc} in pixel art style, dark rectangle with "${user.username}" text on right. Three small circular metal grommet holes evenly spaced at bottom edge. ${badgeMaterial} badge with ${badgeColor} color. Solid ${bgColor} background.`;

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
