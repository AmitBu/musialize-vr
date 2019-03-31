// import NumberUtils from "./utils/Number";
// import p5 from 'p5'
// window.p5 = require('p5');
// window.p5 = p5;
// import 'p5/lib/addons/p5.sound';

const MAX_SPHERE_Y = 20;
const MIN_SPHERE_Y = 1;
const MIN_TIME = 70;
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

// TODO: check what can you do about it
// Some weird stuff, telling me component was already registered
AFRAME.components.musialize = null;
AFRAME.registerComponent("musialize", {
  init: function () {
    // Solution for Getting Entities.
    var sceneEl = document.querySelector("a-scene"); // Or this.el since we're in a component.
    var noteContainer = sceneEl.querySelector("#scale-container");

    // position text elements (scale) on the plane
    scaleArr.forEach((n, i) => {
      noteContainer.appendChild(getNoteText(n, i));
    });

    // setInterval(() => {
    //   const index = Math.floor(Math.random() * 12);
    //   const pitch = Math.floor(Math.random() * 600);
    //   //addPitchSphere(index, pitch);
    // }, 3000);
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
function addPitchSphere(noteIndex, pitch) {
  const noteLabel = scaleArr[noteIndex];
  const id = `note_${pitch}_${Date.now()}`;
  const noteContainer = document.querySelector("#scale-container");
  const eleSphere = document.createElement("a-sphere");
  const x = getNoteXPosition(noteIndex) * 2;
  const y = NumberUtils.scale(pitch, 0, 600, MIN_SPHERE_Y, MAX_SPHERE_Y);

  eleSphere.setAttribute("position", `${x} ${y} -10`);
  eleSphere.setAttribute("radius", "1.0");
  eleSphere.setAttribute("color", noteColor[noteLabel]);
  eleSphere.setAttribute("shadow", "");
  eleSphere.setAttribute('id', id);

  noteContainer.appendChild(eleSphere);

  // TODO: Make sphere disappear after X time
  setTimeout(() => removeSphereFromScale(id), DISPLAY_TIME);
}

function removeSphereFromScale(id) {
  const ele = document.querySelector(`#${id}`);
  ele.parentNode.removeChild(ele);
}

let mic;
let audioContext;
let pitch;

function onUserStart() {
  // Problem with chrome - user gesture
  if (!mic) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function (stream) {
        audioContext = new AudioContext();
        mic = stream;
        startPitch();
      })
      .catch(function (err) {
        console.log('The following getUserMedia error occured: ' + err);
      });
  }

  function startPitch() {
    pitch = ml5.pitchDetection("./model/", audioContext, mic, modelLoaded);

    function modelLoaded(f) {
      getPitch();
      console.log("model loaded", f);
    }
  }

  function getPitch() {
    pitch.getPitch(function (err, frequency) {
      if (err) {
        console.error('ml5 error', err);
        return;
      } else if (frequency) {
        let midiNum = freqToMidi(frequency);
        const currentNote = scaleArr[midiNum % 12];
        const scaleNum = getScaleFromMidi(midiNum);
        // console.log(midiNum, currentNote, scaleNum);
        // TODO: Update scale data
        updateScaleData(midiNum * scaleNum, currentNote, scaleNum);
      }
      getPitch();
    });
  }
}

function updateScaleData(pitch, note, scaleNum) {
  // Update chart data only if a treshhold has been met
  if (Date.now() - lastNoteTime >= MIN_TIME) {
    console.log(note);
    // TODO: Add time limitation - to not cause overflow
    addPitchSphere(scaleArr.indexOf(note), pitch)
  }
}

/**
 * MIDI utils - when we'll have loader and module control move to different file
 */
function getScaleFromMidi(midiNum) {
  return Math.floor(midiNum / 12) - 1;
}

function freqToMidi(freq) {
  var e = Math.log(freq / 440) / Math.log(2);
  var i = Math.round(12 * e) + 69;
  return i;
}

/**
 * Number utils - when we'll have loader and module control move to different file
 */
class NumberUtils {
  static scale(num, in_min, in_max, out_min, out_max) {
    return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
  }
}