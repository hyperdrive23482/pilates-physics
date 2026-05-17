export function workshopUrl(slug) {
  if (!slug) return '/education'
  if (slug.startsWith('PP-101')) return '/pilates-physics-101'
  if (slug.startsWith('PP-102')) return '/pilates-physics-102'
  return `/workshops/${slug}`
}

// "Wed May 20 11am PDT" — short weekday + month + day, time in the viewer's
// local zone with lowercase am/pm and no minutes when on the hour.
export function formatWorkshopWhen(scheduledAt) {
  if (!scheduledAt) return ''
  const d = new Date(scheduledAt)

  const datePart = d
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    .replace(',', '')

  const onTheHour = d.getMinutes() === 0
  const timePart = d
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      ...(onTheHour ? {} : { minute: '2-digit' }),
      timeZoneName: 'short',
    })
    .replace(/\s(AM|PM)/, (_, m) => m.toLowerCase())

  return `${datePart} ${timePart}`
}
