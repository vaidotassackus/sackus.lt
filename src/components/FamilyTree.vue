<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import type {
  Couple,
  Generation,
  People,
  Person,
} from "../types/person";
import {
  CANVAS_H,
  CANVAS_W,
  FCX,
  FCY,
  getNodePositions,
} from "../lib/familyLayout";
import PersonNode from "./PersonNode.vue";
import TreeLines from "./TreeLines.vue";

const props = defineProps<{
  people: People;
  couples: Couple[];
  generations: Generation[];
}>();

const focusId = ref<string | null>(null);
const focusHistory = ref<string[]>([]);
const search = ref("");
const wrapRef = ref<HTMLDivElement | null>(null);

const focusPerson = computed<Person | null>(() =>
  focusId.value ? props.people[focusId.value] ?? null : null,
);

const nodePositions = computed(() =>
  getNodePositions(focusId.value, props.people, props.couples),
);

const matchIds = computed<Set<string> | null>(() => {
  const q = search.value.toLowerCase().trim();
  if (!q) return null;
  return new Set(
    Object.values(props.people)
      .filter((p) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(q))
      .map((p) => p.id),
  );
});

function scrollToFocus(smooth = true) {
  const wrap = wrapRef.value;
  if (!wrap) return;
  if (focusId.value) {
    const left = Math.max(0, FCX - wrap.clientWidth / 2);
    const top = Math.max(0, FCY - wrap.clientHeight / 2);
    wrap.scrollTo({ left, top, behavior: smooth ? "smooth" : "auto" });
  } else {
    wrap.scrollTo({ left: 0, top: 0, behavior: smooth ? "smooth" : "auto" });
  }
}

function syncUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (focusId.value) url.searchParams.set("focus", focusId.value);
  else url.searchParams.delete("focus");
  window.history.replaceState({}, "", url.toString());
}

function handleFocus(id: string) {
  if (id === focusId.value) return;
  if (focusId.value) focusHistory.value.push(focusId.value);
  focusId.value = id;
}

function handleBack() {
  if (focusHistory.value.length > 0) {
    focusId.value = focusHistory.value.pop() ?? null;
  } else {
    focusId.value = null;
    focusHistory.value = [];
  }
}

function showFullTree() {
  focusId.value = null;
  focusHistory.value = [];
}

watch(focusId, () => {
  syncUrl();
  nextTick(() => setTimeout(() => scrollToFocus(true), 60));
});

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  const f = params.get("focus");
  if (f && props.people[f]) {
    focusId.value = f;
    nextTick(() => setTimeout(() => scrollToFocus(false), 60));
  }
});
</script>

<template>
  <header class="header">
    <a href="/familytree/" class="header-brand">
      <span class="header-title">Šačkus</span>
      <span class="header-subtitle">giminės medis</span>
    </a>
    <div class="header-sep" />

    <template v-if="focusId">
      <button class="header-btn-back" @click="handleBack">
        ←
        {{
          focusHistory.length > 0
            ? people[focusHistory[focusHistory.length - 1]]?.firstName ||
              "Atgal"
            : "Visi"
        }}
      </button>
      <div class="breadcrumb">
        <span>·</span>
        <span class="breadcrumb-current">
          {{ focusPerson?.firstName }} {{ focusPerson?.lastName }}
        </span>
      </div>
    </template>
    <div v-else class="search-wrap">
      <span class="search-icon">⌕</span>
      <input
        v-model="search"
        class="search-input"
        placeholder="Ieškoti..."
      />
    </div>

    <div class="header-right">
      <button v-if="focusId" class="header-btn" @click="showFullTree">
        ⊙ Visas medis
      </button>
      <a
        v-if="focusPerson"
        :href="`/familytree/asmuo/${focusPerson.id}`"
        class="header-btn header-btn-primary"
      >
        Profilis →
      </a>
    </div>
  </header>

  <div ref="wrapRef" class="tree-wrap">
    <div
      class="tree-canvas"
      :style="{ width: `${CANVAS_W}px`, height: `${CANVAS_H}px` }"
    >
      <template v-if="!focusId">
        <div
          v-for="g in generations"
          :key="g.label"
          class="gen-label"
          :style="{ top: `${g.y}px` }"
        >
          {{ g.label }}
        </div>
      </template>

      <div
        v-if="focusId && focusPerson"
        class="focus-hint"
        :style="{ left: `${FCX}px`, top: `${FCY}px` }"
      >
        spustelėkite ant giminaičio → jis taps centru
      </div>

      <TreeLines :node-pos="nodePositions" :couples="couples" />

      <PersonNode
        v-for="person in Object.values(people)"
        :key="person.id"
        :person="person"
        :node-info="
          nodePositions[person.id] ?? {
            x: person.x ?? 0,
            y: person.y ?? 0,
            visible: !focusId,
            role: 'tree',
          }
        "
        :is-focus="person.id === focusId"
        :dimmed="
          !!matchIds && !matchIds.has(person.id) && !focusId
        "
        @focus="handleFocus"
      />
    </div>
  </div>

  <div class="zoom-ctrl">
    <button
      class="zbtn"
      :title="focusId ? 'Grįžti į centrą' : 'Grįžti į pradžią'"
      @click="scrollToFocus(true)"
    >
      ⊙
    </button>
  </div>

  <div class="legend">
    <div class="legend-row">
      <svg width="28" height="10">
        <line
          x1="0"
          y1="5"
          x2="28"
          y2="5"
          stroke="#c9a96e"
          stroke-width="1.2"
          stroke-dasharray="4,3"
        />
      </svg>
      <span>Santuoka</span>
    </div>
    <div class="legend-row">
      <svg width="28" height="10">
        <line
          x1="0"
          y1="5"
          x2="28"
          y2="5"
          stroke="#8b6b45"
          stroke-width="1.4"
        />
      </svg>
      <span>Giminystė</span>
    </div>
    <div class="legend-row">
      <div class="legend-dot male" />
      <span>Vyras</span>
      <div class="legend-dot female" :style="{ marginLeft: '6px' }" />
      <span>Moteris</span>
    </div>
    <div v-if="!focusId" class="legend-row legend-divider">
      Spausti ant asmens → fokusas
    </div>
  </div>
</template>
