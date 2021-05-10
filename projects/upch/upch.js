const MESSAGES = {
  default:
    '<p> The <a href="https://www.cs.princeton.edu/~chazelle/temp/451/451-2019/KirkSeidel.pdf">Ultimate Planar Convex Hull Algorithm?</a> is an output-sensitive convex hull algorithm by David Kirkpatrick and Patrick Seidel. The name is derived from its O(nlogh) runtime, which is asymptotically as fast as one can hope for in computing the convex hull of a point set.</p><br><p>To start, click in the box on the right side of the screen to add points to the point set, and hit the "Run" button below when you\'re ready to start the visualization.</p>',
  isUpper:
    '<p>Like many convex hull algorithms, this algorithm computes the upper hull separately from the lower hull, and then merges the two together in constant time. We start with the upper hull, which may contain any points above the line between the minimum and maximum point, sorted by x coordinate.</p>',
  medianLine: 'Now we draw the median line, dividing our current point set into two.',
};

var descriptiveTextDiv = document.getElementById('descriptive-text');
function setMessage(msg) {
  descriptiveTextDiv.innerHTML = msg;
}

setMessage(MESSAGES.default);

var CUR_RUNNING = false;
const TIME_UNIT = 500;

var FUNC_STACK = [];
var FUNC_QUEUE = [];

var HULL_EDGES = [];

var MAX_X;
var MIN_X;

var pointsArr = [];
var pointCircles = [];

var pointsContainer = d3
  .select('#upch')
  .append('svg')
  .attr('class', 'pointsContainer')
  .attr('style', 'outline: thin solid black')
  .attr('width', '100%')
  .attr('height', '100%');

// This click handler is based on the handler from http://bl.ocks.org/WilliamQLiu/76ae20060e19bf42d774
pointsContainer.on('click', (event) => {
  if (!CUR_RUNNING) {
    // don't want to add points while the algorithm is running
    var coords = d3.pointer(event);

    // Normally we go from data to pixels, but here we're doing pixels to data
    var clickCoords = [
      Math.round(coords[0]), // Takes the pixel number to convert to number
      Math.round(coords[1]),
    ];

    duplicateClick = false;
    pointsArr.forEach((point) => {
      if (point[0] === clickCoords[0] && point[1] === clickCoords[1]) {
        duplicateClick = true;
      }
    });

    if (!duplicateClick) {
      pointsArr.push([clickCoords[0], clickCoords[1]]);

      pointCircles.push({
        x_axis: clickCoords[0],
        y_axis: clickCoords[1],
        radius: 6,
        color: 'black',
        id: `a-${clickCoords[0]}-${clickCoords[1]}`,
      });
    }
  }

  var circles = pointsContainer
    .selectAll('circle') // For new circle, go through the update process
    .data(pointCircles)
    .enter()
    .append('circle');

  var circleAttributes = circles
    .attr('cx', (d) => d.x_axis)
    .attr('cy', (d) => d.y_axis)
    .attr('r', (d) => d.radius)
    .attr('id', (d) => d.id)
    .style('fill', (d) => d.color);
});

function start() {
  if (pointsArr.length <= 2) {
    window.alert('Please make sure you draw at least three points in the point set.');
    return;
  }

  CUR_RUNNING = true;
  disableStartBtn();

  pointsContainer.selectAll('circle').attr('style', 'opacity: 0.15;');

  runUPCH();
}

function runUPCH(isUpper = true) {
  setMessage(MESSAGES.isUpper);

  const pointsSortedByX = sortByX(pointsArr);
  const minByX = pointsSortedByX[0];
  const maxByX = pointsSortedByX[pointsArr.length - 1];
  HULL_EDGES.push([minByX, maxByX]);
  MIN_X = minByX;
  MAX_X = maxByX;
  d3.select(`#a-${minByX[0]}-${minByX[1]}`).attr('style', 'fill: green;');
  d3.select(`#a-${maxByX[0]}-${maxByX[1]}`).attr('style', 'fill: green;');
  drawLine(minByX, maxByX, 'green');

  const line = [minByX, maxByX];
  const pointsAboveLine = pointsArr.filter((p) => isAboveLine(p, line));
  for (var i = 0; i < pointsAboveLine.length; i++) {
    const curPoint = pointsAboveLine[i];
    d3.select(`#a-${curPoint[0]}-${curPoint[1]}`).attr('style', 'fill: green;');
  }

  console.log('POINTS ABOVE LINE: ', pointsAboveLine);
  FUNC_QUEUE.push(() => splitPointsInHalf(pointsAboveLine, pointsAboveLine, line));
}

