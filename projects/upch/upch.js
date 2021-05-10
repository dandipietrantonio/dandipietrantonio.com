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
  d3.select(`#a-${minByX[0]}-${minByX[1]}`).attr('style', 'fill: green;');
  d3.select(`#a-${maxByX[0]}-${maxByX[1]}`).attr('style', 'fill: green;');
  drawLine(minByX, maxByX, 'green');

  const line = [minByX, maxByX];
  const pointsAboveLine = pointsArr.filter((p) => isAboveLine(p, line));
  console.log('POINTS ABOVE LINE: ', pointsAboveLine);
  for (var i = 0; i < pointsAboveLine.length; i++) {
    const curPoint = pointsAboveLine[i];
    d3.select(`#a-${curPoint[0]}-${curPoint[1]}`).attr('style', 'fill: green;');
  }

  FUNC_QUEUE.push(() => splitPointsInHalf(pointsAboveLine, line));
}

function splitPointsInHalf(curPointsArr, splitLine) {
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
    pairUpPoints(curPointsArr);
  });
}

function pairUpPoints(curPointsArr) {
  setMessage('Next we randomly pair up points and draw lines between them.');
  const shuffledArr = shuffle(curPointsArr);
  var pairs = [];
  for (var i = 0; i < shuffledArr.length - 1; i = i + 2) {
    const p1 = shuffledArr[i];
    const p2 = shuffledArr[i + 1];
    pairs.push([p1, p2]);
    drawLine(p1, p2, 'black');
  }
  FUNC_QUEUE.push(() => findMedianSlope(curPointsArr, pairs));
}

function findMedianSlope(curPointsArr, pairs) {
  setMessage('We find the median of all these slopes, which can be seen highlighted in pink.');
  const slopes = pairs.map((pair) => {
    const curLineID = getLineID(pair[0], pair[1]);
    return [(pair[1][1] - pair[0][1]) / (pair[1][0] - pair[0][0]), curLineID, pair];
  });
  console.log('slopes: ', slopes);
  console.log(
    'sorted lopes: ',
    slopes.sort(([x1, y1], [x2, y2]) => x1 < x2),
  );
  const median = getMedianSlope(slopes.sort(([x, y]) => x));
  console.log('yes');
  console.log('MEDIAN: ', median);
  d3.select(`#${median[1]}`).attr('stroke', 'hotpink');

  FUNC_QUEUE.push(() => findLastHitPoint(curPointsArr, pairs, median));
}

function findLastHitPoint(curPointsArr, pairs, median) {
  extendLine(median[2]);

  const f = getLineFunc(median[2]);

  var curMax = null;
  var twoMaxes = false;
  for (var i = 0; i < curPointsArr.length; i++) {
    const curPoint = curPointsArr[i];
    const curPointVal = curPoint[1] - f(curPoint[0]);
    if (i == 0) curMax = { val: curPointVal, point: curPoint };
    else if (curPointVal < curMax.val) {
      // reversed because d3 coordinate system is reverse in the y direction
      twoMaxes = false;
      curMax = { val: curPointVal, point: curPoint };
    } else {
      twoMaxes = true;
      curMax = {
        max1: curMax,
        max2: {
          val: curPointVal,
          point: curPoint,
        },
      };
    }
  }

  if (twoMaxes) {
    console.log('WE HAVE A WINNER!');
    const maxID1 = getPointID(curMax.max1.point);
    const maxID2 = getPointID(curMax.max2.point);

    d3.select(`#${maxID1}`).attr('style', 'fill: yellow;');
    d3.select(`#${maxID2}`).attr('style', 'fill: yellow;');
  } else {
    const maxID = getPointID(curMax.point);
    d3.select(`#${maxID}`).attr('style', 'fill: yellow;');
  }
}

function pointIsToLeftOrRightOfLine(point, line) {
  // from https://math.stackexchange.com/questions/274712/calculate-on-which-side-of-a-straight-line-is-a-given-point-located

  const x = point[0];
  const y = point[1];
  const x1 = line[0][0];
  const y1 = line[0][1];
  const x2 = line[1][0];
  const y2 = line[1][1];

  const val = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1);

  return val < 0 ? 'right' : val == 0 ? 'on' : 'left';
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
  console.log('drawing line: ', startPoint, endPoint);
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

function extendLine(line) {
  const f = getLineFunc(line);
  const w = pointsContainer.node().getBoundingClientRect().width;
  const lineID = getLineID(line[0], line[1]);
  d3.select(`#${lineID}`)
    .transition()
    .duration(TIME_UNIT)
    .attr('x1', 0)
    .attr('y1', f(0))
    .attr('x2', w)
    .attr('y2', f(w));
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
