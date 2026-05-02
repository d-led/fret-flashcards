/* eslint-disable @typescript-eslint/no-explicit-any -- ambient declarations for the VexFlow IIFE bundle */
// Minimal ambient declarations for VexFlow to satisfy TypeScript in the IDE.

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
