/**
 * Sound utility functions for application notifications and ambience
 * Uses the Web Audio API to generate sounds programmatically
 */

// Global reference to notification audio context to allow stopping it
let notificationAudioContext: AudioContext | null = null;
let notificationOscillators: OscillatorNode[] = [];
let notificationGainNodes: GainNode[] = [];
let notificationInterval: NodeJS.Timeout | null = null;

/**
 * Stops any currently playing notification sounds
 */
export const stopNotificationSound = () => {
  if (notificationAudioContext) {
    // Stop all oscillators
    notificationOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // Ignore errors if oscillator was already stopped
      }
    });
    
    // Disconnect all gain nodes
    notificationGainNodes.forEach(gain => {
      try {
        gain.disconnect();
      } catch (e) {
        // Ignore errors if already disconnected
      }
    });
    
    // Clear the arrays
    notificationOscillators = [];
    notificationGainNodes = [];
    
    // Close the audio context
    try {
      notificationAudioContext.close();
    } catch (e) {
      // Ignore errors if already closed
    }
    notificationAudioContext = null;
  }
  
  // Clear the repeat interval if it exists
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
};

/**
 * Plays a notification sound consisting of multiple ticks
 * The sound will repeat until stopNotificationSound() is called
 */
export const playNotificationSound = () => {
  // Stop any currently playing notification sounds
  stopNotificationSound();
  
  // Function to play one set of ticks
  const playTickSequence = () => {
    // Create audio context (with fallback for older browsers)
    notificationAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Play multiple ticks with pauses between them for a more noticeable notification pattern
    for (let i = 0; i < 6; i++) {
      const oscillator = notificationAudioContext.createOscillator();
      const gainNode = notificationAudioContext.createGain();

      // Store references to allow stopping later
      notificationOscillators.push(oscillator);
      notificationGainNodes.push(gainNode);

      // Configure the sound parameters
      oscillator.type = 'sine';  // Sine wave for a clean, pure tone
      oscillator.frequency.setValueAtTime(1200, notificationAudioContext.currentTime + (i * 0.5)); // Higher frequency tone (1200Hz), each tick starting 0.5s apart
      gainNode.gain.setValueAtTime(0.2, notificationAudioContext.currentTime + (i * 0.5));  // Increase volume to 20%

      // Connect audio nodes to create the processing chain
      oscillator.connect(gainNode);
      gainNode.connect(notificationAudioContext.destination);

      // Schedule sound playback
      oscillator.start(notificationAudioContext.currentTime + (i * 0.5));    // Delayed start for each tick
      oscillator.stop(notificationAudioContext.currentTime + (i * 0.5) + 0.2); // Each tick lasts 0.2 seconds (shorter, more tick-like)
    }
  };
  
  // Play the first sequence immediately
  playTickSequence();
  
  // Set up an interval to repeat the sound every 5 seconds until stopped
  notificationInterval = setInterval(() => {
    // Clean up previous audio context before creating a new one
    if (notificationAudioContext) {
      notificationOscillators.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {
          // Ignore errors if already stopped
        }
      });
      
      notificationGainNodes.forEach(gain => {
        try {
          gain.disconnect();
        } catch (e) {
          // Ignore errors if already disconnected
        }
      });
      
      notificationOscillators = [];
      notificationGainNodes = [];
      
      try {
        notificationAudioContext.close();
      } catch (e) {
        // Ignore errors if already closed
      }
      notificationAudioContext = null;
    }
    
    // Play the sequence again
    playTickSequence();
  }, 6000); // Repeat every 6 seconds
};

/**
 * Types of noise that can be generated for ambient sound
 * - ocean: calming ocean waves sound
 * - rain: gentle rainfall sound
 * - forest: peaceful forest ambience
 * - cafe: coffee shop background noise
 * - fireplace: crackling fire sound
 */
export type NoiseType = 'ocean' | 'rain' | 'forest' | 'cafe' | 'fireplace';

// Audio file paths for each noise type
const NOISE_FILES: Record<NoiseType, string> = {
  ocean: '/sounds/ocean-waves.mp3',
  rain: '/sounds/rainfall.mp3',
  forest: '/sounds/forest-ambience.mp3',
  cafe: '/sounds/cafe-ambience.mp3',
  fireplace: '/sounds/fireplace.mp3'
};

// Global references to audio elements and nodes
let audioElement: HTMLAudioElement | null = null;
let noiseContext: AudioContext | null = null;
let noiseSource: MediaElementAudioSourceNode | null = null;
let noiseGainNode: GainNode | null = null;
let noiseBiquadFilter: BiquadFilterNode | null = null;

/**
 * Stops playback of ambient noise and cleans up audio resources
 */
export const stopWhiteNoise = () => {
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
    audioElement.remove();
    audioElement = null;
  }

  if (noiseSource) {
    noiseSource.disconnect();
    noiseSource = null;
  }

  if (noiseGainNode) {
    noiseGainNode.disconnect();
    noiseGainNode = null;
  }

  if (noiseBiquadFilter) {
    noiseBiquadFilter.disconnect();
    noiseBiquadFilter = null;
  }

  if (noiseContext) {
    noiseContext.close();
    noiseContext = null;
  }
};

/**
 * Starts playing continuous ambient noise in the background
 */
export const startWhiteNoise = (type: NoiseType = 'ocean', volume: number = 0.1) => {
  // Stop any existing noise playback first
  stopWhiteNoise();

  // Create new audio context
  noiseContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  // Create new audio element
  audioElement = new Audio(NOISE_FILES[type]);
  audioElement.loop = true;

  // Create audio source node
  noiseSource = noiseContext.createMediaElementSource(audioElement);

  // Create gain node to control volume
  noiseGainNode = noiseContext.createGain();
  noiseGainNode.gain.value = volume;

  // Create filter node for sound shaping
  noiseBiquadFilter = noiseContext.createBiquadFilter();

  // Configure filter based on noise type
  switch (type) {
    case 'ocean':
      noiseBiquadFilter.type = 'lowpass';
      noiseBiquadFilter.frequency.value = 1000;
      break;
    case 'rain':
      noiseBiquadFilter.type = 'highpass';
      noiseBiquadFilter.frequency.value = 2000;
      break;
    case 'forest':
      noiseBiquadFilter.type = 'bandpass';
      noiseBiquadFilter.frequency.value = 800;
      noiseBiquadFilter.Q.value = 0.5;
      break;
    case 'cafe':
      noiseBiquadFilter.type = 'bandpass';
      noiseBiquadFilter.frequency.value = 600;
      noiseBiquadFilter.Q.value = 0.7;
      break;
    case 'fireplace':
      noiseBiquadFilter.type = 'lowpass';
      noiseBiquadFilter.frequency.value = 1500;
      break;
  }

  // Connect audio nodes
  noiseSource.connect(noiseGainNode);
  noiseGainNode.connect(noiseBiquadFilter);
  noiseBiquadFilter.connect(noiseContext.destination);

  // Start playing
  audioElement.play().catch(error => {
    console.error('Error playing audio:', error);
  });
};

/**
 * Adjusts the volume of currently playing ambient noise
 */
export const setWhiteNoiseVolume = (volume: number) => {
  if (noiseGainNode) {
    noiseGainNode.gain.value = Math.max(0, Math.min(1, volume));
  }
}; 