class V2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    return new V2(this.x + v.x, this.y + v.y);
  }

  toString() {
    return "(" + this.x + ", " + this.y + ")";
  }
};

class Rect {
  constructor(l, t, r, b) {
    this._l = l
    this._t = t
    this._r = r
    this._b = b
  }

  l() { return this._l }
  t() { return this._t }
  r() { return this._r }
  b() { return this._b }
  w() { return this._r - this._l }
  h() { return this._b - this._t }
  lt() { return new V2(this._l, this._t)}

}
