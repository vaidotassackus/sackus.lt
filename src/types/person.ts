export type Gender = "m" | "f";

export interface Link {
  label: string;
  url: string;
}

export interface Doc {
  name: string;
  type: string;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  maidenName?: string;
  gender: Gender;
  birth?: string;
  death?: string;
  birthPlace?: string;
  bio?: string;
  links?: Link[];
  docs?: Doc[];
  gallery?: string[];
  photo?: string;
  x?: number;
  y?: number;
}

export interface Couple {
  spouses: [string, string];
  children: string[];
  married?: string;
  divorced?: string;
}

export interface Generation {
  y: number;
  label: string;
}

export type People = Record<string, Person>;

export type Role =
  | "focus"
  | "parent"
  | "grandparent"
  | "great-grandparent"
  | "child"
  | "grandchild"
  | "great-grandchild"
  | "spouse"
  | "sibling"
  | "aunt-uncle"
  | "nephew-niece"
  | "child-spouse"
  | "tree"
  | "hidden";

export interface NodePosition {
  x: number;
  y: number;
  visible: boolean;
  role: Role;
  relationLabel?: string;
}

export interface FamilyRelation {
  parents: string[];
  children: string[];
  spouse: string | null;
}

export type FamilyLookup = Record<string, FamilyRelation>;
