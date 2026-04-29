/**
 * Logic for the 3D Earth Model Viewer on the Connect page.
 */

document.addEventListener("DOMContentLoaded", () => {
    const modelViewer = document.querySelector("model-viewer");
    
    if (modelViewer) {
        // Optional: you can add specific events interactions here if needed
        modelViewer.addEventListener("load", () => {
            // Model loaded successfully
        });

        // E.g., slow down or speed up rotation depending on user scroll or interaction
        // modelViewer.autoRotateDelay = 0;
        // modelViewer.rotationPerSecond = "30deg";
    }
});
