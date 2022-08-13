class Task {
  constructor(progress, text="task") {
    this.progress = progress
    this.text = text
  }
}

class TaskDrawer {
  constructor(root, pos, progress, text) {
    console.log(pos, text)
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
    this.text = this.g.append("text").text(text);
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
    this.text
      .attr("transform", "translate(" + pos.x + "," + pos.y + ")");
  }
}

class LineDrawer {
  constructor(root, lpos, rpos) {
    this.lpos = lpos;
    this.rpos = rpos;
    this.path = root.append("path")
      .attr("fill", "none")
      .attr("stroke", "black");
    this._update(lpos, rpos);
  }

  redraw(t) {
    const lx = t.applyX(this.lpos.x);
    const ly = t.applyY(this.lpos.y);
    const rx = t.applyX(this.rpos.x);
    const ry = t.applyY(this.rpos.y);
    this._update(new V2(lx, ly), new V2(rx, ry));
  }

  _update(from, to) {
    const m = (from.x + to.x) / 2;
    const points = [
      from, new V2(m, from.y), new V2(m, to.y), to
    ];

    const line = d3.line()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(d3.curveBasis);
    this.path.attr("d", line(points));
  }
}

window.onload = (e) => {
  const levelsRaw = [
    [0, 1], [0, 2], 
    [1, 3], [1, 4], [1, 5], [1, 6], 
    [2, 7], [2, 8], [2, 9], [2, 10],
    [3, 11]
  ];
  var levels = buildLevels(levelsRaw, (o) => o[0])
  const levelSizes = levels.map(l => l.length)
  const cs = levelsToCoordinates(new Rect(0, 0, 900, 700), levelSizes);
  //const cs = circleLevelsToCoordinates(new Rect(0, 0, 1000, 1000), levelSizes);
  levels = levels.map((level, i) => {
    return level.map((el, j) => {
      return [el, cs.at(i).at(j)]
    });
  });
  levels = levels.flat();

  const points = cs.flat()
  const progress = [ 70, 50, 10, 20, 90, 10, 10, 10, 10, 10, 10 ]

  const r = 10;
  var size = points.reduce(
      (a, b) => new V2(Math.max(a.x, b.x), Math.max(a.y, b.y)), 
      new V2(-Infinity, -Infinity)).add(new V2(r, r));
  size = new V2(size.x * 2, size.y * 2)

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

  const bindings = [
    [0, 5],
    [0, 2],
    [1, 3],
    [1, 2],
    [2, 6],
    [3, 6],
    [4, 7],
    [5, 7],
    [7, 10],
    [6, 10],
    [8, 10],
    [9, 10]
  ]

  var linesGroup = viewport.append("g");
  var circlesGroup = viewport.append("g");
  console.log(levels)
  const circles = levels.map((p, i) => new TaskDrawer(circlesGroup, p[1], progress[i] / 100, i));
  const lines = bindings.map((b, i) => 
    new LineDrawer(linesGroup, circles[b[0]].pos, circles[b[1]].pos))

  const update = () => {
    const t = d3.event.transform;
    const k = t.k;
    circles.forEach(c => c.redraw(t))
    lines.forEach(c => c.redraw(t))
  }

  const zoom = d3.zoom()
    .scaleExtent([.5, 20])  // This control how much you can unzoom (x0.5) and zoom (x20)
    .extent([[0, 0], [size.x, size.y]])
    .on("zoom", update);

  svg.call(zoom)
}
