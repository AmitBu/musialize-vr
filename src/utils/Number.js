class NumberUtils {
  static scale(num, in_min, in_max, out_min, out_max) {
    return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
  }

  static getRandomArbitrary(min, max) {
    return parseInt(Math.random() * (max - min) + min);
  }
}

export default NumberUtils;
