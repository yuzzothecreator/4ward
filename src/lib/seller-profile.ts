/** Seller must explain who they are and how buyers get help after purchase. */
export function isSellerProfileReady(input: {
  bio?: string | null;
  supportNote?: string | null;
}): boolean {
  return (
    (input.bio || "").trim().length >= 20 &&
    (input.supportNote || "").trim().length >= 20
  );
}
