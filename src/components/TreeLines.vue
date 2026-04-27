<script setup lang="ts">
import { computed } from "vue";
import type { Couple, NodePosition } from "../types/person";
import { HH, HW } from "../lib/familyLayout";

const props = defineProps<{
  nodePos: Record<string, NodePosition>;
  couples: Couple[];
}>();

interface Segment {
  type: "line" | "heart" | "date-label";
  key: string;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  cx?: number;
  cy?: number;
  stroke?: string;
  width?: number;
  dash?: string;
  text?: string;
  divorced?: boolean;
}

const segments = computed<Segment[]>(() => {
  const segs: Segment[] = [];
  props.couples.forEach(
    ({ spouses, children, married, divorced }, ci) => {
      const [aId, bId] = spouses;
      const aP = props.nodePos[aId];
      const bP = props.nodePos[bId];
      if (!aP?.visible || !bP?.visible) return;

      const leftX = Math.min(aP.x, bP.x);
      const rightX = Math.max(aP.x, bP.x);
      const midX = (aP.x + bP.x) / 2;
      const coupleY = aP.y;
      const mL = leftX + HW + 4;
      const mR = rightX - HW - 4;
      const isPast = !!divorced;

      if (mR > mL) {
        segs.push({
          type: "line",
          key: `ml${ci}`,
          x1: mL,
          y1: coupleY,
          x2: mR,
          y2: coupleY,
          stroke: isPast ? "#b0a89c" : "#c9a96e",
          width: 1.2,
          dash: "5,4",
        });
      }
      segs.push({
        type: "heart",
        key: `mh${ci}`,
        cx: midX,
        cy: coupleY - 11,
        divorced: isPast,
      });

      if (married || divorced) {
        const my = (married || "").slice(0, 4);
        const dy = (divorced || "").slice(0, 4);
        const label = my && dy ? `${my}–${dy}` : my ? `nuo ${my}` : `–${dy}`;
        segs.push({
          type: "date-label",
          key: `md${ci}`,
          cx: midX,
          cy: coupleY + 14,
          text: label,
        });
      }

      const childPoses = children
        .map((id) => props.nodePos[id])
        .filter((cp) => cp?.visible);
      if (!childPoses.length) return;
      const childY = childPoses[0].y;
      const branchY = Math.round((coupleY + childY) / 2);

      segs.push({
        type: "line",
        key: `vd${ci}`,
        x1: midX,
        y1: coupleY + HH,
        x2: midX,
        y2: branchY,
        stroke: "#8b6b45",
        width: 1.4,
      });

      if (childPoses.length === 1) {
        const ch = childPoses[0];
        if (Math.abs(midX - ch.x) > 2) {
          segs.push({
            type: "line",
            key: `hb${ci}`,
            x1: midX,
            y1: branchY,
            x2: ch.x,
            y2: branchY,
            stroke: "#8b6b45",
            width: 1.4,
          });
        }
        segs.push({
          type: "line",
          key: `cv${ci}0`,
          x1: ch.x,
          y1: branchY,
          x2: ch.x,
          y2: ch.y - HH,
          stroke: "#8b6b45",
          width: 1.4,
        });
      } else {
        const minX = Math.min(...childPoses.map((c) => c.x));
        const maxX = Math.max(...childPoses.map((c) => c.x));
        segs.push({
          type: "line",
          key: `hb${ci}`,
          x1: Math.min(midX, minX),
          y1: branchY,
          x2: Math.max(midX, maxX),
          y2: branchY,
          stroke: "#8b6b45",
          width: 1.4,
        });
        childPoses.forEach((ch, i) => {
          segs.push({
            type: "line",
            key: `cv${ci}${i}`,
            x1: ch.x,
            y1: branchY,
            x2: ch.x,
            y2: ch.y - HH,
            stroke: "#8b6b45",
            width: 1.4,
          });
        });
      }
    },
  );
  return segs;
});
</script>

<template>
  <svg class="tree-svg">
    <defs>
      <filter id="roughen">
        <feTurbulence
          type="turbulence"
          baseFrequency="0.018"
          numOctaves="2"
          seed="5"
          result="noise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="2.5"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>
    <g filter="url(#roughen)">
      <template v-for="seg in segments" :key="seg.key">
        <line
          v-if="seg.type === 'line'"
          :x1="seg.x1"
          :y1="seg.y1"
          :x2="seg.x2"
          :y2="seg.y2"
          :stroke="seg.stroke"
          :stroke-width="seg.width"
          :stroke-dasharray="seg.dash"
        />
        <template v-else-if="seg.type === 'heart'">
          <text
            :x="seg.cx"
            :y="seg.cy"
            text-anchor="middle"
            :fill="seg.divorced ? '#b0a89c' : '#c9a96e'"
            font-size="11"
            font-family="serif"
          >
            ♥
          </text>
          <line
            v-if="seg.divorced"
            :x1="(seg.cx ?? 0) - 7"
            :y1="(seg.cy ?? 0) - 8"
            :x2="(seg.cx ?? 0) + 7"
            :y2="(seg.cy ?? 0) + 2"
            stroke="#7a3a3a"
            stroke-width="1.2"
            stroke-linecap="round"
          />
        </template>
        <text
          v-else-if="seg.type === 'date-label'"
          :x="seg.cx"
          :y="seg.cy"
          text-anchor="middle"
          fill="var(--ink-light)"
          font-size="10"
          font-family="'Caveat', cursive"
          font-style="italic"
        >
          {{ seg.text }}
        </text>
      </template>
    </g>
  </svg>
</template>
