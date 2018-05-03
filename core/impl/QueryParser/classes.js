class Attr {

  constructor(value) {
    this.val = value;
  }

  set value(v) {
    this.val = v;
  }

  get value() {
    if (this.val) {
      if (this.val[0] === '$') {
        return this.val.substr(1);
      }
      return this.val;
    }
  }
}

module.exports.Attr = Attr;
