class MidiUtils {
    static getScaleFromMidi(midiNum) {
        return Math.floor(midiNum / 12) - 1;
    }

    static freqToMidi(freq) {
        var e = Math.log(freq / 440) / Math.log(2);
        var i = Math.round(12 * e) + 69;
        return i;
    }
}

export default MidiUtils;