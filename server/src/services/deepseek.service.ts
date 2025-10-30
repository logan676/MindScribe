import type { DeepSeekNoteRequest, DeepSeekNoteResponse } from '../types/index.js';

export class DeepSeekService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.deepseek.com/v1';
  }

  /**
   * Generate clinical notes from session transcript
   */
  async generateClinicalNote(
    request: DeepSeekNoteRequest
  ): Promise<DeepSeekNoteResponse> {
    const prompt = this.buildPrompt(request);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(request.noteType),
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const error = await response.json() as any;
        throw new Error(`DeepSeek API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json() as any;
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content returned from DeepSeek API');
      }

      return this.parseNoteContent(content, request.noteType);
    } catch (error) {
      console.error('Error generating clinical note:', error);
      throw error;
    }
  }

  /**
   * Build prompt based on note type
   */
  private buildPrompt(request: DeepSeekNoteRequest): string {
    let prompt = `Please analyze the following therapy session transcript and generate a ${request.noteType.toUpperCase()} note.\n\n`;

    if (request.patientContext) {
      prompt += `Patient: ${request.patientContext.name}\n`;
      if (request.patientContext.history) {
        prompt += `Patient History: ${request.patientContext.history}\n`;
      }
      prompt += '\n';
    }

    prompt += `Session Transcript:\n${request.transcript}\n\n`;
    prompt += `Generate a detailed ${request.noteType.toUpperCase()} note based on this session.`;

    return prompt;
  }

  /**
   * Get system prompt based on note type
   */
  private getSystemPrompt(noteType: 'soap' | 'dare'): string {
    if (noteType === 'soap') {
      return `You are a clinical psychologist assistant helping to generate SOAP notes (Subjective, Objective, Assessment, Plan) from therapy session transcripts.

Guidelines for SOAP notes:
- Subjective: Patient's reported symptoms, concerns, and subjective experience
- Objective: Observable facts, mental status exam findings, and clinical observations
- Assessment: Clinical interpretation, diagnosis, and progress evaluation
- Plan: Treatment plan, interventions, next steps, and homework assignments

Format your response as JSON with the following structure:
{
  "subjective": "...",
  "objective": "...",
  "assessment": "...",
  "plan": "..."
}

Be concise, professional, and focus on clinically relevant information. Use proper medical terminology.`;
    } else {
      return `You are a clinical psychologist assistant helping to generate DARE notes (Description, Action, Response, Evaluation) from therapy session transcripts.

Guidelines for DARE notes:
- Description: Describe what happened during the session
- Action: What actions or interventions were taken by the therapist
- Response: How the client responded to the interventions
- Evaluation: Evaluation of the session and next steps

Format your response as JSON with the following structure:
{
  "description": "...",
  "action": "...",
  "response": "...",
  "evaluation": "..."
}

Be concise, professional, and focus on clinically relevant information. Use proper medical terminology.`;
    }
  }

  /**
   * Parse the note content from API response
   */
  private parseNoteContent(
    content: string,
    noteType: 'soap' | 'dare'
  ): DeepSeekNoteResponse {
    try {
      // Try to parse as JSON first
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: parse as text sections
      if (noteType === 'soap') {
        return {
          subjective: this.extractSection(content, ['subjective', 's:']),
          objective: this.extractSection(content, ['objective', 'o:']),
          assessment: this.extractSection(content, ['assessment', 'a:']),
          plan: this.extractSection(content, ['plan', 'p:']),
        };
      } else {
        return {
          description: this.extractSection(content, ['description', 'd:']),
          action: this.extractSection(content, ['action', 'a:']),
          response: this.extractSection(content, ['response', 'r:']),
          evaluation: this.extractSection(content, ['evaluation', 'e:']),
        };
      }
    } catch (error) {
      console.error('Error parsing note content:', error);
      throw new Error('Failed to parse clinical note from AI response');
    }
  }

  /**
   * Extract a section from text content
   */
  private extractSection(content: string, headers: string[]): string {
    const lowerContent = content.toLowerCase();

    for (const header of headers) {
      const index = lowerContent.indexOf(header);
      if (index !== -1) {
        const start = index + header.length;
        // Find the next section or end of content
        let end = content.length;
        for (const nextHeader of ['subjective', 'objective', 'assessment', 'plan', 'description', 'action', 'response', 'evaluation']) {
          const nextIndex = lowerContent.indexOf(nextHeader, start);
          if (nextIndex !== -1 && nextIndex < end) {
            end = nextIndex;
          }
        }
        return content.substring(start, end).trim();
      }
    }

    return '';
  }
}

// Export singleton instance
export const deepSeekService = new DeepSeekService(
  process.env.DEEPSEEK_API_KEY || '',
  process.env.DEEPSEEK_API_URL
);
