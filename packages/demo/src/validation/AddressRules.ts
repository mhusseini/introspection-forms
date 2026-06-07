import type { DryvValidationRuleSet } from 'dryvue'
import type { AddressInput } from '../generated/graphql-types'

/**
 * Local Dryv validation rules for the AddressInput.
 */
export const AddressValidationSet = {
  name: 'Address',
  validators: {
    street: [
      {
        annotations: { required: true },
        validate($m: AddressInput) {
          return !$m.street?.trim()
            ? { type: 'error', text: 'Street is required.', group: null }
            : null
        },
      },
    ],
    houseNumber: [
      {
        annotations: { required: true },
        validate($m: AddressInput) {
          return !$m.houseNumber?.trim()
            ? { type: 'error', text: 'House number is required.', group: null }
            : null
        },
      },
    ],
    zipCode: [
      {
        annotations: { required: true },
        validate($m: AddressInput) {
          return !$m.zipCode?.trim()
            ? { type: 'error', text: 'ZIP code is required.', group: null }
            : null
        },
      },
      {
        validate($m: AddressInput) {
          return $m.zipCode && !/^\d{5}$/.test($m.zipCode)
            ? { type: 'error', text: 'ZIP code must be exactly 5 digits.', group: null }
            : null
        },
      },
    ],
    city: [
      {
        annotations: { required: true },
        validate($m: AddressInput) {
          return !$m.city?.trim()
            ? { type: 'error', text: 'City is required.', group: null }
            : null
        },
      },
    ],
  },
  disablers: {},
  parameters: {},
} as DryvValidationRuleSet<AddressInput>
