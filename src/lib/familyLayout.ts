import type {
  Couple,
  FamilyLookup,
  NodePosition,
  Person,
  People,
  Role,
} from "../types/person";

export const NODE_W = 148;
export const NODE_H = 98;
export const HW = 74;
export const HH = 49;

export const CANVAS_W = 1500;
export const CANVAS_H = 2100;

export const FCX = 750;
export const FCY = 1050;
export const XGAP = 190;
export const YGAP = 195;
const NODE_GAP = 42;
const SPOUSE_GAP = NODE_W + 20;
const MAX_RELATION_DEPTH = 5;

const ROLE_LABELS_BY_GENDER: Record<Role, Record<Person["gender"], string>> = {
  focus: { m: "", f: "" },
  parent: { m: "tėvas", f: "motina" },
  grandparent: { m: "senelis", f: "senelė" },
  "great-grandparent": { m: "prosenelis", f: "prosenelė" },
  child: { m: "sūnus", f: "dukra" },
  grandchild: { m: "anūkas", f: "anūkė" },
  "great-grandchild": { m: "proanūkis", f: "proanūkė" },
  spouse: { m: "sutuoktinis", f: "sutuoktinė" },
  sibling: { m: "brolis", f: "sesuo" },
  "aunt-uncle": { m: "dėdė", f: "teta" },
  "nephew-niece": { m: "sūnėnas", f: "dukterėčia" },
  "child-spouse": { m: "sutuoktinis", f: "sutuoktinė" },
  tree: { m: "", f: "" },
  hidden: { m: "", f: "" },
};

export function getRoleLabel(role: Role, person: Person): string {
  return ROLE_LABELS_BY_GENDER[role]?.[person.gender] ?? "";
}

function gendered(person: Person, male: string, female: string): string {
  return person.gender === "f" ? female : male;
}

function repeatedProLabel(base: string, depth: number): string {
  const proCount = depth - 2;
  if (proCount <= 0) return base;
  if (proCount === 1) return `pro${base}`;
  return `${"pro-".repeat(proCount)}${base}`;
}

function ancestorLabel(person: Person, depth: number): string {
  if (depth === 1) return gendered(person, "tėvas", "motina");
  const base = gendered(person, "senelis", "senelė");
  return repeatedProLabel(base, depth);
}

function descendantLabel(person: Person, depth: number): string {
  if (depth === 1) return gendered(person, "sūnus", "dukra");
  const base = gendered(person, "anūkis", "anūkė");
  return repeatedProLabel(base, depth);
}

export function buildLookup(people: People, couples: Couple[]): FamilyLookup {
  const lu: FamilyLookup = {};
  Object.keys(people).forEach((id) => {
    lu[id] = { parents: [], children: [], spouse: null };
  });
  couples.forEach(({ spouses, children }) => {
    const [a, b] = spouses;
    if (lu[a]) lu[a].spouse = b;
    if (lu[b]) lu[b].spouse = a;
    children.forEach((cid) => {
      if (lu[cid]) lu[cid].parents = [...spouses];
      if (lu[a]) lu[a].children.push(cid);
      if (lu[b]) lu[b].children.push(cid);
    });
  });
  return lu;
}

interface FocusLayout {
  pos: Record<string, { x: number; y: number }>;
  roles: Record<string, Role>;
  labels: Record<string, string>;
}

