const messages = {
  default:
    '<p> The <a href="https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm"   >Douglas-Peucker Algorithm</a > is an intuitive, recursive line simplification algorithm.<br/><br/>To use this visualizer, first click two points in the blue box. This will be your epsilon value. Next, create a polyline in the red box by clicking wherever you want the points to go. Once you\'re ready, hit "Run RDP", and the Douglas-Peucker algorithm will be performed, with explanations in the sidebar. Hit "Next" to get to the next step. Hit "Reset" to start again. </p>',
  firstStep: '<p>First, we draw a line from the start point to the end point.</p>',
  consideringNewLine:
    '<p>The line highlighted in blue is our current potential output. In order to see if this line is an accurate representation of the original polyline, we must make sure that every point between the start point and end point are within a distance of epsilon of this simplified line, where epsilon is the length of the line you drew in the blue box above.</p>',
  calculatingDistance:
    '<p>We go through each point between the start and end of our current line and calculate its distance from the line. <br/><br/> The distance formula we use for this calculation is as follows: if a point is within range of the line, we take its perpendicular distance to the line. If a point is outside of the range of the line, we take its distance to either endpoint that it is closest to.</p>',
  foundFurthestPoint:
    '<p>Next we find the point with the largest distance from the simplified line. Here it is highlighted in lime green.</p>',
  drawingEpsilonNextToFurthest:
    '<p>We take our furthest point and compare it to our epsilon value, shown in pink. If our epsilon value does not pass the simplified polyline, we know that the point is further than epsilon away from the polyline and thus must be simplified. If the epsilon value passes the polyline, however, we know that this point is within a distance epsilon from the polyline and thus we need not simplify the line further.</p>',
  outsideEpsilon:
    '<p>In this case, the furthest point was further than epsilon away from the simplified line. Thus, our simplified line is not good enough. <br/><br/>To fix this, we split the line into two more lines. The first one goes from the start point to the furthest point; the second one goes from the furthest point to the end point. We now make two recursive calls: first on the line from start to furthest point, and then on the line from furthest point to end.</p>',
  withinEpsilon:
    '<p>In this case, even the furthest point from the simplified line is still within our epsilon range. Thus we conclude that this line is a valid simplification of the original polyline! We change its color to red to represent that, once all remaining recursive calls are completed, this line should be a part of the final simplified polylne output.</p>',
  onlyTwoPoints:
    '<p>Since this polyline only consists of one line segment, there are no more simplifications to be made; we highlight the line in red to indicate that it will be a part of our final polyline output.</p>',
  allDone:
    "<p>And now we're done! The simplified polyline is shown in red, and the original polyline can be seen in dashed black lines. All points on the original polyline are no further than epsilon from the simplified polyline. <br/><br/> To run this demo again, hit the 'Reset' button below!</p>",
};

var descriptiveTextDiv = document.getElementById('descriptive-text');
descriptiveTextDiv.innerHTML = messages.default;

var EPSILON;
var RUNNING_RDP = false;

const timeUnit = 250;

FUNC_STACK = []; // represents the recursion stack
FUNC_QUEUE = []; // next function that should be called; when empty, pop from FUNC_STACK

var pointsArr = [];
var pointCircles = [];
var blackLines = [];

var distancePoints = [];
var distancePointCircles = [];
var distanceLine = [];

var distanceContainer = d3
  .select('#RDP')
  .append('svg')
  .attr('style', 'outline: thin solid blue; margin-bottom: 10px')
  .attr('width', '100%')
  .attr('height', '20%');

