import { AssemblyAI } from 'assemblyai';
import type { Transcript } from 'assemblyai';

export class AssemblyAIService {
  private client: AssemblyAI;

  constructor(apiKey: string) {
    this.client = new AssemblyAI({ apiKey });
  }

  /**
   * Upload audio file to AssemblyAI
   */
  async uploadAudio(audioBuffer: Buffer): Promise<string> {
    try {
      const uploadUrl = await this.client.files.upload(audioBuffer);
      return uploadUrl;
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
      const transcript = await this.client.transcripts.transcribe({
        audio: audioUrl,
        speaker_labels: true, // Enable speaker diarization
        punctuate: true,
        format_text: true,
        language_code: 'en',
      });

      return transcript.id;
    } catch (error) {
      console.error('Error creating transcript:', error);
      throw error;
    }
  }

  /**
   * Get transcription status and result
   */
  async getTranscript(transcriptId: string): Promise<Transcript> {
    try {
      const transcript = await this.client.transcripts.get(transcriptId);
      return transcript;
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
  ): Promise<Transcript> {
    let transcript = await this.getTranscript(transcriptId);

    while (transcript.status === 'queued' || transcript.status === 'processing') {
      if (onProgress) {
        onProgress(transcript.status);
      }

      // Wait 3 seconds before polling again
      await new Promise((resolve) => setTimeout(resolve, 3000));
      transcript = await this.getTranscript(transcriptId);
    }

    if (transcript.status === 'error') {
      throw new Error(`Transcription failed: ${transcript.error}`);
    }

    return transcript;
  }

  /**
   * Process transcript utterances for database storage
   */
  processUtterances(transcript: Transcript): Array<{
    speaker: string;
    text: string;
    startTime: number;
    endTime: number;
    confidence: number;
  }> {
    if (!transcript.utterances || transcript.utterances.length === 0) {
      return [];
    }

    return transcript.utterances.map((utterance) => ({
      speaker: utterance.speaker === 'A' ? 'therapist' : 'client',
      text: utterance.text,
      startTime: utterance.start / 1000, // Convert from milliseconds to seconds
      endTime: utterance.end / 1000, // Convert from milliseconds to seconds
      confidence: utterance.confidence,
    }));
  }
}

// Export singleton instance
export const assemblyAIService = new AssemblyAIService(
  process.env.ASSEMBLYAI_API_KEY || ''
);
