/**
 * World art-direction pass — a shared, named reference palette for new or
 * upgraded 3D scene work, so new files reuse the same conceptual color
 * instead of picking a slightly-different nearby hex. This is a reference,
 * not a hard requirement: existing building/prop files each already
 * declare their own local color consts, and a repo-wide refactor onto this
 * file is out of scope for this pass. New/upgraded code should prefer
 * pulling from here, or from the subject's own already-established
 * existing hex values, over inventing an unrelated new color.
 *
 * `core.glow`/`core.glowBright` are the one reserved "signature" color —
 * the Records Core's violet signal. Keep it exclusive to the Core/Beacon
 * and the signature "signal line" accents; it should never become a
 * generic decorative accent elsewhere, or it stops reading as meaningful.
 */
export const WORLD_PALETTE = {
  core: {
    glow: '#9d7bff',
    glowBright: '#d8c9ff',
    stone: '#584a72',
    stoneDark: '#453a5c',
  },
  history: {
    wallWarm: '#8a7560',
    wallDark: '#6b5a48',
    trim: '#c9a877',
    plaque: '#b8925a',
  },
  english: {
    wall: '#b08a63',
    wallDark: '#8a6a49',
    roof: '#8f5e4c',
    trim: '#e0c9a6',
  },
  math: {
    wall: '#5f74a3',
    wallDark: '#465884',
    roof: '#3d4d70',
    accentCool: '#8fd0ff',
  },
  lamp: {
    warm: '#ffcf8a',
    warmBright: '#f5d98a',
  },
  foliage: {
    canopy: '#3f7a4f',
    canopyLight: '#4c8a58',
    canopyDark: '#3a6f47',
  },
  foundation: {
    stone: '#3a3f4d',
  },
  completion: '#5fd382',
} as const
