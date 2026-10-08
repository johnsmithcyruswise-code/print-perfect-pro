declare module "*.asset.json" {
  const asset: { url: string; [key: string]: unknown };
  export default asset;
}
