const trainingData = [
  {"high":35.67,"low":35.4625,"volume":6.93E+07,"up":1},
  {"high":35.9875,"low":35.795,"volume":6.85E+07,"up":1},
  {"high":36.225,"low":35.9675,"volume":75486000,"up":0},
  {"high":36.15,"low":35.845,"volume":8.02E+07,"up":0},
  {"high":36.04,"low":35.8275,"volume":5.70E+07,"up":1},
  {"high":36.075,"low":35.8175,"volume":8.34E+07,"up":1},
  {"high":36.8,"low":36.24,"volume":1.34E+08,"up":1},
  {"high":37.0225,"low":36.71,"volume":1.81E+08,"up":0},
  {"high":36.8725,"low":36.0675,"volume":1.83E+08,"up":0},
  {"high":36.785,"low":36.4525,"volume":9.35E+07,"up":1},
  {"high":37.245,"low":36.69,"volume":1.09E+08,"up":1},
  {"high":38.425,"low":37.2575,"volume":1.95E+08,"up":1},
  {"high":38.72,"low":38.3625,"volume":1.57E+08,"up":0},
  {"high":38.485,"low":38.0275,"volume":1.03E+08,"up":1},
  {"high":38.5175,"low":38.0775,"volume":1.09E+08,"up":1},
  {"high":39.105,"low":38.6675,"volume":1.30E+08,"up":1},
  {"high":39.1625,"low":38.7625,"volume":1.04E+08,"up":0},
  {"high":39.015,"low":38.68,"volume":8.02E+07,"up":0},
  {"high":38.6425,"low":37.4275,"volume":2.03E+08,"up":0},
  {"high":38.335,"low":37.7825,"volume":1.34E+08,"up":1},
  // ...truncated for brevity...
]

const NUMBER_OF_EPOCHS = 100;
const inputs2dArray = trainingData.map((r) => r.slice(0, 3));
const outputs2dArray = trainingData.map((r) => [r[3]]);

// Normalization

const minVals = [
  Math.min(...inputs2dArray.map((r) => r[0])),
  Math.min(...inputs2dArray.map((r) => r[1])),
  Math.min(...inputs2dArray.map((r) => r[2])),
];
const maxVals = [
  Math.max(...inputs2dArray.map((r) => r[0])),
  Math.max(...inputs2dArray.map((r) => r[1])),
  Math.max(...inputs2dArray.map((r) => r[2])),
];

function normalizeData(data) {
  return data.map((row) =>
    row.map((v, i) => (v - minVals[i]) / (maxVals[i] - minVals[i]))
  );
}

const normalizedInputs = normalizeData(inputs2dArray);
const xs = tf.tensor2d(normalizedInputs);
const ys = tf.tensor2d(outputs2dArray);

// Model (multi-layer relu and sigmoid output)

const model = tf.sequential();
model.add(
  tf.layers.dense({
    inputShape: [3],
    units: 6,
    activation: "relu",
    kernelConstraint: tf.constraints.nonNeg(),
  })
);
model.add(
  tf.layers.dense({
    units: 3,
    activation: "relu",
    kernelConstraint: tf.constraints.nonNeg(),
  })
);
model.add(
  tf.layers.dense({
    units: 1,
    activation: "sigmoid",
    kernelConstraint: tf.constraints.nonNeg(),
  })
);

model.compile({
  optimizer: tf.train.adam(0.01),
  loss: "binaryCrossentropy",
  metrics: ["accuracy"],
});

// Training and confusion matrix

const spinner = document.getElementById("spinner");
const outputEl = document.getElementById("output");
const predictBtn = document.getElementById("predictBtn");
const canvas = document.getElementById("confusion");
const ctx = canvas.getContext("2d");

async function trainModel() {
  spinner.style.display = "block"; // show spinner
  outputEl.textContent = "🚂 Training model...";
  await model.fit(xs, ys, {
    epochs: NUMBER_OF_EPOCHS,
    shuffle: true,
    verbose: 0,
  });
  outputEl.textContent = "Model trained! 🚀 Adjust sliders and click Predict.";
  spinner.style.display = "none"; // hide spinner
  predictBtn.disabled = false;
  await drawConfusionMatrix();
}

