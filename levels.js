function topSortImpl(v, getNeighbours, state, id) {
  if (state.has(v)) { return id; }
  state.set(v, { visited: true });
  var depth = 0;
  for (var w of getNeighbours(v)) {
    id = topSortImpl(w, getNeighbours, state, id);
    depth = Math.max(depth, state.get(w).depth)
  }
  id += 1;
  state.get(v).id = id;
  state.get(v).depth = depth + 1;
  return id;
}

function topSort(vertices, getNeighbours) {
  var results = new Map();
  var id = 0;
  for (var v of vertices) {
    id = topSortImpl(v, getNeighbours, results, id);
  }
  return results;
}

function levelsToCoordinates(rect, levelSizes) {
  var coordinates = [];
  for (var i = 0; i < levelSizes.length; ++i) {
    coordinates.push([]);
  }

  dx = (rect.r() - rect.l()) / levelSizes.length

  levelSizes.forEach((l, idx) => {
    dy = (rect.b() - rect.t()) / l;
    //const k = Math.random()
    const k = 1/2;
    const offset = new V2(dx / 2, k * dy);
    for (var i = 0; i < l; ++i) {
      coordinates.at(idx).push(rect.lt().add(new V2(dx * idx, dy * i)).add(offset))
    }
  })
  return coordinates
}

function circleLevelsToCoordinates(rect, levelSizes) {
  levelSizes = [...levelSizes];
  levelSizes.reverse();
  var coordinates = [];
  for (var i = 0; i < levelSizes.length; ++i) {
    coordinates.push([]);
  }

  r = Math.min(rect.w(), rect.h()) / 2;
  dr = r / levelSizes.length

  levelSizes.forEach((l, idx) => {
    dy = 360 / l;
    const cr = dr * idx;
    for (var i = 0; i < l; ++i) {
      const offset = idx % 2 == 0 ? 0 : Math.PI / 4;
      const a = dy * i / 180 * Math.PI + offset;
      coordinates.at(idx).push(rect.lt()
        .add(new V2(r, r))
        .add(new V2(Math.cos(a) * cr, Math.sin(a) * cr)));
    }
  })
  return coordinates
}

function buildLevels(objects, getLevel) {
  const minMaxLevel = objects.reduce((la, b) => {
    // const la = getLevel(a);
    const lb = getLevel(b);
    return [Math.min(la[0], lb), Math.max(la[1], lb)];
  }, [Infinity, -Infinity]);
  var levels = [];
  for (var i = 0; i < minMaxLevel[1] - minMaxLevel[0] + 1; ++i) {
    levels.push([]);
  }
  const minLevel = minMaxLevel[0];
  for (o of objects) {
    level = getLevel(o) - minLevel;
    levels[level].push(o);
  }
  return levels;
}
