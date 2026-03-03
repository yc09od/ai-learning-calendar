export interface Entry {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  voiceTranscription?: string;
  aiEnhanced?: string;
  mood?: string;
  deletedAt?: number;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: number;
}

export interface Settings {
  aiModel: 'ollama' | 'claude';
  ollamaUrl: string;
  claudeApiKey?: string;
  voiceLanguage: 'zh-CN' | 'en-US';
}
