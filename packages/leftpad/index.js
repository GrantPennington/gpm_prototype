module.exports = (str, len) => {
  while (str.length < len) {
    str = ' ' + str;
  }
  return str;
};