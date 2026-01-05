import type { TYPE_PLUGIN_ITEM } from "@/types/type/plugin.type";

export interface InstallerInstance {
  chooseManager: () => Promise<void>;
  install: (plugins: TYPE_PLUGIN_ITEM[]) => Promise<void>;
  choose: () => Promise<void>;
}
