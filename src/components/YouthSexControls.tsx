import { useId } from 'react'
import type { YouthSex } from '../types/domain'

export const youthSexFilters = [
  { value: 'all', label: 'Todos' },
  { value: 'male', label: 'Varones' },
  { value: 'female', label: 'Mujeres' },
  { value: 'unset', label: 'Sin registrar' },
] as const

export type YouthSexFilterValue = typeof youthSexFilters[number]['value']

export function readYouthSex(value: unknown): YouthSex | null {
  return value === 'male' || value === 'female' ? value : null
}

export function matchesYouthSex(sex: YouthSex | null | undefined, filter: YouthSexFilterValue) {
  if (filter === 'all') return true
  if (filter === 'unset') return !sex
  return sex === filter
}

export function YouthSexFilter({ value, onChange }: {
  value: YouthSexFilterValue
  onChange: (value: YouthSexFilterValue) => void
}) {
  return <div>
    <span className="youth-sex-label">Sexo</span>
    <div className="segmented youth-sex-filter" role="group" aria-label="Filtrar por sexo">
      {youthSexFilters.map(option => <button type="button" key={option.value}
        className={value === option.value ? 'active' : ''} aria-pressed={value === option.value}
        onClick={() => onChange(option.value)}>{option.label}</button>)}
    </div>
  </div>
}

export function YouthSexField({ value }: { value?: YouthSex | null }) {
  const id = useId()
  return <div>
    <label htmlFor={id}>Sexo</label>
    <select id={id} name="sex" defaultValue={value ?? ''}>
      <option value="">Sin registrar</option>
      <option value="male">Varón</option>
      <option value="female">Mujer</option>
    </select>
  </div>
}
