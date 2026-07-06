import GroupDataInput from './GroupDataInput'
import type { BoxData } from '../../types/figures'

interface Props {
  data: BoxData
  labels: string[]
  onChange: (data: BoxData, labels: string[]) => void
}

export default function BoxInput({ data, labels, onChange }: Props) {
  return (
    <GroupDataInput
      groups={data.groups}
      labels={labels}
      onChange={(groups, newLabels) => onChange({ groups }, newLabels)}
    />
  )
}
