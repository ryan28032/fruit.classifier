const imageInput = document.querySelector("#image-input");
const browseButton = document.querySelector("#browse-button");
const dropZone = document.querySelector("#drop-zone");
const uploadContent = document.querySelector("#upload-content");
const imagePreview = document.querySelector("#image-preview");
const previewImage = document.querySelector("#preview-image");
const uploadFeedback = document.querySelector("#upload-feedback");
const resultEmpty = document.querySelector("#result-empty");
const resultReady = document.querySelector("#result-ready");
const readyFile = document.querySelector("#ready-file");
const resultTitle = document.querySelector("#result-title");
const resultMessage = document.querySelector("#result-message");
const predictionOutput = document.querySelector("#prediction-output");
const predictionLabel = document.querySelector("#prediction-label");
const confidenceValue = document.querySelector("#confidence-value");
const confidenceBar = document.querySelector("#confidence-bar");
const predictionNote = document.querySelector("#prediction-note");
const modelStatus = document.querySelector("#model-status");
const modelFooterStatus = document.querySelector("#model-footer-status");
const retryButton = document.querySelector("#retry-button");
const removeImage = document.querySelector("#remove-image");
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
let previewUrl;
let activeFile;
let classificationRequest = 0;
let modelPromise;

const fruitClasses = [
  ["custard apple", "Custard apple"],
  ["granny smith", "Apple"],
  ["apple", "Apple"],
  ["banana", "Banana"],
  ["orange", "Orange"],
  ["lemon", "Lemon"],
  ["lime", "Lime"],
  ["strawberry", "Strawberry"],
  ["pineapple", "Pineapple"],
  ["pomegranate", "Pomegranate"],
  ["jackfruit", "Jackfruit"],
  ["fig", "Fig"],
  ["pear", "Pear"],
  ["peach", "Peach"],
  ["grape", "Grape"],
  ["watermelon", "Watermelon"],
  ["cantaloupe", "Cantaloupe"],
  ["cherry", "Cherry"],
  ["plum", "Plum"],
  ["avocado", "Avocado"],
  ["mango", "Mango"],
  ["coconut", "Coconut"],
  ["papaya", "Papaya"],
  ["kiwi", "Kiwi"],
  ["raspberry", "Raspberry"],
  ["blueberry", "Blueberry"],
  ["blackberry", "Blackberry"],
  ["grapefruit", "Grapefruit"],
  ["tangerine", "Tangerine"],
  ["apricot", "Apricot"],
  ["olive", "Olive"]
];

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".classifier-card, .step-card, .project-copy, .project-note").forEach((element) => {
    element.classList.add("reveal-on-scroll");
    revealObserver.observe(element);
  });
}

browseButton.addEventListener("click", () => imageInput.click());
imageInput.addEventListener("change", () => {
  if (imageInput.files.length) showImage(imageInput.files[0]);
});
dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("drag-over");
});
dropZone.addEventListener("dragleave", (event) => {
  if (!dropZone.contains(event.relatedTarget)) dropZone.classList.remove("drag-over");
});
dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("drag-over");
  const [file] = event.dataTransfer.files;
  if (file) showImage(file);
});
removeImage.addEventListener("click", clearImage);
retryButton.addEventListener("click", () => {
  if (activeFile) void classifyImage(activeFile, classificationRequest);
});
menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});
mainNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  }
});

function showImage(file) {
  uploadFeedback.textContent = "";
  if (!file.type.startsWith("image/")) {
    uploadFeedback.textContent = "Please choose an image file.";
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    uploadFeedback.textContent = "That image is over 10 MB. Please choose a smaller one.";
    return;
  }
  activeFile = file;
  classificationRequest += 1;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  previewImage.src = previewUrl;
  readyFile.textContent = file.name;
  uploadContent.hidden = true;
  imagePreview.hidden = false;
  resultEmpty.hidden = true;
  resultReady.hidden = false;
  predictionOutput.hidden = true;
  retryButton.hidden = true;
  resultTitle.textContent = "Preparing your classifier…";
  resultMessage.textContent = "The first image downloads the model. Your photo stays on this device.";
  modelStatus.textContent = "PREPARING MODEL";
  modelFooterStatus.textContent = "LOADING";
  void classifyImage(file, classificationRequest);
}

