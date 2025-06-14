export default function filterSetting(voice) {
  let filterSetting;
  if (voice == 1) {
    filterSetting = [
      // Raise pitch by 5 semitones
      {
        filter: "asetrate",
        options: "44100*1.9874", // Increase pitch by 5 semitones (pitch factor 1.5874)
      },
      {
        filter: "atempo",
        options: "1/1.9874", // Maintain tempo while applying the pitch shift
      },
      {
        filter: "aresample",
        options: "44100",
      },
      // Highpass filter to eliminate low frequencies
      {
        filter: "highpass",
        options: "f=200", // Cut off low frequencies, making the voice sound sharp
      },
      // Boost high frequencies for a digital, robotic tone
      {
        filter: "equalizer",
        options: "f=7000:t=q:w=1.5:g=6", // Sharpen the voice with a digital, robotic tone
      },
      // Add distortion to increase the robotic effect
      {
        filter: "afftdn",
        options: "nt=w", // White noise frequency domain filter
      },
    ];
  }
  if (voice == 2) {
    filterSetting = [
      // Raise pitch by 3 semitones
      {
        filter: "asetrate",
        options: "44100*1.6667", // Increase pitch by 3 semitones (pitch factor 1.2600)
      },
      {
        filter: "atempo",
        options: "1/1.6667", // Maintain tempo while applying the pitch shift
      },
      {
        filter: "aresample",
        options: "44100",
      },
      // Highpass filter to remove the warmth of low frequencies
      {
        filter: "highpass",
        options: "f=300", // Remove low frequencies to create a thin, unnatural sound
      },
      // Boosting high frequencies to make the voice thin and glassy
      {
        filter: "equalizer",
        options: "f=5000:t=q:w=1.5:g=8", // Boost high frequencies to make the voice sound thin
      },
      // Cut midrange frequencies for a more distant, synthetic effect
      {
        filter: "equalizer",
        options: "f=1500:t=q:w=2:g=-6", // Muffle midrange frequencies
      },
    ];
  }
  if (voice == 3) {
    filterSetting = [
      // Lower pitch by 3 semitones
      {
        filter: "asetrate",
        options: "44100*0.6667", // Decrease pitch by 3 semitones (pitch factor 0.63095)
      },
      {
        filter: "atempo",
        options: "1/0.6667", // Maintain tempo while applying the pitch shift
      },
      {
        filter: "aresample",
        options: "44100",
      },
      // Lowpass filter to cut off clarity in the high frequencies
      {
        filter: "lowpass",
        options: "f=1500", // Cut higher frequencies to obscure natural voice
      },
      // Boosting high frequencies for a metallic sound
      {
        filter: "equalizer",
        options: "f=4000:t=q:w=1.5:g=10", // Boost high frequencies to make the voice sound metallic
      },
      // Add distortion to make the voice more robotic
      {
        filter: "afftdn", // Frequency domain noise reduction (adds distortion and artifact)
        options: "nt=w", // White noise reduction type
      },
    ];
  }
  if (voice == 4) {
    filterSetting = [
      // Lower pitch by 2 semitones
      {
        filter: "asetrate",
        options: "44100*0.807", // Decrease pitch by 2 semitones (pitch factor 0.707)
      },
      {
        filter: "atempo",
        options: "1/0.807", // Maintain tempo while applying the pitch shift
      },
      {
        filter: "aresample",
        options: "44100",
      },
      // Lowpass filter to remove high frequencies (masking clarity)
      {
        filter: "lowpass",
        options: "f=2000", // Remove higher frequencies, making voice more distant
      },
      // Muffle the voice by cutting midrange frequencies
      {
        filter: "equalizer",
        options: "f=500:t=q:w=1.5:g=-5", // Reduce low-mid frequencies to make the voice hollow
      },
      {
        filter: "equalizer",
        options: "f=1000:t=q:w=2:g=-3", // Muffle the voice further by cutting the midrange
      },
    ];
  }

  return filterSetting;
}
