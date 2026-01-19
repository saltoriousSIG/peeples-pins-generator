// Flair system types and constants

export interface FlairSlotPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FlairItem {
  flairId: string;
  ipfsCid: string;
  slotIndex: number; // 0, 1, or 2
}

export interface NFTFlairState {
  tokenId: string;
  currentImageCid: string;
  equippedFlair: FlairItem[];
}

// Flair slot positions on the badge (these are estimates and may need adjustment)
// Based on a 1024x1024 badge with 3 evenly spaced circular slots at the bottom
export const FLAIR_SLOT_POSITIONS: FlairSlotPosition[] = [
  // Left slot
  {
    x: 256,
    y: 880,
    width: 100,
    height: 100,
  },
  // Center slot
  {
    x: 462,
    y: 880,
    width: 100,
    height: 100,
  },
  // Right slot
  {
    x: 668,
    y: 880,
    width: 100,
    height: 100,
  },
];

// Standard badge dimensions
export const BADGE_WIDTH = 1024;
export const BADGE_HEIGHT = 1024;
