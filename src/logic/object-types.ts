export interface InventoryObject {
  index: number;
  name: string;
}

export interface ObjectFile {
  maxAnimatedObjects: number;
  objects: InventoryObject[];
}

export interface ObjectIndexResult {
  content: string;
  stats: {
    replacedObjects: number;
  };
}
