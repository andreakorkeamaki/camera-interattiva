const poiCards = [...document.querySelectorAll("[data-ios-poi]")];
const panelKicker = document.querySelector("#ios-kicker");
const panelTitle = document.querySelector("#ios-title");
const panelDescription = document.querySelector("#ios-description");
const panelTag1 = document.querySelector("#ios-tag-1");
const panelTag2 = document.querySelector("#ios-tag-2");

const poiContent = {
  obbiettivo: {
    kicker: "Punto selezionato",
    title: "Obbiettivo",
    description:
      "L'obbiettivo convoglia la luce verso il sensore e determina nitidezza, profondita' di campo e carattere dell'immagine.",
    tag1: "Luce e messa a fuoco",
    tag2: "Dettagli fuori dall'AR",
  },
  schermo: {
    kicker: "Punto selezionato",
    title: "Schermo",
    description:
      "Lo schermo posteriore serve per consultare menu, anteprima e controllo rapido dello scatto durante l'utilizzo.",
    tag1: "Display e lettura",
    tag2: "Supporto informativo su iPhone",
  },
  batteria: {
    kicker: "Punto selezionato",
    title: "Batteria",
    description:
      "La batteria alimenta il corpo macchina e determina l'autonomia durante foto, video e sessioni di utilizzo piu' lunghe.",
    tag1: "Energia e autonomia",
    tag2: "Supporto informativo su iPhone",
  },
};

function updatePanel(key) {
  const poi = poiContent[key];
  if (!poi) {
    return;
  }

  panelKicker.textContent = poi.kicker;
  panelTitle.textContent = poi.title;
  panelDescription.textContent = poi.description;
  panelTag1.textContent = poi.tag1;
  panelTag2.textContent = poi.tag2;

  poiCards.forEach((card) => {
    card.classList.toggle("is-active", card.dataset.iosPoi === key);
  });
}

poiCards.forEach((card) => {
  card.addEventListener("click", () => updatePanel(card.dataset.iosPoi));
});
