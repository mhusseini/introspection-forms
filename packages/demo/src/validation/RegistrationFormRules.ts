import type { DryvValidationRuleSet } from 'dryvue'
import type { RegistrationFormInput } from '../generated/graphql-types'

/**
 * Local Dryv validation rules for the RegistrationFormInput.
 * These are defined locally (not fetched from a server) for demo purposes.
 */
export const RegistrationFormValidationSet = {
  name: 'RegistrationForm',
  validators: {
    firstName: [
      {
        annotations: { required: true },
        validate($m: RegistrationFormInput) {
          return !$m.firstName?.trim()
            ? { type: 'error', text: 'First name is required.', group: null }
            : null
        },
      },
      {
        validate($m: RegistrationFormInput) {
          return $m.firstName && $m.firstName.length < 2
            ? { type: 'error', text: 'First name must be at least 2 characters.', group: null }
            : null
        },
      },
    ],
    lastName: [
      {
        annotations: { required: true },
        validate($m: RegistrationFormInput) {
          return !$m.lastName?.trim()
            ? { type: 'error', text: 'Last name is required.', group: null }
            : null
        },
      },
    ],
    email: [
      {
        annotations: { required: true },
        validate($m: RegistrationFormInput) {
          return !$m.email?.trim()
            ? { type: 'error', text: 'Email address is required.', group: null }
            : null
        },
      },
      {
        validate($m: RegistrationFormInput) {
          return $m.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($m.email)
            ? { type: 'error', text: 'Please enter a valid email address.', group: null }
            : null
        },
      },
    ],
    phone: [
      {
        validate($m: RegistrationFormInput) {
          if ($m.preferredContact !== 'Phone') return null
          return !$m.phone?.trim()
            ? { type: 'error', text: 'Phone number is required when phone is the preferred contact method.', group: null }
            : null
        },
      },
      {
        validate($m: RegistrationFormInput) {
          if (!$m.phone) return null
          return !/^[+]?[\d\s\-()]{7,20}$/.test($m.phone)
            ? { type: 'error', text: 'Please enter a valid phone number.', group: null }
            : null
        },
      },
    ],
    dateOfBirth: [
      {
        validate($m: RegistrationFormInput) {
          if (!$m.dateOfBirth) return null
          const dob = new Date($m.dateOfBirth)
          const now = new Date()
          const age = now.getFullYear() - dob.getFullYear()
          return age < 18
            ? { type: 'error', text: 'You must be at least 18 years old.', group: null }
            : null
        },
      },
      {
        validate($m: RegistrationFormInput) {
          if (!$m.dateOfBirth) return null
          const dob = new Date($m.dateOfBirth)
          return dob > new Date()
            ? { type: 'error', text: 'Date of birth cannot be in the future.', group: null }
            : null
        },
      },
    ],
    annualIncome: [
      {
        validate($m: RegistrationFormInput) {
          if ($m.employmentStatus === 'Unemployed' || $m.employmentStatus === 'Student') return null
          return $m.annualIncome != null && $m.annualIncome < 0
            ? { type: 'error', text: 'Annual income cannot be negative.', group: null }
            : null
        },
      },
      {
        validate($m: RegistrationFormInput) {
          if ($m.employmentStatus === 'Unemployed' || $m.employmentStatus === 'Student') return null
          return $m.annualIncome != null && $m.annualIncome > 10000000
            ? { type: 'warning', text: 'Please verify — this seems unusually high.', group: null }
            : null
        },
      },
    ],
    companyName: [
      {
        validate($m: RegistrationFormInput) {
          if ($m.employmentStatus !== 'Employed' && $m.employmentStatus !== 'SelfEmployed') return null
          return !$m.companyName?.trim()
            ? { type: 'error', text: 'Company name is required for employed/self-employed applicants.', group: null }
            : null
        },
      },
    ],
    acceptTerms: [
      {
        annotations: { required: true },
        validate($m: RegistrationFormInput) {
          return !$m.acceptTerms
            ? { type: 'error', text: 'You must accept the terms and conditions.', group: null }
            : null
        },
      },
    ],
    referralCode: [
      {
        validate($m: RegistrationFormInput) {
          if (!$m.referralCode) return null
          return !/^[A-Z0-9]{6,12}$/.test($m.referralCode)
            ? { type: 'error', text: 'Referral code must be 6-12 uppercase alphanumeric characters.', group: null }
            : null
        },
      },
    ],
  },
  disablers: {},
  parameters: {},
} as DryvValidationRuleSet<RegistrationFormInput>