// This click handler is based on the handler from http://bl.ocks.org/WilliamQLiu/76ae20060e19bf42d774
distanceContainer.on('click', (event) => {
  if (!RUNNING_RDP) {
    // don't want to add points while the algorithm is running
    var coords = d3.pointer(event);

    // Normally we go from data to pixels, but here we're doing pixels to data
    var clickCoords = [
      Math.round(coords[0]), // Takes the pixel number to convert to number
      Math.round(coords[1]),
    ];

    if (distancePoints.length !== 2) {
      distancePoints.push([clickCoords[0], clickCoords[1]]);

      distancePointCircles.push({
        x_axis: clickCoords[0],
        y_axis: clickCoords[1],
        radius: 6,
        color: '#FF69B4',
      });

      if (distancePoints.length > 1) {
        const endIndex = distancePointCircles.length - 1;
        distanceLine.push({
          id:
            'a' +
            distancePoints[endIndex - 1].toString().replace(',', '') +
            distancePoints[endIndex].toString().replace(',', ''),
          x1: distancePoints[endIndex - 1][0],
          y1: distancePoints[endIndex - 1][1],
          x2: distancePoints[endIndex][0],
          y2: distancePoints[endIndex][1],
        });
      }

      var distanceCircles = distanceContainer
        .selectAll('circle') // For new circle, go through the update process
        .data(distancePointCircles)
        .enter()
        .append('circle');

      var circleAttributes = distanceCircles
        .attr('cx', (d) => d.x_axis)
        .attr('cy', (d) => d.y_axis)
        .attr('r', (d) => d.radius)
        .style('fill', (d) => d.color);

      var lines = distanceContainer.selectAll('line').data(distanceLine).enter().append('line');

      var lineAttributes = lines
        .attr('stroke-width', 2)
        .attr('stroke', '#FF69B4')
        .attr('id', (d) => d.id)
        .attr('x1', (d) => d.x1)
        .attr('y1', (d) => d.y1)
        .attr('x2', (d) => d.x2)
        .attr('y2', (d) => d.y2);
      if (distancePoints.length === 2) {
        a = Math.abs(distancePoints[0][0] - distancePoints[1][0]);
        b = Math.abs(distancePoints[0][1] - distancePoints[1][1]);
        EPSILON = Math.sqrt(a ** 2 + b ** 2);
      }
    }
  }
});

var svgContainer = d3
  .select('#RDP')
  .append('svg')
  .attr('style', 'outline: thin solid red')
  .attr('width', '100%')
  .attr('height', '80%');

// This click handler is based on the handler from http://bl.ocks.org/WilliamQLiu/76ae20060e19bf42d774
svgContainer.on('click', (event) => {
  if (!RUNNING_RDP) {
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
      });

      if (pointsArr.length > 1) {
        const endIndex = pointCircles.length - 1;
        blackLines.push({
          id:
            'a' +
            pointsArr[endIndex - 1].toString().replace(',', '') +
            pointsArr[endIndex].toString().replace(',', ''),
          x1: pointsArr[endIndex - 1][0],
          y1: pointsArr[endIndex - 1][1],
          x2: pointsArr[endIndex][0],
          y2: pointsArr[endIndex][1],
        });
      }
    }
  }

  var circles = svgContainer
    .selectAll('circle') // For new circle, go through the update process
    .data(pointCircles)
    .enter()
    .append('circle');

  var circleAttributes = circles
    .attr('cx', (d) => d.x_axis)
    .attr('cy', (d) => d.y_axis)
    .attr('r', (d) => d.radius)
    .style('fill', (d) => d.color);

  var lines = svgContainer.selectAll('line').data(blackLines).enter().append('line');

  var lineAttributes = lines
    .attr('stroke-width', 2)
    .attr('stroke', 'black')
    .attr('id', (d) => d.id)
    .attr('x1', (d) => d.x1)
    .attr('y1', (d) => d.y1)
    .attr('x2', (d) => d.x2)
    .attr('y2', (d) => d.y2);
});

function drawLine(startPoint, endPoint, endFunc = () => {}) {
  disableNextBtn();
  const id = 'a' + startPoint.toString().replace(',', 'l') + endPoint.toString().replace(',', 'l');
  svgContainer
    .append('line')
    .attr('stroke-width', 2)
    .attr('stroke', 'gray')
    .attr('id', id)
    .attr('x1', startPoint[0])
    .attr('y1', startPoint[1])
    .attr('x2', startPoint[0])
    .attr('y2', startPoint[1]);
  svgContainer
    .select('#' + id)
    .transition()
    .duration(timeUnit)
    .attr('x2', endPoint[0])
    .attr('y2', endPoint[1])
    .on('end', () => {
      endFunc();
      enableNextBtn();
    });
}

