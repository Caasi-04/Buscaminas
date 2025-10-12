// Inicializa EmailJS
emailjs.init("WSInyP-MO7AG5m4od"); // Tu Public Key

const feedbackBtn = document.getElementById("feedback-button");
const feedbackModal = document.getElementById("feedback-modal");
const cancelFeedback = document.getElementById("cancelFeedback");

feedbackBtn.onclick = async () => {
    const platformInput = document.getElementById("platform");
    const browserInput = document.getElementById("browser");
    const countryInput = document.getElementById("country");

    const detectedPlatform = getFriendlyPlatform();
    const detectedBrowser = getFriendlyBrowser();
    const detectedCountry = await getCountry();

    platformInput.value = detectedPlatform.name + (detectedPlatform.version ? ` ${detectedPlatform.version}` : "");
    platformInput.readOnly = detectedPlatform.name !== "Desconocido";

    browserInput.value = detectedBrowser.name + (detectedBrowser.version ? ` ${detectedBrowser.version}` : "");
    browserInput.readOnly = detectedBrowser.name !== "Desconocido";

    countryInput.value = detectedCountry;

    feedbackModal.style.display = "flex";
};


cancelFeedback.onclick = () => feedbackModal.style.display = "none";

// Detecta sistema operativo con versión (PC y móviles)
function getFriendlyPlatform() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;

    if (/windows phone/i.test(ua)) return {name: "Windows Phone", version: ""};
    if (/windows nt 10.0|windows nt 11.0/i.test(ua)) return {name: "Windows", version: ""};
    if (/android\s([0-9\.]+)/i.test(ua)) return {name: "Android", version: ua.match(/android\s([0-9\.]+)/i)[1]};
    if (/iPad|iPhone|iPod/.test(ua)) {
        const iosVersion = ua.match(/OS (\d+_\d+(_\d+)?)/i);
        return {name: "iOS", version: iosVersion ? iosVersion[1].replace(/_/g, ".") : ""};
    }
    if (/macintosh|mac os x (\d+[_\.]\d+[_\.]?\d*)/i.test(ua)) {
        const macVersion = ua.match(/mac os x (\d+[_\.]\d+[_\.]?\d*)/i)[1].replace(/_/g, ".");
        return {name: "macOS", version: macVersion};
    }
    if (/linux/i.test(ua)) return {name: "Linux", version: ""};
    return {name: "Desconocido", version: ""};
}

// Detecta navegador con versión (incluye móviles y Brave)
function getFriendlyBrowser() {
    const ua = navigator.userAgent;

    // Brave
    if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
        const version = ua.match(/Chrome\/([\d\.]+)/);
        return {name: "Brave", version: version ? version[1] : ""};
    }

    // Edge (Chromium)
    if (/Edg\/([\d\.]+)/.test(ua)) {
        return {name: "Edge", version: ua.match(/Edg\/([\d\.]+)/)[1]};
    }

    // Opera
    if (/OPR\/([\d\.]+)/.test(ua)) {
        return {name: "Opera", version: ua.match(/OPR\/([\d\.]+)/)[1]};
    }

    // Firefox
    if (/Firefox\/([\d\.]+)/.test(ua)) {
        return {name: "Firefox", version: ua.match(/Firefox\/([\d\.]+)/)[1]};
    }

    // Chrome
    if (/Chrome\/([\d\.]+)/.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua)) {
        const version = ua.match(/Chrome\/([\d\.]+)/)[1];
        if (/Android/.test(ua)) return {name: "Chrome Mobile", version};
        return {name: "Chrome", version};
    }

    // Safari
    if (/Safari\/([\d\.]+)/.test(ua) && !/Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua)) {
        const version = ua.match(/Version\/([\d\.]+)/);
        if (/iPad|iPhone|iPod/.test(ua)) return {name: "Safari Mobile", version: version ? version[1] : ""};
        return {name: "Safari", version: version ? version[1] : ""};
    }

    return {name: "Desconocido", version: ""};
}

document.getElementById("feedbackForm").addEventListener("submit", async function(e){
    e.preventDefault();

    const platformInput = document.getElementById("platform");
    const browserInput = document.getElementById("browser");
    const country = await getCountry(); // <-- obtenemos el país

    const templateParams = {
        from_email: "BuscaminasCaasi04@gmail.com",
        platform: platformInput.value,
        browser: browserInput.value,
        country: country,                 // <-- agregamos aquí
        message: document.getElementById("message").value
    };

    emailjs.send("service_39b6vhr", "template_2ymcxoi", templateParams)
        .then(() => {
            alert("✅ Feedback enviado con éxito. ¡Gracias!");
            feedbackModal.style.display = "none";
            e.target.reset();
            platformInput.readOnly = false;
            browserInput.readOnly = false;
        })
        .catch((err) => {
            alert("❌ Error al enviar: " + JSON.stringify(err));
        });
});



async function getCountry() {
  try {
    const res = await fetch('https://ipwho.is/');
    const data = await res.json();
    return data.country || "Desconocido";
  } catch (err) {
    return "Desconocido";
  }
}
