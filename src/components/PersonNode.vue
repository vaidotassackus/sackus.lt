<script setup lang="ts">
import type { NodePosition, Person } from "../types/person";
import { getRoleLabel } from "../lib/familyLayout";

const props = defineProps<{
  person: Person;
  nodeInfo: NodePosition;
  isFocus: boolean;
  dimmed: boolean;
}>();

const emit = defineEmits<{
  focus: [id: string];
}>();

function onCardClick() {
  emit("focus", props.person.id);
}

function roleLabel() {
  return getRoleLabel(props.nodeInfo.role, props.person);
}
</script>

<template>
  <div
    :class="[
      'pnode',
      { deceased: !!person.death, focused: isFocus },
      nodeInfo.role && nodeInfo.role !== 'tree' && nodeInfo.role !== 'hidden'
        ? `role-${nodeInfo.role}`
        : '',
    ]"
    :style="{
      left: `${nodeInfo.x}px`,
      top: `${nodeInfo.y}px`,
      opacity: dimmed ? 0.28 : nodeInfo.visible ? 1 : 0,
      pointerEvents: nodeInfo.visible ? 'auto' : 'none',
      transition: 'opacity 0.35s ease, left 0.55s cubic-bezier(0.4,0,0.2,1), top 0.55s cubic-bezier(0.4,0,0.2,1)',
    }"
    @click="onCardClick"
  >
    <div style="position: relative; width: 38px; margin: 0 auto 7px">
      <a
        :href="`/asmuo/${person.id}`"
        :class="['pnode-avatar', person.gender === 'f' ? 'female' : 'male']"
        title="Atidaryti profilį"
        @click.stop
      >
        <img v-if="person.photo" :src="person.photo" :alt="person.firstName" />
        <template v-else>{{ person.firstName[0] }}</template>
      </a>
      <div v-if="!isFocus" class="avatar-focus-hint">⊙</div>
    </div>
    <div class="pnode-name">
      {{ person.firstName }}<br />{{ person.lastName }}
    </div>
    <div class="pnode-dates">
      {{
        [
          person.birth ? `* ${person.birth.slice(0, 4)}` : "",
          person.death ? `† ${person.death.slice(0, 4)}` : "",
        ]
          .filter(Boolean)
          .join("  ") || "—"
      }}
    </div>
    <div
      v-if="
        !isFocus &&
        nodeInfo.role &&
        nodeInfo.role !== 'tree' &&
        nodeInfo.role !== 'hidden' &&
        roleLabel()
      "
      class="pnode-role-badge"
    >
      {{ roleLabel() }}
    </div>
  </div>
</template>