function splitPointsInHalf(originalArr, curPointsArr, splitLine) {
  setMessage(
    'We now partition our potential upper hull vertices into two halves, separated by the median of the point subset by x-coordinate. We color the points in the left partition red, and those in the right partition blue.',
  );
  const medianX = getMedianByX(sortByX(curPointsArr));
  const lineFunc = getLineFunc(splitLine);

  const p1 = [medianX, 0];
  const p2 = [medianX, Math.floor(lineFunc(medianX) + 1)];

  console.log('hello');

  drawLine(p1, p2, 'green', () => {
    for (var i = 0; i < curPointsArr.length; i++) {
      const curPoint = curPointsArr[i];
      const fill = i < curPointsArr.length / 2 ? 'red' : 'blue';
      d3.select(`#a-${curPoint[0]}-${curPoint[1]}`).attr('style', `fill: ${fill};`);
    }
  });

  FUNC_QUEUE.push(() => {
    deleteLine(getLineID(p1, p2));
    pairUpPoints(originalArr, curPointsArr, medianX);
  });
}

function pairUpPoints(originalArr, curPointsArr, medianX) {
  setMessage('Next we randomly pair up points and draw lines between them.');
  const shuffledArr = shuffle(curPointsArr);
  var pairs = [];
  for (var i = 0; i < shuffledArr.length - 1; i = i + 2) {
    const p1 = shuffledArr[i];
    const p2 = shuffledArr[i + 1];
    pairs.push([p1, p2]);
    drawLine(p1, p2, 'black');
  }
  var newPointsArr = [];
  if (curPointsArr.length % 2 === 1) {
    console.log('I PUSHED IT INTO THE NEW POINTS ARRAY');
    newPointsArr.push(curPointsArr[curPointsArr.length - 1]);
  }
  FUNC_QUEUE.push(() => findMedianSlope(originalArr, curPointsArr, pairs, newPointsArr, medianX));
}

function findMedianSlope(originalArr, curPointsArr, pairs, newPointsArr, medianX) {
  setMessage('We find the median of all these slopes, which can be seen highlighted in pink.');
  const slopes = pairs.map((pair) => {
    const curLineID = getLineID(pair[0], pair[1]);
    return [(pair[1][1] - pair[0][1]) / (pair[1][0] - pair[0][0]), curLineID, pair];
  });
  const median = getMedianSlope(slopes.sort(([x1, y1, z1], [x2, y2, z2]) => x1 - x2));
  console.log(
    'SORTED SLOPES: ',
    slopes.sort(([x1, y1, z1], [x2, y2, z2]) => x1 < x2),
  );
  console.log('MEDIAN: ', median);
  d3.select(`#${median[1]}`).attr('stroke', 'hotpink');

  FUNC_QUEUE.push(() =>
    findLastHitPoint(originalArr, curPointsArr, pairs, median, newPointsArr, medianX),
  );
}

