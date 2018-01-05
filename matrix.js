export class Matrix {
  constructor(w, h) {
    this.width = w;
    this.height = h;
    this.buffer = new Float64Array(w*h);
  }
  get(y, x) {
    return this.buffer[y * this.width + x];
  }
  set(y, x, v) {
    return this.buffer[y * this.width + x] = v;
  }
  mul(b, result=null) {
    if (this.width !== b.height) {
      throw new Error("Incompatible matrices at .mul");
    }
    if (!result) {
      result = new Matrix(b.width, this.height);
    }
    if (result.height !== this.height || result.width !== b.width) {
      throw new Error("Incompatible result matrix at .mul");
    }
    
    for (var i = 0; i < this.height; i++) {
      for (var j = 0; j < b.width; j++) {
        let sum = 0;
        for (var k = 0; k < this.width; k++) {
          sum += this.get(i, k) * b.get(k, j);
        }
        result.set(i, j, sum);
      }
    }
    return result;
  }

  t_mul(b, result=null) {
    if (this.height !== b.height) {
      throw new Error("Incompatible matrices at .t_mul");
    }
    if (!result) {
      result = new Matrix(b.width, this.width);
    }
    if (result.height !== this.width || result.width !== b.width) {
      throw new Error("Incompatible result matrix at .mul");
    }
    
    for (var i = 0; i < this.width; i++) {
      for (var j = 0; j < b.width; j++) {
        let sum = 0;
        for (var k = 0; k < this.height; k++) {
          sum += this.get(k, i) * b.get(k, j);
        }
        result.set(i, j, sum);
      }
    }
    return result;
  }
  
  add(b, result=this) {
    if (this.width !== b.width || this.height !== b.height) {
      throw new Error("Incompatible matrices at .add");
    }
    if (!result) {
      result = new Matrix(this.width, this.height);
    }
    if (this.width !== result.width || this.height !== result.height) {
      throw new Error("Incompatible result matrix at .add");
    }
        
    for (var i = 0; i < this.height; i++) {
      for (var j = 0; j < this.width; j++) {
        result.set(i, j, this.get(i, j) + b.get(i, j));
      }
    }
    return result;
  }

  sub(b, result=this) {
    if (this.width !== b.width || this.height !== b.height) {
      throw new Error("Incompatible matrices at .sub");
    }
    if (!result) {
      result = new Matrix(this.width, this.height);
    }
    if (this.width !== result.width || this.height !== result.height) {
      throw new Error("Incompatible result matrix at .sub");
    }
        
    for (var i = 0; i < this.height; i++) {
      for (var j = 0; j < this.width; j++) {
        result.set(i, j, this.get(i, j) - b.get(i, j));
      }
    }
    return result;
  }
  scale(f, result=this) {
    if (!result) {
      result = new Matrix(this.width, this.height);
    }
    if (this.width !== result.width || this.height !== result.height) {
      throw new Error("Incompatible result matrix at .scale");
    }
    for (var i = 0; i < this.height; i++) {
      for (var j = 0; j < this.width; j++) {
        result.set(i, j, this.get(i, j) * f);
      }
    }
    return result;
  }
  clone(result=null) {
    if (!result) {
      result = new Matrix(this.width, this.height);
    }
    if (this.width !== result.width || this.height !== result.height) {
      throw new Error("Incompatible result matrix at .clone");
    }
    for (var i = 0; i < this.height; i++) {
      for (var j = 0; j < this.width; j++) {
        result.set(i, j, this.get(i, j));
      }
    }
    return result;
  }
  copy_rect(sx, sy, dest, dx, dy, w, h) {
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        dest.set(dy + i, dx + j, this.get(sy + i, sx + j));
      }
    }
  }
  identity_rect(x, y, s) {
    for (let i = 0; i < s; i++) {
      for (let j = 0; j < s; j++) {
        this.set(y + i, x + j, i === j ? 1 : 0);
      }
    }
  }
  exchange_rows(a, b) {
    if (a === b) {
      return;
    }
    for (var j = 0; j < this.width; j++) {
      let tmp = this.get(a, j);
      this.set(a, j, this.get(b, j));
      this.set(b, j, tmp);
    }
  }
  sub_row_scaled(dest, src, scale) {
    for (var j = 0; j < this.width; j++) {
      this.set(dest, j, this.get(dest, j) - this.get(src, j) * scale);
    }
  }
  scale_row(row, s) {
    for (var j = 0; j < this.width; j++) {
      this.set(row, j, this.get(row, j) * s);
    }
  }
  search_largest_abs_diag(idx) {
    var maxi = -1, maxv = 0;
    for (let i = idx; i < this.height; i++) {
      const curr = Math.abs(this.get(i, idx));
      if (maxi < 0 || curr > maxv) {
        maxi = i;
        maxv = curr;
      }
    }
    return maxi;
  }
  invert(result=null) {
    const self = this;
    const size = this.width;
    if (this.height !== this.width) {
      throw new Error("Cannot invert non-square matrix");
    }
    if (!result) {
      result = new Matrix(size, size);
    }
    if (size !== result.width || size !== result.height) {
      throw new Error("Incompatible result matrix at .invert");
    }
    
    const temp = new Matrix(size * 2, size);
    this.copy_rect(0, 0, temp, 0, 0, size, size);
    temp.identity_rect(size, 0, size);
    temp.gauss_elimination();
    temp.copy_rect(size, 0, result, 0, 0, size, size);
    return result;
  }
  
  gauss_elimination() {
    for (var j = 0; j < this.height; j++) {
      var goodi = this.search_largest_abs_diag(j);
      this.exchange_rows(goodi, j);
      this.scale_row(j, 1 / this.get(j, j));
      for (var i = j+1; i < this.height; i++) {
        this.sub_row_scaled(i, j, this.get(i, j));
      }
    }
    for (var j = this.height - 1; j >= 0; j--) {
      for (var i = 0; i < j; i++) {
        this.sub_row_scaled(i, j, this.get(i, j));
      }
    }
  }
  toJSON() {
    var result = "[";
    for (var i = 0; i < this.height; i++) {
      if (i !== 0) result += ",\n";
      result += "[";
      for (var j = 0; j < this.width; j++) {
        if (j !== 0) result += ", ";
        result += this.get(i, j);
      }
      result += "]";
    }
    return result + "]";
  }
};
