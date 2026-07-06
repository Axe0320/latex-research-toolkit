export type Example = {
  name: string
  description: string
  input: string
}

export const EXAMPLES: Example[] = [
  {
    name: 'Benchmark (TSV)',
    description: 'メソッド比較表',
    input: [
      'Method\tAccuracy\tPrecision\tRecall\tF1',
      'Ours (Proposed)\t0.924\t0.918\t0.931\t0.911',
      'BERT-base\t0.901\t0.895\t0.908\t0.887',
      'RoBERTa\t0.913\t0.909\t0.920\t0.899',
      'Baseline\t0.872\t0.864\t0.878\t0.859',
    ].join('\n'),
  },
  {
    name: 'Classification Report',
    description: 'sklearn classification_report',
    input: [
      '              precision    recall  f1-score   support',
      '',
      '           0       0.85      0.88      0.86        50',
      '           1       0.72      0.65      0.68        31',
      '           2       0.94      0.97      0.96        72',
      '',
      '    accuracy                           0.88       153',
      '   macro avg       0.84      0.83      0.83       153',
      'weighted avg       0.88      0.88      0.88       153',
    ].join('\n'),
  },
  {
    name: 'Log Parser',
    description: '実験ログからの抽出',
    input: [
      'Epoch: 50',
      'Accuracy: 0.9243',
      'Precision: 0.9182',
      'Recall: 0.9308',
      'F1 Score: 0.9112',
      'Loss: 0.2341',
      'Val Accuracy: 0.9017',
      'Val Loss: 0.2891',
    ].join('\n'),
  },
  {
    name: 'Custom CSV',
    description: 'カスタム CSV 表',
    input: [
      'Dataset,Model,Acc,F1,Params',
      'CIFAR-10,ResNet-50,0.9531,0.9524,25.6M',
      'CIFAR-10,ViT-B/16,0.9812,0.9809,86.6M',
      'CIFAR-100,ResNet-50,0.7823,0.7801,25.6M',
      'CIFAR-100,ViT-B/16,0.9031,0.9018,86.6M',
    ].join('\n'),
  },
]
