<template>
  <div v-show="visible" :class="spanClass">
    <!-- Nested form -->
    <IntrospectionForm
      v-if="fieldForm"
      as="div"
      :form="fieldForm"
      :columns="columns"
      :model="(validatable as Record<string, unknown>)"
      dependent
    />

    <!-- Error: no component assigned -->
    <div v-else-if="typeof field.component !== 'function'" class="introspection-field-error">
      The field '{{ field.name }}' does not have an assigned component.
    </div>

    <!-- Custom component (no introspection metadata) -->
    <component
      v-else-if="!field.introspection"
      :is="field.component!(model)"
      :id="id"
      v-bind="toValues(model, field.props)"
      v-on="toEmits(model, field.emits)"
      :validatable="typingProxy"
    />

    <!-- Regular form field -->
    <component
      v-else
      :is="field.component!(model)"
      :id="id"
      :name="`${type.name}.${field.name}`"
      :required="(validatable as any)?.required"
      :label="field.label?.(model) ?? t(`${translationPrefix}${type.name}.${field.name}`)"
      :info="field.info?.(model)"
      v-bind="toValues(model, field.props)"
      v-on="toEmits(model, field.emits)"
      :validatable="typingProxy"
      :disabled="field.disabled?.(model)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, useId } from 'vue'
import type { DryvValidatableField } from 'dryvjs'
import type { FieldRuntime, IntrospectionField, IntrospectionType, Translate, ValidatableField } from '../types'
import { convert } from '../utils/convert'
import IntrospectionForm from './IntrospectionForm.vue'

const props = withDefaults(
  defineProps<{
    validatable?: DryvValidatableField | ValidatableField | unknown
    model: object
    type: IntrospectionType
    field: Partial<FieldRuntime>
    columns: number
  }>(),
  { columns: 2 },
)

const t = inject<Translate>('introspection-forms:translate', (key: string) => key)
const translationPrefix = inject<string>('introspection-forms:translationPrefix', 'forms.')
const id = useId()

const typingProxy = computed(() =>
  props.validatable && props.field?.introspection
    ? createTypingProxy(props.validatable as ValidatableField, props.field.introspection, newValue => {
        const handler = props.field.emits?.['update:modelValue']
        if (handler) handler(props.model, t, newValue)
      })
    : props.validatable,
)

const fieldForm = computed(() => props.field.form?.())
const visible = computed(
  () => (props.field.visible?.(props.model) ?? true) && (fieldForm.value?.visible(props.model as any) ?? true),
)

const spanClass = computed(() => `introspection-field introspection-field--${props.field.name} span-${props.field.span?.(props.model) ?? props.columns}`)

function toValues(
  item: object,
  functions: Record<string, (item: unknown, t: Translate) => unknown> | undefined,
): Record<string, unknown> {
  return functions
    ? Object.fromEntries(Object.entries(functions).map(([key, value]) => [key, value(item, t)]))
    : {}
}

function toEmits(
  item: object,
  emits: Record<string, (...args: any[]) => void> | undefined,
): Record<string, (...args: unknown[]) => void> {
  return emits
    ? Object.fromEntries(
        Object.entries(emits).map(([key, handler]) => [key, (...args: unknown[]) => handler(item, t, ...args)]),
      )
    : {}
}

function createTypingProxy(
  validatable: ValidatableField,
  introspection: IntrospectionField,
  onValueChange?: (newValue: unknown) => void,
) {
  return new Proxy(validatable, {
    get(target: ValidatableField, prop: string | symbol) {
      return (target as Record<string | symbol, unknown>)[prop]
    },
    set(target: ValidatableField, prop: string | symbol, newValue: unknown) {
      const value = prop === 'value' ? convert(newValue, introspection.type) : newValue;
      (target as Record<string | symbol, unknown>)[prop] = value
      if (prop === 'value' && onValueChange) onValueChange(value)
      return true
    },
  })
}
</script>
