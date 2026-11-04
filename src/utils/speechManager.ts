/**
 * Robust Vietnamese Speech Synthesis Manager
 * Handles browser voice loading, speaking, pausing, fallback timers, and error recovery.
 */

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

class SpeechManager {
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private fallbackTimeout: any = null;
  private isSpeaking = false;
  private isPaused = false;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.initVoices();
        };
      }
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voices = window.speechSynthesis.getVoices();
  }

  public getVietnameseVoice(): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) {
      this.initVoices();
    }
    // Prefer vi-VN or Vietnamese
    const viVoice = this.voices.find(
      (v) =>
        v.lang === 'vi-VN' ||
        v.lang === 'vi' ||
        v.lang.toLowerCase().includes('vietnam') ||
        v.name.toLowerCase().includes('vietnamese')
    );
    if (viVoice) return viVoice;

    // Fallback to default voice
    return this.voices.find((v) => v.default) || this.voices[0] || null;
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public speak(text: string, options: SpeechOptions = {}) {
    this.stop();

    const cleanText = text.trim();
    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    if (!this.isSupported()) {
      // Simulate speech duration with fallback timer
      const durationMs = Math.max(3500, cleanText.length * 75);
      options.onStart?.();
      this.isSpeaking = true;
      this.fallbackTimeout = setTimeout(() => {
        this.isSpeaking = false;
        options.onEnd?.();
      }, durationMs);
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      this.activeUtterance = utterance;

      const voice = this.getVietnameseVoice();
      if (voice) {
        utterance.voice = voice;
      }
      utterance.lang = 'vi-VN';
      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = options.volume ?? 1.0;

      let hasFinished = false;

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.isPaused = false;
        options.onStart?.();
      };

      utterance.onend = () => {
        if (hasFinished) return;
        hasFinished = true;
        this.isSpeaking = false;
        this.isPaused = false;
        this.activeUtterance = null;
        if (this.fallbackTimeout) clearTimeout(this.fallbackTimeout);
        options.onEnd?.();
      };

      utterance.onerror = (e) => {
        if (hasFinished) return;
        hasFinished = true;
        this.isSpeaking = false;
        this.isPaused = false;
        this.activeUtterance = null;
        if (this.fallbackTimeout) clearTimeout(this.fallbackTimeout);
        options.onError?.(e);
        // Still proceed to onEnd so tour doesn't stall
        options.onEnd?.();
      };

      // Safety fallback timer in case browser stalls the speech event
      const estimatedDuration = Math.max(4000, (cleanText.length * 85) / (options.rate ?? 1.0));
      this.fallbackTimeout = setTimeout(() => {
        if (this.isSpeaking && !hasFinished) {
          hasFinished = true;
          this.isSpeaking = false;
          options.onEnd?.();
        }
      }, estimatedDuration + 3000);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis error:', err);
      this.isSpeaking = false;
      options.onEnd?.();
    }
  }

  public pause() {
    if (this.isSupported() && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      this.isPaused = true;
    }
  }

  public resume() {
    if (this.isSupported() && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      this.isPaused = false;
    }
  }

  public stop() {
    if (this.fallbackTimeout) {
      clearTimeout(this.fallbackTimeout);
      this.fallbackTimeout = null;
    }
    if (this.isSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }
    this.activeUtterance = null;
    this.isSpeaking = false;
    this.isPaused = false;
  }

  public getSpeakingState() {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
    };
  }
}

export const speechManager = new SpeechManager();
