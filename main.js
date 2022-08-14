class Task {
  constructor(progress, text="task") {
    this.progress = progress
    this.text = text
  }
}

class Events {
  constructor() {
    this.events = []
  }

  addEvent() {

  }

  processEvents() {

  }
}

class TaskDrawer {
  constructor(root, pos, progress, text, r, transform) {
    this.p = progress
    this.g = root.append("g")
      .on('click', () => {
        this.selected(!this._selected)
      });
    this.outer = this.g.append("circle");
    this.arc = this.g.append("path")
        .attr("fill", "green");
    this.inner = this.g.append("circle");
    this.outer_r = r;
    this.inner_r = 0.5 * r;
    this.pos = pos;
    this.outer.attr("fill", "black");
    this.inner.attr("fill", "lightgrey");
    this.arc.attr("fill", "green");
    this.text = this.g.append("text").text(text);
    this.redraw(transform)
  }

  redraw(transform) {
    const t = transform;
    const lx = t.applyX(this.pos.x);
    const ly = t.applyY(this.pos.y);

    this._update(new V2(lx, ly), this.outer_r * t.k, this.inner_r * t.k, this.p)
  }

  selected(on) {
    this._selected = on;
    if (this._selected) {
      this.inner.attr("fill", "yellow")
    } else {
      this.inner.attr("fill", "lightgrey")
    }
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
    const textPos = pos.add(new V2(or, 0));
    this.text
      .attr("transform", "translate(" + textPos.x + "," + textPos.y + ")");
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

function prepare(tasks, bindings) {
  const depthsRaw = topSort(tasks, (v) => { 
    return bindings.filter(p => p[0] == v[1]).map(p => tasks[p[1] - 1])
  });

  var d = Array.from(depthsRaw);
  d.sort((a, b) => a[1].depth - b[1].depth)

  for (var v of d) {
    console.log(v[0], v[1]);
  }

  var levels = buildLevels(d, (o) => -o[1].depth)
  const levelSizes = levels.map(l => l.length)
  const cs = levelsToCoordinates(new Rect(0, 0, 900, 700), levelSizes);
  levels = levels.map((level, i) => {
    return level.map((el, j) => {
      return [el[0], cs.at(i).at(j)]
    });
  });
  levels = levels.flat();
  console.log(levels)
  return levels;
}

function example() {
  const levelsRaw = [
    [0, 1], [0, 2], 
    [1, 3], [1, 4], [1, 5], [1, 6], 
    [2, 7], [2, 8], [2, 9], [2, 10],
    [3, 11]
  ];

  var bindings = [
    [1, 6],
    [1, 3],
    [2, 4],
    [2, 3],
    [3, 7],
    [4, 7],
    [5, 8],
    [6, 8],
    [7, 11],
    [8, 11],
    [9, 11],
    [10, 11]
  ];
}

window.onload = (e) => {
  var n = 10;
  var p = 0.6;
  var r = 5;
  var levelsRaw = []
  for (var i = 1; i <= n; ++i) {
    levelsRaw.push([0, i]);
  }

  var bindings = []
  for (var i = 1; i <= n; ++i) {
    for (var j = i + 1; j <= n; ++j) {
      if (Math.random() > p) {
        bindings.push([i, j])
      }
    }
  }

  var transform = d3.zoomIdentity

  var levels = prepare(levelsRaw, bindings)
  const points = levels.map((l) => l[1])
  const progress = [ 70, 50, 10, 20, 90, 10, 10, 10, 10, 10, 10 ]

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

  var linesGroup = viewport.append("g");
  var circlesGroup = viewport.append("g");
  var circles = levels.map((p, i) => new TaskDrawer(circlesGroup, p[1], (i % 10) / 10, p[0][1], r, transform));
  var id2circle = function() {
    var map = new Map();
    levels.forEach((l, i) => map.set(l[0][1], circles[i]));
    return map;
  }();
  var lines = bindings.map((b, i) => 
    new LineDrawer(linesGroup, id2circle.get(b[0]).pos, id2circle.get(b[1]).pos))


  const update = () => {
    transform = d3.event.transform
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
    .on('click', () => {
      if (d3.event.target.tagName == "svg") {
        const e = d3.event;
        const task = new TaskDrawer(circlesGroup, new V2(e.x, e.y), 0.7, '!', r, transform);
        circles.push(task)
      }
    });
}
