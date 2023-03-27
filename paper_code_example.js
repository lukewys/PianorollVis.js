// the div to draw the piano roll
let div = document.getElementById('pianoroll');
// set the animation type and orientation
let animationType = 'waterfall';
let orientation = 'vertical';
// the number of octaves to draw. -1 means draw all 7 octaves
let numOctaves = -1;
// The lowest C on the piano roll. The number can be set from 1-7.
let lowestC = 1;
// set the width and height of the pianoroll.
// -1 means the height of the window
let width = -1;
let height = -1;
// the x,y position of the left top corner of visual panel
let x = 0;
let y = 0;

// create a new NoteVisual object for drawing
const visual = new NoteVisual(div, animationType, orientation,
    numOctaves, lowestC, width, height, x, y);
// create a new DrawLoop object for animation
const drawLoop = new DrawLoop(CONSTANTS.REFRESH_RATE);
// add the draw function to the draw loop
drawLoop.addDrawFunctionFromVisual(visual);
// start the draw loop
drawLoop.startDrawLoop();


// Function triggered when WEBMIDI.js is ready
function onEnabled() {
    const mySynth = WebMidi.inputs[0];
    //display the note name and play the note
    mySynth.channels[1].addListener("noteon", e => {
        piano_synth.triggerAttack(e.note.identifier);
        // for noteOn, just specify note number and color
        visual.noteOn(e.note.number, 'orange');
    });
    mySynth.channels[1].addListener("noteoff", e => {
        piano_synth.triggerRelease(e.note.identifier);
        // for noteOff, similarly, specify note number and color
        visual.noteOff(e.note.number, 'orange');
    });
}