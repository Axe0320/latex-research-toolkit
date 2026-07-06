import GroupDataInput from './GroupDataInput'
import type { ViolinData } from '../../types/figures'

interface Props {
  data: ViolinData
  labels: string[]
  onChange: (data: ViolinData, labels: string[]) => void
}

export default function ViolinInput({ data, labels, onChange }: Props) {
  return (
    <GroupDataInput
      groups={data.groups}
      labels={labels}
      onChange={(groups, newLabels) => onChange({ groups }, newLabels)}
    />
  )
}
