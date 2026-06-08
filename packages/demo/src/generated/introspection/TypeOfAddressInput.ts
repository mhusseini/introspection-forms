import type { IntrospectionType } from '@softwareproduction/introspection-forms'
import { type AddressInput } from '../graphql-types'

export const TypeOfAddressInput: IntrospectionType<AddressInput> = {
  name: 'AddressInput',
  fields: [
    { name: 'street', type: 'string', originalType: 'String', isArray: false, isNullable: false, isEnum: false, enumValues: [], defaultValue: '' },
    { name: 'houseNumber', type: 'string', originalType: 'String', isArray: false, isNullable: false, isEnum: false, enumValues: [], defaultValue: '' },
    { name: 'zipCode', type: 'string', originalType: 'String', isArray: false, isNullable: false, isEnum: false, enumValues: [], defaultValue: '' },
    { name: 'city', type: 'string', originalType: 'String', isArray: false, isNullable: false, isEnum: false, enumValues: [], defaultValue: '' },
    { name: 'country', type: 'string', originalType: 'String', isArray: false, isNullable: true, isEnum: false, enumValues: [], defaultValue: null },
  ],
  create(defaultValues?: Partial<AddressInput>): AddressInput {
    return {
      street: '',
      houseNumber: '',
      zipCode: '',
      city: '',
      country: null,
      ...(defaultValues || {}),
    } as AddressInput
  },
}