async function drawConfusionMatrix() {
  const predictions = await model.predict(xs).data();
  let TP = 0,
    TN = 0,
    FP = 0,
    FN = 0;
  for (let i = 0; i < predictions.length; i++) {
    const pred = predictions[i] > 0.5 ? 1 : 0;
    const actual = outputs2dArray[i][0];
    if (pred === 1 && actual === 1) TP++;
    else if (pred === 0 && actual === 0) TN++;
    else if (pred === 1 && actual === 0) FP++;
    else if (pred === 0 && actual === 1) FN++;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const size = 120;
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.strokeRect(150, 50, size, size);
  ctx.strokeRect(150 + size, 50, size, size);
  ctx.strokeRect(150, 50 + size, size, size);
  ctx.strokeRect(150 + size, 50 + size, size, size);

  ctx.font = "16px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`TP: ${TP}`, 150 + size / 2, 50 + size / 2);
  ctx.fillText(`FP: ${FP}`, 150 + size + size / 2, 50 + size / 2);
  ctx.fillText(`FN: ${FN}`, 150 + size / 2, 50 + size + size / 2);
  ctx.fillText(`TN: ${TN}`, 150 + size + size / 2, 50 + size + size / 2);
  ctx.fillText("Actual 1", 150 + size * 0.5, 40);
  ctx.fillText("Actual 0", 150 + size * 0.5 + size, 40);
  ctx.fillText("Pred 1", 120, 50 + size * 0.5);
  ctx.fillText("Pred 0", 120, 50 + size * 0.5 + size);
}

// Prediction

function getNormalizedInput() {
  const high = parseFloat(document.getElementById("high").value);
  const exp = parseFloat(document.getElementById("low").value);
  const volume = parseFloat(document.getElementById("volume").value);
  return [
    (high - minVals[0]) / (maxVals[0] - minVals[0]),
    (exp - minVals[1]) / (maxVals[1] - minVals[1]),
    (volume - minVals[2]) / (maxVals[2] - minVals[2]),
  ];
}

function weightsStr() {
  const weights = model.getWeights()[0].dataSync();
  const bias = model.getWeights()[1].dataSync();
  return `[${Array.from(weights)
    .map((w) => w.toFixed(2))
    .join(", ")}] + bias [${Array.from(bias)
    .map((b) => b.toFixed(2))
    .join(", ")}]`;
}

function predict() {
  const inputNorm = getNormalizedInput();
  const newX = tf.tensor2d([inputNorm]);
  model
    .predict(newX)
    .data()
    .then((probArray) => {
      const prob = probArray[0];
      const result = prob > 0.5 ? 1 : 0;
      outputEl.textContent = `high: ${
        document.getElementById("high").value
      }, Years of low: ${
        document.getElementById("low").value
      }, Number of volume: ${
        document.getElementById("volume").value
      }\nHire This Applicant?: ${result} ${
        result == 1 ? "✅" : "❌"
      } (confidence ${(prob * 100).toFixed(1)}%)`;
      newX.dispose();
    });
}

// UI handlers

predictBtn.addEventListener("click", predict);
document
  .getElementById("high")
  .addEventListener(
    "input",
    (e) => (document.getElementById("highVal").textContent = e.target.value)
  );
document
  .getElementById("low")
  .addEventListener(
    "input",
    (e) => (document.getElementById("expVal").textContent = e.target.value)
  );
document
  .getElementById("volume")
  .addEventListener(
    "input",
    (e) => (document.getElementById("hikeVal").textContent = e.target.value)
  );

trainModel();

// Make 3D scatterplot

const reds = trainingData.filter((p) => p[3] === 0); 
const greens = trainingData.filter((p) => p[3] === 1);

// Format hover text for each group
const redHoverText = reds.map(
  (p) => `high: ${p[0]}<br>low: ${p[1]}<br>volume: ${p[2]}<br>hired: 0`
);
const greenHoverText = greens.map(
  (p) => `high: ${p[0]}<br>low: ${p[1]}<br>volume: ${p[2]}<br>hired: 1`
);

const redTrace = {
  x: reds.map((p) => p[0]), // high
  y: reds.map((p) => p[1]), // low
  z: reds.map((p) => p[2]), // volume
  mode: "markers",
  type: "scatter3d",
  name: "0 = Not Hired",
  text: redHoverText,
  hoverinfo: "text",
  marker: { size: 6, color: "red" },
};

const greenTrace = {
  x: greens.map((p) => p[0]),
  y: greens.map((p) => p[1]),
  z: greens.map((p) => p[2]),
  mode: "markers",
  type: "scatter3d",
  name: "1 = Hired",
  text: greenHoverText,
  hoverinfo: "text",
  marker: { size: 6, color: "green" },
};

const layout = {
  scene: {
    xaxis: { title: "high" },
    yaxis: { title: "low (Years)" },
    zaxis: { title: "Number of volume" },
  },
  margin: { l: 0, r: 0, b: 0, t: 30 },
  legend: { x: 0.8, y: 0.9 },
};

Plotly.newPlot("plot3d", [redTrace, greenTrace], layout);