function findLastHitPoint(originalArr, curPointsArr, pairs, median, newPointsArr, medianX) {
  extendLine(median[2], 0, () => {
    const f = getLineFunc(median[2]);

    var curMax1 = null;
    var curMax2 = null;
    var twoMaxes = false;

    for (var i = 0; i < curPointsArr.length; i++) {
      const curPoint = curPointsArr[i];
      const curPointVal = curPoint[1] - f(curPoint[0]);
      if (i == 0) curMax1 = { val: curPointVal, point: curPoint };
      else if (curPointVal < curMax1.val) {
        // reversed because d3 coordinate system is reverse in the y direction
        curMax1 = { val: curPointVal, point: curPoint };
        twoMaxes = false;
      } else if (curPointVal == curMax1.val) {
        twoMaxes = true;
        curMax2 = { val: curPointVal, point: curPoint };
      }
    }

    const p1 = curMax1.point;
    const changeY = p1[1] - f(p1[0]);

    const w = pointsContainer.node().getBoundingClientRect().width;

    disableNextBtn();
    d3.select(`#${median[1]}`)
      .transition()
      .duration(TIME_UNIT * 3)
      .attr('y1', f(0) + changeY)
      .attr('y2', f(w) + changeY)
      .on('end', enableNextBtn);

    var falseAlarm = true;
    if (twoMaxes) {
      const p2 = curMax2.point;
      const color1 = p1[0] < medianX ? 'red' : 'blue';
      const color2 = p2[0] < medianX ? 'red' : 'blue';
      if (color1 !== color2) {
        falseAlarm = false;
        console.log('foud a hull edge!');
        FUNC_QUEUE.push(() => {
          addHullEdge(originalArr, curPointsArr, p1, p2);
        });
      }
    }
    if (falseAlarm) {
      const pointColor = p1[0] < medianX ? 'red' : 'blue';

      console.log('point color: ', pointColor);

      var message =
        'Now comes the key to the algorithm: we sweep this median slope in the direction directly perpendicular to itself. When we do this, we will eventually hit one last point (or two, if those two points are collinear at the same slope as our median).<br/>The color of this last-hit point tells us about how our slope compaes to the slope of the convex hull edge we are trying to find.';
      if (pointColor == 'red')
        message = message.concat(
          '<br/>Here, our last point is <span style="background-color: red">red</span>. This implies that the current line we are using to try and connect the red point set to the blue point set is too steep, and so we need to make it shallower.',
        );
      else {
        message = message.concat(
          '<br/>Here, our last point is <span style="background-color: blue">blue</span>. This implies that the current line we are using to try and connect the red point set to the blue point set is too shallow, and so we need to make it steeper.',
        );
      }
      setMessage(message);

      FUNC_QUEUE.push(() => {
        throwAwayData(originalArr, curPointsArr, pairs, median, pointColor, newPointsArr, medianX);
      });
    }
  });
}

function throwAwayData(
  originalArr,
  curPointsArr,
  pairs,
  median,
  lastHitPointColor,
  newPointsArr,
  medianX,
) {
  console.log('new points array before', newPointsArr);
  const slopes = pairs.map((pair) => {
    const curLineID = getLineID(pair[0], pair[1]);
    return [(pair[1][1] - pair[0][1]) / (pair[1][0] - pair[0][0]), curLineID, pair];
  });
  const sortedSlopes = slopes.sort(([x1, y1, z1], [x2, y2, z2]) => x1 - x2);
  if (lastHitPointColor == 'red') {
    for (var i = 0; i < sortedSlopes.length; i++) {
      const p1 = sortedSlopes[i][2][0];
      const p2 = sortedSlopes[i][2][1];
      if (i <= Math.floor(sortedSlopes.length / 2)) {
        if (p1[0] > p2[0]) {
          newPointsArr.push(p1);
          d3.select(`#${getPointID(p2)}`).attr('style', 'fill:yellow;');
        } else {
          newPointsArr.push(p2);
          d3.select(`#${getPointID(p1)}`).attr('style', 'fill:yellow;');
        }
      } else {
        newPointsArr.push(p1);
        newPointsArr.push(p2);
      }
    }
  } else {
    for (var i = 0; i < sortedSlopes.length; i++) {
      const p1 = sortedSlopes[i][2][0];
      const p2 = sortedSlopes[i][2][1];
      if (i >= Math.floor(sortedSlopes.length / 2)) {
        if (p1[0] < p2[0]) {
          newPointsArr.push(p1);
          d3.select(`#${getPointID(p2)}`).attr('style', 'fill:yellow;');
        } else {
          newPointsArr.push(p2);
          d3.select(`#${getPointID(p1)}`).attr('style', 'fill:yellow;');
        }
      } else {
        newPointsArr.push(p1);
        newPointsArr.push(p2);
      }
    }
  }
  console.log('NEW POINTS ARR: ', newPointsArr);
  FUNC_QUEUE.push(() => {
    deleteAllLines();
    removePointColors();
    makeAllNotInArrayClear(newPointsArr);
    drawAllHullEdges();
    for (var i = 0; i < newPointsArr.length; i++) {
      const curPoint = newPointsArr[i];
      if (curPoint[0] < medianX) {
        d3.select(`#${getPointID(curPoint)}`).attr('style', 'fill:red;');
      } else {
        d3.select(`#${getPointID(curPoint)}`).attr('style', 'fill:blue;');
      }
    }
    pairUpPoints(originalArr, newPointsArr, medianX);
  });
}

