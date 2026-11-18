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
const removeImage = document.querySelector("#remove-image");
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
let previewUrl;

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
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  previewImage.src = previewUrl;
  readyFile.textContent = file.name;
  uploadContent.hidden = true;
  imagePreview.hidden = false;
  resultEmpty.hidden = true;
  resultReady.hidden = false;
}

function clearImage() {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = undefined;
  previewImage.removeAttribute("src");
  imageInput.value = "";
  uploadContent.hidden = false;
  imagePreview.hidden = true;
  resultReady.hidden = true;
  resultEmpty.hidden = false;
  uploadFeedback.textContent = "";
}