import { useMemo, useState } from 'react'
import { ALL_SYMBOLS, SymbolCategory } from '../symbols'
import {
  describeExportProfileRule,
  resolvePdfExportProfiles
} from '../services/pdfExportProfiles'
import type { ExportProfile, ExportProfileRule, Floor } from '../types/project'

interface Props {
  floors: Floor[]
  exportProfiles?: ExportProfile[]
  onCancel: () => void
  onAddProfile: (profile: Omit<ExportProfile, 'id'>) => string
  onUpdateProfile: (profileId: string, profile: Omit<ExportProfile, 'id'>) => void
  onRemoveProfile: (profileId: string) => void
}

export function PdfProfilesDialog({
  floors,
  exportProfiles = [],
  onCancel,
  onAddProfile,
  onUpdateProfile,
  onRemoveProfile
}: Props) {
  const profiles = useMemo(() => resolvePdfExportProfiles(exportProfiles), [exportProfiles])
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [rules, setRules] = useState<ExportProfileRule[]>([createDraftRule('subject')])

  const symbolGroups = Object.values(SymbolCategory).map((category) => ({
    category,
    symbols: ALL_SYMBOLS.filter((symbol) => symbol.category === category)
  }))
  const subjectOptions = useMemo(
    () =>
      Array.from(
        new Set(
          floors.flatMap((floor) =>
            floor.symbols
              .map((symbol) => symbol.subject?.trim())
              .filter((subject): subject is string => Boolean(subject))
          )
        )
      ).sort((a, b) => a.localeCompare(b, 'nl')),
    [floors]
  )
  const canSave =
    name.trim().length > 0 &&
    rules.length > 0 &&
    rules.every((rule) => normalizeValues(rule.values).length > 0)

  const updateRule = (ruleId: string, updates: Partial<ExportProfileRule>) => {
    setRules((current) =>
      current.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule))
    )
  }

  const handleFieldChange = (ruleId: string, field: ExportProfileRule['field']) => {
    updateRule(ruleId, { field, values: [] })
  }

  const toggleRuleValue = (ruleId: string, value: string) => {
    setRules((current) =>
      current.map((rule) => {
        if (rule.id !== ruleId) return rule
        const values = rule.values.includes(value)
          ? rule.values.filter((item) => item !== value)
          : [...rule.values, value]
        return { ...rule, values }
      })
    )
  }

  const resetForm = () => {
    setEditingProfileId(null)
    setName('')
    setRules([createDraftRule('subject')])
  }

  const handleEditProfile = (profile: ExportProfile) => {
    setEditingProfileId(profile.id)
    setName(profile.name)
    setRules(cloneRules(profile.rules))
  }

  const handleSaveProfile = () => {
    if (!canSave) return

    const profile = {
      name: name.trim(),
      rules: rules.map((rule) => ({
        ...rule,
        values: normalizeValues(rule.values)
      }))
    }

    if (editingProfileId) {
      onUpdateProfile(editingProfileId, profile)
    } else {
      onAddProfile(profile)
    }
    resetForm()
  }

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog pdf-profiles-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="dialog-title">PDF profielen</div>

        <div className="pdf-export-section">
          <div className="pdf-export-section-header">
            <span>Beschikbare profielen</span>
          </div>
          <div className="pdf-profile-list">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className={`pdf-profile-list-row${editingProfileId === profile.id ? ' selected' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() =>
                  handleEditProfile({
                    id: profile.id,
                    name: profile.name,
                    rules: profile.rules ?? []
                  })
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    handleEditProfile({
                      id: profile.id,
                      name: profile.name,
                      rules: profile.rules ?? []
                    })
                  }
                }}
              >
                <div>
                  <div className="pdf-profile-list-name">{profile.name}</div>
                  <div className="pdf-profile-list-rules">
                    {profile.rules === null
                      ? 'huidige zichtbaarheid'
                      : profile.rules.map(describeExportProfileRule).join(' AND ')}
                  </div>
                </div>
                <button
                  type="button"
                  className="pdf-profile-remove"
                  onClick={(event) => {
                    event.stopPropagation()
                    if (editingProfileId === profile.id) resetForm()
                    onRemoveProfile(profile.id)
                  }}
                  title="Profiel verwijderen"
                >
                  x
                </button>
              </div>
            ))}
            {profiles.length === 0 && (
              <div className="pdf-empty-state">Geen profielen ingesteld.</div>
            )}
          </div>
        </div>

        <div className="pdf-export-section">
          <div className="pdf-export-section-header">
            <span>{editingProfileId ? 'Profiel bewerken' : 'Nieuw profiel'}</span>
            {editingProfileId && (
              <button type="button" className="dialog-btn" onClick={resetForm}>
                Nieuw profiel
              </button>
            )}
          </div>
          <label className="dialog-field">
            <span className="dialog-field-label">
              Profielnaam <span className="dialog-field-required">verplicht</span>
            </span>
            <input
              className="dialog-input"
              aria-label="Profielnaam"
              required
              placeholder="Naam, bijv. Beamer"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <div className="pdf-profile-rule-list">
            {rules.map((rule, index) => (
              <div key={rule.id} className="pdf-profile-rule">
                <div className="pdf-profile-rule-header">
                  <span>Regel {index + 1}</span>
                  <button
                    type="button"
                    className="pdf-profile-remove"
                    onClick={() =>
                      setRules((current) => current.filter((item) => item.id !== rule.id))
                    }
                    disabled={rules.length === 1}
                    title="Regel verwijderen"
                  >
                    x
                  </button>
                </div>
                <div className="pdf-profile-rule-controls">
                  <select
                    aria-label={`Veld regel ${index + 1}`}
                    value={rule.field}
                    onChange={(event) =>
                      handleFieldChange(rule.id, event.target.value as ExportProfileRule['field'])
                    }
                  >
                    <option value="subject">Onderwerp</option>
                    <option value="symbolId">Type</option>
                  </select>
                  <select
                    aria-label={`Operator regel ${index + 1}`}
                    value={rule.operator}
                    onChange={(event) =>
                      updateRule(rule.id, {
                        operator: event.target.value as ExportProfileRule['operator']
                      })
                    }
                  >
                    <option value="is">is</option>
                    <option value="is-not">is niet</option>
                  </select>
                </div>

                {rule.field === 'subject' ? (
                  subjectOptions.length > 0 ? (
                    <div className="pdf-value-picker" aria-label={`Onderwerp regel ${index + 1}`}>
                      {subjectOptions.map((subject) => (
                        <label key={subject} className="pdf-symbol-picker-row">
                          <input
                            type="checkbox"
                            checked={rule.values.includes(subject)}
                            onChange={() => toggleRuleValue(rule.id, subject)}
                          />
                          <span>{subject}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="pdf-empty-state">
                      Geen onderwerpen gebruikt in dit project.
                    </div>
                  )
                ) : (
                  <div className="pdf-symbol-picker">
                    {symbolGroups.map((group) => (
                      <div key={group.category} className="pdf-symbol-picker-group">
                        <div className="pdf-symbol-picker-header">{group.category}</div>
                        {group.symbols.map((symbol) => (
                          <label key={symbol.id} className="pdf-symbol-picker-row">
                            <input
                              type="checkbox"
                              checked={rule.values.includes(symbol.id)}
                              onChange={() => toggleRuleValue(rule.id, symbol.id)}
                            />
                            <span>{symbol.name}</span>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="dialog-btn"
            onClick={() => setRules((current) => [...current, createDraftRule('subject')])}
          >
            Regel toevoegen
          </button>
        </div>

        <div className="dialog-actions">
          <button className="dialog-btn" onClick={onCancel}>
            Sluiten
          </button>
          <button className="dialog-btn primary" onClick={handleSaveProfile} disabled={!canSave}>
            {editingProfileId ? 'Profiel opslaan' : 'Profiel toevoegen'}
          </button>
        </div>
      </div>
    </div>
  )
}

function createDraftRule(field: ExportProfileRule['field']): ExportProfileRule {
  return {
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    field,
    operator: 'is',
    values: []
  }
}

function cloneRules(rules: ExportProfileRule[]): ExportProfileRule[] {
  return rules.map((rule) => ({
    ...rule,
    values: [...rule.values]
  }))
}

function normalizeValues(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))
  )
}
