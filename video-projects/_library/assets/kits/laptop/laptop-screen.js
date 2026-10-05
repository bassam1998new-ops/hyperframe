// Put any element (an <img> screenshot, a <video>) onto the laptop screen.
// corners = [[x,y] top-left, top-right, bottom-right, bottom-left] in the laptop PNG's pixels (laptop.json).
// el is positioned inside a box that has the laptop PNG at its natural size (scale the box, not the PNG).
// Works for both angles: the front view is a plain rectangle, the hero view needs the perspective matrix.
(function (root) {
  function solve(A, b) { // Gauss, 8x8
    var n = b.length;
    for (var i = 0; i < n; i++) {
      var m = i; for (var r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[m][i])) m = r;
      var t = A[i]; A[i] = A[m]; A[m] = t; t = b[i]; b[i] = b[m]; b[m] = t;
      for (r = i + 1; r < n; r++) { var f = A[r][i] / A[i][i]; for (var c = i; c < n; c++) A[r][c] -= f * A[i][c]; b[r] -= f * b[i]; }
    }
    var x = new Array(n);
    for (i = n - 1; i >= 0; i--) { var s = b[i]; for (c = i + 1; c < n; c++) s -= A[i][c] * x[c]; x[i] = s / A[i][i]; }
    return x;
  }
  // CSS matrix3d that maps a w x h element (transform-origin 0 0) onto the 4 corners
  function screenMatrix(w, h, corners) {
    var src = [[0, 0], [w, 0], [w, h], [0, h]], A = [], b = [];
    for (var i = 0; i < 4; i++) {
      var x = src[i][0], y = src[i][1], u = corners[i][0], v = corners[i][1];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
    }
    var k = solve(A, b);
    return "matrix3d(" + [k[0], k[3], 0, k[6], k[1], k[4], 0, k[7], 0, 0, 1, 0, k[2], k[5], 0, 1].join(",") + ")";
  }
  function placeScreen(el, corners, w, h) {
    w = w || el.naturalWidth || el.videoWidth || el.offsetWidth; h = h || el.naturalHeight || el.videoHeight || el.offsetHeight;
    el.style.position = "absolute"; el.style.left = "0"; el.style.top = "0";
    el.style.width = w + "px"; el.style.height = h + "px";
    el.style.transformOrigin = "0 0"; el.style.transform = screenMatrix(w, h, corners);
  }
  root.LaptopScreen = { screenMatrix: screenMatrix, placeScreen: placeScreen };
})(typeof window !== "undefined" ? window : this);
