<template>
  <component
    :is="as"
    :name="form.introspection.name"
    v-show="form.visible(unref(innerModel) as TModel)"
    v-bind="toValues(innerModel, form.props)"
    ref="elRef"
    @submit.prevent
  >
    <slot name="fields" :fields="form.fields" :model="innerModel" :validatable="resolvedValidatable">
      <IntrospectionField
        v-for="field in form.fields"
        :key="field.name"
        :type="form.introspection"
        :field="field"
        :model="innerModel"
        :validatable="getFieldValidatable(field.name!)"
        :columns="columns"
      />
    </slot>
    <slot />
  </component>
</template>

<script setup lang="ts" generic="TModel extends Record<string, unknown>">
import { ref, computed, onMounted, watch, watchEffect, unref, inject, type Ref } from 'vue'
import type { FormRuntime, FieldRuntime, IntrospectionField as IntrospectionFieldType, Translate } from '../types'
import type { DryvValidatableObject, DryvValidationResult, DryvValidationRuleSet } from 'dryvjs'
import type { UseDryvResult } from 'dryvue'
import { readStorage, writeStorage } from '../utils/storage'
import IntrospectionField from './IntrospectionField.vue'

let useDryvImport: typeof import('dryvue')['useDryv'] | undefined
try {
  useDryvImport = (await import('dryvue')).useDryv
} catch {
  // dryvue not available — form will work without validation
}

const props = withDefaults(
  defineProps<{
    as?: string
    model: TModel
    form: FormRuntime<TModel>
    columns?: number
    dependent?: boolean
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

const validateModel = defineModel<(checkOnly?: boolean) => Promise<boolean>>('validate')
const dirtyModel = defineModel<boolean>('dirty', { default: false })
const loaded = defineModel<boolean>('loaded', { default: false })
const parametersOut = defineModel<object>('parameters')
const el = defineModel<HTMLElement>('el')

const elRef = ref<HTMLElement>()

const storageType = computed(() =>
  props.storage === true ? 'session' : props.storage === false ? 'none' : props.storage,
)

const t = inject<Translate>('introspection-forms:translate', (key: string) => key)

/**
 * Form initialization - Three scenarios based on form configuration:
 *
 * SCENARIO 1 - DEPENDENT FORM (`props.dependent === true`):
 * A child form embedded within a parent form. Shares validation lifecycle with parent.
 * Cannot be validated independently. validatable = props.model directly.
 *
 * SCENARIO 2 - STANDALONE WITH EXTERNAL VALIDATABLE (`props.validatable` provided):
 * The parent already created the Dryv session and passes validatable in.
 * innerModel = props.model, resolvedValidatable = props.validatable.
 *
 * SCENARIO 3 - STANDALONE WITHOUT VALIDATION (no rules, no external validatable):
 * A simple form that accepts input but has no validation.
 * Creates a manual proxy mimicking Dryv's interface.
 */
interface FormSession {
  resolvedValidatable: DryvValidatableObject<TModel> | Record<string, unknown>
  innerModel: TModel | Ref<TModel>
  validate: () => Promise<DryvValidationResult | { success: boolean }>
  dirty?: Ref<boolean>
  reset?: () => void
  revert?: () => void
  parameters?: Ref<object | undefined>
}

let session: FormSession

if (props.dependent) {
  session = {
    resolvedValidatable: props.model as Record<string, unknown>,
    innerModel: props.model,
    validate: async () => {
      throw new Error('Dependent forms cannot be validated')
    },
  }
} else if (props.validatable) {
  session = {
    resolvedValidatable: props.validatable,
    innerModel: props.model,
    validate: async () => ({ success: true }),
  }
} else if (props.form.rules && useDryvImport) {
  const dryvResult: UseDryvResult<TModel> = useDryvImport<TModel>(
    props.model,
    props.form.rules as DryvValidationRuleSet<TModel>,
  )
  session = {
    resolvedValidatable: dryvResult.validatable,
    innerModel: dryvResult.model as TModel,
    validate: dryvResult.validate,
    dirty: dryvResult.dirty,
    reset: dryvResult.reset,
    revert: dryvResult.revert,
    parameters: dryvResult.parameters as Ref<object | undefined>,
  }
} else {
  session = {
    resolvedValidatable: new Proxy(props.model as object, {
      get(_: object, prop: string | symbol) {
        return {
          get value() {
            return props.model[prop as keyof typeof props.model]
          },
          set value(value: unknown) {
            ;(props.model as TModel)[prop as keyof TModel] = value as TModel[keyof TModel]
          },
          text: null,
        }
      },
    }) as Record<string, unknown>,
    innerModel: props.model,
    validate: async () => ({ success: true }),
  }
}

const { resolvedValidatable, innerModel, dirty, reset, revert, parameters } = session

// Sync validatable with props.model changes
if (!props.dependent && resolvedValidatable && props.model) {
  watchEffect(() => {
    const validatableRef = resolvedValidatable as unknown as Ref<object>
    if (validatableRef?.value) {
      Object.assign(validatableRef.value, props.model)
    }
  })
}

// Expose dirty state
if (dirty) {
  watchEffect(() => {
    dirtyModel.value = !!dirty.value
  })
}

// Expose parameters
if (parameters) {
  watchEffect(() => {
    parametersOut.value = unref(parameters)
  })
}

// Expose element reference
watchEffect(() => {
  if (elRef.value) {
    el.value = elRef.value
  }
})

// Expose validate command
validateModel.value = async (checkOnly?: boolean) => {
  const result = await session.validate() as DryvValidationResult

  const validationSuccessful = !result.hasErrors && !result.hasNewWarnings

  if (checkOnly) {
    if (reset) reset()
    return validationSuccessful
  }

  if (validationSuccessful) {
    const resolvedModel = unref(innerModel)
    if (resolvedModel) {
      Object.assign(props.model, resolvedModel)
    }

    if (storageType.value !== 'none') {
      writeStorage(storageType.value, props.form.introspection.name, props.model)
    }
  }

  return validationSuccessful
}

function getFieldValidatable(fieldName: string): unknown {
  return resolvedValidatable?.[fieldName]
}

function toValues(
  item: object | Ref<object>,
  functions: Record<string, (item?: unknown) => unknown> | undefined,
): Record<string, unknown> {
  const resolved = unref(item)
  return functions
    ? Object.fromEntries(Object.entries(functions).map(([key, value]) => [key, value(resolved)]))
    : {}
}

//
// Load from storage
//
onMounted(() => {
  loadFromStorage()
  loaded.value = true
  watch(() => props.model, loadFromStorage)
})

function loadFromStorage() {
  if (!(props.model && storageType.value !== 'none')) {
    return
  }

  let savedData = readStorage(storageType.value, props.form.introspection.name)
  if (!(savedData && Object.keys(savedData).length > 0)) {
    return
  }

  if (props.interceptStorage) {
    savedData = (props.interceptStorage(savedData as TModel) ?? savedData) as Record<string, unknown>
  }

  Object.assign(props.model, savedData)
}

defineExpose({
  el: elRef,
  persistToStorage() {
    if (storageType.value !== 'none') {
      writeStorage(storageType.value, props.form.introspection.name, props.model)
    }
  },
})
</script>
