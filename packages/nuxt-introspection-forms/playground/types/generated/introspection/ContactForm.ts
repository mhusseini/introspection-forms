import type { IntrospectionType } from '@softwareproduction/introspection-forms'

export const ContactForm: IntrospectionType = {
  name: 'ContactForm',
  fields: [
    {name: 'name', type: 'string', required: true},
    {name: 'newsletter', type: 'boolean'},
    {name: 'country', type: 'enum', values: ['DE', 'AT', 'CH']},
  ],
}
