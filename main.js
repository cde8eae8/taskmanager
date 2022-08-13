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

class Task {
  constructor(progress, text="task") {
    this.progress = progress
    this.text = text
  }
}

class TaskDrawer {
  constructor(root, pos, progress) {
    this.p = progress
    this.g = root.append("g");
    this.outer = this.g.append("circle");
    this.arc = this.g.append("path")
        .attr("fill", "green");
    this.inner = this.g.append("circle");
    this.outer_r = 40;
    this.inner_r = 20;
    this.pos = pos;
    this.outer.attr("fill", "black");
    this.inner.attr("fill", "lightgrey");
    this.arc.attr("fill", "green");
    this._update(this.pos, this.outer_r, this.inner_r, this.p);
  }

  redraw(transform) {
    const t = transform;
    const lx = t.applyX(this.pos.x);
    const ly = t.applyY(this.pos.y);

    this._update(new V2(lx, ly), this.outer_r * t.k, this.inner_r * t.k, this.p)
  }

  _update(pos, or, ir, p) { 
    const arc = d3.arc()
      .innerRadius(ir)
      .outerRadius(or)
      .startAngle(0)
      .endAngle(Math.PI * 2 * p);

    this.arc.attr("d", arc());

    this.outer
      .attr("r", or)
      .attr("cx", pos.x)
      .attr("cy", pos.y);
    this.arc
      .attr("transform", "translate(" + pos.x + "," + pos.y + ")")
    this.inner
      .attr("r", ir)
      .attr("cx", pos.x)
      .attr("cy", pos.y);
  }
}

window.onload = (e) => {
  const points = [
      [100, 100],
      [100, 400],
      [400, 300],
      [700, 200],
      [600, 100]
    ].map((v) => new V2(v[0], v[1]));
  const progress = [ 70, 50, 10, 20, 90 ]

  const r = 10;
  const size = points.reduce(
      (a, b) => new V2(Math.max(a.x, b.x), Math.max(a.y, b.y)), 
      new V2(-Infinity, -Infinity)).add(new V2(r, r));

  var svg = d3.select("body")
    .append("svg")
    .attr("width", size.x)
    .attr("height", size.y)

  var clip = svg.append("defs").append("SVG:clipPath")
      .attr("id", "clip")
      .append("SVG:rect")
      .attr("width", size.x)
      .attr("height", size.y)
      .attr("x", 0)
      .attr("y", 0);

  const viewport = svg.append('g')
    .attr("clip-path", "url(#clip)")

  const circles = points.map((p, i) => new TaskDrawer(viewport, p, progress[i] / 100));

  const update = () => {
    const t = d3.event.transform;
    const k = t.k;
    circles.forEach(c => c.redraw(t))
  }

  const zoom = d3.zoom()
    .scaleExtent([.5, 20])  // This control how much you can unzoom (x0.5) and zoom (x20)
    .extent([[0, 0], [size.x, size.y]])
    .on("zoom", update);

  svg.call(zoom)
}
