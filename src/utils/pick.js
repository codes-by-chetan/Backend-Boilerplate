const pick = (object, keys) =>
  keys.reduce((accumulator, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key) && object[key] !== undefined) {
      accumulator[key] = object[key];
    }

    return accumulator;
  }, {});

export default pick;
