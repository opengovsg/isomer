/**
 * Pure utility functions for focal point geometry calculations.
 * No dependencies, fully unit-testable.
 */

/**
 * Clamps a number to [0, 1] range.
 */
export const clampUnit = (n: number): number => Math.min(1, Math.max(0, n))

/**
 * Converts client coordinates to normalized focal point coordinates [0, 1].
 * Guards against zero width/height by returning 0.5.
 */
export const pointToFocal = (
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): { x: number; y: number } => {
  const { left, top, width, height } = rect

  // Guard against zero dimensions
  if (width === 0 || height === 0) {
    return { x: 0.5, y: 0.5 }
  }

  return {
    x: clampUnit((clientX - left) / width),
    y: clampUnit((clientY - top) / height),
  }
}