function consideringPolylineWithTwoPoints(curPoints, epsilon) {
  descriptiveTextDiv.innerHTML = messages.onlyTwoPoints;
  const startPoint = curPoints[0];
  const endPoint = curPoints[curPoints.length - 1];

  const lineId =
    'a' + startPoint.toString().replace(',', 'l') + endPoint.toString().replace(',', 'l');

  svgContainer
    .select('#' + lineId)
    .transition()
    .attr('stroke', 'red');
}

function RDP(curPoints, epsilon) {
  descriptiveTextDiv.innerHTML = messages.firstStep;

  drawLine(curPoints[0], curPoints[curPoints.length - 1]);

  FUNC_QUEUE.push(() => {
    startOnLine(curPoints, epsilon);
  });
}

function startOnLine(curPoints, epsilon) {
  descriptiveTextDiv.innerHTML = messages.consideringNewLine;

  const startPoint = curPoints[0];
  const endPoint = curPoints[curPoints.length - 1];

  const lineId =
    'a' + startPoint.toString().replace(',', 'l') + endPoint.toString().replace(',', 'l');

  svgContainer
    .select('#' + lineId)
    .transition()
    .attr('stroke', 'blue');

  if (curPoints.length === 2) {
    FUNC_QUEUE.push(() => {
      consideringPolylineWithTwoPoints(curPoints, epsilon);
    });
  } else {
    FUNC_QUEUE.push(() => {
      findFurthestPoint(curPoints, epsilon);
    });
  }
}

function findFurthestPoint(curPoints, epsilon) {
  // based on code from Stack Overflow: https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
  // we have 3 cases:
  //    1. the point is closest to the start point
  //    2. the point is closest to the end point
  //    3. the point is closest to another point on the line (this is its perpendicular distance)
  // this implementation accounts for all three cases

  disableNextBtn();
  descriptiveTextDiv.innerHTML = messages.calculatingDistance;

  const startPoint = curPoints[0];
  const endPoint = curPoints[curPoints.length - 1];

  const xStart = startPoint[0];
  const yStart = startPoint[1];
  const xEnd = endPoint[0];
  const yEnd = endPoint[1];

  var curMaxPoint = null;
  var curMaxDistance = 0;
  var curMaxIndex;
  var curMaxDx = 0;
  var curMaxDy = 0;

  for (var i = 1; i < curPoints.length - 1; i++) {
    const curPoint = curPoints[i];
    const xCurPoint = curPoint[0];
    const yCurPoint = curPoint[1];

    const id =
      xCurPoint.toString() + yCurPoint.toString() + curPoints.toString().replaceAll(',', 'l'); // guaranteed to be unique since we'll never consider the same point twice with the same point array

    svgContainer
      .append('line')
      .attr('id', 'distanceLine' + id)
      .attr('class', 'distanceLine')
      .attr('stroke-width', 2)
      .attr('stroke', 'orange')
      .attr('x1', xCurPoint)
      .attr('y1', yCurPoint)
      .attr('x2', xCurPoint)
      .attr('y2', yCurPoint);

    var A = xCurPoint - xStart;
    var B = yCurPoint - yStart;
    var C = xEnd - xStart;
    var D = yEnd - yStart;

    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = -1;
    if (len_sq != 0)
      //in case of 0 length line
      param = dot / len_sq;

    var xx, yy;

    if (param < 0) {
      // closest to start point
      xx = xStart;
      yy = yStart;
    } else if (param > 1) {
      // closest to end point
      xx = xEnd;
      yy = yEnd;
    } else {
      // closest to some other point on the line
      xx = xStart + param * C;
      yy = yStart + param * D;
    }

    const curIdx = i;

    svgContainer
      .select('#distanceLine' + id)
      .transition()
      .duration(timeUnit)
      .delay(function (d) {
        return i * timeUnit;
      })
      .attr('x2', xx)
      .attr('y2', yy)
      .on('end', () => {
        if (curIdx === curPoints.length - 2) {
          // only when we hit the last element
          enableNextBtn();
        }
      });

    var dx = xCurPoint - xx;
    var dy = yCurPoint - yy;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > curMaxDistance) {
      curMaxDistance = distance;
      curMaxPoint = curPoint;
      curMaxIndex = i;
      curMaxPointID = id;
      curMaxDx = dx;
      curMaxDy = dy;
      curMaxXX = xx;
      curMaxYY = yy;
    }
  }
  if (curMaxPoint) {
    FUNC_QUEUE.push(() => {
      highlight_furthest(curPoints, epsilon, {
        maxPoint: curMaxPoint,
        maxIndex: curMaxIndex,
        maxDistance: curMaxDistance,
        maxPointID: curMaxPointID,
        maxPointLineSlope: curMaxDy / curMaxDx,
        targetPoint: [curMaxXX, curMaxYY],
      });
    });
  } else
    FUNC_QUEUE.push(() => {
      highlight_furthest(curPoints, epsilon, null);
    });
}

