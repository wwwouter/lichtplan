import { ALL_SYMBOLS } from '../symbols'
import { lightingSymbols } from '../symbols/lighting'
import { switchSymbols } from '../symbols/switches'
import { isPlacedSymbolVisible } from '../components/symbolVisibility'
import type { ExportProfile, ExportProfileRule, PlacedSymbol } from '../types/project'

export const CURRENT_VISIBILITY_EXPORT_PROFILE_ID = 'current-visibility'

export interface ResolvedExportProfile {
  id: string
  name: string
  rules: ExportProfileRule[] | null
  builtIn: boolean
}

export interface PdfExportSelection {
  floorId: string
  profileId: string
}

const lightingSymbolIds = lightingSymbols.map((symbol) => symbol.id)
const switchSymbolIds = switchSymbols.map((symbol) => symbol.id)

export const CURRENT_VISIBILITY_EXPORT_PROFILE: ResolvedExportProfile = {
  id: CURRENT_VISIBILITY_EXPORT_PROFILE_ID,
  name: 'Huidige zichtbaarheid',
  rules: null,
  builtIn: true
}

export function createDefaultExportProfiles(): ExportProfile[] {
  return [
    {
      id: 'lighting-switches',
      name: 'Verlichting',
      rules: [
        createRule('symbolId', 'is', [...lightingSymbolIds, ...switchSymbolIds]),
        createRule('subject', 'is-not', ['beamer'])
      ]
    },
    {
      id: 'wcd',
      name: 'WCD',
      rules: [
        createRule('symbolId', 'is', ['geaard-stopcontact', 'dubbel-geaard-stopcontact']),
        createRule('subject', 'is-not', ['beamer'])
      ]
    },
    {
      id: '12v',
      name: '12V',
      rules: [
        createRule('symbolId', 'is', ['12v-lasdoos']),
        createRule('subject', 'is-not', ['beamer'])
      ]
    },
    {
      id: 'beamer',
      name: 'Beamer',
      rules: [createRule('subject', 'is', ['beamer'])]
    },
    {
      id: 'network',
      name: 'Netwerk',
      rules: [
        createRule('symbolId', 'is', ['cat6a-contactdoos']),
        createRule('subject', 'is-not', ['beamer'])
      ]
    },
    {
      id: 'cameras',
      name: 'Cameras',
      rules: [createRule('subject', 'is', ['cameras'])]
    }
  ]
}

export function createRule(
  field: ExportProfileRule['field'],
  operator: ExportProfileRule['operator'],
  values: string[]
): ExportProfileRule {
  return {
    id: `${field}-${operator}-${values.join('-')}`,
    field,
    operator,
    values
  }
}

export function resolvePdfExportProfiles(customProfiles: ExportProfile[] = []): ResolvedExportProfile[] {
  return customProfiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    rules: Array.isArray(profile.rules) ? profile.rules : [],
    builtIn: false
  }))
}

export function resolvePdfExportOptions(customProfiles: ExportProfile[] = []): ResolvedExportProfile[] {
  return [CURRENT_VISIBILITY_EXPORT_PROFILE, ...resolvePdfExportProfiles(customProfiles)]
}

export function getVisibleSymbolIdsForExportProfile(
  symbols: PlacedSymbol[],
  profile: ResolvedExportProfile,
  baseHiddenSymbolIds: Set<string>
): Set<string> | null {
  if (profile.rules === null) return null

  return new Set(
    symbols
      .filter((symbol) => isPlacedSymbolVisibleForExportProfile(symbol, profile, baseHiddenSymbolIds))
      .map((symbol) => symbol.id)
  )
}

export function isPlacedSymbolVisibleForExportProfile(
  symbol: PlacedSymbol,
  profile: ResolvedExportProfile,
  baseHiddenSymbolIds: Set<string>
): boolean {
  if (!isPlacedSymbolVisible(symbol, baseHiddenSymbolIds)) return false
  if (profile.rules === null) return true
  if (profile.rules.length === 0) return false
  return profile.rules.every((rule) => doesSymbolMatchRule(symbol, rule))
}

export function describeExportProfileRule(rule: ExportProfileRule): string {
  const field = rule.field === 'symbolId' ? 'type' : 'onderwerp'
  const operator = rule.operator === 'is' ? '=' : '!='
  const values =
    rule.field === 'symbolId'
      ? rule.values.map(getSymbolName).join(', ')
      : rule.values.join(', ')

  return `${field} ${operator} ${values}`
}

function doesSymbolMatchRule(symbol: PlacedSymbol, rule: ExportProfileRule): boolean {
  const values = normalizeValues(rule.values)
  const matches =
    rule.field === 'symbolId'
      ? matchesSymbolTypeRule(symbol, values)
      : values.includes(normalizeValue(symbol.subject))

  if (rule.operator === 'is') {
    return matches
  }

  return !matches
}

function matchesSymbolTypeRule(symbol: PlacedSymbol, values: string[]): boolean {
  return values.some(
    (value) => value === normalizeValue(symbol.symbolId) || value === normalizeValue(symbol.forSymbolId)
  )
}

function normalizeValues(values: string[]): string[] {
  return values.map(normalizeValue).filter((value) => value.length > 0)
}

function normalizeValue(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? ''
}

function getSymbolName(symbolId: string): string {
  return ALL_SYMBOLS.find((symbol) => symbol.id === symbolId)?.name ?? symbolId
}
