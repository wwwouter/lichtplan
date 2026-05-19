const TIMESTAMP_SUFFIX_PATTERN = /^(.*)(\d{4}-\d{2}-\d{2}T\d{2}:?\d{2})$/

export function refreshTimestampSuffix(filePath: string | undefined, now = new Date()): string | undefined {
  if (!filePath) return filePath

  const pathSeparatorIndex = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
  const directory = pathSeparatorIndex >= 0 ? filePath.slice(0, pathSeparatorIndex + 1) : ''
  const fileName = pathSeparatorIndex >= 0 ? filePath.slice(pathSeparatorIndex + 1) : filePath
  const extensionIndex = fileName.lastIndexOf('.')
  const hasExtension = extensionIndex > 0
  const stem = hasExtension ? fileName.slice(0, extensionIndex) : fileName
  const extension = hasExtension ? fileName.slice(extensionIndex) : ''
  const match = stem.match(TIMESTAMP_SUFFIX_PATTERN)

  if (!match) return filePath

  const [, prefix, timestamp] = match
  const separator = timestamp.includes(':') ? ':' : ''
  return `${directory}${prefix}${formatLocalMinuteStamp(now, separator)}${extension}`
}

function formatLocalMinuteStamp(date: Date, timeSeparator: ':' | ''): string {
  const year = date.getFullYear()
  const month = pad2(date.getMonth() + 1)
  const day = pad2(date.getDate())
  const hours = pad2(date.getHours())
  const minutes = pad2(date.getMinutes())
  return `${year}-${month}-${day}T${hours}${timeSeparator}${minutes}`
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}
