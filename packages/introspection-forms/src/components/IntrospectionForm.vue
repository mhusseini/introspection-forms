<template>
  <component
    :is="as"
    :name="form.introspection.name"
    v-show="form.visible(model as TModel)"
    v-bind="toValues(model, form.props)"
    ref="formEl"
    @submit.prevent
  >
    <slot name="fields" :fields="form.fields" :model="model" :validatable="validatable">
      <IntrospectionField
        v-for="field in form.fields"
        :key="field.name"
        :type="form.introspection"
        :field="field"
        :model="model"
        :validatable="getFieldValidatable(field.name!)"
        :columns="columns"
      />
    </slot>
    <slot />
  </component>
</template>

<script setup lang="ts" generic="TModel extends Record<string, unknown>">
import { ref, computed, onMounted, watch, unref, inject } from 'vue'
import type { FormRuntime, FieldRuntime, IntrospectionField as IntrospectionFieldType, Translate } from '../types'
import { readStorage, writeStorage } from '../utils/storage'
import IntrospectionField from './IntrospectionField.vue'

const props = withDefaults(
  defineProps<{
    as?: string
    model: TModel
    form: FormRuntime<TModel>
    columns?: number
    storage?: 'session' | 'local' | 'none' | boolean
    interceptStorage?: (model: TModel) => TModel | undefined
    validatable?: Record<string, unknown>
  }>(),
  {
    as: 'form',
    columns: 2,
    storage: 'session',
  },
)

const emit = defineEmits<{
  validate: [result: { success: boolean }]
}>()

const formEl = ref<HTMLElement>()

const storageType = computed(() =>
  props.storage === true ? 'session' : props.storage === false ? 'none' : props.storage,
)

const t = inject<Translate>('introspection-forms:translate', (key: string) => key)

function getFieldValidatable(fieldName: string): unknown {
  return props.validatable?.[fieldName]
}

function toValues(
  item: object,
  functions: Record<string, (item?: unknown) => unknown> | undefined,
): Record<string, unknown> {
  return functions
    ? Object.fromEntries(Object.entries(functions).map(([key, value]) => [key, value(item)]))
    : {}
}

onMounted(() => {
  if (storageType.value === 'none') return
  let savedData = readStorage(storageType.value, props.form.introspection.name)
  if (!savedData || Object.keys(savedData).length === 0) return

  if (props.interceptStorage) {
    savedData = (props.interceptStorage(savedData as TModel) ?? savedData) as Record<string, unknown>
  }

  Object.assign(props.model, savedData)
})

/**
 * Persist model to storage. Call after successful validation.
 */
function persistToStorage() {
  if (storageType.value !== 'none') {
    writeStorage(storageType.value, props.form.introspection.name, props.model)
  }
}

defineExpose({
  formEl,
  persistToStorage,
})
</script>
