export enum Salutation {
  Mr = 'Mr',
  Mrs = 'Mrs',
  Other = 'Other',
  None = 'None',
}

export enum ContactMethod {
  Email = 'Email',
  Phone = 'Phone',
  Mail = 'Mail',
}

export enum EmploymentStatus {
  Employed = 'Employed',
  SelfEmployed = 'SelfEmployed',
  Student = 'Student',
  Retired = 'Retired',
  Unemployed = 'Unemployed',
}

export interface AddressInput {
  street: string
  houseNumber: string
  zipCode: string
  city: string
  country?: string | null
}

export interface RegistrationFormInput {
  salutation: Salutation
  firstName: string
  lastName: string
  dateOfBirth?: string | null
  email: string
  phone?: string | null
  preferredContact: ContactMethod
  address: AddressInput
  billingAddress?: AddressInput | null
  useSameAddress: boolean
  employmentStatus: EmploymentStatus
  companyName?: string | null
  annualIncome?: number | null
  acceptTerms: boolean
  acceptNewsletter: boolean
  referralCode?: string | null
  notes?: string | null
}
