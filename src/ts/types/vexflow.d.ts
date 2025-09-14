// Minimal ambient declarations for VexFlow to satisfy TypeScript in the IDE.
// These intentionally use `any` — you can replace with more specific types later.

declare module "vexflow" {
  const VexFlow: any;
  export = VexFlow;
}

declare module "vexflow/build/cjs/vexflow" {
  const VexFlow: any;
  export = VexFlow;
}

// If code expects a global `VexFlow` (from a script tag), declare that as well.
declare const VexFlow: any;
