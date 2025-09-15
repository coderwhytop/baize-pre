import { HUSKY, PRETTIER, TS, ESLINT, COMMITLINT } from "@/const/plugin.const";

export type TYPE_PLUGIN_NAME =
  | typeof TS
  | typeof HUSKY
  | typeof PRETTIER
  | typeof ESLINT
  | typeof COMMITLINT;

export type TYPE_PLUGIN_ITEM = {
  name: TYPE_PLUGIN_NAME;
  config: { file: string; json: any } | Array<{ file: string; json: any }>;
  dev: boolean;
  pkgInject: Record<string, any>;
};