function highlight_furthest(curPoints, epsilon, maxObj) {
  disableNextBtn();
  descriptiveTextDiv.innerHTML = messages.foundFurthestPoint;

  const maxLineID = 'distanceLine' + maxObj.maxPointID;
  // Removing all of the non-furthest lines and highlighting the furthest
  if (curPoints.length === 3) {
    svgContainer
      .select('#' + maxLineID)
      .transition()
      .attr('stroke', 'lime');
    enableNextBtn();
  } else {
    svgContainer
      .selectAll('.distanceLine')
      .filter(function (d, i, line) {
        return line[i].id !== maxLineID;
      })
      .transition()
      .duration(timeUnit)
      .style('stroke-opacity', 0)
      .style('fill-opacity', 0)
      .on('end', () => {
        svgContainer
          .selectAll('.distanceLine')
          .filter(function (d, i, line) {
            return line[i].id !== maxLineID;
          })
          .remove();
        svgContainer
          .select('#' + maxLineID)
          .transition()
          .attr('stroke', 'lime');
        enableNextBtn();
      });
  }

  FUNC_QUEUE.push(() => {
    showEpsilonNextToFurthest(curPoints, epsilon, maxObj);
  });
}

function showEpsilonNextToFurthest(curPoints, epsilon, maxObj) {
  disableNextBtn();
  descriptiveTextDiv.innerHTML = messages.drawingEpsilonNextToFurthest;

  const slope = maxObj.maxPointLineSlope;
  const targetPointX = maxObj.targetPoint[0];
  const targetPointY = maxObj.targetPoint[1];
  const xMaxDistancePoint = maxObj.maxPoint[0];
  const yMaxDistancePoint = maxObj.maxPoint[1];

  const c = Math.sqrt(epsilon ** 2 / (slope ** 2 + 1));

  var xEnd;
  var yEnd;

  if (slope === Number.POSITIVE_INFINITY || slope === Number.NEGATIVE_INFINITY) {
    // occurs when slope is undefined
    xEnd = targetPointX;
    yEnd =
      yMaxDistancePoint > targetPointY ? yMaxDistancePoint - epsilon : yMaxDistancePoint + epsilon;
  } else if (xMaxDistancePoint > targetPointX) {
    xEnd = xMaxDistancePoint - c;
    yEnd = yMaxDistancePoint - slope * c;
  } else {
    xEnd = xMaxDistancePoint + c;
    yEnd = yMaxDistancePoint + slope * c;
  }
  const xMax = svgContainer.width;
  const yMax = svgContainer.height;

  if (xEnd > xMax) xEnd = xMax;
  else if (xEnd < 0) xEnd = 0;
  if (yEnd > yMax) yEnd = yMax;
  else if (yEnd < 0) yEnd = 0;

  const epsilonLineId = `epsilon-${xMaxDistancePoint}-${yMaxDistancePoint}`;

  svgContainer
    .append('line')
    .attr('stroke-width', 2)
    .attr('stroke', '#FF69B4')
    .attr('id', epsilonLineId)
    .attr('x1', xMaxDistancePoint)
    .attr('y1', yMaxDistancePoint)
    .attr('x2', xMaxDistancePoint)
    .attr('y2', yMaxDistancePoint);
  svgContainer
    .select('#' + epsilonLineId)
    .transition()
    .duration(timeUnit)
    .attr('x2', xEnd)
    .attr('y2', yEnd)
    .on('end', () => {
      enableNextBtn();
    });

  FUNC_QUEUE.push(() => {
    breakLineIntoTwo(curPoints, epsilon, maxObj);
  });
}

