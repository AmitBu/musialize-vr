import Soundfont from "soundfont-player";
import NumberUtils from './utils/Number'
import ColorUtils from './utils/Color'
import MidiUtils from './utils/MIDI'
import sampleFile from "./assets/elvis.base64";

var MidiPlayer = require("midi-player-js");
var AudioContext = window.AudioContext || window.webkitAudioContext || false;
var ac = new AudioContext() || new webkitAudioContext();
let Player;


const MAX_SPHERE_Y = 20;
const MIN_SPHERE_Y = 1;
const MIN_TIME = 100;
const DISPLAY_TIME = 200;
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
let eleSphere;

// TODO: check what can you do about it
// Some weird stuff, telling me component was already registered
AFRAME.components.musialize = null;
AFRAME.registerComponent("musialize", {
  init: function () {
    // Solution for Getting Entities.
    var sceneEl = document.querySelector("a-scene"); // Or this.el since we're in a component.
    var noteContainer = sceneEl.querySelector("#scale-container");
    eleSphere = sceneEl.querySelector("#amit-sphere");

    // position text elements (scale) on the plane
    for (let i = 0; i < scaleArr.length; i++) {
      noteContainer.appendChild(getNoteText(scaleArr[i], i));
    }
  },
  tick: function() {
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
function addPitchSphere(noteIndex, pitch, scaleNum = 1) {
  const noteLabel = scaleArr[noteIndex];
  const id = `note_${pitch}_${Date.now()}`;
  //const noteContainer = document.querySelector("#scale-container");
  // TODO: Return if needed
  // const eleSphere = document.createElement("a-sphere");
  //const eleSphere = document.getElementById("amit-sphere");
  
  const x = getNoteXPosition(noteIndex) * 2;
  const y = NumberUtils.scale(pitch, 0, 600, MIN_SPHERE_Y, MAX_SPHERE_Y);

  const scaleBrightness = NumberUtils.scale(scaleNum, 6, 1, 0.3, -0.6);
  const newColor = ColorUtils.shadeColor(scaleBrightness, noteColor[noteLabel]);

  if (eleSphere) {
    eleSphere.object3D.position.set( x, y, -20 );
    // eleSphere.setAttribute("position", `${x} ${y} -10`);
    // eleSphere.setAttribute("radius", "1.0");
    eleSphere.setAttribute("color", newColor);
    // eleSphere.setAttribute("shadow", "");
    // eleSphere.setAttribute('id', id);
  } else {
    eleSphere = document.querySelector("#amit-sphere");
  }

  // TODO: Return if needed
  //noteContainer.appendChild(eleSphere);

  // TODO: Make sphere disappear after X time
  //setTimeout(() => removeSphereFromScale(id), DISPLAY_TIME);
}

function removeSphereFromScale(id) {
  const ele = document.querySelector(`#${id}`);
  ele.parentNode.removeChild(ele);
}

window.onUserStart = () => {
  console.log('Starting');
  Player.play();
}

window.onUserPause = () => {
  Player.pause();
}

function updateScaleData(pitch, note, scaleNum) {
  // Update chart data only if a treshhold has been met
  if (Date.now() - lastNoteTime >= MIN_TIME) {
    // console.log(note, 'time', lastNoteTime, Date.now() - lastNoteTime);
    lastNoteTime = Date.now();
    // TODO: Add time limitation - to not cause overflow
    addPitchSphere(scaleArr.indexOf(note), pitch, scaleNum)
  }
}


/**
 * MIDI player & events code
 * */ 

const instrumentUrl = "https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/MusyngKite/acoustic_guitar_nylon-mp3.js";

Soundfont.instrument(ac, instrumentUrl).then((instrument) => {
  
  function loadDataUri(dataUri) {
    let currentNote;
    let scaleNum;

    Player = new MidiPlayer.Player(function(event) {
      const {name, velocity, noteName, noteNumber} = event;
      if (name === "Note on" && velocity && velocity > 0) {
        // console.log("Event", name, velocity, noteName, event);
        instrument.play(noteName, ac.currentTime, {
          gain: velocity / 100
        });

        currentNote = scaleArr[noteNumber % 12];
        scaleNum = MidiUtils.getScaleFromMidi(noteNumber);
        
        console.log('Current note', currentNote, 'From midi', noteName, 'scale:', scaleNum);


        // TODO: Display sphere for notes
        updateScaleData(noteNumber * scaleNum, currentNote, scaleNum);
      } else {
        //console.log(event);
      }
    });

    Player.on("endOfFile", function() {
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