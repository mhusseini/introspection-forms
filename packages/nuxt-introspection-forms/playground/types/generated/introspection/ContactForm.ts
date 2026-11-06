import type { IntrospectionType } from '@softwareproduction/introspection-forms'

interface ContactModel {
  name: string
  newsletter: boolean
  country: string
}

export const ContactForm: IntrospectionType<ContactModel> = {
  name: 'ContactForm',
  fields: [
    { name: 'name', type: 'string', originalType: 'String', isArray: false, isNullable: false, isEnum: false, enumValues: [], defaultValue: '' },
    { name: 'newsletter', type: 'boolean', originalType: 'Boolean', isArray: false, isNullable: false, isEnum: false, enumValues: [], defaultValue: false },
    { name: 'country', type: 'enum', originalType: 'Country', isArray: false, isNullable: false, isEnum: true, enumValues: ['DE', 'AT', 'CH'], defaultValue: 'DE' },
  ],
  create(defaultValues?: Partial<ContactModel>): ContactModel {
    return { name: '', newsletter: false, country: 'DE', ...(defaultValues || {}) } as ContactModel
  },
}
