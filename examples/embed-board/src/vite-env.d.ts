/// <reference types="vite/client" />

declare module "*.scan.yaml?raw" {
  const content: string;
  export default content;
}

declare module "*.yaml?raw" {
  const content: string;
  export default content;
}