function addHullEdge(originalArr, curPointsArr, p1, p2) {
  deleteAllLines();
  drawAllHullEdges();
  drawLine(p1, p2, 'green');
  HULL_EDGES.push([p1, p2]);
  if (p1[0] < p2[0]) {
    drawLine(p1, MIN_X, 'orange');
    drawLine(p2, MAX_X, 'orange');
  } else {
    drawLine(p2, MIN_X, 'orange');
    drawLine(p1, MAX_X, 'orange');
  }

  FUNC_QUEUE.push(() => throwAwayPointsInsideTrapezoid(originalArr, curPointsArr, p1, p2));
}

function throwAwayPointsInsideTrapezoid(originalArr, curPointsArr, p1, p2) {
  const lowerLineF = getLineFunc([MAX_X, MIN_X]);
  const upperLineF = getLineFunc([p1, p2]);
  var leftLineF;
  var rightLineF;
  if (p1[0] < p2[0]) {
    leftLineF = getLineFunc([p1, MIN_X]);
    rightLineF = getLineFunc([p2, MAX_X]);
  } else {
    leftLineF = getLineFunc([p2, MIN_X]);
    rightLineF = getLineFunc([p1, MAX_X]);
  }
  var left = [];
  var right = [];
  for (var i = 0; i < originalArr.length; i++) {
    console.log('hi i am in this loop');
    const curPoint = originalArr[i];
    const curPointX = curPoint[0];
    const curPointY = curPoint[1];
    const inTrapezoid = (x, y) => {
      return y < lowerLineF(x) && y > upperLineF(x) && y > leftLineF(x) && y > rightLineF(x);
    };
    const onTrapezoid = (x, y) => {
      return y == lowerLineF(x) || y == upperLineF(x) || y == leftLineF(x) || y == rightLineF(x);
    };
    if (inTrapezoid(curPointX, curPointY) || curPointY > lowerLineF(curPointX)) {
      d3.select(`#${getPointID(curPoint)}`).attr('style', 'fill: black; opacity: 0.15;');
    } else {
      if (!onTrapezoid(curPointX, curPointY)) {
        curPointX > p2[0] ? right.push(curPoint) : left.push(curPoint);
        d3.select(`#${getPointID(curPoint)}`).attr('style', 'fill: yellow;');
      }
    }
  }
  console.log('LEFT: ', left);
  console.log('RIGHT: ', right);
  const leftMore = p1[0] < p2[0] ? p1 : p2;
  const rightMore = p1[0] > p2[0] ? p1 : p2;
  if (left.length > 1)
    FUNC_QUEUE.push(() => splitPointsInHalf(originalArr, left, [leftMore, MIN_X]));
  else FUNC_QUEUE.push(() => solveBaseCase(left, MIN_X, leftMore));
  if (right.length > 1)
    FUNC_STACK.push(() => splitPointsInHalf(originalArr, right, [rightMore, MIN_X]));
  else FUNC_STACK.push(() => solveBaseCase(right, MAX_X, rightMore));
}

function solveBaseCase(d, chP1, chP2) {
  if (d.length == 0) {
    drawLine(chP1, chP2, 'green');
    HULL_EDGES.push([chP1, chP2]);
  } else {
    console.log('DELETING LINE');
    deleteLine(getLineID(chP1, chP2));
    deleteLine(getLineID(chP2, chP1));
    if (d.length == 1) {
      HULL_EDGES.push([d[0], chP1]);
      HULL_EDGES.push([d[0], chP2]);

      drawLine(d[0], chP1, 'green');
      drawLine(d[0], chP2, 'green');
      return;
    }
  }
}

function reset() {
  console.log('reset not implemented');
}