function clearImage() {
  classificationRequest += 1;
  activeFile = undefined;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = undefined;
  previewImage.removeAttribute("src");
  imageInput.value = "";
  uploadContent.hidden = false;
  imagePreview.hidden = true;
  resultReady.hidden = true;
  predictionOutput.hidden = true;
  retryButton.hidden = true;
  resultEmpty.hidden = false;
  uploadFeedback.textContent = "";
  modelStatus.textContent = "MOBILENET · ON DEVICE";
  modelFooterStatus.textContent = "READY ON DEMAND";
}

async function classifyImage(file, requestId) {
  try {
    await previewImage.decode();
    if (requestId !== classificationRequest) return;

    modelStatus.textContent = "LOADING MOBILENET";
    modelFooterStatus.textContent = "DOWNLOADING";
    const model = await getModel();
    if (requestId !== classificationRequest) return;

    resultTitle.textContent = "Taking a closer look…";
    resultMessage.textContent = "MobileNet is checking the image for a familiar fruit.";
    modelStatus.textContent = "ANALYZING IMAGE";
    modelFooterStatus.textContent = "ANALYZING";
    const predictions = await model.classify(previewImage, 5);
    if (requestId !== classificationRequest) return;
    if (!predictions.length) throw new Error("The model returned no predictions.");

    const fruitPrediction = predictions.find((prediction) => getFruitName(prediction.className));
    const bestPrediction = fruitPrediction || predictions[0];
    const fruitName = fruitPrediction && getFruitName(fruitPrediction.className);
    const confidence = Math.round(bestPrediction.probability * 100);
    predictionLabel.textContent = fruitName || formatLabel(bestPrediction.className);
    confidenceValue.textContent = `${confidence}%`;
    confidenceBar.style.width = `${confidence}%`;
    const lowConfidence = confidence < 20;
    predictionNote.textContent = fruitName
      ? lowConfidence
        ? "Low confidence. Try a clear, close-up photo of one fruit."
        : "Best matching fruit from the model’s top predictions."
      : "No fruit appeared in the top guesses. This is the model’s closest match.";
    resultTitle.textContent = fruitName
      ? lowConfidence ? `Maybe ${fruitName}?` : `Looks like ${fruitName}!`
      : "No clear fruit match";
    resultMessage.textContent = fruitName
      ? lowConfidence
        ? "The model is unsure about this image."
        : "Here’s the model’s best match for your photo."
      : "Try a closer, well-lit photo of a single fruit.";
    predictionOutput.hidden = false;
    retryButton.hidden = true;
    modelStatus.textContent = "CLASSIFICATION COMPLETE";
    modelFooterStatus.textContent = "READY";
  } catch (error) {
    console.error("Fruit classification failed:", error);
    if (requestId !== classificationRequest) return;
    resultTitle.textContent = "Couldn’t classify this image";
    resultMessage.textContent = "Check your internet connection and try again. The model loads from a CDN on first use.";
    modelStatus.textContent = "CLASSIFICATION FAILED";
    modelFooterStatus.textContent = "CHECK CONNECTION";
    retryButton.hidden = false;
  }
}

function getModel() {
  if (!modelPromise) {
    modelPromise = loadMobileNet().catch((error) => {
      modelPromise = undefined;
      throw error;
    });
  }
  return modelPromise;
}

async function loadMobileNet() {
  if (!window.tf) {
    await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js");
  }
  if (!window.mobilenet) {
    await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1");
  }
  return window.mobilenet.load({ version: 2, alpha: 1.0 });
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.crossOrigin = "anonymous";
    script.onload = resolve;
    script.onerror = () => {
      script.remove();
      reject(new Error(`Could not load classifier library: ${src}`));
    };
    document.head.append(script);
  });
}

function getFruitName(label) {
  const normalizedLabel = label.toLowerCase();
  const match = fruitClasses.find(([className]) => normalizedLabel.includes(className));
  return match && match[1];
}

function formatLabel(label) {
  return label.replace(/,.*$/, "").replace(/\b\w/g, (letter) => letter.toUpperCase());
}