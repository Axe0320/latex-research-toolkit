import type { FormattingOptions } from '../lib/table/formatters/options'

type Props = {
  options: FormattingOptions
  onChange: (next: FormattingOptions) => void
}

export function FormattingBar({ options, onChange }: Props) {
  function update<K extends keyof FormattingOptions>(key: K, value: FormattingOptions[K]) {
    onChange({ ...options, [key]: value })
  }

  return (
    <div
      className="mt-5"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r)',
        boxShadow: 'var(--shadow-md)',
        padding: '1.25rem 1.5rem',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="text-xs font-bold uppercase"
          style={{ color: 'var(--text-light)', letterSpacing: '0.1em' }}
        >
          出力設定
        </span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>

      {/* Controls grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <SelectField
          label="出力環境"
          hint="table / table*"
          value={options.environment}
          onChange={(v) => update('environment', v as FormattingOptions['environment'])}
          options={[
            { value: 'table*', label: 'table*（2段組向け）' },
            { value: 'table', label: 'table（1段組）' },
          ]}
        />

        <SelectField
          label="小数点桁数"
          hint="数値の丸め"
          value={String(options.decimalPrecision)}
          onChange={(v) => update('decimalPrecision', v === 'auto' ? 'auto' : Number(v))}
          options={[
            { value: 'auto', label: 'Auto（4桁）' },
            { value: '0', label: '0桁　(0)' },
            { value: '1', label: '1桁　(0.0)' },
            { value: '2', label: '2桁　(0.00)' },
            { value: '3', label: '3桁　(0.000)' },
            { value: '4', label: '4桁　(0.0000)' },
          ]}
        />

        <SelectField
          label="欠損値"
          hint="空セルの表示"
          value={options.missingValue}
          onChange={(v) => update('missingValue', v as FormattingOptions['missingValue'])}
          options={[
            { value: '---', label: '--- （横線）' },
            { value: 'N/A', label: 'N/A' },
            { value: '-', label: '- （ハイフン）' },
            { value: 'blank', label: '空白' },
          ]}
        />

        <SelectField
          label="罫線スタイル"
          hint="横線の入れ方"
          value={options.borderTemplate}
          onChange={(v) => update('borderTemplate', v as FormattingOptions['borderTemplate'])}
          options={[
            { value: 'classic', label: 'Default（3線 \\hline）' },
            { value: 'academic', label: 'Booktabs（投稿用）' },
            { value: 'full', label: '全罫線' },
            { value: 'minimal', label: '上下のみ' },
          ]}
        />
      </div>
    </div>
  )
}

type SelectFieldProps = {
  label: string
  hint: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}

function SelectField({ label, hint, value, onChange, options }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <div>
        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          {label}
        </span>
        <span className="text-xs ml-1.5" style={{ color: 'var(--text-light)' }}>
          {hint}
        </span>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontSize: '0.875rem',
          padding: '0.45rem 0.75rem',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--rs)',
          background: '#FAFAFA',
          color: 'var(--text)',
          outline: 'none',
          cursor: 'pointer',
          transition: 'border-color .18s',
          width: '100%',
        }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--border-focus)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
