// Global ambient declarations so `tsc --noEmit` resolves static image
// imports on fresh CI checkouts (where Next's generated next-env.d.ts
// image types may not exist yet). Uses inline import() types so this file
// stays a global script — a top-level import would turn it into a module
// and the wildcards would stop applying.
declare module "*.jpg" {
  const content: import("next/image").StaticImageData;
  export default content;
}

declare module "*.jpeg" {
  const content: import("next/image").StaticImageData;
  export default content;
}

declare module "*.png" {
  const content: import("next/image").StaticImageData;
  export default content;
}

declare module "*.webp" {
  const content: import("next/image").StaticImageData;
  export default content;
}

declare module "*.avif" {
  const content: import("next/image").StaticImageData;
  export default content;
}
