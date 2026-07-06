import json

# ------------------------------------------------------------------ schemas
SCHEMAS: dict[str, dict] = {
    'confusion_matrix': {
        'matrix': [[0, 1], [2, 3]],
        'labels': ['Class A', 'Class B'],
    },
    'heatmap': {
        'matrix': [[1.0, 2.0], [3.0, 4.0]],
        'labels_x': ['col1', 'col2'],
        'labels_y': ['row1', 'row2'],
    },
    'bar_chart': {
        'labels': ['A', 'B', 'C'],
        'values': [[1.0, 2.0, 3.0]],
        'series_names': ['Series 1'],
    },
    'line_plot': {
        'series': [{'name': 'Series 1', 'x': [0, 1, 2], 'y': [0.0, 1.0, 2.0]}],
    },
    'scatter_plot': {
        'series': [{'name': 'Series 1', 'x': [1.0, 2.0], 'y': [1.0, 2.0]}],
    },
    'histogram': {
        'values': [1.0, 2.0, 3.0],
    },
    'roc_curve': {
        'series': [{'name': 'Model', 'fpr': [0.0, 0.5, 1.0], 'tpr': [0.0, 0.8, 1.0], 'auc': 0.85}],
    },
    'pr_curve': {
        'series': [{'name': 'Model', 'precision': [1.0, 0.8, 0.6], 'recall': [0.0, 0.5, 1.0], 'ap': 0.75}],
    },
    'learning_curve': {
        'epochs': [1, 2, 3],
        'series': [{'label': 'Train Loss', 'axis': 'left', 'values': [0.8, 0.5, 0.3]}],
    },
    'feature_importance': {
        'features': ['Feature A', 'Feature B'],
        'importances': [0.25, 0.15],
    },
    'box_plot': {
        'groups': [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]],
        'labels': ['Group A', 'Group B'],
    },
    'violin_plot': {
        'groups': [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]],
        'labels': ['Group A', 'Group B'],
    },
    'error_bar': {
        'labels': ['Condition A', 'Condition B'],
        'series': [{'name': 'Series 1', 'means': [2.5, 4.0], 'errors': [0.3, 0.5]}],
    },
    'stacked_bar': {
        'labels': ['A', 'B', 'C'],
        'values': [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]],
    },
    'combo_chart': {
        'labels': ['Q1', 'Q2', 'Q3', 'Q4'],
        'bar_series': [{'name': 'Sales', 'values': [100.0, 150.0, 130.0, 200.0]}],
        'line_series': [{'name': 'Growth Rate', 'values': [0.10, 0.50, -0.13, 0.54]}],
    },
    'pie_chart': {
        'labels': ['A', 'B', 'C'],
        'values': [30.0, 50.0, 20.0],
    },
    # Table module (docs/02-integrations.md §3.3): printed/screenshotted table → cells
    'table_data': {
        'columns': ['Column A', 'Column B'],
        'rows': [['1', '2'], ['3', '4']],
    },
    # Citation module (docs/02-integrations.md §3.3): reference list photo → citation strings
    'citation_list': {
        'citations': ['Author, A. (2024). Title. Journal.'],
    },
}

FIGURE_TYPE_JA: dict[str, str] = {
    'confusion_matrix': '混合行列',
    'heatmap': 'ヒートマップ',
    'bar_chart': '棒グラフ',
    'line_plot': '折れ線グラフ',
    'scatter_plot': '散布図',
    'histogram': 'ヒストグラム',
    'roc_curve': 'ROC曲線',
    'pr_curve': 'PR曲線',
    'learning_curve': '学習曲線',
    'feature_importance': '特徴量重要度',
    'box_plot': '箱ひげ図',
    'violin_plot': 'バイオリンプロット',
    'error_bar': 'エラーバー',
    'stacked_bar': '積み上げ棒グラフ',
    'combo_chart': '棒+折れ線複合グラフ',
    'pie_chart': '円グラフ',
    'table_data': '表',
    'citation_list': '参考文献リスト',
}


def _build_prompt(figure_type: str, schema: dict) -> str:
    ja = FIGURE_TYPE_JA.get(figure_type, figure_type)
    schema_str = json.dumps(schema, ensure_ascii=False, indent=2)
    return (
        f'この画像は「{ja}」のグラフです。\n'
        f'グラフからデータを読み取り、以下のJSONスキーマに従って正確に返してください。\n\n'
        f'スキーマ（同じ構造で値を埋めてください）:\n{schema_str}\n\n'
        f'注意:\n'
        f'- 数値は軸の目盛りから正確に読み取ってください\n'
        f'- ラベルは画像に表示されているものをそのまま使用してください\n'
        f'- 推定が難しい値は 0 としてください（nullは使わない）\n'
        f'- スキーマにないキーを追加しないでください\n'
        f'JSONのみ返してください。前後の説明文は不要です。'
    )


def _parse_json_response(text: str) -> dict:
    text = text.strip()
    if '```json' in text:
        text = text.split('```json')[1].split('```')[0].strip()
    elif '```' in text:
        text = text.split('```')[1].split('```')[0].strip()
    return json.loads(text)


# ------------------------------------------------------------------ Claude
def call_claude(image_b64: str, figure_type: str, schema: dict, api_key: str) -> dict:
    import anthropic
    prompt = _build_prompt(figure_type, schema)
    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model='claude-opus-4-5-20251101',
        max_tokens=2048,
        messages=[{
            'role': 'user',
            'content': [
                {'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/png', 'data': image_b64}},
                {'type': 'text', 'text': prompt},
            ],
        }],
    )
    return _parse_json_response(message.content[0].text)


