import { ConnectStickyEngine } from './engines/ConnectStickyEngine.js';
import { ConnectHandshakeEngine } from './engines/ConnectHandshakeEngine.js';

function activateFallback() {
    document.documentElement.classList.add('connect-fallback');
}

document.addEventListener('DOMContentLoaded', () => {
    // Gate: GSAP must be available for animations to work
    if (typeof gsap === 'undefined') {
        activateFallback();
        return;
    }

    // Instantiate the experiment if the handshake logic is present
    const experimentSection = document.getElementById('connectExperiment');
    if (experimentSection) {
        try {
            new ConnectHandshakeEngine();
        } catch (e) {
            activateFallback();
        }
    } else {
        // Fallback to original
        const connectSection = document.querySelector('.connect-experience');
        if (connectSection) {
            try {
                new ConnectStickyEngine();
            } catch (e) {
                activateFallback();
            }
        }
    }
});
