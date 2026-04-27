import type {
  Couple,
  FamilyLookup,
  NodePosition,
  People,
  Role,
} from "../types/person";

export const NODE_W = 148;
export const NODE_H = 98;
export const HW = 74;
export const HH = 49;

export const CANVAS_W = 1500;
export const CANVAS_H = 1000;

export const FCX = 750;
export const FCY = 480;
export const XGAP = 190;
export const YGAP = 195;

export const ROLE_LABELS: Record<Role, string> = {
  focus: "",
  parent: "tėvas / motina",
  grandparent: "senelis / senelė",
  child: "vaikas",
  grandchild: "vaikaitis",
  spouse: "sutuoktinis/ė",
  sibling: "brolis / sesuo",
  "child-spouse": "sutuoktinis/ė",
  tree: "",
  hidden: "",
};

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
}

export function computeFocusLayout(
  focusId: string,
  people: People,
  couples: Couple[],
): FocusLayout {
  const lu = buildLookup(people, couples);
  const pos: FocusLayout["pos"] = {};
  const roles: FocusLayout["roles"] = {};

  const place = (id: string, x: number, y: number, role: Role) => {
    if (!people[id] || pos[id]) return;
    pos[id] = { x, y };
    roles[id] = role;
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

  const parents = rel.parents.filter((id) => people[id]);
  let p0x = FCX;
  let p1x = FCX;
  if (parents.length === 1) {
    p0x = FCX;
    place(parents[0], p0x, FCY - YGAP, "parent");
  } else if (parents.length === 2) {
    p0x = FCX - XGAP * 0.45;
    p1x = FCX + XGAP * 0.45;
    place(parents[0], p0x, FCY - YGAP, "parent");
    place(parents[1], p1x, FCY - YGAP, "parent");
  }

  parents.forEach((pid, pi) => {
    const px = pi === 0 ? p0x : p1x;
    const prel = lu[pid] || { parents: [], children: [], spouse: null };
    const gps = prel.parents.filter((id) => people[id] && !pos[id]);
    if (gps.length === 1) {
      place(gps[0], px, FCY - YGAP * 2, "grandparent");
    } else if (gps.length === 2) {
      place(gps[0], px - XGAP * 0.5, FCY - YGAP * 2, "grandparent");
      place(gps[1], px + XGAP * 0.5, FCY - YGAP * 2, "grandparent");
    }
    gps.forEach((gpid) => {
      const gprel = lu[gpid] || { parents: [], children: [], spouse: null };
      if (gprel.spouse && !pos[gprel.spouse]) {
        place(
          gprel.spouse,
          pos[gpid].x + XGAP * 0.55,
          FCY - YGAP * 2,
          "grandparent",
        );
      }
    });
  });

  const children = rel.children.filter((id) => people[id]);
  const childTotalW = (children.length - 1) * XGAP;
  children.forEach((cid, i) => {
    const cx = FCX - childTotalW / 2 + i * XGAP;
    place(cid, cx, FCY + YGAP, "child");
    const crel = lu[cid] || { parents: [], children: [], spouse: null };
    if (crel.spouse && !pos[crel.spouse]) {
      place(crel.spouse, cx + XGAP * 0.55 + 25, FCY + YGAP, "child-spouse");
    }
    const grandchildren = crel.children.filter(
      (id) => people[id] && !pos[id],
    );
    grandchildren.forEach((gcid, gi) => {
      place(
        gcid,
        cx + (gi - (grandchildren.length - 1) / 2) * 175,
        FCY + YGAP * 2,
        "grandchild",
      );
    });
  });

  return { pos, roles };
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
  const { pos, roles } = computeFocusLayout(focusId, people, couples);
  const r: Record<string, NodePosition> = {};
  Object.values(people).forEach((p) => {
    if (pos[p.id]) {
      r[p.id] = {
        x: pos[p.id].x,
        y: pos[p.id].y,
        visible: true,
        role: roles[p.id],
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