function breakLineIntoTwo(curPoints, epsilon, maxObj) {
  disableNextBtn();

  const idOfDistanceLineToRemove = 'distanceLine' + maxObj.maxPointID;
  const idOfEpsilonLineToRemove = `epsilon-${maxObj.maxPoint[0]}-${maxObj.maxPoint[1]}`;

  const idOfCurLine =
    'a' +
    curPoints[0].toString().replace(',', 'l') +
    curPoints[curPoints.length - 1].toString().replace(',', 'l');

  svgContainer
    .select('#' + idOfDistanceLineToRemove)
    .transition()
    .duration(timeUnit)
    .style('stroke-opacity', 0)
    .style('fill-opacity', 0)
    .on('end', () => {
      svgContainer.select('#' + idOfDistanceLineToRemove).remove();
    });

  svgContainer
    .select('#' + idOfEpsilonLineToRemove)
    .transition()
    .duration(timeUnit)
    .style('stroke-opacity', 0)
    .style('fill-opacity', 0)
    .on('end', () => {
      svgContainer.select('#' + idOfEpsilonLineToRemove).remove();
    });

  if (maxObj.maxDistance > epsilon) {
    descriptiveTextDiv.innerHTML = messages.outsideEpsilon;

    svgContainer
      .select('#' + idOfCurLine)
      .transition()
      .delay(timeUnit) // so the distance line is removed first
      .duration(timeUnit)
      .style('stroke-opacity', 0)
      .style('fill-opacity', 0)
      .on('end', () => {
        svgContainer.select('#' + idOfCurLine).remove();
        drawLine(curPoints[0], maxObj.maxPoint, () => {
          drawLine(maxObj.maxPoint, curPoints[curPoints.length - 1]);
        });
      });

    const firstHalfPoints = curPoints.slice(0, maxObj.maxIndex + 1);
    const secondHalfPoints = curPoints.slice(maxObj.maxIndex, curPoints.length);

    FUNC_QUEUE.push(() => {
      startOnLine(firstHalfPoints, epsilon);
    });
    FUNC_STACK.push(() => {
      startOnLine(secondHalfPoints, epsilon);
    });
  } else {
    descriptiveTextDiv.innerHTML = messages.withinEpsilon;

    svgContainer
      .select('#' + idOfCurLine)
      .transition()
      .attr('stroke', 'red');
    enableNextBtn();
  }
}

function start() {
  if (distancePoints.length !== 2) {
    window.alert('Please make sure you draw a line in the blue box for your epsilon value.');
    return;
  }
  if (pointsArr.length <= 1) {
    window.alert('Please make sure you draw at least two points for the polyline in the red box.');
    return;
  }

  RUNNING_RDP = true;
  disableStartBtn();

  svgContainer.selectAll('line').attr('stroke-dasharray', '10,10');
  RDP(pointsArr, EPSILON);
}

function reset() {
  RUNNING_RDP = false;
  pointsArr = [];
  pointCircles = [];
  blackLines = [];

  distancePoints = [];
  distancePointCircles = [];
  distanceLine = [];

  FUNC_STACK = [];
  FUNC_QUEUE = [];

  enableStartBtn();
  disableNextBtn();
  descriptiveTextDiv.innerHTML = messages.default;

  svgContainer.selectAll('*').remove();
  distanceContainer.selectAll('*').remove();
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