export function computeFocusLayout(
  focusId: string,
  people: People,
  couples: Couple[],
): FocusLayout {
  const lu = buildLookup(people, couples);
  const pos: FocusLayout["pos"] = {};
  const roles: FocusLayout["roles"] = {};
  const labels: FocusLayout["labels"] = {};

  const place = (
    id: string,
    x: number,
    y: number,
    role: Role,
    relationLabel?: string,
  ) => {
    if (!people[id] || pos[id]) return;
    pos[id] = { x, y };
    roles[id] = role;
    labels[id] = relationLabel ?? getRoleLabel(role, people[id]);
  };

  place(focusId, FCX, FCY, "focus");
  const rel = lu[focusId] || { parents: [], children: [], spouse: null };

  if (rel.spouse) place(rel.spouse, FCX + XGAP + 55, FCY, "spouse");

  const sibSet = new Set<string>();
  rel.parents.forEach((pid) =>
    (lu[pid]?.children || []).forEach((cid) => {
      if (cid !== focusId) sibSet.add(cid);
    }),
  );
  const sibs = [...sibSet].filter((id) => people[id]);
  sibs.forEach((sid, i) =>
    place(sid, FCX - XGAP * (sibs.length - i), FCY, "sibling"),
  );

  const ancestorRole = (depth: number): Role => {
    if (depth === 1) return "parent";
    if (depth === 2) return "grandparent";
    return "great-grandparent";
  };

  const placeAncestors = (
    childId: string,
    centerX: number,
    depth: number,
  ): Record<string, number> => {
    if (depth > MAX_RELATION_DEPTH) return {};

    const ancestorIds = (lu[childId]?.parents || []).filter((id) => people[id]);
    const placedXs: Record<string, number> = {};
    if (ancestorIds.length === 0) return placedXs;

    const xs =
      ancestorIds.length === 1
        ? [centerX]
        : [centerX - XGAP * 0.45, centerX + XGAP * 0.45];

    ancestorIds.forEach((id, index) => {
      const x = xs[index] ?? centerX;
      placedXs[id] = x;
      place(
        id,
        x,
        FCY - YGAP * depth,
        ancestorRole(depth),
        ancestorLabel(people[id], depth),
      );
      placeAncestors(id, x, depth + 1);
    });

    return placedXs;
  };

  const parents = rel.parents.filter((id) => people[id]);
  const parentXs = placeAncestors(focusId, FCX, 1);
  let p0x = FCX;
  let p1x = FCX;
  if (parents.length === 1) p0x = parentXs[parents[0]] ?? FCX;
  if (parents.length >= 2) {
    p0x = parentXs[parents[0]] ?? FCX - XGAP * 0.45;
    p1x = parentXs[parents[1]] ?? FCX + XGAP * 0.45;
  }

  const auntUncleSet = new Set<string>();
  parents.forEach((pid) => {
    const parentRel = lu[pid] || { parents: [], children: [], spouse: null };
    parentRel.parents.forEach((gpid) => {
      (lu[gpid]?.children || []).forEach((relativeId) => {
        if (relativeId !== pid && !parents.includes(relativeId)) {
          auntUncleSet.add(relativeId);
        }
      });
    });
  });
  const auntUncles = [...auntUncleSet].filter((id) => people[id] && !pos[id]);
  const leftAuntUncles = auntUncles.filter((id) => {
    const siblingParents = lu[id]?.parents || [];
    return parents.some(
      (pid, pi) =>
        pi === 0 &&
        siblingParents.some((gpid) => lu[pid]?.parents.includes(gpid)),
    );
  });
  const rightAuntUncles = auntUncles.filter(
    (id) => !leftAuntUncles.includes(id),
  );

  leftAuntUncles.forEach((id, index) => {
    place(id, p0x - XGAP * (index + 1), FCY - YGAP, "aunt-uncle");
  });
  rightAuntUncles.forEach((id, index) => {
    place(id, p1x + XGAP * (index + 1), FCY - YGAP, "aunt-uncle");
  });

  const nephewNieceSet = new Set<string>();
  sibs.forEach((sid) => {
    (lu[sid]?.children || []).forEach((childId) => {
      if (childId !== focusId) nephewNieceSet.add(childId);
    });
  });
  [...nephewNieceSet]
    .filter((id) => people[id] && !pos[id])
    .forEach((id, index) => {
      place(id, FCX - XGAP * (index + 1), FCY + YGAP, "nephew-niece");
    });

  const children = rel.children.filter((id) => people[id]);
  const childGroups = children.map((cid) => {
    const crel = lu[cid] || { parents: [], children: [], spouse: null };
    const hasSpouse = !!(
      crel.spouse &&
      people[crel.spouse] &&
      !pos[crel.spouse]
    );
    return {
      childId: cid,
      spouseId: hasSpouse ? crel.spouse : null,
      width: hasSpouse ? NODE_W * 2 + NODE_GAP : NODE_W,
    };
  });
  const childTotalW =
    childGroups.reduce((sum, group) => sum + group.width, 0) +
    Math.max(0, childGroups.length - 1) * NODE_GAP;
  let childCursor = FCX - childTotalW / 2;

  childGroups.forEach((group) => {
    const cid = group.childId;
    const cx = childCursor + NODE_W / 2;
    place(cid, cx, FCY + YGAP, "child");
    const crel = lu[cid] || { parents: [], children: [], spouse: null };
    if (group.spouseId) {
      place(group.spouseId, cx + SPOUSE_GAP, FCY + YGAP, "child-spouse");
    }
    const grandchildren = crel.children.filter(
      (id) => people[id] && !pos[id],
    );
    grandchildren.forEach((gcid, gi) => {
      const gcx = cx + (gi - (grandchildren.length - 1) / 2) * 175;
      place(
        gcid,
        gcx,
        FCY + YGAP * 2,
        "grandchild",
        descendantLabel(people[gcid], 2),
      );

      const placeDescendants = (
        parentId: string,
        parentX: number,
        depth: number,
      ) => {
        if (depth > MAX_RELATION_DEPTH) return;
        const descendants = (lu[parentId]?.children || []).filter(
          (id) => people[id] && !pos[id],
        );
        descendants.forEach((descendantId, descendantIndex) => {
          const dx =
            parentX + (descendantIndex - (descendants.length - 1) / 2) * 160;
          place(
            descendantId,
            dx,
            FCY + YGAP * depth,
            depth === 2 ? "grandchild" : "great-grandchild",
            descendantLabel(people[descendantId], depth),
          );
          placeDescendants(descendantId, dx, depth + 1);
        });
      };
      placeDescendants(gcid, gcx, 3);
    });
    childCursor += group.width + NODE_GAP;
  });

  return { pos, roles, labels };
}

export function getNodePositions(
  focusId: string | null,
  people: People,
  couples: Couple[],
): Record<string, NodePosition> {
  if (!focusId) {
    const r: Record<string, NodePosition> = {};
    Object.values(people).forEach((p) => {
      r[p.id] = {
        x: p.x ?? 0,
        y: p.y ?? 0,
        visible: true,
        role: "tree",
      };
    });
    return r;
  }
  const { pos, roles, labels } = computeFocusLayout(focusId, people, couples);
  const r: Record<string, NodePosition> = {};
  Object.values(people).forEach((p) => {
    if (pos[p.id]) {
      r[p.id] = {
        x: pos[p.id].x,
        y: pos[p.id].y,
        visible: true,
        role: roles[p.id],
        relationLabel: labels[p.id],
      };
    } else {
      r[p.id] = {
        x: p.x ?? 0,
        y: p.y ?? 0,
        visible: false,
        role: "hidden",
      };
    }
  });
  return r;
}
