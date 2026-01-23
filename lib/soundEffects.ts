'use client';

/**
 * Sound Effects using Web Audio API
 * Generates sounds programmatically - NO external MP3 files needed!
 */

class SoundEffectsManager {
    private audioContext: AudioContext | null = null;
    private isInitialized = false;

    /**
     * Initialize Web Audio Context (only runs in browser)
     */
    private initialize = () => {
        if (this.isInitialized || typeof window === 'undefined') {
            return;
        }

        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.isInitialized = true;
        } catch (error) {
            console.warn('Failed to initialize Web Audio API:', error);
        }
    };

    /**
     * Play spin sound - Oscillating low-frequency hum
     */
    playSpinSound = () => {
        this.initialize();
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const lfo = this.audioContext.createOscillator(); // Low-frequency oscillator for wobble

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Main tone
        oscillator.type = 'sine';
        oscillator.frequency.value = 120;

        // Add wobble effect
        lfo.type = 'sine';
        lfo.frequency.value = 3; // 3Hz wobble
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = 20; // Wobble intensity
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);

        // Volume envelope
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.5);

        oscillator.start();
        lfo.start();
        oscillator.stop(this.audioContext.currentTime + 2);
        lfo.stop(this.audioContext.currentTime + 2);
    }

    /**
     * Stop spin sound - Not needed for Web Audio (sounds auto-stop)
     */
    stopSpinSound = () => {
        // Web Audio oscillators stop automatically
        // This method kept for API compatibility
    };

    /**
     * Play tick sound - Sharp click
     */
    playTickSound = () => {
        this.initialize();
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.value = 1000; // High-pitched click

        // Very short envelope for "tick" effect
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.03);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.03);
    }

    /**
     * Play win sound - Ascending celebratory tone with harmonics
     */
    playWinSound = () => {
        this.initialize();
        if (!this.audioContext) return;

        // Create 4 harmonics for rich sound
        const frequencies = [400, 600, 800, 1000];

        frequencies.forEach((baseFreq, i) => {
            const oscillator = this.audioContext!.createOscillator();
            const gainNode = this.audioContext!.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext!.destination);

            oscillator.type = 'sine';
            oscillator.frequency.value = baseFreq;

            // Ascending pitch
            oscillator.frequency.exponentialRampToValueAtTime(
                baseFreq * 1.5,
                this.audioContext!.currentTime + 0.4
            );

            // Volume envelope (staggered for each harmonic)
            const startTime = this.audioContext!.currentTime + (i * 0.05);
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.4);
        });

        // Add "sparkle" effect at the end
        setTimeout(() => {
            if (!this.audioContext) return;
            const sparkle = this.audioContext.createOscillator();
            const sparkleGain = this.audioContext.createGain();

            sparkle.connect(sparkleGain);
            sparkleGain.connect(this.audioContext.destination);

            sparkle.type = 'sine';
            sparkle.frequency.value = 1600;

            sparkleGain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            sparkleGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

            sparkle.start();
            sparkle.stop(this.audioContext.currentTime + 0.2);
        }, 300);
    }
}

// Export singleton instance
export const soundEffects = new SoundEffectsManager();

