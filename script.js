const viewer = document.querySelector("#camera-viewer");
const panelKicker = document.querySelector("#panel-kicker");
const panelTitle = document.querySelector("#panel-title");
const panelDescription = document.querySelector("#panel-description");
const panelDetail1 = document.querySelector("#panel-detail-1");
const panelDetail2 = document.querySelector("#panel-detail-2");
const resetButton = document.querySelector("#reset-view");
const zoomInButton = document.querySelector("#zoom-in");
const zoomOutButton = document.querySelector("#zoom-out");
const enterArButton = document.querySelector("#enter-ar");
const ua = navigator.userAgent || "";
const isIPhoneSafari =
  /iPhone|iPad|iPod/i.test(ua) &&
  /Safari/i.test(ua) &&
  !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);

const hotspots = [...document.querySelectorAll("[data-hotspot]")];
const poiCards = [...document.querySelectorAll("[data-poi-trigger]")];

const defaultView = {
  orbit: "35deg 72deg 140%",
  target: "0m 0.06m 0m",
  fov: "28deg",
};

const poiContent = {
  obbiettivo: {
    kicker: "Punto selezionato",
    title: "Obbiettivo",
    description:
      "L'obbiettivo e' la parte che convoglia la luce verso il sensore. Da qui dipendono nitidezza, profondita' di campo e resa generale dello scatto.",
    detail1: "Luce, fuoco, inquadratura",
    detail2: "Vista frontale guidata",
    orbit: "0deg 88deg 72%",
    target: "0.0019m 0.1044m 0.0637m",
    fov: "19deg",
  },
  schermo: {
    kicker: "Punto selezionato",
    title: "Schermo",
    description:
      "Lo schermo posteriore permette di controllare inquadratura, menu e anteprima delle immagini. E' il riferimento rapido per leggere e verificare lo scatto.",
    detail1: "Controllo visivo e menu",
    detail2: "Vista sul retro della camera",
    orbit: "180deg 82deg 82%",
    target: "0.0172m 0.0617m -0.1230m",
    fov: "20deg",
  },
  batteria: {
    kicker: "Punto selezionato",
    title: "Batteria",
    description:
      "La batteria alimenta corpo macchina, sensore e display. E' fondamentale per autonomia, continuita' di ripresa e gestione delle sessioni fotografiche.",
    detail1: "Energia e autonomia",
    detail2: "Vista laterale ravvicinata",
    orbit: "235deg 78deg 85%",
    target: "-0.1068m 0.0463m -0.1063m",
    fov: "20deg",
  },
};

function setActiveState(key) {
  hotspots.forEach((hotspot) => {
    hotspot.classList.toggle("is-active", hotspot.dataset.hotspot === key);
  });

  poiCards.forEach((card) => {
    card.classList.toggle("is-active", card.dataset.poiTrigger === key);
  });
}

function updatePanel(key) {
  const poi = poiContent[key];
  if (!poi) {
    return;
  }

  panelKicker.textContent = poi.kicker;
  panelTitle.textContent = poi.title;
  panelDescription.textContent = poi.description;
  panelDetail1.textContent = poi.detail1;
  panelDetail2.textContent = poi.detail2;
}

function focusPoi(key) {
  const poi = poiContent[key];
  if (!poi) {
    return;
  }

  setActiveState(key);
  updatePanel(key);
  viewer.cameraTarget = poi.target;
  viewer.cameraOrbit = poi.orbit;
  viewer.fieldOfView = poi.fov;
}

function adjustZoom(step) {
  const current = viewer.getCameraOrbit();
  const nextRadius = Math.min(Math.max(current.radius + step, 0.55), 2.6);
  viewer.cameraOrbit = `${current.theta.toString()} ${current.phi.toString()} ${nextRadius.toString()}m`;
}

hotspots.forEach((hotspot) => {
  hotspot.addEventListener("click", () => {
    focusPoi(hotspot.dataset.hotspot);
  });
});

poiCards.forEach((card) => {
  card.addEventListener("click", () => {
    focusPoi(card.dataset.poiTrigger);
  });
});

resetButton.addEventListener("click", () => {
  setActiveState("obbiettivo");
  viewer.cameraTarget = defaultView.target;
  viewer.cameraOrbit = defaultView.orbit;
  viewer.fieldOfView = defaultView.fov;
  updatePanel("obbiettivo");
});

zoomInButton.addEventListener("click", () => adjustZoom(-0.12));
zoomOutButton.addEventListener("click", () => adjustZoom(0.12));
enterArButton.addEventListener("click", () => {
  window.location.href = isIPhoneSafari ? "./ios-ar.html" : "./ar.html";
});

viewer.addEventListener("load", () => {
  viewer.cameraTarget = defaultView.target;
  viewer.cameraOrbit = defaultView.orbit;
  viewer.fieldOfView = defaultView.fov;
  focusPoi("obbiettivo");
});