# ------------------------------------------------------------------ OpenAI
def call_openai(image_b64: str, figure_type: str, schema: dict, api_key: str) -> dict:
    import urllib.request
    prompt = _build_prompt(figure_type, schema)
    body = json.dumps({
        'model': 'gpt-4o',
        'messages': [{'role': 'user', 'content': [
            {'type': 'text', 'text': prompt},
            {'type': 'image_url', 'image_url': {'url': f'data:image/png;base64,{image_b64}'}},
        ]}],
        'max_tokens': 2048,
    }).encode()
    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=body,
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read())
    return _parse_json_response(result['choices'][0]['message']['content'])


# ------------------------------------------------------------------ Gemini (Interactions API)
def call_gemini(image_b64: str, figure_type: str, schema: dict, api_key: str) -> dict:
    import urllib.request
    prompt = _build_prompt(figure_type, schema)
    body = json.dumps({
        'model': 'gemini-3.1-flash-lite',
        'input': [
            {'type': 'text', 'text': prompt},
            {'type': 'image', 'data': image_b64, 'mime_type': 'image/png'},
        ],
    }).encode()
    req = urllib.request.Request(
        'https://generativelanguage.googleapis.com/v1beta/interactions',
        data=body,
        headers={
            'Content-Type': 'application/json',
            'x-goog-api-key': api_key,
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read())
    # Response structure: steps[].content[].text where type == 'model_output'
    text = next(
        (part.get('text', '')
         for step in result.get('steps', [])
         if step.get('type') == 'model_output'
         for part in step.get('content', [])
         if isinstance(part, dict) and part.get('type') == 'text'),
        '',
    )
    return _parse_json_response(text)


# ------------------------------------------------------------------ auto classify + extract
def _build_auto_prompt(schemas: dict) -> str:
    type_list = '\n'.join(f'- {k}: {FIGURE_TYPE_JA.get(k, k)}' for k in schemas)
    schema_str = json.dumps(schemas, ensure_ascii=False)
    return (
        'この画像のグラフを分析し、以下の手順で回答してください。\n\n'
        '【手順1】グラフの種類を以下から判定する:\n'
        f'{type_list}\n\n'
        '【手順2】判定した種類のスキーマに従いデータを抽出する。\n\n'
        f'【スキーマ一覧】\n{schema_str}\n\n'
        '【レスポンス形式】JSONのみ返してください。\n'
        'typeフィールドに種類の英語キーを含め、そのスキーマのフィールドを展開してください。\n'
        '例: {"type": "bar_chart", "labels": [...], "values": [...]}\n\n'
        '注意:\n'
        '- typeフィールドは必ず含める（上記リストの英語キーをそのまま使用）\n'
        '- 数値は軸の目盛りから正確に読み取る\n'
        '- 推定が難しい値は 0 とする（nullは使わない）\n'
        '- JSONのみ返す（前後の説明文不要）'
    )


def classify_and_extract(image_b64: str, schemas: dict, provider: str, api_key: str) -> dict:
    import urllib.request
    prompt = _build_auto_prompt(schemas)

    if provider == 'claude':
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model='claude-opus-4-5-20251101',
            max_tokens=2048,
            messages=[{'role': 'user', 'content': [
                {'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/png', 'data': image_b64}},
                {'type': 'text', 'text': prompt},
            ]}],
        )
        return _parse_json_response(message.content[0].text)

    elif provider == 'openai':
        body = json.dumps({
            'model': 'gpt-4o',
            'messages': [{'role': 'user', 'content': [
                {'type': 'text', 'text': prompt},
                {'type': 'image_url', 'image_url': {'url': f'data:image/png;base64,{image_b64}'}},
            ]}],
            'max_tokens': 2048,
        }).encode()
        req = urllib.request.Request(
            'https://api.openai.com/v1/chat/completions',
            data=body,
            headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())
        return _parse_json_response(result['choices'][0]['message']['content'])

    elif provider == 'gemini':
        body = json.dumps({
            'model': 'gemini-3.1-flash-lite',
            'input': [
                {'type': 'text', 'text': prompt},
                {'type': 'image', 'data': image_b64, 'mime_type': 'image/png'},
            ],
        }).encode()
        req = urllib.request.Request(
            'https://generativelanguage.googleapis.com/v1beta/interactions',
            data=body,
            headers={'Content-Type': 'application/json', 'x-goog-api-key': api_key},
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())
        text = next(
            (part.get('text', '')
             for step in result.get('steps', [])
             if step.get('type') == 'model_output'
             for part in step.get('content', [])
             if isinstance(part, dict) and part.get('type') == 'text'),
            '',
        )
        return _parse_json_response(text)

    raise ValueError(f'Unknown provider: {provider}')


# ------------------------------------------------------------------ dispatcher
def call_vision(image_b64: str, figure_type: str, schema: dict, provider: str, api_key: str) -> dict:
    if provider == 'claude':
        return call_claude(image_b64, figure_type, schema, api_key)
    elif provider == 'openai':
        return call_openai(image_b64, figure_type, schema, api_key)
    elif provider == 'gemini':
        return call_gemini(image_b64, figure_type, schema, api_key)
    else:
        raise ValueError(f'Unknown provider: {provider}')
