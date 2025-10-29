import type { AssemblyAITranscriptResponse } from '../types/index.js';

export class AssemblyAIService {
  private apiKey: string;
  private baseUrl = 'https://api.assemblyai.com/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Upload audio file to AssemblyAI
   */
  async uploadAudio(audioBuffer: Buffer): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers: {
          authorization: this.apiKey,
          'Content-Type': 'application/octet-stream',
        },
        body: audioBuffer,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to upload audio: ${error.error}`);
      }

      const data = await response.json();
      return data.upload_url;
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  }

  /**
   * Start transcription with speaker diarization
   */
  async createTranscript(audioUrl: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/transcript`, {
        method: 'POST',
        headers: {
          authorization: this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          speaker_labels: true, // Enable speaker diarization
          punctuate: true,
          format_text: true,
          language_code: 'en',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create transcript: ${error.error}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error creating transcript:', error);
      throw error;
    }
  }

  /**
   * Get transcription status and result
   */
  async getTranscript(transcriptId: string): Promise<AssemblyAITranscriptResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transcript/${transcriptId}`, {
        method: 'GET',
        headers: {
          authorization: this.apiKey,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to get transcript: ${error.error}`);
      }

      const data = await response.json();

      return {
        id: data.id,
        status: data.status,
        text: data.text,
        words: data.words,
        utterances: data.utterances,
        error: data.error,
      };
    } catch (error) {
      console.error('Error getting transcript:', error);
      throw error;
    }
  }

  /**
   * Poll for transcription completion
   */
  async pollTranscript(
    transcriptId: string,
    onProgress?: (status: string) => void
  ): Promise<AssemblyAITranscriptResponse> {
    let result = await this.getTranscript(transcriptId);

    while (result.status === 'queued' || result.status === 'processing') {
      if (onProgress) {
        onProgress(result.status);
      }

      // Wait 3 seconds before polling again
      await new Promise((resolve) => setTimeout(resolve, 3000));
      result = await this.getTranscript(transcriptId);
    }

    if (result.status === 'error') {
      throw new Error(`Transcription failed: ${result.error}`);
    }

    return result;
  }

  /**
   * Process transcript utterances for database storage
   */
  processUtterances(transcript: AssemblyAITranscriptResponse): Array<{
    speaker: string;
    text: string;
    startTime: number;
    endTime: number;
    confidence: number;
  }> {
    if (!transcript.utterances) {
      return [];
    }

    return transcript.utterances.map((utterance) => ({
      speaker: utterance.speaker === 'A' ? 'therapist' : 'client',
      text: utterance.text,
      startTime: utterance.start,
      endTime: utterance.end,
      confidence: utterance.confidence,
    }));
  }
}

// Export singleton instance
export const assemblyAIService = new AssemblyAIService(
  process.env.ASSEMBLYAI_API_KEY || ''
);
