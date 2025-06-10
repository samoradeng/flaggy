class SoundEffects {
    constructor() {
        this.enabled = localStorage.getItem('soundEnabled') !== 'false';
        this.audioContext = null;
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('soundEnabled', this.enabled.toString());
        return this.enabled;
    }

    playTone(frequency, duration, type = 'sine') {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playCorrect() {
        // Happy ascending notes
        this.playTone(523.25, 0.2); // C5
        setTimeout(() => this.playTone(659.25, 0.2), 100); // E5
        setTimeout(() => this.playTone(783.99, 0.3), 200); // G5
    }

    playWrong() {
        // Descending sad notes
        this.playTone(392, 0.3); // G4
        setTimeout(() => this.playTone(349.23, 0.4), 150); // F4
    }

    playStreak() {
        // Exciting rapid notes
        const notes = [523.25, 587.33, 659.25, 698.46, 783.99]; // C5, D5, E5, F5, G5
        notes.forEach((note, index) => {
            setTimeout(() => this.playTone(note, 0.15), index * 80);
        });
    }

    playLevelUp() {
        // Triumphant chord progression
        this.playTone(523.25, 0.5); // C5
        this.playTone(659.25, 0.5); // E5
        this.playTone(783.99, 0.5); // G5
        setTimeout(() => {
            this.playTone(1046.5, 0.8); // C6
        }, 300);
    }
}

window.SoundEffects = SoundEffects;