import Soundfont from "soundfont-player";
import NumberUtils from './utils/Number'
import ColorUtils from './utils/Color'
import MidiUtils from './utils/MIDI'
import sampleFile from "./assets/elvis.base64";
import SpherePool from "./models/SpherePool";

var MidiPlayer = require("midi-player-js");
var AudioContext = window.AudioContext || window.webkitAudioContext || false;
var ac = new AudioContext() || new webkitAudioContext();
let Player;



const SPHERES_CONTAINER = '#scale-container';
const MAX_SPHERES = 20;
const MAX_SPHERE_Y = 20;
const MIN_SPHERE_Y = 1;
const MIN_TIME = 0;
const MAX_DISPLAY_TIME = 1000;
let lastNoteTime = 0;
const scaleArr = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const noteColor = {
  C: "rgb(0, 231, 0)",
  "C#": "rgb(0, 255, 164)",
  D: "rgb(0, 100, 253)",
  "D#": "rgb(43, 0, 252)",
  E: "rgb(127, 0, 208)",
  F: "rgb(57, 0, 85)",
  "F#": "rgb(95, 0, 79)",
  G: "rgb(217, 0, 0)",
  "G#": "rgb(226, 64, 0)",
  A: "rgb(255, 137, 0)",
  "A#": "rgb(235, 255, 0)",
  B: "rgb(152, 247, 0)"
};
let spherePool;
// Currently active spheres map [note_id] -> sphereElement
const activeSpheres = {}

// TODO: check what can you do about it
// Some weird stuff, telling me component was already registered
AFRAME.components.musialize = null;
AFRAME.registerComponent("musialize", {
  init: function () {
    spherePool = new SpherePool(MAX_SPHERES, SPHERES_CONTAINER);

    // Solution for Getting Entities.
    var sceneEl = document.querySelector("a-scene"); // Or this.el since we're in a component.
    var noteContainer = sceneEl.querySelector(SPHERES_CONTAINER);

    // position text elements (scale) on the plane
    for (let i = 0; i < scaleArr.length; i++) {
      noteContainer.appendChild(getNoteText(scaleArr[i], i));
    }
  },
  tick: function () {
    // console.log('Tick');
  }
});

function getNoteXPosition(index) {
  return index * 2 - scaleArr.length;
}

function getNoteText(note, index) {
  const elePitch = document.createElement("a-text");
  elePitch.setAttribute("text", "value: " + note);
  elePitch.setAttribute("position", `${getNoteXPosition(index)} 0 0`);
  elePitch.setAttribute("mixin", "text");

  return elePitch;
}

/**
 * Add detected pitch to scale scene
 * @param noteIndex - the index of the note in the scale
 */
function addPitchSphere(noteIndex, pitch, scaleNum, noteId) {
  const noteLabel = scaleArr[noteIndex];

  // TODO: Get sphere from SpherePool
  const eleSphere = spherePool.getItem();
  // Save sphere in active spheres



  const x = getNoteXPosition(noteIndex) * 2;
  const y = NumberUtils.scale(pitch, 0, 600, MIN_SPHERE_Y, MAX_SPHERE_Y);

  const scaleBrightness = NumberUtils.scale(scaleNum, 6, 1, 0.3, -0.6);
  const newColor = ColorUtils.shadeColor(scaleBrightness, noteColor[noteLabel]);

  if (eleSphere) {
    // Setting active spheres for current note to empty array
    if (!activeSpheres[noteId]) {
      activeSpheres[noteId] = [];
    }

    activeSpheres[noteId].push(eleSphere);
    // console.log('Getting from queue', noteId);

    eleSphere.object3D.position.set(x, y, -20);
    // eleSphere.setAttribute("position", `${x} ${y} -10`);
    // eleSphere.setAttribute("radius", "1.0");
    eleSphere.setAttribute("color", newColor);
    // eleSphere.setAttribute("shadow", "");
    // eleSphere.setAttribute('id', id);
    // TODO: Make sphere disappear after X time
    // setTimeout(() => removeSphereFromScale(noteId), MAX_DISPLAY_TIME);
  } else {
    // eleSphere = document.querySelector("#amit-sphere");
    console.warn('Could not get avilable sphere - skipping!')
  }

  
}

function removeSphereFromScale(noteId) {
  const sphereArr = activeSpheres[noteId];
  if (sphereArr && sphereArr.length > 0) {
    const sphere = sphereArr.pop();
    // Return item to sphere pool
    spherePool.addItem(sphere);
    // console.log('Adding sphere to queue', noteId, sphere, 'activeSpheres', activeSpheres);
    // Remove shere from active spheres
  } else {
    console.warn('Could not remove sphere', noteId, 'active spheres', activeSpheres)
  }
}

window.onUserStart = () => {
  console.log('Starting');
  Player.play();
}

window.onUserPause = () => {
  Player.pause();
}

function updateScaleData(pitch, note, scaleNum, noteId) {
  // Update chart data only if a treshhold has been met
  if (Date.now() - lastNoteTime >= MIN_TIME) {
    // console.log(note, 'time', lastNoteTime, Date.now() - lastNoteTime);
    lastNoteTime = Date.now();
    // TODO: Add time limitation - to not cause overflow
    addPitchSphere(scaleArr.indexOf(note), pitch, scaleNum, noteId)
  }
}


/**
 * MIDI player & events code
 * */

const instrumentUrl = "https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/MusyngKite/acoustic_guitar_nylon-mp3.js";

Soundfont.instrument(ac, instrumentUrl).then((instrument) => {

  function getIdFromEvent(event) {
    return `note_${event.noteName}`;
  }

  function loadDataUri(dataUri) {
    let currentNote;
    let scaleNum;

    Player = new MidiPlayer.Player(function (event) {
      const { name, velocity, noteName, noteNumber } = event;
      if (name === "Note on" && velocity && velocity > 0) {
        // console.log("Event", name, velocity, noteName, event);
        instrument.play(noteName, ac.currentTime, {
          gain: velocity / 100
        });

        currentNote = scaleArr[noteNumber % 12];
        scaleNum = MidiUtils.getScaleFromMidi(noteNumber);

        // console.log('Current note', currentNote, 'From midi', noteName, 'scale:', scaleNum);
        const noteId = getIdFromEvent(event);
        // console.log('Note on', noteId, event);

        // Display spheres for notes
        updateScaleData(noteNumber * scaleNum, currentNote, scaleNum, noteId);
      } else if (name === "Note off") {
        // console.log('Note off', noteId, event);
        removeSphereFromScale(getIdFromEvent(event));
      }
    });

    Player.on("endOfFile", function () {
      // Do something when end of the file has been reached.
      console.log("End of file");
    });

    console.log("instrument loaded");
    try {
      Player.loadDataUri(dataUri);
    } catch (e) {
      console.error(e);
    }
    console.log("load data uri");
  }

  loadDataUri(sampleFile);
});