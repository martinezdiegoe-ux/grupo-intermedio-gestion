const argentinaYear = new Intl.DateTimeFormat('es-AR', {
  year: 'numeric',
  timeZone: 'America/Argentina/Buenos_Aires',
})

export function currentGraduationYear(now = new Date()) {
  return Number(argentinaYear.format(now))
}

export function isGraduatingInYear(birthDate: string, year: number) {
  const birthYear = year - 18
  // A birth date is a calendar day, so compare ISO dates without a UTC conversion.
  return /^\d{4}-\d{2}-\d{2}$/.test(birthDate) &&
    birthDate >= `${birthYear}-01-01` && birthDate <= `${birthYear}-12-31`
}
