export const POSITION_OPTIONS = [
  { value: 'Technician', label: 'Technician' },
  { value: 'Foreman', label: 'Foreman' },
  { value: 'Diagnostician', label: 'Diagnostician' },
  { value: 'Advisor', label: 'Advisor' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Warranty Clerk', label: 'Warranty Clerk' },
] as const;

export type Position = (typeof POSITION_OPTIONS)[number]['value'];
