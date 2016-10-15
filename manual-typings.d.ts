
declare module "mocha-sugar-free" {
  interface Dsl {
    (d: string, f: Function): void;
    skip(d: string): void;
    only(d: string, f: Function): void;
  }
  export const it:Dsl;
  export const describe: Dsl;
}
