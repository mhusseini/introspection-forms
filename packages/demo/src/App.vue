<template>
  <div class="app">
    <header>
      <h1>Introspection Forms Demo</h1>
      <p class="subtitle">Complex registration form with validation, conditional fields, and nested address forms</p>
    </header>

    <main>
      <form @submit.prevent="handleSubmit" class="registration-form">
        <!-- Personal Information Section -->
        <section class="form-section">
          <h2>Personal Information</h2>
          <div class="form-grid">
            <FormRadio
              label="Salutation"
              :validatable="validatable.salutation"
              :required="true"
              :options="salutationOptions"
            />
            <FormInput
              label="First Name"
              :validatable="validatable.firstName"
              :required="true"
              placeholder="Enter your first name"
            />
            <FormInput
              label="Last Name"
              :validatable="validatable.lastName"
              :required="true"
              placeholder="Enter your last name"
            />
            <FormDateInput
              label="Date of Birth"
              :validatable="validatable.dateOfBirth"
            />
          </div>
        </section>

        <!-- Contact Section -->
        <section class="form-section">
          <h2>Contact Details</h2>
          <div class="form-grid">
            <FormInput
              label="Email"
              type="email"
              :validatable="validatable.email"
              :required="true"
              placeholder="you@example.com"
            />
            <FormInput
              label="Phone"
              type="tel"
              :validatable="validatable.phone"
              :required="model.preferredContact === 'Phone'"
              placeholder="+49 123 456789"
            />
            <FormRadio
              label="Preferred Contact Method"
              :validatable="validatable.preferredContact"
              :required="true"
              :options="contactMethodOptions"
            />
          </div>
        </section>

        <!-- Address Section -->
        <section class="form-section">
          <h2>Address</h2>
          <div class="form-grid">
            <FormInput
              label="Street"
              :validatable="addressValidatable.street"
              :required="true"
              placeholder="Main Street"
            />
            <FormInput
              label="House Number"
              :validatable="addressValidatable.houseNumber"
              :required="true"
              placeholder="42a"
            />
            <FormInput
              label="ZIP Code"
              :validatable="addressValidatable.zipCode"
              :required="true"
              placeholder="12345"
            />
            <FormInput
              label="City"
              :validatable="addressValidatable.city"
              :required="true"
              placeholder="Berlin"
            />
            <FormInput
              label="Country"
              :validatable="addressValidatable.country"
              placeholder="Germany"
            />
          </div>
        </section>

        <!-- Billing Address Section (conditional) -->
        <section class="form-section">
          <h2>Billing Address</h2>
          <FormCheckbox
            label="Use same address for billing"
            :validatable="validatable.useSameAddress"
          />
          <div v-if="!model.useSameAddress" class="form-grid billing-address">
            <FormInput label="Street" placeholder="Billing Street" />
            <FormInput label="House Number" placeholder="1" />
            <FormInput label="ZIP Code" placeholder="10115" />
            <FormInput label="City" placeholder="Munich" />
          </div>
        </section>

        <!-- Employment Section -->
        <section class="form-section">
          <h2>Employment</h2>
          <div class="form-grid">
            <FormSelect
              label="Employment Status"
              :validatable="validatable.employmentStatus"
              :required="true"
              :options="employmentOptions"
            />
            <FormInput
              v-if="showCompanyField"
              label="Company Name"
              :validatable="validatable.companyName"
              :required="showCompanyField"
              placeholder="Acme Corp."
            />
            <FormInput
              v-if="showIncomeField"
              label="Annual Income (€)"
              type="number"
              :validatable="validatable.annualIncome"
              placeholder="45000"
            />
          </div>
        </section>

        <!-- Additional Section -->
        <section class="form-section">
          <h2>Additional Information</h2>
          <div class="form-grid">
            <FormInput
              label="Referral Code"
              :validatable="validatable.referralCode"
              placeholder="ABC123"
            />
            <FormTextarea
              label="Notes"
              :validatable="validatable.notes"
              placeholder="Any additional comments..."
            />
          </div>
        </section>

        <!-- Terms & Consent -->
        <section class="form-section">
          <h2>Consent</h2>
          <FormCheckbox
            label="I accept the terms and conditions"
            :validatable="validatable.acceptTerms"
            :required="true"
          />
          <FormCheckbox
            label="Subscribe to newsletter"
            :validatable="validatable.acceptNewsletter"
          />
        </section>

        <!-- Actions -->
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            {{ isSubmitting ? 'Submitting...' : 'Register' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="resetForm">Reset</button>
        </div>
      </form>

      <!-- Debug Panel -->
      <aside class="debug-panel">
        <h3>Model State</h3>
        <pre>{{ JSON.stringify(model, null, 2) }}</pre>
        <h3>Validation</h3>
        <pre>{{ JSON.stringify(validationState, null, 2) }}</pre>
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
import { ref, reactive, computed } from 'vue'
import { useDryv } from 'dryvue'
import { TypeOfRegistrationFormInput } from './generated/introspection'
import { RegistrationFormValidationSet } from './validation/RegistrationFormRules'
import { AddressValidationSet } from './validation/AddressRules'
import { Salutation, ContactMethod, EmploymentStatus } from './generated/graphql-types'
import FormInput from './components/FormInput.vue'
import FormCheckbox from './components/FormCheckbox.vue'
import FormRadio from './components/FormRadio.vue'
import FormSelect from './components/FormSelect.vue'
import FormTextarea from './components/FormTextarea.vue'
import FormDateInput from './components/FormDateInput.vue'

// Create model from introspection metadata
const formData = TypeOfRegistrationFormInput.create({
  useSameAddress: true,
  acceptNewsletter: false,
})

// Set up Dryv validation for the main form
const { validatable, model, validate } = useDryv(formData, RegistrationFormValidationSet)

// Set up Dryv validation for the nested address
const { validatable: addressValidatable } = useDryv(model.address, AddressValidationSet)

const isSubmitting = ref(false)
const submitted = ref(false)

// Computed conditions for dynamic fields
const showCompanyField = computed(
  () => model.employmentStatus === EmploymentStatus.Employed || model.employmentStatus === EmploymentStatus.SelfEmployed,
)
const showIncomeField = computed(
  () => model.employmentStatus !== EmploymentStatus.Unemployed && model.employmentStatus !== EmploymentStatus.Student,
)

// Options
const salutationOptions = [
  { value: Salutation.Mr, label: 'Mr' },
  { value: Salutation.Mrs, label: 'Mrs' },
  { value: Salutation.Other, label: 'Other' },
]

const contactMethodOptions = [
  { value: ContactMethod.Email, label: 'Email' },
  { value: ContactMethod.Phone, label: 'Phone' },
  { value: ContactMethod.Mail, label: 'Mail' },
]

const employmentOptions = [
  { value: EmploymentStatus.Employed, label: 'Employed' },
  { value: EmploymentStatus.SelfEmployed, label: 'Self-Employed' },
  { value: EmploymentStatus.Student, label: 'Student' },
  { value: EmploymentStatus.Retired, label: 'Retired' },
  { value: EmploymentStatus.Unemployed, label: 'Unemployed' },
]

// Validation state for debug
const validationState = computed(() => {
  const fields: Record<string, string | null> = {}
  for (const key of Object.keys(validatable)) {
    const v = (validatable as Record<string, { text: string | null }>)[key]
    if (v?.text) fields[key] = v.text
  }
  for (const key of Object.keys(addressValidatable)) {
    const v = (addressValidatable as Record<string, { text: string | null }>)[key]
    if (v?.text) fields[`address.${key}`] = v.text
  }
  return fields
})

async function handleSubmit() {
  isSubmitting.value = true
  try {
    const result = await validate()
    if (result?.success) {
      submitted.value = true
    }
  } finally {
    isSubmitting.value = false
  }
}

function resetForm() {
  const fresh = TypeOfRegistrationFormInput.create({ useSameAddress: true })
  Object.assign(model, fresh)
}
</script>

<style>
:root {
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-error: #dc2626;
  --color-warning: #d97706;
  --color-success: #16a34a;
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  --color-text: #1e293b;
  --color-text-muted: #64748b;
  --radius: 8px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
}

.app {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

header {
  text-align: center;
  margin-bottom: 2rem;
}

header h1 {
  font-size: 2rem;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: var(--color-text-muted);
}

main {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 1024px) {
  main { grid-template-columns: 1fr; }
  .debug-panel { order: -1; }
}

.registration-form {
  background: var(--color-surface);
  border-radius: var(--radius);
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 1rem;
}

.form-section h2 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: var(--color-primary);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.form-field input,
.form-field select,
.form-field textarea {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
  background: var(--color-surface);
}

.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-field.has-error input,
.form-field.has-error select,
.form-field.has-error textarea {
  border-color: var(--color-error);
}

.form-field .error {
  font-size: 0.8rem;
  color: var(--color-error);
  margin-top: 0.125rem;
}

.form-field .required {
  color: var(--color-error);
}

.form-field--checkbox label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.form-field--checkbox input {
  width: 1rem;
  height: 1rem;
}

.form-field--radio fieldset {
  border: none;
  padding: 0;
}

.form-field--radio legend {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.25rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.radio-option input {
  margin: 0;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.65rem 1.5rem;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background 0.2s;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-border);
  color: var(--color-text);
}

.btn-secondary:hover {
  background: #cbd5e1;
}

.debug-panel {
  background: var(--color-surface);
  border-radius: var(--radius);
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 1rem;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
}

.debug-panel h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
  margin-top: 1rem;
}

.debug-panel h3:first-child {
  margin-top: 0;
}

.debug-panel pre {
  font-size: 0.75rem;
  background: #f1f5f9;
  padding: 0.75rem;
  border-radius: 6px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.billing-address {
  margin-top: 1rem;
}

.success-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.success-message {
  background: white;
  padding: 2.5rem;
  border-radius: var(--radius);
  text-align: center;
  max-width: 400px;
}

.success-message h2 {
  color: var(--color-success);
  margin-bottom: 0.5rem;
}
</style>
