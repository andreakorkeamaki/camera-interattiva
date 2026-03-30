import * as THREE from "three";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const overlayRoot = document.querySelector("#ar-overlay");
const introCard = document.querySelector("#intro-card");
const hintCard = document.querySelector("#hint-card");
const supportCard = document.querySelector("#support-card");
const infoCard = document.querySelector("#info-card");
const sessionPill = document.querySelector("#session-pill");
const statusText = document.querySelector("#status-text");
const supportText = document.querySelector("#support-text");
const infoKicker = document.querySelector("#info-kicker");
const infoTitle = document.querySelector("#info-title");
const infoDescription = document.querySelector("#info-description");
const infoTag1 = document.querySelector("#info-tag-1");
const infoTag2 = document.querySelector("#info-tag-2");
const arButtonHost = document.querySelector("#ar-button-host");

const poiContent = {
  obbiettivo: {
    kicker: "Punto selezionato",
    title: "Obbiettivo",
    description:
      "L'obbiettivo convoglia la luce verso il sensore e determina nitidezza, profondita' di campo e carattere dell'immagine.",
    detail1: "Luce e messa a fuoco",
    detail2: "Nodo frontale della camera",
    color: "#c4632d",
    offset: new THREE.Vector3(0.05, 0.06, 0.08),
  },
  schermo: {
    kicker: "Punto selezionato",
    title: "Schermo",
    description:
      "Lo schermo posteriore e' il punto da cui controlli menu, anteprima e lettura delle impostazioni durante l'uso.",
    detail1: "Display e verifica scatto",
    detail2: "Nodo posteriore della camera",
    color: "#3f83f8",
    offset: new THREE.Vector3(0.03, 0.06, -0.08),
  },
  batteria: {
    kicker: "Punto selezionato",
    title: "Batteria",
    description:
      "La batteria alimenta il corpo macchina e sostiene sessioni di foto e video. In AR la vedi con il suo indicatore dedicato.",
    detail1: "Energia e autonomia",
    detail2: "Nodo laterale della camera",
    color: "#3fa66b",
    offset: new THREE.Vector3(-0.08, 0.05, -0.04),
  },
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.8);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
dirLight.position.set(2, 3, 2);
scene.add(dirLight);

const reticle = new THREE.Mesh(
  new THREE.RingGeometry(0.08, 0.1, 40).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0xd06d34 })
);
reticle.matrixAutoUpdate = false;
reticle.visible = false;
scene.add(reticle);

const floorDot = new THREE.Mesh(
  new THREE.CircleGeometry(0.015, 24).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0xfff2dd })
);
floorDot.position.y = 0.002;
reticle.add(floorDot);

const modelRoot = new THREE.Group();
modelRoot.visible = false;
scene.add(modelRoot);

const selectables = [];
const raycaster = new THREE.Raycaster();
const tempMatrix = new THREE.Matrix4();
const cameraDirection = new THREE.Vector3();
const controller = renderer.xr.getController(0);
scene.add(controller);

let hitTestSource = null;
let hitTestSourceRequested = false;
let modelPlaced = false;

function updateStatus(message, sessionState = "AR pronta") {
  statusText.textContent = message;
  sessionPill.textContent = sessionState;
}

function showSupportMessage(message, sessionState = "Non supportato") {
  supportText.textContent = message;
  supportCard.classList.remove("is-hidden");
  hintCard.classList.add("is-hidden");
  updateStatus(message, sessionState);
}

function showInfo(key) {
  const poi = poiContent[key];
  if (!poi) {
    return;
  }

  infoKicker.textContent = poi.kicker;
  infoTitle.textContent = poi.title;
  infoDescription.textContent = poi.description;
  infoTag1.textContent = poi.detail1;
  infoTag2.textContent = poi.detail2;
  infoCard.classList.remove("is-hidden");
}

function buildLabelTexture(text, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(18, 15, 11, 0.88)";
  roundRect(ctx, 8, 8, canvas.width - 16, canvas.height - 16, 40);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  roundRect(ctx, 8, 8, canvas.width - 16, canvas.height - 16, 40);
  ctx.stroke();

  ctx.fillStyle = "#fffaf5";
  ctx.font = "700 56px Space Grotesk, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function createPoiMarker(node, key) {
  const poi = poiContent[key];
  const markerGroup = new THREE.Group();

  const anchor = new THREE.Mesh(
    new THREE.SphereGeometry(0.008, 24, 24),
    new THREE.MeshStandardMaterial({
      color: poi.color,
      emissive: poi.color,
      emissiveIntensity: 0.5,
      roughness: 0.25,
      metalness: 0.1,
    })
  );
  markerGroup.add(anchor);

  const lineMaterial = new THREE.LineBasicMaterial({ color: poi.color });
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    poi.offset.clone(),
  ]);
  const line = new THREE.Line(lineGeometry, lineMaterial);
  markerGroup.add(line);

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: buildLabelTexture(poi.title, poi.color),
      depthTest: false,
      depthWrite: false,
      transparent: true,
      sizeAttenuation: true,
    })
  );
  sprite.position.copy(poi.offset);
  sprite.scale.set(0.11, 0.042, 1);
  sprite.userData.poiKey = key;
  markerGroup.add(sprite);

  const hitArea = new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 12, 12),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  );
  hitArea.position.copy(poi.offset);
  hitArea.userData.poiKey = key;
  markerGroup.add(hitArea);

  node.add(markerGroup);
  selectables.push(sprite, hitArea, anchor);
}

