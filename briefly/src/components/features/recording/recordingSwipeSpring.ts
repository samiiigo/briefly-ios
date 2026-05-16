/** Spring used when the row snaps open or closed after a swipe. */
export const RECORDING_SWIPE_SPRING = {
  damping: 22,
  stiffness: 210,
  mass: 0.85,
  overshootClamping: false,
} as const;

export const RECORDING_SWIPE_FRICTION = 1.05;
export const RECORDING_SWIPE_OVERSHOOT_FRICTION = 6;
