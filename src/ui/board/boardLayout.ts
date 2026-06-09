// Optional card art.
//
// Drop the two card sides as PNG/JPG at:
//     public/cards/side-1.png   (Spider / Orc side — levels 1,3,5,7,9,11)
//     public/cards/side-2.png   (Skeleton / Demon side — levels 2,4,6,8,10,12)
// and the board background will use them (rotated 180° on the relevant levels).
// For best alignment with the 5x5 click overlay, crop each image down to just
// the square grid region of the card. If no file is present, a themed
// placeholder board is shown instead. See README.md.

export const CARD_IMAGES: Record<1 | 2, string> = {
  1: `${import.meta.env.BASE_URL}cards/side-1.png`,
  2: `${import.meta.env.BASE_URL}cards/side-2.png`,
}
