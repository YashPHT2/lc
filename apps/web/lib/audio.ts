export const playNotificationSound = (type: 'chat' | 'warning' | 'start' | 'success' | 'win') => {
    if (typeof window === 'undefined') return;

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
        case 'chat':
            // Soft pop
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.15);
            break;

        case 'warning':
            // Urgent beep
            osc.type = 'square';
            osc.frequency.setValueAtTime(440, now); // A4
            osc.frequency.setValueAtTime(440, now + 0.1);
            osc.frequency.setValueAtTime(0, now + 0.11); // Silence
            osc.frequency.setValueAtTime(440, now + 0.2); // A4 again

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
            gain.gain.setValueAtTime(0, now + 0.11);
            gain.gain.setValueAtTime(0.1, now + 0.2);
            gain.gain.linearRampToValueAtTime(0, now + 0.4);

            osc.start(now);
            osc.stop(now + 0.4);
            break;

        case 'start':
            // Gong / Swell
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(440, now + 1);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.3, now + 0.5);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
            osc.start(now);
            osc.stop(now + 1.5);
            break;

        case 'success':
            // Success chord (C Major arpeggio)
            const playNote = (freq: number, delay: number) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g);
                g.connect(ctx.destination);
                o.type = 'sine';
                o.frequency.value = freq;
                g.gain.setValueAtTime(0.1, now + delay);
                g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6);
                o.start(now + delay);
                o.stop(now + delay + 0.6);
            };
            playNote(523.25, 0); // C5
            playNote(659.25, 0.1); // E5
            playNote(783.99, 0.2); // G5
            playNote(1046.50, 0.4); // C6
            break;

        case 'win':
            // Victory fanfare logic can be expanded here
            // For now, same as success but louder/longer? 
            // Reuse success for simplicity or add complex sequence
            playNotificationSound('success');
            break;
    }
};
