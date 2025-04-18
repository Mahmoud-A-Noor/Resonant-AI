class NoiseSuppressor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.noiseLevel = 0.01;
    this.smoothingFactor = 0.8;
  }

  process(inputs, outputs) {
    const input = inputs[0][0];
    const output = outputs[0][0];
    
    if (!input) return true;
    
    // Gentle noise reduction - only suppress very quiet sounds
    const threshold = 0.05; // Increased from 0.01
    
    for (let i = 0; i < input.length; i++) {
      output[i] = Math.abs(input[i]) > threshold ? input[i] : 0;
    }
    
    return true;
  }
}

registerProcessor('noise-suppressor', NoiseSuppressor);
