interface Props {
  mode: 'manual' | 'paste'
  onSwitch: (mode: 'manual' | 'paste') => void
}

export default function InputModeToggle({ mode, onSwitch }: Props) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: 10 }}>
      {(['manual', 'paste'] as const).map(m => (
        <button
          key={m}
          onClick={() => onSwitch(m)}
          style={{
            padding: '4px 12px', fontSize: 11, fontWeight: 600,
            background: 'none', border: 'none',
            borderBottom: mode === m ? '2px solid #6C63FF' : '2px solid transparent',
            color: mode === m ? '#6C63FF' : '#9CA3AF',
            cursor: 'pointer', marginBottom: -1,
          }}
        >
          {m === 'manual' ? '手入力' : 'CSV / 貼り付け'}
        </button>
      ))}
    </div>
  )
}
