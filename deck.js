(() => {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".slide"));
  const previousButton = document.querySelector("#previousSlide");
  const nextButton = document.querySelector("#nextSlide");
  const initialSlide = Number.parseInt(window.location.hash.slice(1), 10) - 1;
  const firstReportPage = 4;
  const reportTotalPages = 87;
  let current = Number.isInteger(initialSlide) && initialSlide >= 0 ? initialSlide : 0;

  slides.forEach((slide, index) => {
    const reportPage = firstReportPage + index;
    const oldCounter = slide.querySelector(".slide-count");
    if (oldCounter) oldCounter.setAttribute("aria-hidden", "true");
    if (slide.querySelector(".beamer-footline")) return;
    const footline = document.createElement("footer");
    footline.className = "beamer-footline";
    footline.setAttribute("aria-label", `Group 5, Measure Concentration, page ${reportPage} of ${reportTotalPages}`);
    const author = document.createElement("span");
    author.className = "beamer-footline-author";
    author.textContent = "Group 5";
    const title = document.createElement("span");
    title.className = "beamer-footline-title";
    title.textContent = "Measure Concentration";
    const date = document.createElement("span");
    date.className = "beamer-footline-date";
    date.textContent = `August 13, 2026   ${reportPage} / ${reportTotalPages}`;
    footline.append(author, title, date);
    slide.querySelector(".slide-frame")?.append(footline);
  });

  function showSlide(nextIndex) {
    current = Math.max(0, Math.min(nextIndex, slides.length - 1));
    slides.forEach((slide, index) => {
      slide.classList.toggle("is-active", index === current);
      slide.setAttribute("aria-hidden", index === current ? "false" : "true");
    });
    if (previousButton) previousButton.disabled = current === 0;
    if (nextButton) nextButton.disabled = current === slides.length - 1;
    window.history.replaceState(null, "", `#${current + 1}`);
    window.dispatchEvent(new CustomEvent("slidechange", { detail: { index: current } }));
  }

  function drawSigmaProjectionLabel(context, x, bottom, indexLabel, fontSize, color) {
    context.save();
    context.fillStyle = color;
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    context.font = `500 ${fontSize}px "Segoe UI", sans-serif`;
    const baseline = bottom - fontSize * 0.22;
    const prefix = "projection to ";
    context.fillText(prefix, x, baseline);
    x += context.measureText(prefix).width;
    context.fillText("Σ", x, baseline);
    x += context.measureText("Σ").width;
    const subscriptSize = fontSize * 0.68;
    context.font = `500 ${subscriptSize}px "Segoe UI", sans-serif`;
    context.fillText(`f,${indexLabel}`, x, baseline + fontSize * 0.24);
    context.restore();
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await document.documentElement.requestFullscreen();
  }

  document.addEventListener("keydown", (event) => {
    const controllingRange = event.target instanceof HTMLInputElement && event.target.type === "range";
    if (controllingRange && ["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) {
      return;
    }

    if (["ArrowRight", "PageDown", " "].includes(event.key)) {
      event.preventDefault();
      showSlide(current + 1);
    } else if (["ArrowLeft", "PageUp"].includes(event.key)) {
      event.preventDefault();
      showSlide(current - 1);
    } else if (event.key.toLowerCase() === "f") {
      event.preventDefault();
      toggleFullscreen().catch(() => {});
    }
  });

  previousButton?.addEventListener("click", () => showSlide(current - 1));
  nextButton?.addEventListener("click", () => showSlide(current + 1));

  function initializeSphereSlide() {
    const slider = document.querySelector("#radiusSlider");
    const sphereCanvas = document.querySelector("#sphereCanvas");
    const curveCanvas = document.querySelector("#curveCanvas");
    const radiusValue = document.querySelector("#radiusValue");
    const alphaValue = document.querySelector("#alphaValue");

    if (!slider || !sphereCanvas || !curveCanvas || !radiusValue || !alphaValue) {
      return;
    }

    const maximumRadius = Math.PI;
    const coveringRadius = Math.PI / 2;
    const palette = {
      blue: [43, 111, 155],
      gold: [224, 160, 45],
      red: [203, 68, 59],
      ink: "#102b3a",
      muted: "#60717a",
      paper: "#f5f2eb",
      line: "#b9c5c7"
    };
    let scheduledFrame = 0;

    function prepareCanvas(canvas) {
      const bounds = canvas.getBoundingClientRect();
      if (bounds.width < 2 || bounds.height < 2) {
        return null;
      }

      const scale = Math.min(window.devicePixelRatio || 1, 1.35);
      const pixelWidth = Math.max(2, Math.round(bounds.width * scale));
      const pixelHeight = Math.max(2, Math.round(bounds.height * scale));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      const context = canvas.getContext("2d", { alpha: true });
      return {
        context,
        width: bounds.width,
        height: bounds.height,
        pixelWidth,
        pixelHeight,
        scale
      };
    }

    function drawSphere(radius) {
      const prepared = prepareCanvas(sphereCanvas);
      if (!prepared) return;

      const { context, width, height, pixelWidth, pixelHeight, scale } = prepared;
      const centerX = width * 0.5;
      const centerY = height * 0.5;
      const sphereRadius = Math.min(height * 0.444, width * 0.34);
      const centerXPx = centerX * scale;
      const centerYPx = centerY * scale;
      const radiusPx = sphereRadius * scale;
      const threshold = radius >= coveringRadius ? -1 : -Math.sin(radius);
      const image = context.createImageData(pixelWidth, pixelHeight);
      const data = image.data;
      const lightX = -0.46;
      const lightY = 0.53;
      const lightZ = 0.71;

      for (let py = 0; py < pixelHeight; py += 1) {
        const y = (centerYPx - py) / radiusPx;
        if (Math.abs(y) > 1) continue;
        for (let px = 0; px < pixelWidth; px += 1) {
          const x = (px - centerXPx) / radiusPx;
          const radialSquared = x * x + y * y;
          if (radialSquared > 1) continue;

          const z = Math.sqrt(Math.max(0, 1 - radialSquared));
          const base = x >= 0 ? palette.blue : (x >= threshold ? palette.gold : palette.red);
          const light = Math.max(0, x * lightX + y * lightY + z * lightZ);
          const rim = 0.76 + 0.24 * Math.sqrt(z);
          const shade = (0.72 + 0.28 * light) * rim;
          const highlight = Math.pow(Math.max(0, light), 16) * 28;
          const index = 4 * (py * pixelWidth + px);
          data[index] = Math.min(255, base[0] * shade + highlight);
          data[index + 1] = Math.min(255, base[1] * shade + highlight);
          data[index + 2] = Math.min(255, base[2] * shade + highlight);
          data[index + 3] = 255;
        }
      }

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, pixelWidth, pixelHeight);
      context.putImageData(image, 0, 0);
      context.setTransform(scale, 0, 0, scale, 0, 0);

      context.save();
      context.beginPath();
      context.arc(centerX, centerY, sphereRadius, 0, 2 * Math.PI);
      context.clip();
      context.strokeStyle = "rgba(245, 242, 235, 0.34)";
      context.lineWidth = 1;

      [-Math.PI / 3, -Math.PI / 6, Math.PI / 6, Math.PI / 3].forEach((longitude) => {
        context.beginPath();
        for (let step = 0; step <= 100; step += 1) {
          const latitude = -Math.PI / 2 + (Math.PI * step) / 100;
          const x = Math.cos(latitude) * Math.sin(longitude);
          const y = Math.sin(latitude);
          const screenX = centerX + sphereRadius * x;
          const screenY = centerY - sphereRadius * y;
          if (step === 0) context.moveTo(screenX, screenY);
          else context.lineTo(screenX, screenY);
        }
        context.stroke();
      });

      [-0.5, 0, 0.5].forEach((normalizedY) => {
        const halfWidth = sphereRadius * Math.sqrt(1 - normalizedY * normalizedY);
        const screenY = centerY - sphereRadius * normalizedY;
        context.beginPath();
        context.moveTo(centerX - halfWidth, screenY);
        context.lineTo(centerX + halfWidth, screenY);
        context.stroke();
      });
      context.restore();

      function drawBoundary(normalizedX, color, lineWidth) {
        const halfHeight = sphereRadius * Math.sqrt(Math.max(0, 1 - normalizedX * normalizedX));
        const screenX = centerX + sphereRadius * normalizedX;
        context.beginPath();
        context.moveTo(screenX, centerY - halfHeight);
        context.lineTo(screenX, centerY + halfHeight);
        context.strokeStyle = "rgba(245, 242, 235, 0.88)";
        context.lineWidth = lineWidth + 2.6;
        context.stroke();
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.stroke();
      }

      drawBoundary(0, palette.ink, 1.7);
      if (radius > 0.002 && radius < coveringRadius - 0.002) {
        drawBoundary(threshold, "#9c6714", 1.55);
      }

      context.beginPath();
      context.arc(centerX, centerY, sphereRadius, 0, 2 * Math.PI);
      context.strokeStyle = palette.ink;
      context.lineWidth = 2.2;
      context.stroke();

      context.fillStyle = palette.muted;
      context.font = `600 ${Math.max(16, Math.min(20, width * 0.03))}px "Segoe UI", sans-serif`;
      context.textAlign = "center";
      context.fillText("x₁ = 0", centerX + 1, Math.max(20, centerY - sphereRadius - 11));
    }

    function drawCurve(radius) {
      const prepared = prepareCanvas(curveCanvas);
      if (!prepared) return;

      const { context, width, height, pixelWidth, pixelHeight, scale } = prepared;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, pixelWidth, pixelHeight);
      context.setTransform(scale, 0, 0, scale, 0, 0);

      const margin = {
        left: Math.max(58, width * 0.105),
        right: Math.max(20, width * 0.035),
        top: Math.max(20, height * 0.055),
        bottom: Math.max(50, height * 0.12)
      };
      const plotLeft = margin.left;
      const plotRight = width - margin.right;
      const plotTop = margin.top;
      const plotBottom = height - margin.bottom;
      const plotWidth = plotRight - plotLeft;
      const plotHeight = plotBottom - plotTop;
      const xMap = (value) => plotLeft + (value / maximumRadius) * plotWidth;
      const yMap = (value) => plotBottom - (value / 0.5) * plotHeight;
      const sphereAlpha = (value) => value >= coveringRadius ? 0 : 0.5 * (1 - Math.sin(value));
      const alpha = sphereAlpha(radius);

      context.lineWidth = 1;
      context.strokeStyle = "rgba(96, 113, 122, 0.26)";
      [0, 0.25, 0.5].forEach((tick) => {
        const y = yMap(tick);
        context.beginPath();
        context.moveTo(plotLeft, y);
        context.lineTo(plotRight, y);
        context.stroke();
      });

      context.beginPath();
      context.moveTo(plotLeft, plotBottom);
      context.lineTo(plotLeft, plotTop);
      context.moveTo(plotLeft, plotBottom);
      context.lineTo(plotRight, plotBottom);
      context.strokeStyle = palette.ink;
      context.lineWidth = 1.5;
      context.stroke();

      context.beginPath();
      context.moveTo(xMap(0), yMap(0));
      for (let step = 0; step <= 240; step += 1) {
        const xValue = (maximumRadius * step) / 240;
        const yValue = sphereAlpha(xValue);
        context.lineTo(xMap(xValue), yMap(yValue));
      }
      context.lineTo(xMap(maximumRadius), yMap(0));
      context.closePath();
      context.fillStyle = "rgba(203, 68, 59, 0.10)";
      context.fill();

      context.beginPath();
      for (let step = 0; step <= 240; step += 1) {
        const xValue = (maximumRadius * step) / 240;
        const yValue = sphereAlpha(xValue);
        const x = xMap(xValue);
        const y = yMap(yValue);
        if (step === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.strokeStyle = "#c64239";
      context.lineWidth = 3.2;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.stroke();

      const pointX = xMap(radius);
      const pointY = yMap(alpha);
      context.save();
      context.setLineDash([6, 6]);
      context.strokeStyle = "rgba(212, 154, 56, 0.9)";
      context.lineWidth = 1.6;
      context.beginPath();
      context.moveTo(pointX, plotBottom);
      context.lineTo(pointX, pointY);
      context.lineTo(plotLeft, pointY);
      context.stroke();
      context.restore();

      context.beginPath();
      context.arc(pointX, pointY, 7.5, 0, 2 * Math.PI);
      context.fillStyle = palette.gold;
      context.fill();
      context.strokeStyle = palette.paper;
      context.lineWidth = 3;
      context.stroke();
      context.beginPath();
      context.arc(pointX, pointY, 7.5, 0, 2 * Math.PI);
      context.strokeStyle = palette.ink;
      context.lineWidth = 1.25;
      context.stroke();

      const tickFont = Math.max(16, Math.min(20, width * 0.028));
      context.fillStyle = palette.muted;
      context.font = `500 ${tickFont}px "Segoe UI", sans-serif`;
      context.textAlign = "right";
      context.textBaseline = "middle";
      [[0, "0"], [0.25, "0.25"], [0.5, "0.50"]].forEach(([value, label]) => {
        context.fillText(label, plotLeft - 11, yMap(value));
      });

      context.textAlign = "center";
      context.textBaseline = "top";
      [[0, "0"], [Math.PI / 2, "π/2"], [maximumRadius, "π"]].forEach(([value, label]) => {
        context.fillText(label, xMap(value), plotBottom + 12);
      });

      context.fillStyle = palette.ink;
      context.font = `600 ${Math.max(17, Math.min(21, width * 0.03))}px "Segoe UI", sans-serif`;
      context.fillText("radius r", (plotLeft + plotRight) / 2, plotBottom + 35);
      context.save();
      context.translate(Math.max(14, plotLeft - 66), (plotTop + plotBottom) / 2);
      context.rotate(-Math.PI / 2);
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("αₓ(r)", 0, 0);
      context.restore();
    }

    function render() {
      scheduledFrame = 0;
      const radius = Math.max(0, Math.min(Number(slider.value), maximumRadius));
      const alpha = radius >= coveringRadius ? 0 : 0.5 * (1 - Math.sin(radius));
      radiusValue.textContent = `r = ${radius.toFixed(3)}`;
      alphaValue.textContent = alpha.toFixed(3);
      slider.style.setProperty("--progress", `${(100 * radius / maximumRadius).toFixed(2)}%`);
      slider.setAttribute("aria-valuetext", `r equals ${radius.toFixed(3)} radians; alpha X equals ${alpha.toFixed(3)}`);
      drawSphere(radius);
      drawCurve(radius);
    }

    function scheduleRender() {
      if (scheduledFrame) return;
      scheduledFrame = window.requestAnimationFrame(render);
    }

    slider.addEventListener("input", scheduleRender);
    window.addEventListener("resize", scheduleRender);
    window.addEventListener("slidechange", (event) => {
      if (event.detail.index === 1) scheduleRender();
    });

    scheduleRender();
  }

  function initializeSphereFamilySlide() {
    const dimensionSlider = document.querySelector("#dimensionSlider");
    const radiusSlider = document.querySelector("#familyRadiusSlider");
    const cloudCanvas = document.querySelector("#familyCloudCanvas");
    const curveCanvas = document.querySelector("#familyCurveCanvas");
    const dimensionValue = document.querySelector("#dimensionValue");
    const radiusValue = document.querySelector("#familyRadiusValue");
    const dimensionBadge = document.querySelector("#familyDimensionBadge");
    const alphaValue = document.querySelector("#familyAlphaValue");

    if (!dimensionSlider || !radiusSlider || !cloudCanvas || !curveCanvas ||
        !dimensionValue || !radiusValue || !dimensionBadge || !alphaValue) {
      return;
    }

    const minimumDimension = 2;
    const maximumDimension = 2048;
    const maximumRadius = Math.PI / 2;
    const palette = {
      blue: "#2b6f9b",
      gold: "#e0a02d",
      red: "#cb443b",
      ink: "#102b3a",
      muted: "#60717a",
      paper: "#f5f2eb",
      line: "#b9c5c7"
    };
    let scheduledFrame = 0;
    let cachedDimension = 0;
    let cachedPoints = [];
    let cloudYaw = -0.58;
    let cloudPitch = 0.24;
    let cloudDragging = false;
    let cloudPointerId = null;
    let cloudPointerX = 0;
    let cloudPointerY = 0;

    function prepareCanvas(canvas) {
      const bounds = canvas.getBoundingClientRect();
      if (bounds.width < 2 || bounds.height < 2) return null;
      const scale = Math.min(window.devicePixelRatio || 1, 1.35);
      const pixelWidth = Math.max(2, Math.round(bounds.width * scale));
      const pixelHeight = Math.max(2, Math.round(bounds.height * scale));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      const context = canvas.getContext("2d", { alpha: true });
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, pixelWidth, pixelHeight);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      return { context, width: bounds.width, height: bounds.height, scale };
    }

    function logGamma(value) {
      const coefficients = [
        0.9999999999998099,
        676.5203681218851,
        -1259.1392167224028,
        771.3234287776531,
        -176.6150291621406,
        12.5073432786869,
        -0.13857109526672,
        9.984369578019572e-6,
        1.5056327351493116e-7
      ];
      if (value < 0.5) {
        return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value);
      }
      let z = value - 1;
      let sum = coefficients[0];
      for (let index = 1; index < coefficients.length; index += 1) {
        sum += coefficients[index] / (z + index);
      }
      const t = z + coefficients.length - 1.5;
      return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(sum);
    }

    function betaContinuedFraction(a, b, x) {
      const maximumIterations = 180;
      const epsilon = 3e-12;
      const floor = 1e-300;
      const qab = a + b;
      const qap = a + 1;
      const qam = a - 1;
      let c = 1;
      let d = 1 - qab * x / qap;
      if (Math.abs(d) < floor) d = floor;
      d = 1 / d;
      let result = d;

      for (let iteration = 1; iteration <= maximumIterations; iteration += 1) {
        const twice = 2 * iteration;
        let numerator = iteration * (b - iteration) * x /
          ((qam + twice) * (a + twice));
        d = 1 + numerator * d;
        if (Math.abs(d) < floor) d = floor;
        c = 1 + numerator / c;
        if (Math.abs(c) < floor) c = floor;
        d = 1 / d;
        result *= d * c;

        numerator = -(a + iteration) * (qab + iteration) * x /
          ((a + twice) * (qap + twice));
        d = 1 + numerator * d;
        if (Math.abs(d) < floor) d = floor;
        c = 1 + numerator / c;
        if (Math.abs(c) < floor) c = floor;
        d = 1 / d;
        const delta = d * c;
        result *= delta;
        if (Math.abs(delta - 1) < epsilon) break;
      }
      return result;
    }

    function regularizedIncompleteBeta(x, a, b) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      const betaTerm = Math.exp(
        logGamma(a + b) - logGamma(a) - logGamma(b) +
        a * Math.log(x) + b * Math.log1p(-x)
      );
      if (x < (a + 1) / (a + b + 2)) {
        return betaTerm * betaContinuedFraction(a, b, x) / a;
      }
      return 1 - betaTerm * betaContinuedFraction(b, a, 1 - x) / b;
    }

    function sphereAlpha(radius, dimension) {
      if (radius <= 0) return 0.5;
      if (radius >= maximumRadius) return 0;
      const cosine = Math.cos(radius);
      const value = 0.5 * regularizedIncompleteBeta(
        cosine * cosine,
        dimension / 2,
        0.5
      );
      return Math.max(0, Math.min(0.5, value));
    }

    function seededRandom(seed) {
      let state = seed >>> 0;
      return () => {
        state += 0x6d2b79f5;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
      };
    }

    function normalSample(random) {
      const u = Math.max(random(), 1e-12);
      const v = random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    function gammaSample(shape, random) {
      if (shape <= 0) return 0;
      if (shape < 1) {
        return gammaSample(shape + 1, random) * Math.pow(Math.max(random(), 1e-12), 1 / shape);
      }
      const d = shape - 1 / 3;
      const c = 1 / Math.sqrt(9 * d);
      while (true) {
        let x;
        let v;
        do {
          x = normalSample(random);
          v = 1 + c * x;
        } while (v <= 0);
        v *= v * v;
        const u = random();
        if (u < 1 - 0.0331 * x * x * x * x ||
            Math.log(Math.max(u, 1e-12)) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
          return d * v;
        }
      }
    }

    function sampleProjectedPoints(dimension, count) {
      const random = seededRandom(41357 + 97 * dimension);
      const points = [];
      for (let index = 0; index < count; index += 1) {
        const g1 = normalSample(random);
        const g2 = normalSample(random);
        const g3 = normalSample(random);
        const omittedSquaredNorm = dimension === 2 ? 0 : 2 * gammaSample((dimension - 2) / 2, random);
        const norm = Math.sqrt(g1 * g1 + g2 * g2 + g3 * g3 + omittedSquaredNorm);
        const x1 = g1 / norm;
        const x2 = g2 / norm;
        const x3 = g3 / norm;
        const projectionNorm = Math.max(Math.sqrt(x1 * x1 + x2 * x2 + x3 * x3), 1e-12);
        const projectedX1 = x1 / projectionNorm;
        const projectedX2 = x2 / projectionNorm;
        const projectedX3 = x3 / projectionNorm;
        points.push({
          x1,
          x: projectedX1,
          y: projectedX2,
          z: projectedX3
        });
      }
      return points;
    }

    function drawCloud(dimension, radius) {
      const prepared = prepareCanvas(cloudCanvas);
      if (!prepared) return;
      const { context, width, height } = prepared;
      const centerX = width * 0.5;
      const sphereRadius = Math.min(width * 0.36, (height - 26) * 0.5);
      const centerY = sphereRadius + 7;
      const count = Math.max(900, Math.min(1900, Math.round(width * height / 115)));
      if (cachedDimension !== dimension || cachedPoints.length !== count) {
        cachedDimension = dimension;
        cachedPoints = sampleProjectedPoints(dimension, count);
      }

      const cosineYaw = Math.cos(cloudYaw);
      const sineYaw = Math.sin(cloudYaw);
      const cosinePitch = Math.cos(cloudPitch);
      const sinePitch = Math.sin(cloudPitch);

      function rotatePoint(point) {
        const yawX = cosineYaw * point.x + sineYaw * point.z;
        const yawZ = -sineYaw * point.x + cosineYaw * point.z;
        return {
          x: yawX,
          y: cosinePitch * point.y - sinePitch * yawZ,
          z: sinePitch * point.y + cosinePitch * yawZ
        };
      }

      function drawGreatCircle(axis) {
        context.beginPath();
        for (let step = 0; step <= 120; step += 1) {
          const angle = 2 * Math.PI * step / 120;
          const point = axis === "x"
            ? { x: 0, y: Math.cos(angle), z: Math.sin(angle) }
            : axis === "y"
              ? { x: Math.cos(angle), y: 0, z: Math.sin(angle) }
              : { x: Math.cos(angle), y: Math.sin(angle), z: 0 };
          const rotated = rotatePoint(point);
          const screenX = centerX + sphereRadius * rotated.x;
          const screenY = centerY - sphereRadius * rotated.y;
          if (step === 0) context.moveTo(screenX, screenY);
          else context.lineTo(screenX, screenY);
        }
        context.stroke();
      }

      context.strokeStyle = "rgba(96, 113, 122, 0.22)";
      context.lineWidth = 1;
      drawGreatCircle("x");
      drawGreatCircle("y");
      drawGreatCircle("z");

      const threshold = -Math.sin(radius);
      const rotatedPoints = cachedPoints.map((point) => ({
        source: point,
        rotated: rotatePoint(point)
      })).sort((left, right) => left.rotated.z - right.rotated.z);

      rotatedPoints.forEach(({ source, rotated }) => {
        const color = source.x1 >= 0 ? palette.blue : (source.x1 >= threshold ? palette.gold : palette.red);
        const pointRadius = color === palette.red ? 2.25 : 1.85;
        context.globalAlpha = color === palette.red ? 0.82 : 0.54;
        context.fillStyle = color;
        context.beginPath();
        context.arc(
          centerX + sphereRadius * rotated.x,
          centerY - sphereRadius * rotated.y,
          pointRadius,
          0,
          2 * Math.PI
        );
        context.fill();
      });
      context.globalAlpha = 1;

      context.beginPath();
      context.arc(centerX, centerY, sphereRadius, 0, 2 * Math.PI);
      context.strokeStyle = palette.ink;
      context.lineWidth = 1.45;
      context.stroke();

      context.fillStyle = palette.muted;
      context.font = `700 ${Math.max(10, Math.min(12, width * 0.018))}px "Segoe UI", sans-serif`;
      context.textAlign = "right";
      context.textBaseline = "top";
      context.fillText("DRAG TO ROTATE", width - 6, 5);

    }

    function drawCurve(dimension, radius) {
      const prepared = prepareCanvas(curveCanvas);
      if (!prepared) return;
      const { context, width, height } = prepared;
      const margin = {
        left: Math.max(92, width * 0.14),
        right: Math.max(20, width * 0.035),
        top: Math.max(18, height * 0.055),
        bottom: Math.max(50, height * 0.16)
      };
      const left = margin.left;
      const right = width - margin.right;
      const top = margin.top;
      const bottom = height - margin.bottom;
      const logMinimum = Math.log2(minimumDimension);
      const logMaximum = Math.log2(maximumDimension);
      const xMap = (value) => left + (Math.log2(value) - logMinimum) /
        (logMaximum - logMinimum) * (right - left);
      const yMap = (value) => bottom - value / 0.5 * (bottom - top);

      context.strokeStyle = "rgba(185, 197, 199, 0.64)";
      context.lineWidth = 1;
      [0, 0.25, 0.5].forEach((tick) => {
        context.beginPath();
        context.moveTo(left, yMap(tick));
        context.lineTo(right, yMap(tick));
        context.stroke();
      });

      const points = [];
      const sampleCount = 170;
      for (let index = 0; index < sampleCount; index += 1) {
        const exponent = logMinimum + (logMaximum - logMinimum) * index / (sampleCount - 1);
        const n = Math.pow(2, exponent);
        points.push([xMap(n), yMap(sphereAlpha(radius, n))]);
      }

      context.beginPath();
      context.moveTo(points[0][0], bottom);
      points.forEach(([x, y]) => context.lineTo(x, y));
      context.lineTo(points[points.length - 1][0], bottom);
      context.closePath();
      context.fillStyle = "rgba(203, 68, 59, 0.10)";
      context.fill();

      context.beginPath();
      points.forEach(([x, y], index) => {
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.strokeStyle = palette.red;
      context.lineWidth = 3;
      context.lineJoin = "round";
      context.lineCap = "round";
      context.stroke();

      const currentAlpha = sphereAlpha(radius, dimension);
      const markerX = xMap(dimension);
      const markerY = yMap(currentAlpha);
      context.setLineDash([6, 5]);
      context.strokeStyle = palette.gold;
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(markerX, bottom);
      context.lineTo(markerX, markerY);
      context.lineTo(left, markerY);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = palette.paper;
      context.strokeStyle = palette.blue;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(markerX, markerY, 6.3, 0, 2 * Math.PI);
      context.fill();
      context.stroke();

      context.strokeStyle = palette.ink;
      context.lineWidth = 1.25;
      context.beginPath();
      context.moveTo(left, top);
      context.lineTo(left, bottom);
      context.lineTo(right, bottom);
      context.stroke();

      const tickFont = Math.max(15, Math.min(18, width * 0.026));
      context.fillStyle = palette.muted;
      context.font = `500 ${tickFont}px "Segoe UI", sans-serif`;
      context.textAlign = "right";
      context.textBaseline = "middle";
      [[0, "0"], [0.25, "0.25"], [0.5, "0.50"]].forEach(([value, label]) => {
        context.fillText(label, left - 10, yMap(value));
      });
      context.textAlign = "center";
      context.textBaseline = "top";
      [2, 8, 32, 128, 512, 2048].forEach((tick) => {
        context.fillText(String(tick), xMap(tick), bottom + 11);
      });

      context.fillStyle = palette.ink;
      context.font = `600 ${Math.max(16, Math.min(20, width * 0.029))}px "Segoe UI", sans-serif`;
      context.fillText("dimension n (log scale)", (left + right) / 2, bottom + 33);
      context.save();
      context.translate(Math.max(18, left - 70), (top + bottom) / 2);
      context.rotate(-Math.PI / 2);
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("αₓₙ(r)", 0, 0);
      context.restore();
    }

    function formatAlpha(value) {
      if (value === 0) return "0";
      if (value >= 0.001) return value.toFixed(3);
      if (value >= 1e-12) return value.toExponential(1);
      return "< 1e−12";
    }

    function render() {
      scheduledFrame = 0;
      const exponent = Number(dimensionSlider.value);
      const dimension = Math.max(minimumDimension, Math.min(maximumDimension, Math.round(Math.pow(2, exponent))));
      const radius = Math.max(0, Math.min(maximumRadius, Number(radiusSlider.value)));
      const alpha = sphereAlpha(radius, dimension);

      dimensionValue.textContent = `n = ${dimension}`;
      dimensionBadge.textContent = `n = ${dimension}`;
      radiusValue.textContent = `r = ${radius.toFixed(3)}`;
      alphaValue.textContent = formatAlpha(alpha);
      dimensionSlider.style.setProperty("--progress", `${(100 * (exponent - 1) / 10).toFixed(2)}%`);
      radiusSlider.style.setProperty("--progress", `${(100 * radius / maximumRadius).toFixed(2)}%`);
      dimensionSlider.setAttribute("aria-valuetext", `dimension n equals ${dimension} on a logarithmic scale`);
      radiusSlider.setAttribute("aria-valuetext", `fixed radius r equals ${radius.toFixed(3)}`);
      alphaValue.setAttribute("aria-label", `alpha X sub ${dimension} at radius ${radius.toFixed(3)} equals ${formatAlpha(alpha)}`);

      drawCloud(dimension, radius);
      drawCurve(dimension, radius);
    }

    function scheduleRender() {
      if (scheduledFrame) return;
      scheduledFrame = window.requestAnimationFrame(render);
    }

    dimensionSlider.addEventListener("input", scheduleRender);
    radiusSlider.addEventListener("input", scheduleRender);
    cloudCanvas.addEventListener("pointerdown", (event) => {
      cloudDragging = true;
      cloudPointerId = event.pointerId;
      cloudPointerX = event.clientX;
      cloudPointerY = event.clientY;
      cloudCanvas.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    cloudCanvas.addEventListener("pointermove", (event) => {
      if (!cloudDragging || event.pointerId !== cloudPointerId) return;
      const deltaX = event.clientX - cloudPointerX;
      const deltaY = event.clientY - cloudPointerY;
      cloudPointerX = event.clientX;
      cloudPointerY = event.clientY;
      cloudYaw += deltaX * 0.009;
      cloudPitch = Math.max(-1.05, Math.min(1.05, cloudPitch + deltaY * 0.009));
      scheduleRender();
      event.preventDefault();
    });
    const stopCloudDrag = (event) => {
      if (event.pointerId !== cloudPointerId) return;
      cloudDragging = false;
      cloudPointerId = null;
      if (cloudCanvas.hasPointerCapture(event.pointerId)) {
        cloudCanvas.releasePointerCapture(event.pointerId);
      }
    };
    cloudCanvas.addEventListener("pointerup", stopCloudDrag);
    cloudCanvas.addEventListener("pointercancel", stopCloudDrag);
    window.addEventListener("resize", scheduleRender);
    window.addEventListener("slidechange", (event) => {
      if (event.detail.index === 3) scheduleRender();
    });

    scheduleRender();
  }

  function initializeProductFamilySlide() {
    const dimensionSlider = document.querySelector("#productDimensionSlider");
    const radiusSlider = document.querySelector("#productRadiusSlider");
    const cloudCanvas = document.querySelector("#productCloudCanvas");
    const curveCanvas = document.querySelector("#productCurveCanvas");
    const dimensionValue = document.querySelector("#productDimensionValue");
    const radiusValue = document.querySelector("#productRadiusValue");
    const dimensionBadge = document.querySelector("#productDimensionBadge");
    const massValue = document.querySelector("#productMassValue");

    if (!dimensionSlider || !radiusSlider || !cloudCanvas || !curveCanvas ||
        !dimensionValue || !radiusValue || !dimensionBadge || !massValue) {
      return;
    }

    const minimumDimension = 1;
    const maximumDimension = 2048;
    const maximumRelativeRadius = 1;
    const palette = {
      blue: "#2b6f9b",
      gold: "#e0a02d",
      red: "#cb443b",
      ink: "#102b3a",
      muted: "#60717a",
      paper: "#f5f2eb",
      line: "#b9c5c7"
    };
    let scheduledFrame = 0;
    let cachedPointCount = 0;
    let cachedDimension = 0;
    let cachedPoints = [];
    let cloudYaw = -0.54;
    let cloudPitch = 0.23;
    let cloudDragging = false;
    let cloudPointerId = null;
    let cloudPointerX = 0;
    let cloudPointerY = 0;

    function prepareCanvas(canvas) {
      const bounds = canvas.getBoundingClientRect();
      if (bounds.width < 2 || bounds.height < 2) return null;
      const scale = Math.min(window.devicePixelRatio || 1, 1.35);
      const pixelWidth = Math.max(2, Math.round(bounds.width * scale));
      const pixelHeight = Math.max(2, Math.round(bounds.height * scale));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      const context = canvas.getContext("2d", { alpha: true });
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, pixelWidth, pixelHeight);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      return { context, width: bounds.width, height: bounds.height };
    }

    function seededRandom(seed) {
      let state = seed >>> 0;
      return () => {
        state += 0x6d2b79f5;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
      };
    }

    function normalSample(random) {
      const u = Math.max(random(), 1e-12);
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
    }

    function gammaSample(shape, random) {
      if (shape <= 0) return 0;
      if (shape < 1) {
        return gammaSample(shape + 1, random) * Math.pow(Math.max(random(), 1e-12), 1 / shape);
      }
      const d = shape - 1 / 3;
      const c = 1 / Math.sqrt(9 * d);
      while (true) {
        let x;
        let v;
        do {
          x = normalSample(random);
          v = 1 + c * x;
        } while (v <= 0);
        v *= v * v;
        const u = random();
        if (u < 1 - 0.0331 * x * x * x * x ||
            Math.log(Math.max(u, 1e-12)) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
          return d * v;
        }
      }
    }

    function sampleProductPoints(count, dimension) {
      const random = seededRandom((91873 + Math.imul(dimension, 7919)) >>> 0);
      const points = [];
      for (let index = 0; index < count; index += 1) {
        const angle = 2 * Math.PI * random();
        const x1 = Math.cos(angle);
        const x2 = Math.sin(angle);
        points.push({ x1, x2, interval: random() });
      }
      return points;
    }

    function drawCloud(dimension, relativeRadius) {
      const prepared = prepareCanvas(cloudCanvas);
      if (!prepared) return;
      const { context, width, height } = prepared;
      const centerX = width * 0.5;
      const centerY = height * 0.47;
      const halfHeight = 1.16;
      const cylinderScale = Math.min(width * 0.3, height * 0.346);
      const count = Math.max(950, Math.min(1900, Math.round(width * height / 110)));
      if (cachedPointCount !== count || cachedDimension !== dimension || cachedPoints.length !== count) {
        cachedPointCount = count;
        cachedDimension = dimension;
        cachedPoints = sampleProductPoints(count, dimension);
      }

      const cosineYaw = Math.cos(cloudYaw);
      const sineYaw = Math.sin(cloudYaw);
      const cosinePitch = Math.cos(cloudPitch);
      const sinePitch = Math.sin(cloudPitch);

      function rotatePoint(point) {
        const yawX = cosineYaw * point.x + sineYaw * point.z;
        const yawZ = -sineYaw * point.x + cosineYaw * point.z;
        return {
          x: yawX,
          y: cosinePitch * point.y - sinePitch * yawZ,
          z: sinePitch * point.y + cosinePitch * yawZ
        };
      }

      function projectPoint(point) {
        const rotated = rotatePoint(point);
        const perspective = 5.5 / (5.5 - rotated.z);
        return {
          x: centerX + cylinderScale * rotated.x * perspective,
          y: centerY - cylinderScale * rotated.y * perspective,
          depth: rotated.z,
          perspective
        };
      }

      function cylinderPoint(interval, angle) {
        return {
          x: Math.cos(angle),
          y: (interval - 0.5) * 2 * halfHeight,
          z: Math.sin(angle)
        };
      }

      function drawRing(interval, color, lineWidth, dashed = false) {
        context.save();
        if (dashed) context.setLineDash([5, 5]);
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.beginPath();
        for (let step = 0; step <= 120; step += 1) {
          const projected = projectPoint(cylinderPoint(interval, 2 * Math.PI * step / 120));
          if (step === 0) context.moveTo(projected.x, projected.y);
          else context.lineTo(projected.x, projected.y);
        }
        context.stroke();
        context.restore();
      }

      context.strokeStyle = "rgba(96, 113, 122, 0.25)";
      context.lineWidth = 1;
      drawRing(0, "rgba(96, 113, 122, 0.25)", 1);
      drawRing(1, "rgba(96, 113, 122, 0.25)", 1);
      [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2].forEach((angle) => {
        const bottomPoint = projectPoint(cylinderPoint(0, angle));
        const topPoint = projectPoint(cylinderPoint(1, angle));
        context.beginPath();
        context.moveTo(bottomPoint.x, bottomPoint.y);
        context.lineTo(topPoint.x, topPoint.y);
        context.stroke();
      });

      drawRing(0.5, "rgba(37, 106, 138, 0.46)", 1.2, true);
      drawRing(Math.min(1, 0.5 + relativeRadius), "rgba(212, 154, 56, 0.88)", 1.35, true);

      const projectedPoints = cachedPoints.map((point) => {
        const projected = projectPoint({
          x: point.x1,
          y: (point.interval - 0.5) * 2 * halfHeight,
          z: point.x2
        });
        return { source: point, projected };
      }).sort((left, right) => left.projected.depth - right.projected.depth);

      projectedPoints.forEach(({ source, projected }) => {
        const color = source.interval <= 0.5 ? palette.blue :
          (source.interval <= 0.5 + relativeRadius ? palette.gold : palette.red);
        context.globalAlpha = color === palette.red ? 0.78 : 0.5;
        context.fillStyle = color;
        context.beginPath();
        context.arc(
          projected.x,
          projected.y,
          (color === palette.red ? 2.15 : 1.8) * projected.perspective,
          0,
          2 * Math.PI
        );
        context.fill();
      });
      context.globalAlpha = 1;

      context.fillStyle = palette.muted;
      context.font = `700 ${Math.max(10, Math.min(12, width * 0.018))}px "Segoe UI", sans-serif`;
      context.textAlign = "right";
      context.textBaseline = "top";
      context.fillText("DRAG TO ROTATE", width - 6, 5);

    }

    function drawCurve(dimension, outsideMass) {
      const prepared = prepareCanvas(curveCanvas);
      if (!prepared) return;
      const { context, width, height } = prepared;
      const margin = {
        left: Math.max(92, width * 0.14),
        right: Math.max(20, width * 0.035),
        top: Math.max(18, height * 0.055),
        bottom: Math.max(50, height * 0.16)
      };
      const left = margin.left;
      const right = width - margin.right;
      const top = margin.top;
      const bottom = height - margin.bottom;
      const logMinimum = Math.log2(minimumDimension);
      const logMaximum = Math.log2(maximumDimension);
      const xMap = (value) => left + (Math.log2(value) - logMinimum) /
        (logMaximum - logMinimum) * (right - left);
      const yMap = (value) => bottom - value / 0.5 * (bottom - top);

      context.strokeStyle = "rgba(185, 197, 199, 0.64)";
      context.lineWidth = 1;
      [0, 0.25, 0.5].forEach((tick) => {
        context.beginPath();
        context.moveTo(left, yMap(tick));
        context.lineTo(right, yMap(tick));
        context.stroke();
      });

      context.fillStyle = "rgba(203, 68, 59, 0.10)";
      context.fillRect(left, yMap(outsideMass), right - left, bottom - yMap(outsideMass));
      context.strokeStyle = palette.red;
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(left, yMap(outsideMass));
      context.lineTo(right, yMap(outsideMass));
      context.stroke();

      const markerX = xMap(dimension);
      const markerY = yMap(outsideMass);
      context.setLineDash([6, 5]);
      context.strokeStyle = palette.gold;
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(markerX, bottom);
      context.lineTo(markerX, markerY);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = palette.paper;
      context.strokeStyle = palette.blue;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(markerX, markerY, 6.3, 0, 2 * Math.PI);
      context.fill();
      context.stroke();

      context.strokeStyle = palette.ink;
      context.lineWidth = 1.25;
      context.beginPath();
      context.moveTo(left, top);
      context.lineTo(left, bottom);
      context.lineTo(right, bottom);
      context.stroke();

      const tickFont = Math.max(15, Math.min(18, width * 0.026));
      context.fillStyle = palette.muted;
      context.font = `500 ${tickFont}px "Segoe UI", sans-serif`;
      context.textAlign = "right";
      context.textBaseline = "middle";
      [[0, "0"], [0.25, "0.25"], [0.5, "0.50"]].forEach(([value, label]) => {
        context.fillText(label, left - 10, yMap(value));
      });
      context.textAlign = "center";
      context.textBaseline = "top";
      [1, 8, 64, 512, 2048].forEach((tick) => {
        context.fillText(String(tick), xMap(tick), bottom + 11);
      });
      context.fillStyle = palette.ink;
      context.font = `600 ${Math.max(16, Math.min(20, width * 0.029))}px "Segoe UI", sans-serif`;
      context.fillText("dimension n (log scale)", (left + right) / 2, bottom + 33);
      context.save();
      context.translate(Math.max(18, left - 70), (top + bottom) / 2);
      context.rotate(-Math.PI / 2);
      const axisBaseSize = Math.max(16, Math.min(20, width * 0.029));
      const axisSubSize = axisBaseSize * 0.68;
      const axisParts = [
        ["μ", false], ["n", true], ["(X", false], ["n", true],
        [" ∖ B", false], ["n,r", true], [")", false]
      ];
      const axisWidths = axisParts.map(([label, isSubscript]) => {
        const fontSize = isSubscript ? axisSubSize : axisBaseSize;
        context.font = `600 ${fontSize}px "Segoe UI", sans-serif`;
        return context.measureText(label).width;
      });
      let axisX = -axisWidths.reduce((sum, value) => sum + value, 0) / 2;
      const axisBaseline = axisBaseSize * 0.34;
      context.textAlign = "left";
      context.textBaseline = "alphabetic";
      axisParts.forEach(([label, isSubscript], index) => {
        const fontSize = isSubscript ? axisSubSize : axisBaseSize;
        context.font = `600 ${fontSize}px "Segoe UI", sans-serif`;
        context.fillText(label, axisX, axisBaseline + (isSubscript ? axisBaseSize * 0.27 : 0));
        axisX += axisWidths[index];
      });
      context.restore();
    }

    function render() {
      scheduledFrame = 0;
      const exponent = Number(dimensionSlider.value);
      const dimension = Math.max(minimumDimension, Math.min(maximumDimension, Math.round(Math.pow(2, exponent))));
      const relativeRadius = Math.max(0, Math.min(maximumRelativeRadius, Number(radiusSlider.value)));
      const outsideMass = Math.max(0, 0.5 - relativeRadius);

      dimensionValue.textContent = `n = ${dimension}`;
      dimensionBadge.textContent = `n = ${dimension}`;
      radiusValue.textContent = `r = ${relativeRadius.toFixed(3)}`;
      massValue.textContent = outsideMass.toFixed(3);
      dimensionSlider.style.setProperty("--progress", `${(100 * exponent / 11).toFixed(2)}%`);
      radiusSlider.style.setProperty("--progress", `${(100 * relativeRadius / maximumRelativeRadius).toFixed(2)}%`);
      dimensionSlider.setAttribute("aria-valuetext", `dimension n equals ${dimension} on a logarithmic scale`);
      radiusSlider.setAttribute("aria-valuetext", `normalized radius r equals ${relativeRadius.toFixed(3)}`);
      massValue.setAttribute("aria-label", `mu n of X n minus B n r equals ${outsideMass.toFixed(3)} for every dimension n`);

      drawCloud(dimension, relativeRadius);
      drawCurve(dimension, outsideMass);
    }

    function scheduleRender() {
      if (scheduledFrame) return;
      scheduledFrame = window.requestAnimationFrame(render);
    }

    dimensionSlider.addEventListener("input", scheduleRender);
    radiusSlider.addEventListener("input", scheduleRender);
    cloudCanvas.addEventListener("pointerdown", (event) => {
      cloudDragging = true;
      cloudPointerId = event.pointerId;
      cloudPointerX = event.clientX;
      cloudPointerY = event.clientY;
      cloudCanvas.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    cloudCanvas.addEventListener("pointermove", (event) => {
      if (!cloudDragging || event.pointerId !== cloudPointerId) return;
      const deltaX = event.clientX - cloudPointerX;
      const deltaY = event.clientY - cloudPointerY;
      cloudPointerX = event.clientX;
      cloudPointerY = event.clientY;
      cloudYaw += deltaX * 0.009;
      cloudPitch = Math.max(-1.05, Math.min(1.05, cloudPitch + deltaY * 0.009));
      scheduleRender();
      event.preventDefault();
    });
    const stopProductCloudDrag = (event) => {
      if (event.pointerId !== cloudPointerId) return;
      cloudDragging = false;
      cloudPointerId = null;
      if (cloudCanvas.hasPointerCapture(event.pointerId)) {
        cloudCanvas.releasePointerCapture(event.pointerId);
      }
    };
    cloudCanvas.addEventListener("pointerup", stopProductCloudDrag);
    cloudCanvas.addEventListener("pointercancel", stopProductCloudDrag);
    window.addEventListener("resize", scheduleRender);
    window.addEventListener("slidechange", (event) => {
      if (event.detail.index === 4) scheduleRender();
    });

    scheduleRender();
  }

  function initializeRevolutionSettingSlide() {
    const canvas = document.querySelector("#revolutionSettingCanvas");
    if (!canvas) return;

    const context = canvas.getContext("2d");
    const palette = {
      blue: [37, 106, 138],
      blueDark: "#1e5d79",
      gold: "#d49a38",
      ink: "#102b3a",
      muted: "#60717a",
      line: "#b9c5c7",
    };
    let yaw = -0.28;
    let pitch = 0.34;
    let dragging = false;
    let pointerX = 0;
    let pointerY = 0;
    let scheduledFrame = 0;

    const profile = (x) => 0.48 + 0.68 * Math.pow(Math.cos(Math.PI * x / 2), 2);

    function resizeCanvas() {
      const rectangle = canvas.getBoundingClientRect();
      if (rectangle.width < 2 || rectangle.height < 2) return null;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(rectangle.width);
      const height = Math.round(rectangle.height);
      const pixelWidth = Math.max(1, Math.round(width * ratio));
      const pixelHeight = Math.max(1, Math.round(height * ratio));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      return { width, height };
    }

    function rotatePoint(x, y, z) {
      const cosineYaw = Math.cos(yaw);
      const sineYaw = Math.sin(yaw);
      const xYaw = cosineYaw * x + sineYaw * z;
      const zYaw = -sineYaw * x + cosineYaw * z;
      const cosinePitch = Math.cos(pitch);
      const sinePitch = Math.sin(pitch);
      const yPitch = cosinePitch * y - sinePitch * zYaw;
      const zPitch = sinePitch * y + cosinePitch * zYaw;
      return { x: xYaw, y: yPitch, z: zPitch };
    }

    function draw() {
      scheduledFrame = 0;
      const size = resizeCanvas();
      if (!size) return;
      const { width, height } = size;
      const centerX = width * 0.5;
      const centerY = height * 0.51;
      const scale = Math.min(width / 3.15, height / 2.75);
      const camera = 5.2;

      function project(point) {
        const rotated = rotatePoint(point.x, point.y, point.z);
        const perspective = camera / (camera - rotated.z);
        return {
          x: centerX + scale * perspective * rotated.x,
          y: centerY - scale * perspective * rotated.y,
          depth: rotated.z,
        };
      }

      const xCount = 30;
      const thetaCount = 42;
      const quads = [];
      for (let xIndex = 0; xIndex < xCount; xIndex += 1) {
        const x0 = -1 + 2 * xIndex / xCount;
        const x1 = -1 + 2 * (xIndex + 1) / xCount;
        const radius0 = profile(x0);
        const radius1 = profile(x1);
        for (let thetaIndex = 0; thetaIndex < thetaCount; thetaIndex += 1) {
          const theta0 = 2 * Math.PI * thetaIndex / thetaCount;
          const theta1 = 2 * Math.PI * (thetaIndex + 1) / thetaCount;
          const points = [
            { x: x0, y: radius0 * Math.cos(theta0), z: radius0 * Math.sin(theta0) },
            { x: x1, y: radius1 * Math.cos(theta0), z: radius1 * Math.sin(theta0) },
            { x: x1, y: radius1 * Math.cos(theta1), z: radius1 * Math.sin(theta1) },
            { x: x0, y: radius0 * Math.cos(theta1), z: radius0 * Math.sin(theta1) },
          ];
          const projected = points.map(project);
          quads.push({
            projected,
            depth: projected.reduce((sum, point) => sum + point.depth, 0) / projected.length,
          });
        }
      }
      quads.sort((first, second) => first.depth - second.depth);
      quads.forEach(({ projected, depth }) => {
        const alpha = Math.max(0.035, Math.min(0.12, 0.07 + 0.025 * depth));
        context.beginPath();
        context.moveTo(projected[0].x, projected[0].y);
        for (let index = 1; index < projected.length; index += 1) {
          context.lineTo(projected[index].x, projected[index].y);
        }
        context.closePath();
        context.fillStyle = `rgba(${palette.blue.join(",")}, ${alpha})`;
        context.fill();
      });

      function drawPath(points, color, lineWidth, dash = []) {
        const projected = points.map(project);
        context.save();
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.setLineDash(dash);
        context.beginPath();
        projected.forEach((point, index) => {
          if (index === 0) context.moveTo(point.x, point.y);
          else context.lineTo(point.x, point.y);
        });
        context.stroke();
        context.restore();
      }

      for (let thetaIndex = 0; thetaIndex < 12; thetaIndex += 1) {
        const theta = 2 * Math.PI * thetaIndex / 12;
        const points = [];
        for (let xIndex = 0; xIndex <= 64; xIndex += 1) {
          const x = -1 + 2 * xIndex / 64;
          const radius = profile(x);
          points.push({ x, y: radius * Math.cos(theta), z: radius * Math.sin(theta) });
        }
        drawPath(points, "rgba(37, 106, 138, 0.42)", 1.05);
      }

      for (let xIndex = 0; xIndex <= 12; xIndex += 1) {
        const x = -1 + 2 * xIndex / 12;
        const radius = profile(x);
        const points = [];
        for (let thetaIndex = 0; thetaIndex <= 72; thetaIndex += 1) {
          const theta = 2 * Math.PI * thetaIndex / 72;
          points.push({ x, y: radius * Math.cos(theta), z: radius * Math.sin(theta) });
        }
        drawPath(points, "rgba(37, 106, 138, 0.30)", 0.9);
      }

      drawPath(
        [{ x: -1.22, y: 0, z: 0 }, { x: 1.22, y: 0, z: 0 }],
        palette.line,
        1.2,
        [6, 5],
      );

      const highlightedProfile = [];
      for (let xIndex = 0; xIndex <= 80; xIndex += 1) {
        const x = -1 + 2 * xIndex / 80;
        highlightedProfile.push({ x, y: profile(x), z: 0 });
      }
      drawPath(highlightedProfile, palette.gold, 3.1);

      const endpointA = project({ x: -1.15, y: 0, z: 0 });
      const endpointB = project({ x: 1.15, y: 0, z: 0 });
      context.fillStyle = palette.muted;
      context.font = `600 ${Math.max(16, Math.min(20, width * 0.03))}px "Cambria Math", serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("a", endpointA.x, endpointA.y + 17);
      context.fillText("b", endpointB.x, endpointB.y + 17);

      const labelPoint = project({ x: -0.08, y: profile(-0.08), z: 0 });
      context.fillStyle = palette.gold;
      context.font = `italic 600 ${Math.max(17, Math.min(21, width * 0.034))}px "Cambria Math", serif`;
      context.textAlign = "left";
      context.fillText("f(x)", labelPoint.x + 8, labelPoint.y - 11);
    }

    function scheduleDraw() {
      if (scheduledFrame) return;
      scheduledFrame = window.requestAnimationFrame(draw);
    }

    canvas.addEventListener("pointerdown", (event) => {
      dragging = true;
      pointerX = event.clientX;
      pointerY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const deltaX = event.clientX - pointerX;
      const deltaY = event.clientY - pointerY;
      pointerX = event.clientX;
      pointerY = event.clientY;
      yaw += deltaX * 0.008;
      pitch = Math.max(-1.05, Math.min(1.05, pitch + deltaY * 0.008));
      scheduleDraw();
    });
    canvas.addEventListener("pointerup", (event) => {
      dragging = false;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointercancel", () => {
      dragging = false;
    });
    window.addEventListener("resize", scheduleDraw);
    window.addEventListener("slidechange", (event) => {
      if (event.detail.index === 6) scheduleDraw();
    });
    if ("ResizeObserver" in window) {
      new ResizeObserver(scheduleDraw).observe(canvas);
    }

    scheduleDraw();
  }

  function initializeUniqueMaximumSlide() {
    const slider = document.querySelector("#uniqueDimensionSlider");
    const dimensionValue = document.querySelector("#uniqueDimensionValue");
    const radiusSlider = document.querySelector("#uniqueRadiusSlider");
    const radiusValue = document.querySelector("#uniqueRadiusValue");
    const ellipseCanvas = document.querySelector("#ellipseMcpCanvas");
    const parabolaCanvas = document.querySelector("#parabolaMcpCanvas");
    const ellipseOutside = document.querySelector("#ellipseOutsideMass");
    const parabolaOutside = document.querySelector("#parabolaOutsideMass");
    if (!slider || !dimensionValue || !radiusSlider || !radiusValue || !ellipseCanvas || !parabolaCanvas || !ellipseOutside || !parabolaOutside) return;

    const minimumExponent = Math.log2(3);
    const maximumExponent = 11;
    const palette = {
      blue: "#256a8a",
      red: "#cb443b",
      gold: "#d49a38",
      ink: "#102b3a",
      muted: "#60717a",
      line: "#b9c5c7",
      blueSoft: "rgba(37, 106, 138, 0.08)",
    };
    const profiles = {
      ellipse: {
        canvas: ellipseCanvas,
        output: ellipseOutside,
        extent: 2 / Math.sqrt(3),
        seed: 1907,
        yaw: -0.28,
        pitch: 0.30,
        dragging: false,
        pointerX: 0,
        pointerY: 0,
        value: (x) => Math.sqrt(Math.max(0, 1 - 0.75 * x * x)),
        derivative: (x) => -0.75 * x / Math.max(1e-12, Math.sqrt(Math.max(0, 1 - 0.75 * x * x))),
      },
      parabola: {
        canvas: parabolaCanvas,
        output: parabolaOutside,
        extent: Math.sqrt(2),
        seed: 2909,
        yaw: -0.28,
        pitch: 0.30,
        dragging: false,
        pointerX: 0,
        pointerY: 0,
        value: (x) => Math.max(0, 1 - 0.5 * x * x),
        derivative: (x) => -x,
      },
    };
    let scheduledFrame = 0;

    function createRandom(seed) {
      let state = seed >>> 0;
      return () => {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 4294967296;
      };
    }

    function resizeCanvas(canvas) {
      const rectangle = canvas.getBoundingClientRect();
      if (rectangle.width < 2 || rectangle.height < 2) return null;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(rectangle.width);
      const height = Math.round(rectangle.height);
      const pixelWidth = Math.max(1, Math.round(width * ratio));
      const pixelHeight = Math.max(1, Math.round(height * ratio));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      const context = canvas.getContext("2d");
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      return { context, width, height };
    }

    function buildArcLengthTable(profile) {
      const count = 3600;
      const xs = new Float64Array(count + 1);
      const distances = new Float64Array(count + 1);
      const step = profile.extent / count;
      let distance = 0;
      for (let index = 1; index <= count; index += 1) {
        const midpoint = (index - 0.5) * step;
        const derivative = profile.derivative(midpoint);
        distance += Math.sqrt(1 + derivative * derivative) * step;
        xs[index] = index * step;
        distances[index] = distance;
      }
      profile.arcLengthTable = { xs, distances };
      profile.maximumRadius = distance;
    }

    function radiusToCoordinate(profile, radius) {
      if (radius <= 0) return 0;
      if (radius >= profile.maximumRadius) return profile.extent;
      const { xs, distances } = profile.arcLengthTable;
      let low = 0;
      let high = distances.length - 1;
      while (low + 1 < high) {
        const middle = (low + high) >> 1;
        if (distances[middle] < radius) low = middle;
        else high = middle;
      }
      const span = distances[high] - distances[low];
      const fraction = span > 0 ? (radius - distances[low]) / span : 0;
      return xs[low] + fraction * (xs[high] - xs[low]);
    }

    Object.values(profiles).forEach(buildArcLengthTable);

    function buildDistribution(profile, dimension, boundaryX) {
      const count = 1800;
      const xs = new Float64Array(count);
      const logWeights = new Float64Array(count);
      let maximumLogWeight = -Infinity;
      for (let index = 0; index < count; index += 1) {
        const x = -profile.extent + (index + 0.5) * (2 * profile.extent / count);
        const value = Math.max(1e-12, profile.value(x));
        const derivative = profile.derivative(x);
        const logWeight = (dimension - 1) * Math.log(value) + 0.5 * Math.log1p(derivative * derivative);
        xs[index] = x;
        logWeights[index] = logWeight;
        if (logWeight > maximumLogWeight) maximumLogWeight = logWeight;
      }

      const cdf = new Float64Array(count);
      let total = 0;
      let outside = 0;
      for (let index = 0; index < count; index += 1) {
        const weight = Math.exp(logWeights[index] - maximumLogWeight);
        total += weight;
        if (xs[index] > boundaryX) outside += weight;
        cdf[index] = total;
      }
      for (let index = 0; index < count; index += 1) cdf[index] /= total;
      return { xs, cdf, outsideMass: outside / total };
    }

    function sampleX(distribution, value) {
      let low = 0;
      let high = distribution.cdf.length - 1;
      while (low < high) {
        const middle = (low + high) >> 1;
        if (distribution.cdf[middle] < value) low = middle + 1;
        else high = middle;
      }
      return distribution.xs[low];
    }

    function formatMass(value) {
      if (value >= 0.001) return value.toFixed(3);
      if (value === 0) return "< 10⁻⁶";
      return value.toExponential(1).replace("e-", "×10⁻")
        .replace(/(×10⁻)(\d+)/, (_, prefix, exponent) => `${prefix}${exponent}`);
    }

    function drawProfile(profile, dimension, radius) {
      const resized = resizeCanvas(profile.canvas);
      if (!resized) return;
      const { context, width, height } = resized;
      const boundaryX = radiusToCoordinate(profile, radius);
      const distribution = buildDistribution(profile, dimension, boundaryX);
      const centerX = width * 0.5;
      const centerY = height * 0.52;
      const scale = Math.min(width / (2 * profile.extent + 1.8), height / 2.75);
      const camera = 5.2;

      function rotatePoint(point) {
        const cosineYaw = Math.cos(profile.yaw);
        const sineYaw = Math.sin(profile.yaw);
        const xYaw = cosineYaw * point.x + sineYaw * point.z;
        const zYaw = -sineYaw * point.x + cosineYaw * point.z;
        const cosinePitch = Math.cos(profile.pitch);
        const sinePitch = Math.sin(profile.pitch);
        const yPitch = cosinePitch * point.y - sinePitch * zYaw;
        const zPitch = sinePitch * point.y + cosinePitch * zYaw;
        return { x: xYaw, y: yPitch, z: zPitch };
      }

      function project(point) {
        const rotated = rotatePoint(point);
        const perspective = camera / (camera - rotated.z);
        return {
          x: centerX + scale * perspective * rotated.x,
          y: centerY - scale * perspective * rotated.y,
          depth: rotated.z,
        };
      }

      function surfacePoint(x, theta) {
        const radius = profile.value(x);
        return { x, y: radius * Math.cos(theta), z: radius * Math.sin(theta) };
      }

      const xCount = 34;
      const thetaCount = 40;
      const quads = [];
      for (let xIndex = 0; xIndex < xCount; xIndex += 1) {
        const x0 = -profile.extent + 2 * profile.extent * xIndex / xCount;
        const x1 = -profile.extent + 2 * profile.extent * (xIndex + 1) / xCount;
        for (let thetaIndex = 0; thetaIndex < thetaCount; thetaIndex += 1) {
          const theta0 = 2 * Math.PI * thetaIndex / thetaCount;
          const theta1 = 2 * Math.PI * (thetaIndex + 1) / thetaCount;
          const projected = [
            surfacePoint(x0, theta0),
            surfacePoint(x1, theta0),
            surfacePoint(x1, theta1),
            surfacePoint(x0, theta1),
          ].map(project);
          quads.push({
            projected,
            depth: projected.reduce((sum, point) => sum + point.depth, 0) / projected.length,
          });
        }
      }
      quads.sort((first, second) => first.depth - second.depth);
      quads.forEach(({ projected, depth }) => {
        const alpha = Math.max(0.055, Math.min(0.13, 0.085 + depth * 0.018));
        context.beginPath();
        context.moveTo(projected[0].x, projected[0].y);
        for (let index = 1; index < projected.length; index += 1) context.lineTo(projected[index].x, projected[index].y);
        context.closePath();
        context.fillStyle = `rgba(96, 113, 120, ${alpha})`;
        context.fill();
      });

      const random = createRandom(profile.seed + dimension * 7919);
      const sampleCount = Math.round(Math.max(500, Math.min(950, width * 1.35)));
      const points = [];
      for (let index = 0; index < sampleCount; index += 1) {
        const x = sampleX(distribution, random());
        const theta = 2 * Math.PI * random();
        const projected = project(surfacePoint(x, theta));
        const region = x <= 0 ? "A" : x <= boundaryX ? "shell" : "outside";
        points.push({ ...projected, region });
      }
      points.sort((first, second) => first.depth - second.depth);
      points.forEach((point) => {
        const nearAlpha = Math.max(0.45, Math.min(0.86, 0.62 + point.depth * 0.10));
        context.fillStyle = point.region === "A"
          ? `rgba(37, 106, 138, ${nearAlpha})`
          : point.region === "shell"
            ? `rgba(212, 154, 56, ${nearAlpha})`
            : `rgba(203, 68, 59, ${nearAlpha})`;
        context.beginPath();
        context.arc(point.x, point.y, point.region === "outside" ? 2.15 : 1.9, 0, 2 * Math.PI);
        context.fill();
      });

      const maximumLabel = project(surfacePoint(0, 0));
      context.fillStyle = palette.ink;
      context.font = `600 ${Math.max(15, Math.min(19, width * 0.028))}px "Cambria Math", serif`;
      context.textAlign = "center";
      context.textBaseline = "bottom";
      context.fillText("x* = 0", maximumLabel.x, maximumLabel.y - 8);

      context.fillStyle = palette.muted;
      context.font = `700 ${Math.max(10, Math.min(12, width * 0.016))}px "Segoe UI", sans-serif`;
      context.textAlign = "right";
      context.textBaseline = "top";
      context.fillText("DRAG TO ROTATE", width - 8, 7);
      const projectionFontSize = Math.max(14, Math.min(17, width * 0.024));
      drawSigmaProjectionLabel(context, 8, height - 5, "2", projectionFontSize, palette.muted);

      profile.output.textContent = formatMass(distribution.outsideMass);
      profile.output.setAttribute("aria-label", `outside mass equals ${distribution.outsideMass}`);
    }

    function render() {
      scheduledFrame = 0;
      const exponent = Number(slider.value);
      const dimension = Math.max(3, Math.min(2048, Math.round(Math.pow(2, exponent))));
      const minimumRadius = Number(radiusSlider.min);
      const maximumRadius = Number(radiusSlider.max);
      const radius = Math.max(minimumRadius, Math.min(maximumRadius, Number(radiusSlider.value)));
      dimensionValue.textContent = `n = ${dimension}`;
      radiusValue.textContent = `r = ${radius.toFixed(2)}`;
      const progress = 100 * (exponent - minimumExponent) / (maximumExponent - minimumExponent);
      const radiusProgress = 100 * (radius - minimumRadius) / (maximumRadius - minimumRadius);
      slider.style.setProperty("--progress", `${Math.max(0, Math.min(100, progress)).toFixed(2)}%`);
      radiusSlider.style.setProperty("--progress", `${Math.max(0, Math.min(100, radiusProgress)).toFixed(2)}%`);
      slider.setAttribute("aria-valuetext", `dimension n equals ${dimension} on a logarithmic scale`);
      radiusSlider.setAttribute("aria-valuetext", `meridian radius r equals ${radius.toFixed(2)}`);
      drawProfile(profiles.ellipse, dimension, radius);
      drawProfile(profiles.parabola, dimension, radius);
    }

    function scheduleRender() {
      if (scheduledFrame) return;
      scheduledFrame = window.requestAnimationFrame(render);
    }

    Object.values(profiles).forEach((profile) => {
      profile.canvas.addEventListener("pointerdown", (event) => {
        profile.dragging = true;
        profile.pointerX = event.clientX;
        profile.pointerY = event.clientY;
        profile.canvas.setPointerCapture(event.pointerId);
      });
      profile.canvas.addEventListener("pointermove", (event) => {
        if (!profile.dragging) return;
        const deltaX = event.clientX - profile.pointerX;
        const deltaY = event.clientY - profile.pointerY;
        profile.pointerX = event.clientX;
        profile.pointerY = event.clientY;
        profile.yaw += deltaX * 0.008;
        profile.pitch = Math.max(-1.05, Math.min(1.05, profile.pitch + deltaY * 0.008));
        scheduleRender();
      });
      profile.canvas.addEventListener("pointerup", (event) => {
        profile.dragging = false;
        if (profile.canvas.hasPointerCapture(event.pointerId)) profile.canvas.releasePointerCapture(event.pointerId);
      });
      profile.canvas.addEventListener("pointercancel", () => {
        profile.dragging = false;
      });
    });

    slider.addEventListener("input", scheduleRender);
    radiusSlider.addEventListener("input", scheduleRender);
    window.addEventListener("resize", scheduleRender);
    window.addEventListener("slidechange", (event) => {
      if (event.detail.index === 8) scheduleRender();
    });
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(scheduleRender);
      observer.observe(ellipseCanvas);
      observer.observe(parabolaCanvas);
    }

    scheduleRender();
  }

  function initializeDominantMaximaSlide() {
    const dimensionSlider = document.querySelector("#dominantDimensionSlider");
    const dimensionValue = document.querySelector("#dominantDimensionValue");
    const radiusSlider = document.querySelector("#dominantRadiusSlider");
    const radiusValue = document.querySelector("#dominantRadiusValue");
    const leftCanvas = document.querySelector("#dominantSurfaceCanvasLeft");
    const leftOutsideOutput = document.querySelector("#dominantOutsideMassLeft");
    const leftSetButton = document.querySelector("#dominantHalfSetLeft");
    const rightSetButton = document.querySelector("#dominantHalfSetRight");
    if (!dimensionSlider || !dimensionValue || !radiusSlider || !radiusValue || !leftCanvas || !leftOutsideOutput || !leftSetButton || !rightSetButton) return;

    const minimumExponent = Math.log2(3);
    const maximumExponent = 52;
    const palette = {
      blue: "#256a8a",
      red: "#cb443b",
      gold: "#d49a38",
      ink: "#102b3a",
      muted: "#60717a",
      line: "#b9c5c7",
    };
    const profile = {
      a: -1.25,
      b: 1.25,
      value(x) {
        return Math.max(1e-8, 1 - (2 / 5) * (x + 1) ** 2 * (x - 1) ** 4);
      },
      derivative(x) {
        return -(4 / 5) * (x + 1) * (x - 1) ** 3 * (3 * x + 1);
      },
    };
    profile.midpoint = (profile.a + profile.b) / 2;
    const views = [
      { canvas: leftCanvas, output: leftOutsideOutput, side: "left", yaw: -0.25, pitch: 0.28, dragging: false, pointerX: 0, pointerY: 0 },
    ];
    let scheduledFrame = 0;

    function createRandom(seed) {
      let state = seed >>> 0;
      return () => {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 4294967296;
      };
    }

    function resizeCanvas(canvas) {
      const rectangle = canvas.getBoundingClientRect();
      if (rectangle.width < 2 || rectangle.height < 2) return null;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(rectangle.width);
      const height = Math.round(rectangle.height);
      const pixelWidth = Math.max(1, Math.round(width * ratio));
      const pixelHeight = Math.max(1, Math.round(height * ratio));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      const context = canvas.getContext("2d");
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      return { context, width, height };
    }

    function buildArcTable() {
      const count = 4200;
      const xs = new Float64Array(count + 1);
      const distances = new Float64Array(count + 1);
      const step = (profile.b - profile.a) / count;
      let distance = 0;
      xs[0] = profile.a;
      for (let index = 1; index <= count; index += 1) {
        const midpoint = profile.a + (index - 0.5) * step;
        const derivative = profile.derivative(midpoint);
        distance += Math.sqrt(1 + derivative * derivative) * step;
        xs[index] = profile.a + index * step;
        distances[index] = distance;
      }
      return { xs, distances, step };
    }

    const arcTable = buildArcTable();

    function arcAtCoordinate(x) {
      if (x <= profile.a) return 0;
      if (x >= profile.b) return arcTable.distances[arcTable.distances.length - 1];
      const rawIndex = (x - profile.a) / arcTable.step;
      const low = Math.floor(rawIndex);
      const high = Math.min(low + 1, arcTable.xs.length - 1);
      const fraction = rawIndex - low;
      return arcTable.distances[low] + fraction * (arcTable.distances[high] - arcTable.distances[low]);
    }

    function coordinateAtArc(distance) {
      if (distance <= 0) return profile.a;
      const maximumDistance = arcTable.distances[arcTable.distances.length - 1];
      if (distance >= maximumDistance) return profile.b;
      let low = 0;
      let high = arcTable.distances.length - 1;
      while (low + 1 < high) {
        const middle = (low + high) >> 1;
        if (arcTable.distances[middle] < distance) low = middle;
        else high = middle;
      }
      const span = arcTable.distances[high] - arcTable.distances[low];
      const fraction = span > 0 ? (distance - arcTable.distances[low]) / span : 0;
      return arcTable.xs[low] + fraction * (arcTable.xs[high] - arcTable.xs[low]);
    }

    function buildDistribution(dimension, radius) {
      const count = 2200;
      const xs = new Float64Array(count);
      const logWeights = new Float64Array(count);
      let maximumLogWeight = -Infinity;
      for (let index = 0; index < count; index += 1) {
        const x = profile.a + (index + 0.5) * (profile.b - profile.a) / count;
        const value = Math.max(1e-12, profile.value(x));
        const derivative = profile.derivative(x);
        const logWeight = (dimension - 1) * Math.log(value) + 0.5 * Math.log1p(derivative * derivative);
        xs[index] = x;
        logWeights[index] = logWeight;
        if (logWeight > maximumLogWeight) maximumLogWeight = logWeight;
      }

      const weights = new Float64Array(count);
      const cdf = new Float64Array(count);
      let total = 0;
      for (let index = 0; index < count; index += 1) {
        const weight = Math.exp(logWeights[index] - maximumLogWeight);
        weights[index] = weight;
        total += weight;
        cdf[index] = total;
      }
      for (let index = 0; index < count; index += 1) cdf[index] /= total;

      const medianX = sampleX({ xs, cdf }, 0.5);
      const medianArc = arcAtCoordinate(medianX);
      const leftBoundaryX = coordinateAtArc(medianArc + radius);
      const rightBoundaryX = coordinateAtArc(medianArc - radius);
      let outsideLeftMass = 0;
      let outsideRightMass = 0;
      for (let index = 0; index < count; index += 1) {
        if (xs[index] > leftBoundaryX) outsideLeftMass += weights[index];
        if (xs[index] < rightBoundaryX) outsideRightMass += weights[index];
      }
      return {
        xs,
        cdf,
        medianX,
        leftBoundaryX,
        rightBoundaryX,
        outsideLeftMass: outsideLeftMass / total,
        outsideRightMass: outsideRightMass / total,
      };
    }

    function sampleX(distribution, value) {
      let low = 0;
      let high = distribution.cdf.length - 1;
      while (low < high) {
        const middle = (low + high) >> 1;
        if (distribution.cdf[middle] < value) low = middle + 1;
        else high = middle;
      }
      return distribution.xs[low];
    }

    function regionForX(x, distribution, side) {
      if (side === "left") {
        if (x <= distribution.medianX) return "A";
        if (x <= distribution.leftBoundaryX) return "shell";
        return "outside";
      }
      if (x >= distribution.medianX) return "A";
      if (x >= distribution.rightBoundaryX) return "shell";
      return "outside";
    }

    function colorForRegion(region, alpha) {
      if (region === "A") return `rgba(37, 106, 138, ${alpha})`;
      if (region === "shell") return `rgba(212, 154, 56, ${alpha})`;
      return `rgba(203, 68, 59, ${alpha})`;
    }

    function formatMass(value) {
      if (value >= 0.001) return value.toFixed(3);
      if (value === 0) return "< 10⁻⁶";
      return value.toExponential(1).replace("e-", "×10⁻")
        .replace(/(×10⁻)(\d+)/, (_, prefix, exponent) => `${prefix}${exponent}`);
    }

    function drawProfileView(distribution, dimension) {
      const resized = resizeCanvas(profileCanvas);
      if (!resized) return;
      const { context, width, height } = resized;
      const padding = {
        left: Math.max(38, width * 0.075),
        right: Math.max(16, width * 0.035),
        top: 30,
        bottom: 31,
      };
      const plotWidth = width - padding.left - padding.right;
      const plotHeight = height - padding.top - padding.bottom;
      const xToPixel = (x) => padding.left + (x - profile.a) / (profile.b - profile.a) * plotWidth;
      const yToPixel = (y) => padding.top + (1.08 - y) / 1.08 * plotHeight;

      context.fillStyle = "rgba(96, 113, 120, 0.09)";
      context.beginPath();
      context.moveTo(xToPixel(profile.a), yToPixel(0));
      const curvePoints = 420;
      for (let index = 0; index <= curvePoints; index += 1) {
        const x = profile.a + (profile.b - profile.a) * index / curvePoints;
        context.lineTo(xToPixel(x), yToPixel(profile.value(x)));
      }
      context.lineTo(xToPixel(profile.b), yToPixel(0));
      context.closePath();
      context.fill();

      context.strokeStyle = "rgba(16, 43, 58, 0.78)";
      context.lineWidth = 1.7;
      context.beginPath();
      for (let index = 0; index <= curvePoints; index += 1) {
        const x = profile.a + (profile.b - profile.a) * index / curvePoints;
        const px = xToPixel(x);
        const py = yToPixel(profile.value(x));
        if (index === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
      }
      context.stroke();

      const random = createRandom(4319 + dimension * 3571);
      const sampleCount = Math.round(Math.max(420, Math.min(760, width * 1.35)));
      for (let index = 0; index < sampleCount; index += 1) {
        const x = sampleX(distribution, random());
        const jitter = (random() - 0.5) * 10;
        const region = regionForX(x, distribution);
        context.fillStyle = colorForRegion(region, 0.72);
        context.beginPath();
        context.arc(xToPixel(x), yToPixel(profile.value(x)) + jitter, region === "outside" ? 2.15 : 1.9, 0, 2 * Math.PI);
        context.fill();
      }

      const maxima = [
        { x: -1, label: "x₁ = −1   p₁ = 2", color: palette.ink },
        { x: 1, label: "x₂ = 1   p₂ = 8", color: palette.gold },
      ];
      context.font = `700 ${Math.max(15, Math.min(19, width * 0.03))}px "Cambria Math", serif`;
      context.textAlign = "center";
      context.textBaseline = "bottom";
      maxima.forEach((maximum) => {
        const px = xToPixel(maximum.x);
        const py = yToPixel(1);
        context.fillStyle = "rgba(245, 242, 235, 0.90)";
        const textWidth = context.measureText(maximum.label).width;
        context.fillRect(px - textWidth / 2 - 4, py - 24, textWidth + 8, 20);
        context.fillStyle = maximum.color;
        context.fillText(maximum.label, px, py - 6);
      });

      context.fillStyle = palette.muted;
      context.font = `500 ${Math.max(14, Math.min(17, width * 0.025))}px "Segoe UI", sans-serif`;
      context.textAlign = "left";
      context.textBaseline = "bottom";
      context.fillText("a", xToPixel(profile.a), height - 4);
      context.textAlign = "right";
      context.fillText("b", xToPixel(profile.b), height - 4);
    }

    function drawSurfaceView(view, distribution, dimension) {
      const resized = resizeCanvas(view.canvas);
      if (!resized) return;
      const { context, width, height } = resized;
      const centerX = width * 0.50;
      const centerY = height * 0.54;
      const scale = Math.min(width / ((profile.b - profile.a) + 1.85), height / (views.length === 1 ? 2.45 : 2.75));
      const camera = 5.5;

      function rotatePoint(point) {
        const centeredX = point.x - profile.midpoint;
        const cosineYaw = Math.cos(view.yaw);
        const sineYaw = Math.sin(view.yaw);
        const xYaw = cosineYaw * centeredX + sineYaw * point.z;
        const zYaw = -sineYaw * centeredX + cosineYaw * point.z;
        const cosinePitch = Math.cos(view.pitch);
        const sinePitch = Math.sin(view.pitch);
        const yPitch = cosinePitch * point.y - sinePitch * zYaw;
        const zPitch = sinePitch * point.y + cosinePitch * zYaw;
        return { x: xYaw, y: yPitch, z: zPitch };
      }

      function project(point) {
        const rotated = rotatePoint(point);
        const perspective = camera / (camera - rotated.z);
        return {
          x: centerX + scale * perspective * rotated.x,
          y: centerY - scale * perspective * rotated.y,
          depth: rotated.z,
        };
      }

      function surfacePoint(x, theta) {
        const radius = profile.value(x);
        return { x, y: radius * Math.cos(theta), z: radius * Math.sin(theta) };
      }

      const xCount = 42;
      const thetaCount = 42;
      const quads = [];
      for (let xIndex = 0; xIndex < xCount; xIndex += 1) {
        const x0 = profile.a + (profile.b - profile.a) * xIndex / xCount;
        const x1 = profile.a + (profile.b - profile.a) * (xIndex + 1) / xCount;
        for (let thetaIndex = 0; thetaIndex < thetaCount; thetaIndex += 1) {
          const theta0 = 2 * Math.PI * thetaIndex / thetaCount;
          const theta1 = 2 * Math.PI * (thetaIndex + 1) / thetaCount;
          const projected = [
            surfacePoint(x0, theta0),
            surfacePoint(x1, theta0),
            surfacePoint(x1, theta1),
            surfacePoint(x0, theta1),
          ].map(project);
          quads.push({
            projected,
            depth: projected.reduce((sum, point) => sum + point.depth, 0) / projected.length,
          });
        }
      }
      quads.sort((first, second) => first.depth - second.depth);
      quads.forEach(({ projected, depth }) => {
        const alpha = Math.max(0.05, Math.min(0.125, 0.082 + depth * 0.017));
        context.beginPath();
        context.moveTo(projected[0].x, projected[0].y);
        for (let index = 1; index < projected.length; index += 1) context.lineTo(projected[index].x, projected[index].y);
        context.closePath();
        context.fillStyle = `rgba(96, 113, 120, ${alpha})`;
        context.fill();
      });

      const random = createRandom(7907 + dimension * 7919);
      const sampleCount = Math.round(Math.max(700, Math.min(1200, width * 1.45)));
      const points = [];
      for (let index = 0; index < sampleCount; index += 1) {
        const x = sampleX(distribution, random());
        const theta = 2 * Math.PI * random();
        const projected = project(surfacePoint(x, theta));
        points.push({ ...projected, region: regionForX(x, distribution, view.side) });
      }
      points.sort((first, second) => first.depth - second.depth);
      points.forEach((point) => {
        const alpha = Math.max(0.46, Math.min(0.88, 0.63 + point.depth * 0.10));
        context.fillStyle = colorForRegion(point.region, alpha);
        context.beginPath();
        context.arc(point.x, point.y, point.region === "outside" ? 2.15 : 1.9, 0, 2 * Math.PI);
        context.fill();
      });

      const maxima = [
        { x: -1, label: "x₁, p₁ = 2", color: palette.ink },
        { x: 1, label: "x₂, p₂ = 4", color: palette.gold },
      ];
      context.font = `700 ${Math.max(15, Math.min(19, width * 0.026))}px "Cambria Math", serif`;
      context.textAlign = "center";
      context.textBaseline = "bottom";
      maxima.forEach((maximum) => {
        const location = project(surfacePoint(maximum.x, 0));
        const textWidth = context.measureText(maximum.label).width;
        context.fillStyle = "rgba(245, 242, 235, 0.88)";
        context.fillRect(location.x - textWidth / 2 - 4, location.y - 25, textWidth + 8, 20);
        context.fillStyle = maximum.color;
        context.fillText(maximum.label, location.x, location.y - 7);
      });

      context.fillStyle = palette.muted;
      context.font = `700 ${Math.max(10, Math.min(12, width * 0.016))}px "Segoe UI", sans-serif`;
      context.textAlign = "right";
      context.textBaseline = "top";
      context.fillText("DRAG TO ROTATE", width - 8, 7);
      const projectionFontSize = Math.max(14, Math.min(17, width * 0.022));
      drawSigmaProjectionLabel(context, 8, height - 5, "2", projectionFontSize, palette.muted);
    }

    function render() {
      scheduledFrame = 0;
      const exponent = Number(dimensionSlider.value);
      const dimension = Math.max(3, Math.min(2 ** 52, Math.round(2 ** exponent)));
      const minimumRadius = Number(radiusSlider.min);
      const maximumRadius = Number(radiusSlider.max);
      const radius = Math.max(minimumRadius, Math.min(maximumRadius, Number(radiusSlider.value)));
      const distribution = buildDistribution(dimension, radius);

      dimensionValue.textContent = `n = ${dimension >= 1e7 ? dimension.toExponential(2) : dimension}`;
      radiusValue.textContent = `r = ${radius.toFixed(2)}`;
      const outsideMass = views[0].side === "left" ? distribution.outsideLeftMass : distribution.outsideRightMass;
      leftOutsideOutput.textContent = formatMass(outsideMass);
      leftOutsideOutput.setAttribute("aria-label", `${views[0].side} half-set outside mass equals ${outsideMass}`);

      const dimensionProgress = 100 * (exponent - minimumExponent) / (maximumExponent - minimumExponent);
      const radiusProgress = 100 * (radius - minimumRadius) / (maximumRadius - minimumRadius);
      dimensionSlider.style.setProperty("--progress", `${Math.max(0, Math.min(100, dimensionProgress)).toFixed(2)}%`);
      radiusSlider.style.setProperty("--progress", `${Math.max(0, Math.min(100, radiusProgress)).toFixed(2)}%`);
      dimensionSlider.setAttribute("aria-valuetext", `dimension n equals ${dimension} on a logarithmic scale`);
      radiusSlider.setAttribute("aria-valuetext", `meridian radius r equals ${radius.toFixed(2)}`);

      views.forEach((view) => drawSurfaceView(view, distribution, dimension));
    }

    function scheduleRender() {
      if (scheduledFrame) return;
      scheduledFrame = window.requestAnimationFrame(render);
    }

    views.forEach((view) => {
      view.canvas.addEventListener("pointerdown", (event) => {
        view.dragging = true;
        view.pointerX = event.clientX;
        view.pointerY = event.clientY;
        view.canvas.setPointerCapture(event.pointerId);
      });
      view.canvas.addEventListener("pointermove", (event) => {
        if (!view.dragging) return;
        const deltaX = event.clientX - view.pointerX;
        const deltaY = event.clientY - view.pointerY;
        view.pointerX = event.clientX;
        view.pointerY = event.clientY;
        view.yaw += deltaX * 0.008;
        view.pitch = Math.max(-1.05, Math.min(1.05, view.pitch + deltaY * 0.008));
        scheduleRender();
      });
      view.canvas.addEventListener("pointerup", (event) => {
        view.dragging = false;
        if (view.canvas.hasPointerCapture(event.pointerId)) view.canvas.releasePointerCapture(event.pointerId);
      });
      view.canvas.addEventListener("pointercancel", () => {
        view.dragging = false;
      });
    });

    dimensionSlider.addEventListener("input", scheduleRender);
    radiusSlider.addEventListener("input", scheduleRender);
    leftSetButton.addEventListener("click", () => {
      views[0].side = "left";
      leftSetButton.classList.add("is-active");
      rightSetButton.classList.remove("is-active");
      leftSetButton.setAttribute("aria-pressed", "true");
      rightSetButton.setAttribute("aria-pressed", "false");
      scheduleRender();
    });
    rightSetButton.addEventListener("click", () => {
      views[0].side = "right";
      rightSetButton.classList.add("is-active");
      leftSetButton.classList.remove("is-active");
      rightSetButton.setAttribute("aria-pressed", "true");
      leftSetButton.setAttribute("aria-pressed", "false");
      scheduleRender();
    });
    window.addEventListener("resize", scheduleRender);
    window.addEventListener("slidechange", (event) => {
      if (event.detail.index === 9) scheduleRender();
    });
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(scheduleRender);
      views.forEach((view) => observer.observe(view.canvas));
    }

    scheduleRender();
  }

  function initializeFractionalDominantMaximaSlide() {
    const dimensionSlider = document.querySelector("#fractionalDimensionSlider");
    const dimensionValue = document.querySelector("#fractionalDimensionValue");
    const radiusSlider = document.querySelector("#fractionalRadiusSlider");
    const radiusValue = document.querySelector("#fractionalRadiusValue");
    const canvas = document.querySelector("#fractionalDominantSurfaceCanvas");
    const outsideOutput = document.querySelector("#fractionalOutsideMass");
    const leftSetButton = document.querySelector("#fractionalHalfSetLeft");
    const rightSetButton = document.querySelector("#fractionalHalfSetRight");
    if (!dimensionSlider || !dimensionValue || !radiusSlider || !radiusValue || !canvas || !outsideOutput || !leftSetButton || !rightSetButton) return;

    const minimumExponent = Math.log2(3);
    const maximumExponent = 52;
    const profile = {
      a: -1.2,
      b: 1.2,
      product(x) {
        return (x + 1) ** 2 * x ** 2 * (x - 1) ** 4;
      },
      productDerivative(x) {
        return 2 * (x + 1) * x ** 2 * (x - 1) ** 4
          + 2 * (x + 1) ** 2 * x * (x - 1) ** 4
          + 4 * (x + 1) ** 2 * x ** 2 * (x - 1) ** 3;
      },
      value(x) {
        return Math.max(1e-8, 1 - (2 / 3) * this.product(x));
      },
      derivative(x) {
        return -(2 / 3) * this.productDerivative(x);
      },
    };
    profile.midpoint = (profile.a + profile.b) / 2;
    const views = [
      { canvas, output: outsideOutput, side: "left", yaw: -0.25, pitch: 0.28, dragging: false, pointerX: 0, pointerY: 0 },
    ];
    let scheduledFrame = 0;

    function createRandom(seed) {
      let state = seed >>> 0;
      return () => {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 4294967296;
      };
    }

    function resizeCanvas(canvas) {
      const rectangle = canvas.getBoundingClientRect();
      if (rectangle.width < 2 || rectangle.height < 2) return null;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(rectangle.width);
      const height = Math.round(rectangle.height);
      const pixelWidth = Math.max(1, Math.round(width * ratio));
      const pixelHeight = Math.max(1, Math.round(height * ratio));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      const context = canvas.getContext("2d");
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      return { context, width, height };
    }

    function buildArcTable() {
      const count = 4800;
      const xs = new Float64Array(count + 1);
      const distances = new Float64Array(count + 1);
      const step = (profile.b - profile.a) / count;
      let distance = 0;
      xs[0] = profile.a;
      for (let index = 1; index <= count; index += 1) {
        const midpoint = profile.a + (index - 0.5) * step;
        const derivative = profile.derivative(midpoint);
        distance += Math.sqrt(1 + derivative * derivative) * step;
        xs[index] = profile.a + index * step;
        distances[index] = distance;
      }
      return { xs, distances, step };
    }

    const arcTable = buildArcTable();

    function arcAtCoordinate(x) {
      if (x <= profile.a) return 0;
      if (x >= profile.b) return arcTable.distances[arcTable.distances.length - 1];
      const rawIndex = (x - profile.a) / arcTable.step;
      const low = Math.floor(rawIndex);
      const high = Math.min(low + 1, arcTable.xs.length - 1);
      const fraction = rawIndex - low;
      return arcTable.distances[low] + fraction * (arcTable.distances[high] - arcTable.distances[low]);
    }

    function coordinateAtArc(distance) {
      if (distance <= 0) return profile.a;
      const maximumDistance = arcTable.distances[arcTable.distances.length - 1];
      if (distance >= maximumDistance) return profile.b;
      let low = 0;
      let high = arcTable.distances.length - 1;
      while (low + 1 < high) {
        const middle = (low + high) >> 1;
        if (arcTable.distances[middle] < distance) low = middle;
        else high = middle;
      }
      const span = arcTable.distances[high] - arcTable.distances[low];
      const fraction = span > 0 ? (distance - arcTable.distances[low]) / span : 0;
      return arcTable.xs[low] + fraction * (arcTable.xs[high] - arcTable.xs[low]);
    }

    function sampleX(distribution, value) {
      let low = 0;
      let high = distribution.cdf.length - 1;
      while (low < high) {
        const middle = (low + high) >> 1;
        if (distribution.cdf[middle] < value) low = middle + 1;
        else high = middle;
      }
      return distribution.xs[low];
    }

    function buildDistribution(dimension, radius) {
      const count = 3000;
      const xs = new Float64Array(count);
      const logWeights = new Float64Array(count);
      let maximumLogWeight = -Infinity;
      for (let index = 0; index < count; index += 1) {
        const x = profile.a + (index + 0.5) * (profile.b - profile.a) / count;
        const profileValue = Math.max(1e-12, profile.value(x));
        const derivative = profile.derivative(x);
        const logWeight = (dimension - 1) * Math.log(profileValue) + 0.5 * Math.log1p(derivative * derivative);
        xs[index] = x;
        logWeights[index] = logWeight;
        if (logWeight > maximumLogWeight) maximumLogWeight = logWeight;
      }

      const weights = new Float64Array(count);
      const cdf = new Float64Array(count);
      let total = 0;
      for (let index = 0; index < count; index += 1) {
        const weight = Math.exp(logWeights[index] - maximumLogWeight);
        weights[index] = weight;
        total += weight;
        cdf[index] = total;
      }
      for (let index = 0; index < count; index += 1) cdf[index] /= total;

      const medianX = sampleX({ xs, cdf }, 0.5);
      const medianArc = arcAtCoordinate(medianX);
      const leftBoundaryX = coordinateAtArc(medianArc + radius);
      const rightBoundaryX = coordinateAtArc(medianArc - radius);
      let outsideLeftMass = 0;
      let outsideRightMass = 0;
      for (let index = 0; index < count; index += 1) {
        if (xs[index] > leftBoundaryX) outsideLeftMass += weights[index];
        if (xs[index] < rightBoundaryX) outsideRightMass += weights[index];
      }
      return {
        xs,
        cdf,
        medianX,
        leftBoundaryX,
        rightBoundaryX,
        outsideLeftMass: outsideLeftMass / total,
        outsideRightMass: outsideRightMass / total,
      };
    }

    function regionForX(x, distribution, side) {
      if (side === "left") {
        if (x <= distribution.medianX) return "A";
        if (x <= distribution.leftBoundaryX) return "shell";
        return "outside";
      }
      if (x >= distribution.medianX) return "A";
      if (x >= distribution.rightBoundaryX) return "shell";
      return "outside";
    }

    function colorForRegion(region, alpha) {
      if (region === "A") return `rgba(37, 106, 138, ${alpha})`;
      if (region === "shell") return `rgba(212, 154, 56, ${alpha})`;
      return `rgba(203, 68, 59, ${alpha})`;
    }

    function formatMass(value) {
      if (value >= 0.001) return value.toFixed(3);
      if (value < 1e-6) return "< 10⁻⁶";
      return value.toExponential(1);
    }

    function drawSurface(view, distribution, dimension) {
      const resized = resizeCanvas(view.canvas);
      if (!resized) return;
      const { context, width, height } = resized;
      const centerX = width * 0.50;
      const centerY = height * 0.54;
      const scale = 0.82 * Math.min(width / ((profile.b - profile.a) + 1.85), height / 2.45);
      const axialStretch = 2.1;
      const camera = 5.5;

      function rotatePoint(point) {
        const centeredX = (point.x - profile.midpoint) * axialStretch;
        const cosineYaw = Math.cos(view.yaw);
        const sineYaw = Math.sin(view.yaw);
        const xYaw = cosineYaw * centeredX + sineYaw * point.z;
        const zYaw = -sineYaw * centeredX + cosineYaw * point.z;
        const cosinePitch = Math.cos(view.pitch);
        const sinePitch = Math.sin(view.pitch);
        const yPitch = cosinePitch * point.y - sinePitch * zYaw;
        const zPitch = sinePitch * point.y + cosinePitch * zYaw;
        return { x: xYaw, y: yPitch, z: zPitch };
      }

      function project(point) {
        const rotated = rotatePoint(point);
        const perspective = camera / (camera - rotated.z);
        return {
          x: centerX + scale * perspective * rotated.x,
          y: centerY - scale * perspective * rotated.y,
          depth: rotated.z,
        };
      }

      function surfacePoint(x, theta) {
        const profileRadius = profile.value(x);
        return { x, y: profileRadius * Math.cos(theta), z: profileRadius * Math.sin(theta) };
      }

      const xCount = 48;
      const thetaCount = 42;
      const quads = [];
      for (let xIndex = 0; xIndex < xCount; xIndex += 1) {
        const x0 = profile.a + (profile.b - profile.a) * xIndex / xCount;
        const x1 = profile.a + (profile.b - profile.a) * (xIndex + 1) / xCount;
        for (let thetaIndex = 0; thetaIndex < thetaCount; thetaIndex += 1) {
          const theta0 = 2 * Math.PI * thetaIndex / thetaCount;
          const theta1 = 2 * Math.PI * (thetaIndex + 1) / thetaCount;
          const projected = [
            surfacePoint(x0, theta0),
            surfacePoint(x1, theta0),
            surfacePoint(x1, theta1),
            surfacePoint(x0, theta1),
          ].map(project);
          quads.push({
            projected,
            depth: projected.reduce((sum, point) => sum + point.depth, 0) / projected.length,
          });
        }
      }
      quads.sort((first, second) => first.depth - second.depth);
      quads.forEach(({ projected, depth }) => {
        const alpha = Math.max(0.05, Math.min(0.125, 0.082 + depth * 0.017));
        context.beginPath();
        context.moveTo(projected[0].x, projected[0].y);
        for (let index = 1; index < projected.length; index += 1) context.lineTo(projected[index].x, projected[index].y);
        context.closePath();
        context.fillStyle = `rgba(96, 113, 120, ${alpha})`;
        context.fill();
      });

      const random = createRandom(18313 + dimension * 6991);
      const sampleCount = Math.round(Math.max(760, Math.min(1280, width * 1.5)));
      const points = [];
      for (let index = 0; index < sampleCount; index += 1) {
        const x = sampleX(distribution, random());
        const theta = 2 * Math.PI * random();
        const projected = project(surfacePoint(x, theta));
        points.push({ ...projected, region: regionForX(x, distribution, view.side) });
      }
      points.sort((first, second) => first.depth - second.depth);
      points.forEach((point) => {
        const alpha = Math.max(0.46, Math.min(0.88, 0.63 + point.depth * 0.10));
        context.fillStyle = colorForRegion(point.region, alpha);
        context.beginPath();
        context.arc(point.x, point.y, point.region === "outside" ? 2.15 : 1.9, 0, 2 * Math.PI);
        context.fill();
      });

      const maxima = [
        { x: -1, label: "x₁  p₁ = 2", color: "#60717a", labelLift: 18 },
        { x: 0, label: "x₂  p₂ = 2", color: "#102b3a", labelLift: 16 },
        { x: 1, label: "x₃  p₃ = 4", color: "#d49a38", labelLift: 0 },
      ];
      context.font = `700 ${Math.max(15, Math.min(19, width * 0.025))}px "Cambria Math", serif`;
      context.textAlign = "center";
      context.textBaseline = "bottom";
      maxima.forEach((maximum) => {
        const location = project(surfacePoint(maximum.x, 0));
        const textWidth = context.measureText(maximum.label).width;
        context.fillStyle = "rgba(245, 242, 235, 0.90)";
        context.fillRect(location.x - textWidth / 2 - 4, location.y - 25 - maximum.labelLift, textWidth + 8, 20);
        context.fillStyle = maximum.color;
        context.fillText(maximum.label, location.x, location.y - 7 - maximum.labelLift);
      });

      context.fillStyle = "#60717a";
      context.font = `700 ${Math.max(10, Math.min(12, width * 0.016))}px "Segoe UI", sans-serif`;
      context.textAlign = "right";
      context.textBaseline = "top";
      context.fillText("DRAG TO ROTATE", width - 8, 7);
      const projectionFontSize = Math.max(14, Math.min(17, width * 0.022));
      drawSigmaProjectionLabel(context, 8, height - 5, "2", projectionFontSize, "#60717a");
    }

    function render() {
      scheduledFrame = 0;
      const exponent = Number(dimensionSlider.value);
      const dimension = Math.max(3, Math.min(2 ** 52, Math.round(2 ** exponent)));
      const minimumRadius = Number(radiusSlider.min);
      const maximumRadius = Number(radiusSlider.max);
      const radius = Math.max(minimumRadius, Math.min(maximumRadius, Number(radiusSlider.value)));
      const distribution = buildDistribution(dimension, radius);

      dimensionValue.textContent = `n = ${dimension >= 1e7 ? dimension.toExponential(2) : dimension}`;
      radiusValue.textContent = `r = ${radius.toFixed(2)}`;
      const outsideMass = views[0].side === "left" ? distribution.outsideLeftMass : distribution.outsideRightMass;
      outsideOutput.textContent = formatMass(outsideMass);
      outsideOutput.setAttribute("aria-label", `${views[0].side} half-set outside mass equals ${outsideMass}`);

      const dimensionProgress = 100 * (exponent - minimumExponent) / (maximumExponent - minimumExponent);
      const radiusProgress = 100 * (radius - minimumRadius) / (maximumRadius - minimumRadius);
      dimensionSlider.style.setProperty("--progress", `${Math.max(0, Math.min(100, dimensionProgress)).toFixed(2)}%`);
      radiusSlider.style.setProperty("--progress", `${Math.max(0, Math.min(100, radiusProgress)).toFixed(2)}%`);
      dimensionSlider.setAttribute("aria-valuetext", `dimension n equals ${dimension} on a logarithmic scale`);
      radiusSlider.setAttribute("aria-valuetext", `meridian radius r equals ${radius.toFixed(2)}`);

      views.forEach((view) => drawSurface(view, distribution, dimension));
    }

    function scheduleRender() {
      if (scheduledFrame) return;
      scheduledFrame = window.requestAnimationFrame(render);
    }

    views.forEach((view) => {
      view.canvas.addEventListener("pointerdown", (event) => {
        view.dragging = true;
        view.pointerX = event.clientX;
        view.pointerY = event.clientY;
        view.canvas.setPointerCapture(event.pointerId);
      });
      view.canvas.addEventListener("pointermove", (event) => {
        if (!view.dragging) return;
        const deltaX = event.clientX - view.pointerX;
        const deltaY = event.clientY - view.pointerY;
        view.pointerX = event.clientX;
        view.pointerY = event.clientY;
        view.yaw += deltaX * 0.008;
        view.pitch = Math.max(-1.05, Math.min(1.05, view.pitch + deltaY * 0.008));
        scheduleRender();
      });
      view.canvas.addEventListener("pointerup", (event) => {
        view.dragging = false;
        if (view.canvas.hasPointerCapture(event.pointerId)) view.canvas.releasePointerCapture(event.pointerId);
      });
      view.canvas.addEventListener("pointercancel", () => {
        view.dragging = false;
      });
    });

    dimensionSlider.addEventListener("input", scheduleRender);
    radiusSlider.addEventListener("input", scheduleRender);
    leftSetButton.addEventListener("click", () => {
      views[0].side = "left";
      leftSetButton.classList.add("is-active");
      rightSetButton.classList.remove("is-active");
      leftSetButton.setAttribute("aria-pressed", "true");
      rightSetButton.setAttribute("aria-pressed", "false");
      scheduleRender();
    });
    rightSetButton.addEventListener("click", () => {
      views[0].side = "right";
      rightSetButton.classList.add("is-active");
      leftSetButton.classList.remove("is-active");
      rightSetButton.setAttribute("aria-pressed", "true");
      leftSetButton.setAttribute("aria-pressed", "false");
      scheduleRender();
    });
    window.addEventListener("resize", scheduleRender);
    window.addEventListener("slidechange", (event) => {
      if (event.detail.index === 10) scheduleRender();
    });
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(scheduleRender);
      views.forEach((view) => observer.observe(view.canvas));
    }

    scheduleRender();
  }

  function initializeEqualDominantMaximaSlide() {
    const dimensionSlider = document.querySelector("#equalDimensionSlider");
    const dimensionValue = document.querySelector("#equalDimensionValue");
    const radiusSlider = document.querySelector("#equalRadiusSlider");
    const radiusValue = document.querySelector("#equalRadiusValue");
    const canvas = document.querySelector("#equalDominantSurfaceCanvas");
    const outsideOutput = document.querySelector("#equalOutsideMass");
    const leftSetButton = document.querySelector("#equalHalfSetLeft");
    const rightSetButton = document.querySelector("#equalHalfSetRight");
    if (!dimensionSlider || !dimensionValue || !radiusSlider || !radiusValue || !canvas || !outsideOutput || !leftSetButton || !rightSetButton) return;

    const minimumExponent = Math.log2(3);
    const maximumExponent = 52;
    const profile = {
      a: -1.5,
      b: 1.5,
      value(x) {
        return Math.max(1e-8, 1 - (1 / 3) * (x * x - 1) ** 4);
      },
      derivative(x) {
        return -(8 / 3) * x * (x * x - 1) ** 3;
      },
    };
    profile.midpoint = 0;
    const views = [
      { canvas, output: outsideOutput, side: "left", yaw: -0.25, pitch: 0.28, dragging: false, pointerX: 0, pointerY: 0 },
    ];
    let scheduledFrame = 0;

    function createRandom(seed) {
      let state = seed >>> 0;
      return () => {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 4294967296;
      };
    }

    function resizeCanvas(canvas) {
      const rectangle = canvas.getBoundingClientRect();
      if (rectangle.width < 2 || rectangle.height < 2) return null;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(rectangle.width);
      const height = Math.round(rectangle.height);
      const pixelWidth = Math.max(1, Math.round(width * ratio));
      const pixelHeight = Math.max(1, Math.round(height * ratio));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      const context = canvas.getContext("2d");
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      return { context, width, height };
    }

    function buildArcTable() {
      const count = 4200;
      const xs = new Float64Array(count + 1);
      const distances = new Float64Array(count + 1);
      const step = (profile.b - profile.a) / count;
      let distance = 0;
      xs[0] = profile.a;
      for (let index = 1; index <= count; index += 1) {
        const midpoint = profile.a + (index - 0.5) * step;
        const derivative = profile.derivative(midpoint);
        distance += Math.sqrt(1 + derivative * derivative) * step;
        xs[index] = profile.a + index * step;
        distances[index] = distance;
      }
      return { xs, distances, step };
    }

    const arcTable = buildArcTable();

    function arcAtCoordinate(x) {
      if (x <= profile.a) return 0;
      if (x >= profile.b) return arcTable.distances[arcTable.distances.length - 1];
      const rawIndex = (x - profile.a) / arcTable.step;
      const low = Math.floor(rawIndex);
      const high = Math.min(low + 1, arcTable.xs.length - 1);
      const fraction = rawIndex - low;
      return arcTable.distances[low] + fraction * (arcTable.distances[high] - arcTable.distances[low]);
    }

    function coordinateAtArc(distance) {
      if (distance <= 0) return profile.a;
      const maximumDistance = arcTable.distances[arcTable.distances.length - 1];
      if (distance >= maximumDistance) return profile.b;
      let low = 0;
      let high = arcTable.distances.length - 1;
      while (low + 1 < high) {
        const middle = (low + high) >> 1;
        if (arcTable.distances[middle] < distance) low = middle;
        else high = middle;
      }
      const span = arcTable.distances[high] - arcTable.distances[low];
      const fraction = span > 0 ? (distance - arcTable.distances[low]) / span : 0;
      return arcTable.xs[low] + fraction * (arcTable.xs[high] - arcTable.xs[low]);
    }

    function sampleX(distribution, value) {
      let low = 0;
      let high = distribution.cdf.length - 1;
      while (low < high) {
        const middle = (low + high) >> 1;
        if (distribution.cdf[middle] < value) low = middle + 1;
        else high = middle;
      }
      return distribution.xs[low];
    }

    function buildDistribution(dimension, radius) {
      const count = 2400;
      const xs = new Float64Array(count);
      const logWeights = new Float64Array(count);
      let maximumLogWeight = -Infinity;
      for (let index = 0; index < count; index += 1) {
        const x = profile.a + (index + 0.5) * (profile.b - profile.a) / count;
        const profileValue = Math.max(1e-12, profile.value(x));
        const derivative = profile.derivative(x);
        const logWeight = (dimension - 1) * Math.log(profileValue) + 0.5 * Math.log1p(derivative * derivative);
        xs[index] = x;
        logWeights[index] = logWeight;
        if (logWeight > maximumLogWeight) maximumLogWeight = logWeight;
      }

      const weights = new Float64Array(count);
      const cdf = new Float64Array(count);
      let total = 0;
      for (let index = 0; index < count; index += 1) {
        const weight = Math.exp(logWeights[index] - maximumLogWeight);
        weights[index] = weight;
        total += weight;
        cdf[index] = total;
      }
      for (let index = 0; index < count; index += 1) cdf[index] /= total;

      const medianX = 0;
      const medianArc = arcAtCoordinate(0);
      const leftBoundaryX = coordinateAtArc(medianArc + radius);
      const rightBoundaryX = coordinateAtArc(medianArc - radius);
      let outsideLeftMass = 0;
      let outsideRightMass = 0;
      for (let index = 0; index < count; index += 1) {
        if (xs[index] > leftBoundaryX) outsideLeftMass += weights[index];
        if (xs[index] < rightBoundaryX) outsideRightMass += weights[index];
      }
      return {
        xs,
        cdf,
        medianX,
        leftBoundaryX,
        rightBoundaryX,
        outsideLeftMass: outsideLeftMass / total,
        outsideRightMass: outsideRightMass / total,
      };
    }

    function regionForX(x, distribution, side) {
      if (side === "left") {
        if (x <= distribution.medianX) return "A";
        if (x <= distribution.leftBoundaryX) return "shell";
        return "outside";
      }
      if (x >= distribution.medianX) return "A";
      if (x >= distribution.rightBoundaryX) return "shell";
      return "outside";
    }

    function colorForRegion(region, alpha) {
      if (region === "A") return `rgba(37, 106, 138, ${alpha})`;
      if (region === "shell") return `rgba(212, 154, 56, ${alpha})`;
      return `rgba(203, 68, 59, ${alpha})`;
    }

    function drawSurface(view, distribution, dimension) {
      const resized = resizeCanvas(view.canvas);
      if (!resized) return;
      const { context, width, height } = resized;
      const centerX = width * 0.50;
      const centerY = height * 0.54;
      const scale = Math.min(width / ((profile.b - profile.a) + 1.85), height / 2.45);
      const camera = 5.5;

      function rotatePoint(point) {
        const cosineYaw = Math.cos(view.yaw);
        const sineYaw = Math.sin(view.yaw);
        const xYaw = cosineYaw * point.x + sineYaw * point.z;
        const zYaw = -sineYaw * point.x + cosineYaw * point.z;
        const cosinePitch = Math.cos(view.pitch);
        const sinePitch = Math.sin(view.pitch);
        const yPitch = cosinePitch * point.y - sinePitch * zYaw;
        const zPitch = sinePitch * point.y + cosinePitch * zYaw;
        return { x: xYaw, y: yPitch, z: zPitch };
      }

      function project(point) {
        const rotated = rotatePoint(point);
        const perspective = camera / (camera - rotated.z);
        return {
          x: centerX + scale * perspective * rotated.x,
          y: centerY - scale * perspective * rotated.y,
          depth: rotated.z,
        };
      }

      function surfacePoint(x, theta) {
        const profileRadius = profile.value(x);
        return { x, y: profileRadius * Math.cos(theta), z: profileRadius * Math.sin(theta) };
      }

      const xCount = 42;
      const thetaCount = 42;
      const quads = [];
      for (let xIndex = 0; xIndex < xCount; xIndex += 1) {
        const x0 = profile.a + (profile.b - profile.a) * xIndex / xCount;
        const x1 = profile.a + (profile.b - profile.a) * (xIndex + 1) / xCount;
        for (let thetaIndex = 0; thetaIndex < thetaCount; thetaIndex += 1) {
          const theta0 = 2 * Math.PI * thetaIndex / thetaCount;
          const theta1 = 2 * Math.PI * (thetaIndex + 1) / thetaCount;
          const projected = [
            surfacePoint(x0, theta0),
            surfacePoint(x1, theta0),
            surfacePoint(x1, theta1),
            surfacePoint(x0, theta1),
          ].map(project);
          quads.push({
            projected,
            depth: projected.reduce((sum, point) => sum + point.depth, 0) / projected.length,
          });
        }
      }
      quads.sort((first, second) => first.depth - second.depth);
      quads.forEach(({ projected, depth }) => {
        const alpha = Math.max(0.05, Math.min(0.125, 0.082 + depth * 0.017));
        context.beginPath();
        context.moveTo(projected[0].x, projected[0].y);
        for (let index = 1; index < projected.length; index += 1) context.lineTo(projected[index].x, projected[index].y);
        context.closePath();
        context.fillStyle = `rgba(96, 113, 120, ${alpha})`;
        context.fill();
      });

      const random = createRandom(12317 + dimension * 6553);
      const sampleCount = Math.round(Math.max(700, Math.min(1200, width * 1.45)));
      const points = [];
      for (let index = 0; index < sampleCount; index += 1) {
        const x = sampleX(distribution, random());
        const theta = 2 * Math.PI * random();
        const projected = project(surfacePoint(x, theta));
        points.push({ ...projected, region: regionForX(x, distribution, view.side) });
      }
      points.sort((first, second) => first.depth - second.depth);
      points.forEach((point) => {
        const alpha = Math.max(0.46, Math.min(0.88, 0.63 + point.depth * 0.10));
        context.fillStyle = colorForRegion(point.region, alpha);
        context.beginPath();
        context.arc(point.x, point.y, point.region === "outside" ? 2.15 : 1.9, 0, 2 * Math.PI);
        context.fill();
      });

      const maxima = [
        { x: -1, label: "x₁  p₁ = 4", color: "#256a8a" },
        { x: 1, label: "x₂  p₂ = 4", color: "#cb443b" },
      ];
      context.font = `700 ${Math.max(15, Math.min(19, width * 0.026))}px "Cambria Math", serif`;
      context.textAlign = "center";
      context.textBaseline = "bottom";
      maxima.forEach((maximum) => {
        const location = project(surfacePoint(maximum.x, 0));
        const textWidth = context.measureText(maximum.label).width;
        context.fillStyle = "rgba(245, 242, 235, 0.88)";
        context.fillRect(location.x - textWidth / 2 - 4, location.y - 25, textWidth + 8, 20);
        context.fillStyle = maximum.color;
        context.fillText(maximum.label, location.x, location.y - 7);
      });

      context.fillStyle = "#60717a";
      context.font = `700 ${Math.max(10, Math.min(12, width * 0.016))}px "Segoe UI", sans-serif`;
      context.textAlign = "right";
      context.textBaseline = "top";
      context.fillText("DRAG TO ROTATE", width - 8, 7);
      const projectionFontSize = Math.max(14, Math.min(17, width * 0.022));
      drawSigmaProjectionLabel(context, 8, height - 5, "2", projectionFontSize, "#60717a");
    }

    function render() {
      scheduledFrame = 0;
      const exponent = Number(dimensionSlider.value);
      const dimension = Math.max(3, Math.min(2 ** 52, Math.round(2 ** exponent)));
      const minimumRadius = Number(radiusSlider.min);
      const maximumRadius = Number(radiusSlider.max);
      const radius = Math.max(minimumRadius, Math.min(maximumRadius, Number(radiusSlider.value)));
      const distribution = buildDistribution(dimension, radius);

      dimensionValue.textContent = `n = ${dimension >= 1e7 ? dimension.toExponential(2) : dimension}`;
      radiusValue.textContent = `r = ${radius.toFixed(2)}`;
      const outsideMass = views[0].side === "left" ? distribution.outsideLeftMass : distribution.outsideRightMass;
      outsideOutput.textContent = outsideMass.toFixed(3);
      outsideOutput.setAttribute("aria-label", `${views[0].side} half-set outside mass equals ${outsideMass}`);

      const dimensionProgress = 100 * (exponent - minimumExponent) / (maximumExponent - minimumExponent);
      const radiusProgress = 100 * (radius - minimumRadius) / (maximumRadius - minimumRadius);
      dimensionSlider.style.setProperty("--progress", `${Math.max(0, Math.min(100, dimensionProgress)).toFixed(2)}%`);
      radiusSlider.style.setProperty("--progress", `${Math.max(0, Math.min(100, radiusProgress)).toFixed(2)}%`);
      dimensionSlider.setAttribute("aria-valuetext", `dimension n equals ${dimension} on a logarithmic scale`);
      radiusSlider.setAttribute("aria-valuetext", `meridian radius r equals ${radius.toFixed(2)}`);

      views.forEach((view) => drawSurface(view, distribution, dimension));
    }

    function scheduleRender() {
      if (scheduledFrame) return;
      scheduledFrame = window.requestAnimationFrame(render);
    }

    views.forEach((view) => {
      view.canvas.addEventListener("pointerdown", (event) => {
        view.dragging = true;
        view.pointerX = event.clientX;
        view.pointerY = event.clientY;
        view.canvas.setPointerCapture(event.pointerId);
      });
      view.canvas.addEventListener("pointermove", (event) => {
        if (!view.dragging) return;
        const deltaX = event.clientX - view.pointerX;
        const deltaY = event.clientY - view.pointerY;
        view.pointerX = event.clientX;
        view.pointerY = event.clientY;
        view.yaw += deltaX * 0.008;
        view.pitch = Math.max(-1.05, Math.min(1.05, view.pitch + deltaY * 0.008));
        scheduleRender();
      });
      view.canvas.addEventListener("pointerup", (event) => {
        view.dragging = false;
        if (view.canvas.hasPointerCapture(event.pointerId)) view.canvas.releasePointerCapture(event.pointerId);
      });
      view.canvas.addEventListener("pointercancel", () => {
        view.dragging = false;
      });
    });

    dimensionSlider.addEventListener("input", scheduleRender);
    radiusSlider.addEventListener("input", scheduleRender);
    leftSetButton.addEventListener("click", () => {
      views[0].side = "left";
      leftSetButton.classList.add("is-active");
      rightSetButton.classList.remove("is-active");
      leftSetButton.setAttribute("aria-pressed", "true");
      rightSetButton.setAttribute("aria-pressed", "false");
      scheduleRender();
    });
    rightSetButton.addEventListener("click", () => {
      views[0].side = "right";
      rightSetButton.classList.add("is-active");
      leftSetButton.classList.remove("is-active");
      rightSetButton.setAttribute("aria-pressed", "true");
      leftSetButton.setAttribute("aria-pressed", "false");
      scheduleRender();
    });
    window.addEventListener("resize", scheduleRender);
    window.addEventListener("slidechange", (event) => {
      if (event.detail.index === 11) scheduleRender();
    });
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(scheduleRender);
      views.forEach((view) => observer.observe(view.canvas));
    }

    scheduleRender();
  }

  initializeSphereSlide();
  initializeSphereFamilySlide();
  initializeProductFamilySlide();
  initializeRevolutionSettingSlide();
  initializeUniqueMaximumSlide();
  initializeDominantMaximaSlide();
  initializeFractionalDominantMaximaSlide();
  initializeEqualDominantMaximaSlide();
  showSlide(current);
})();
