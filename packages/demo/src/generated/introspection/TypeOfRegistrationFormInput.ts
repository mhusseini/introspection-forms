import type { IntrospectionType } from 'introspection-forms'
import { type RegistrationFormInput, Salutation, ContactMethod, EmploymentStatus } from '../graphql-types'
import { TypeOfAddressInput } from './TypeOfAddressInput'

export const TypeOfRegistrationFormInput: IntrospectionType<RegistrationFormInput> = {
  name: 'RegistrationFormInput',
  fields: [
    { name: 'salutation', type: 'enum', originalType: 'Salutation', isArray: false, isNullable: false, isEnum: true, enumValues: ['Mr', 'Mrs', 'Other', 'None'], defaultValue: 'Mr' },
    { name: 'firstName', type: 'string', originalType: 'String', isArray: false, isNullable: false, isEnum: false, enumValues: [], defaultValue: '' },
    { name: 'lastName', type: 'string', originalType: 'String', isArray: false, isNullable: false, isEnum: false, enumValues: [], defaultValue: '' },
    { name: 'dateOfBirth', type: 'string', originalType: 'DateTime', isArray: false, isNullable: true, isEnum: false, enumValues: [], defaultValue: null },
    { name: 'email', type: 'string', originalType: 'String', isArray: false, isNullable: false, isEnum: false, enumValues: [], defaultValue: '' },
    { name: 'phone', type: 'string', originalType: 'String', isArray: false, isNullable: true, isEnum: false, enumValues: [], defaultValue: null },
    { name: 'preferredContact', type: 'enum', originalType: 'ContactMethod', isArray: false, isNullable: false, isEnum: true, enumValues: ['Email', 'Phone', 'Mail'], defaultValue: 'Email' },
    { name: 'address', type: 'object', originalType: 'AddressInput', isArray: false, isNullable: false, isEnum: false, enumValues: [], defaultValue: undefined },
    { name: 'billingAddress', type: 'object', originalType: 'AddressInput', isArray: false, isNullable: true, isEnum: false, enumValues: [], defaultValue: null },
    { name: 'useSameAddress', type: 'boolean', originalType: 'Boolean', isArray: false, isNullable: false, isEnum: false, enumValues: [], defaultValue: true },
    { name: 'employmentStatus', type: 'enum', originalType: 'EmploymentStatus', isArray: false, isNullable: false, isEnum: true, enumValues: ['Employed', 'SelfEmployed', 'Student', 'Retired', 'Unemployed'], defaultValue: 'Employed' },
    { name: 'companyName', type: 'string', originalType: 'String', isArray: false, isNullable: true, isEnum: false, enumValues: [], defaultValue: null },
    { name: 'annualIncome', type: 'number', originalType: 'Float', isArray: false, isNullable: true, isEnum: false, enumValues: [], defaultValue: null },
    { name: 'acceptTerms', type: 'boolean', originalType: 'Boolean', isArray: false, isNullable: false, isEnum: false, enumValues: [], defaultValue: false },
    { name: 'acceptNewsletter', type: 'boolean', originalType: 'Boolean', isArray: false, isNullable: false, isEnum: false, enumValues: [], defaultValue: false },
    { name: 'referralCode', type: 'string', originalType: 'String', isArray: false, isNullable: true, isEnum: false, enumValues: [], defaultValue: null },
    { name: 'notes', type: 'string', originalType: 'String', isArray: false, isNullable: true, isEnum: false, enumValues: [], defaultValue: null },
  ],
  create(defaultValues?: Partial<RegistrationFormInput>): RegistrationFormInput {
    return {
      salutation: Salutation.Mr,
      firstName: '',
      lastName: '',
      dateOfBirth: null,
      email: '',
      phone: null,
      preferredContact: ContactMethod.Email,
      address: TypeOfAddressInput.create(),
      billingAddress: null,
      useSameAddress: true,
      employmentStatus: EmploymentStatus.Employed,
      companyName: null,
      annualIncome: null,
      acceptTerms: false,
      acceptNewsletter: false,
      referralCode: null,
      notes: null,
      ...(defaultValues || {}),
    } as RegistrationFormInput
  },
}
