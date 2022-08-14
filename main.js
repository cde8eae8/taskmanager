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

class TaskDrawer extends EventTarget {
  constructor(root, pos, progress, text, r, transform, data) {
    super();
    this.data = data
    this.p = progress
    this.g = root.append("g")
      .on('click', () => {
        this.selected(!this._selected)
        const e = new CustomEvent('select', { detail: this});
        this.dispatchEvent(e);
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
    this.raw_text = text
    this.text = this.g.append("text").text(text);
    this.redraw(transform)
  }

  redraw(transform) {
    const t = transform;
    const lx = t.applyX(this.pos.x);
    const ly = t.applyY(this.pos.y);

    this._update(new V2(lx, ly), this.outer_r * t.k, this.inner_r * t.k, this.p)
  }

  setPosition(pos, transform) {
    this.pos = pos
    redraw(transform)
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
  console.log(tasks)
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

class Graph {
  constructor(vs, es) {
    this.vertices = vs
    this.edges = es
  }
}

class Renderer extends EventTarget {
  constructor() {
    super();
    const size = new V2(1800, 1800);
    this.circles = []
    this.lines = []

    this.selectedItems = new Set();

    this.svg = d3.select("body")
      .append("svg")
      .attr("width", size.x)
      .attr("height", size.y)

    this.clip = this.svg.append("defs").append("SVG:clipPath")
        .attr("id", "clip")
        .append("SVG:rect")
        .attr("width", size.x)
        .attr("height", size.y)
        .attr("x", 0)
        .attr("y", 0);

    this.viewport = this.svg.append('g')
      .attr("clip-path", "url(#clip)")

    this.linesGroup = this.viewport.append("g");
    this.circlesGroup = this.viewport.append("g");
    this.transform = d3.zoomIdentity;

    const update = () => {
      this.transform = d3.event.transform;
      this.redraw();
    }

    const zoom = d3.zoom()
      .scaleExtent([.5, 20])  // This control how much you can unzoom (x0.5) and zoom (x20)
      .extent([[0, 0], [size.x, size.y]])
      .on("zoom", update);

    this.svg.call(zoom)
      .on('click', () => {
        if (d3.event.target.tagName == "svg") {
          console.log('create!')

          const id = this.nextId;
          this.nextId += 1
          this.graph.vertices.push([0, id]);
          for (var selection of this.selectedItems) {
            this.graph.edges.push([selection.data[0][1], id]);
          }

          this.renderGraph(this.graph);

          for (var selection of this.selectedItems) {
            selection.selected(false)
          }
          this.selectedItems.clear()
          this.redraw();
        }
      });
  }

  redraw() {
    this.circles.forEach(c => c.redraw(this.transform))
    this.lines.forEach(c => c.redraw(this.transform))
  }

  renderGraph(graph) {
    this.graph = graph;
    this.nextId = this.graph.vertices.reduce((a, b) => Math.max(a, b[1]) + 1, -Infinity)
    var levels = prepare(graph.vertices, graph.edges);
    console.log("levels", levels);

    const r = 20;
    this.circlesGroup.html("")
    this.linesGroup.html("")
    this.circles = levels.map((p, i) => {
      const e = new TaskDrawer(this.circlesGroup, p[1], (i % 10) / 10, p[0][1], r, this.transform, p);
      e.addEventListener('select', (e) => { 
        if (e.detail._selected) {
          this.selectedItems.add(e.detail)
        } else {
          this.selectedItems.delete(e.detail)
        }
        console.log(Array.from(this.selectedItems).map(e => e.raw_text)); 
      })
      return e;
    });

    var id2circle = (() => {
      var map = new Map();
      levels.forEach((l, i) => map.set(l[0][1], this.circles[i]));
      return map;
    })();
    console.log(id2circle)
    console.log(graph.edges)
    this.lines = graph.edges.map((b, i) => {
      return new LineDrawer(this.linesGroup, id2circle.get(b[0]).pos, id2circle.get(b[1]).pos)
    })
  }
}

function createGraph() {
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
  return new Graph(levelsRaw, bindings)
}

window.onload = (e) => {
  var graph = createGraph();
  console.log(graph.vertices)
  var renderer = new Renderer();
  renderer.renderGraph(graph);
}