function onSelect() {
  if (!modelPlaced && reticle.visible) {
    modelRoot.visible = true;
    modelRoot.position.setFromMatrixPosition(reticle.matrix);
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();
    modelRoot.rotation.set(0, Math.atan2(cameraDirection.x, cameraDirection.z) + Math.PI, 0);
    modelPlaced = true;
    hintCard.classList.remove("is-hidden");
    updateStatus("Fotocamera posizionata. Tocca i marker 3D per leggere le info.", "AR attiva");
    return;
  }

  if (!modelPlaced) {
    return;
  }

  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

  const intersects = raycaster.intersectObjects(selectables, false);
  const hit = intersects.find((entry) => entry.object.userData.poiKey);

  if (hit) {
    showInfo(hit.object.userData.poiKey);
  }
}

controller.addEventListener("select", onSelect);

const loader = new GLTFLoader();
loader.load(
  "./camera.glb",
  (gltf) => {
    const model = gltf.scene;
    model.rotation.x = 0;
    modelRoot.add(model);

    Object.keys(poiContent).forEach((key) => {
      const node = model.getObjectByName(key);
      if (node) {
        createPoiMarker(node, key);
      }
    });

    updateStatus("Avvia AR per rilevare il pavimento e piazzare la fotocamera.", "Modello pronto");
  },
  undefined,
  () => {
    updateStatus("Il modello non si e' caricato correttamente.", "Errore");
  }
);

function createArButton() {
  const button = ARButton.createButton(renderer, {
    requiredFeatures: ["hit-test"],
    optionalFeatures: ["dom-overlay"],
    domOverlay: { root: overlayRoot },
  });

  button.textContent = "Avvia AR";
  arButtonHost.appendChild(button);
}

async function checkSupport() {
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const isChrome = /Chrome/i.test(ua) && !/Edg|OPR|SamsungBrowser/i.test(ua);

  if (!isAndroid || !isChrome) {
    showSupportMessage("Questa AR custom funziona in modo affidabile con Chrome su Android. Apri il link li' e riprova.");
    return;
  }

  if (!navigator.xr) {
    showSupportMessage("Questo browser non espone WebXR AR. Usa Chrome aggiornato su Android.");
    return;
  }

  let supported = false;
  try {
    supported = await navigator.xr.isSessionSupported("immersive-ar");
  } catch {
    showSupportMessage("Non sono riuscito a verificare il supporto AR del browser.");
    return;
  }

  if (!supported) {
    showSupportMessage("WebXR immersive-ar non disponibile. Prova con Chrome su Android e permessi camera attivi.");
    return;
  }

  createArButton();
  supportCard.classList.add("is-hidden");
  updateStatus("Tocca Avvia AR per iniziare.", "AR pronta");
}

renderer.xr.addEventListener("sessionstart", () => {
  introCard.classList.add("is-hidden");
  hintCard.classList.remove("is-hidden");
  supportCard.classList.add("is-hidden");
  infoCard.classList.add("is-hidden");
  updateStatus("Muovi il telefono per trovare una superficie.", "Sessione AR");
});

renderer.xr.addEventListener("sessionend", () => {
  introCard.classList.remove("is-hidden");
  modelRoot.visible = false;
  modelPlaced = false;
  hitTestSource = null;
  hitTestSourceRequested = false;
  reticle.visible = false;
  infoCard.classList.add("is-hidden");
  updateStatus("Tocca Avvia AR per iniziare.", "AR pronta");
});

function render(timestamp, frame) {
  if (frame) {
    const session = renderer.xr.getSession();

    if (!hitTestSourceRequested) {
      session
        .requestReferenceSpace("viewer")
        .then((referenceSpace) => {
          session.requestHitTestSource({ space: referenceSpace }).then((source) => {
            hitTestSource = source;
          });
        })
        .catch(() => {
          showSupportMessage("Il browser ha avviato l'AR ma non supporta l'hit-test necessario per posizionare il modello.", "Errore AR");
        });

      session.addEventListener("end", () => {
        hitTestSourceRequested = false;
        hitTestSource = null;
      });

      hitTestSourceRequested = true;
    }

    if (hitTestSource) {
      const referenceSpace = renderer.xr.getReferenceSpace();
      const hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length > 0 && !modelPlaced) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);
        reticle.visible = true;
        reticle.matrix.fromArray(pose.transform.matrix);
        updateStatus("Superficie trovata. Tocca per posizionare la fotocamera.", "Pronta al posizionamento");
      } else if (!modelPlaced) {
        reticle.visible = false;
      }
    }
  }

  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

hintCard.classList.add("is-hidden");
checkSupport();
renderer.setAnimationLoop(render);
