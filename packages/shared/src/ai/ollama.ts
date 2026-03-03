export class OllamaAI {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async enhanceDiary(content: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:7b',
        prompt: `请将以下口语化的日记内容润色,使其更加流畅和有文采,保持原意:\n\n${content}`,
        stream: false,
      }),
    });
    const data = await response.json();
    return data.response;
  }

  async analyzeMood(content: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:7b',
        prompt: `分析情绪,只返回一个中文词(开心/难过/平静/焦虑):\n\n${content}`,
        stream: false,
      }),
    });
    const data = await response.json();
    return data.response.trim();
  }
}
