<template>
  <div class="app">
    <header>
      <h1>Introspection Forms Demo</h1>
      <p class="subtitle">Complex registration form with validation, conditional fields, and nested address forms</p>
    </header>

    <main>
      <div class="registration-form">
        <Suspense>
          <IntrospectionForm
            :form="form"
            :model="model"
            v-model:validate="validate"
            :storage="false"
          >
            <div class="form-actions">
              <button type="button" class="btn btn-primary" :disabled="isSubmitting" @click="handleSubmit">
                {{ isSubmitting ? 'Submitting...' : 'Register' }}
              </button>
              <button type="button" class="btn btn-secondary" @click="resetForm">Reset</button>
            </div>
          </IntrospectionForm>
        </Suspense>
      </div>

      <!-- Debug Panel -->
      <aside class="debug-panel">
        <h3>Model State</h3>
        <pre>{{ JSON.stringify(model, null, 2) }}</pre>
        <h3>Validation</h3>
        <pre>{{ JSON.stringify({}, null, 2) }}</pre>
      </aside>
    </main>

    <!-- Success Overlay -->
    <div v-if="submitted" class="success-overlay" @click="submitted = false">
      <div class="success-message">
        <h2>✓ Registration Successful</h2>
        <p>Your data has been submitted. Click anywhere to dismiss.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import './App.css'
import { ref, reactive, watch } from 'vue'
import { useIntrospectionForm } from 'introspection-forms'
import IntrospectionForm from 'introspection-forms/components/IntrospectionForm.vue'
import { TypeOfRegistrationFormInput, TypeOfAddressInput } from './generated/introspection'
import { RegistrationFormValidationSet } from './validation/RegistrationFormRules'
import { Salutation, ContactMethod, EmploymentStatus } from './generated/graphql-types'
import FormSelect from './components/FormSelect.vue'
import FormRadio from './components/FormRadio.vue'

// Create model from introspection metadata, wrapped in reactive for Vue tracking
const model = reactive(TypeOfRegistrationFormInput.create({
  useSameAddress: true,
  acceptNewsletter: false,
  billingAddress: TypeOfAddressInput.create(),
}))

const validate = ref<(checkOnly?: boolean) => Promise<boolean>>()
const isSubmitting = ref(false)
const submitted = ref(false)

// Initialize billingAddress when useSameAddress is unchecked
watch(() => model.useSameAddress, (useSame) => {
  if (!useSame && !model.billingAddress) {
    model.billingAddress = TypeOfAddressInput.create()
  }
})

// Nested address form
const addressForm = useIntrospectionForm(TypeOfAddressInput, {
  street: { props: { placeholder: 'Main Street' }, span: 1 },
  houseNumber: { props: { placeholder: '42a' }, span: 1 },
  zipCode: { props: { placeholder: '12345' }, span: 1 },
  city: { props: { placeholder: 'Berlin' }, span: 1 },
  country: { props: { placeholder: 'Germany' } },
})

// Nested billing address form
const billingAddressForm = useIntrospectionForm(TypeOfAddressInput, {
  street: { props: { placeholder: 'Main Street' }, span: 1 },
  houseNumber: { props: { placeholder: '42a' }, span: 1 },
  zipCode: { props: { placeholder: '12345' }, span: 1 },
  city: { props: { placeholder: 'Berlin' }, span: 1 },
  country: { props: { placeholder: 'Germany' } },
})

// Main registration form
const form = useIntrospectionForm(TypeOfRegistrationFormInput, RegistrationFormValidationSet, {
  salutation: {
    component: FormRadio,
    props: {
      options: () => [
        { value: Salutation.Mr, label: 'Mr' },
        { value: Salutation.Mrs, label: 'Mrs' },
        { value: Salutation.Other, label: 'Other' },
      ],
    },
  },
  firstName: { props: { placeholder: 'Enter your first name' }, span: 1 },
  lastName: { props: { placeholder: 'Enter your last name' }, span: 1 },
  dateOfBirth: { span: 1 },
  email: { props: { placeholder: 'you@example.com' }, span: 1 },
  phone: { props: { placeholder: '+49 123 456789' }, span: 1 },
  preferredContact: {
    component: FormRadio,
    props: {
      options: () => [
        { value: ContactMethod.Email, label: 'Email' },
        { value: ContactMethod.Phone, label: 'Phone' },
        { value: ContactMethod.Mail, label: 'Mail' },
      ],
    },
  },
  address: { form: addressForm, label: 'Address' },
  useSameAddress: true,
  billingAddress: {
    form: billingAddressForm,
    label: 'Billing Address',
    visible: (m) => !m.useSameAddress,
  },
  employmentStatus: {
    component: FormSelect,
    props: {
      options: () => [
        { value: EmploymentStatus.Employed, label: 'Employed' },
        { value: EmploymentStatus.SelfEmployed, label: 'Self-Employed' },
        { value: EmploymentStatus.Student, label: 'Student' },
        { value: EmploymentStatus.Retired, label: 'Retired' },
        { value: EmploymentStatus.Unemployed, label: 'Unemployed' },
      ],
    },
  },
  companyName: {
    visible: (m) =>
      m.employmentStatus === EmploymentStatus.Employed || m.employmentStatus === EmploymentStatus.SelfEmployed,
    props: { placeholder: 'Acme Corp.' },
    span: 1,
  },
  annualIncome: {
    visible: (m) =>
      m.employmentStatus !== EmploymentStatus.Unemployed && m.employmentStatus !== EmploymentStatus.Student,
    props: { placeholder: '45000' },
    span: 1,
  },
  referralCode: { props: { placeholder: 'ABC123' }, span: 1 },
  notes: { props: { placeholder: 'Any additional comments...' } },
  acceptTerms: true,
  acceptNewsletter: true,
})

function resetForm() {
  Object.assign(model, TypeOfRegistrationFormInput.create({
    useSameAddress: true,
    acceptNewsletter: false,
    billingAddress: TypeOfAddressInput.create(),
  }))
}

async function handleSubmit() {
  isSubmitting.value = true
  try {
    const success = await validate.value?.()
    if (success) {
      submitted.value = true
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