function next() {
  if (FUNC_QUEUE.length !== 0) FUNC_QUEUE.pop(0)();
  else if (FUNC_STACK.length !== 0) FUNC_STACK.pop()();
  else {
    disableNextBtn();
    descriptiveTextDiv.innerHTML = messages.allDone;
  }
}

function enableNextBtn() {
  document.getElementById('nextBtn').disabled = false;
}

function disableNextBtn() {
  document.getElementById('nextBtn').disabled = true;
}

function enableStartBtn() {
  document.getElementById('startBtn').disabled = false;
}

function disableStartBtn() {
  document.getElementById('startBtn').disabled = true;
}

function isAboveLine(point, line) {
  const pX = point[0];
  const pY = point[1];

  return getLineFunc(line)(pX) > pY;
}

function getLineFunc(line) {
  const x1 = line[0][0];
  const y1 = line[0][1];

  const x2 = line[1][0];
  const y2 = line[1][1];

  const m = (y2 - y1) / (x2 - x1);
  const b = y2 - m * x2;

  return (x) => m * x + b;
}

function sortByX(arr) {
  return arr.sort(([x1, y1], [x2, y2]) => x1 - x2);
}

function drawLine(startPoint, endPoint, color, endFunc = () => {}) {
  disableNextBtn();
  const id = getLineID(startPoint, endPoint);
  pointsContainer
    .append('line')
    .attr('stroke-width', 2)
    .attr('stroke', color)
    .attr('id', id)
    .attr('x1', startPoint[0])
    .attr('y1', startPoint[1])
    .attr('x2', startPoint[0])
    .attr('y2', startPoint[1]);
  pointsContainer
    .select('#' + id)
    .transition()
    .duration(TIME_UNIT)
    .attr('x2', endPoint[0])
    .attr('y2', endPoint[1])
    .on('end', () => {
      endFunc();
      enableNextBtn();
    });
}

function deleteLine(id) {
  d3.select(`#${id}`).remove();
}

function extendLine(line, timeFactor = 1, endFunc = () => {}) {
  disableNextBtn();
  const f = getLineFunc(line);
  const w = pointsContainer.node().getBoundingClientRect().width;
  const lineID = getLineID(line[0], line[1]);
  d3.select(`#${lineID}`)
    .transition()
    .duration(TIME_UNIT * timeFactor)
    .attr('x1', 0)
    .attr('y1', f(0))
    .attr('x2', w)
    .attr('y2', f(w))
    .on('end', () => {
      endFunc();
      enableNextBtn();
    });
}

function getMedianByX(sortedPointsArr) {
  const median =
    sortedPointsArr % 2 == 0
      ? (sortedPointsArr[sortedPointsArr.length / 2 + 1][0] +
          sortedPointsArr[sortedPointsArr.length / 2][0]) /
        2
      : sortedPointsArr[Math.floor(sortedPointsArr.length / 2)][0];
  return median;
}

function getMedianSlope(sortedSlopes) {
  console.log('getting medain slope');
  return sortedSlopes[Math.floor(sortedSlopes.length / 2)];
}

function shuffle(array) {
  // from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function getLineID(p1, p2) {
  return 'line-' + p1.toString().replace(',', 'l') + p2.toString().replace(',', 'l');
}

function getPointID(p) {
  return `a-${p[0]}-${p[1]}`;
}

function removePointColors() {
  d3.selectAll('circle').attr('style', 'fill:black;');
}

function makeAllNotInArrayClear(arr) {
  d3.selectAll('circle').attr('style', 'opacity:0.15;');
  for (var i = 0; i < arr.length; i++) {
    const curPoint = arr[i];
    const pointID = getPointID(curPoint);
    d3.select(`#${pointID}`).attr('style', 'fill:black;');
  }
}

function deleteAllLines() {
  d3.selectAll('line').remove();
}

function drawAllHullEdges() {
  for (var i = 0; i < HULL_EDGES.length; i++) {
    const p1 = HULL_EDGES[i][0];
    const p2 = HULL_EDGES[i][1];
    d3.select(`#a-${p1[0]}-${p1[1]}`).attr('style', 'fill: green;');
    d3.select(`#a-${p2[0]}-${p2[1]}`).attr('style', 'fill: green;');
    drawLine(p1, p2, 'green');
  }
}
