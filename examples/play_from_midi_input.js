SampleLibrary.baseUrl = "https://lukewys.github.io/files/tonejs-samples/"; // "../samples/"
let piano_synth
let metronome

function showMainScreen() {
    document.querySelector('.splash').hidden = true;
    document.querySelector('.loaded').hidden = false;

    Tone.start();
    onEnabledClick();

    // Enable WEBMIDI.js and trigger the onEnabled() function when ready
    WebMidi
        .enable()
        .then(onEnabled)
        .catch(err => alert(err));


}


// Function of clicking on the keyboard by mouse
function onEnabledClick() {
    const keys = document.querySelectorAll('rect');
    const pianoNotes = ['A0', 'A#0', 'B0', 'C1', 'C#1', 'D1', 'D#1', 'E1', 'F1', 'F#1', 'G1', 'G#1', 'A1', 'A#1', 'B1', 'C2', 'C#2',
        'D2', 'D#2', 'E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2', 'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3',
        'A#3', 'B3', 'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5',
        'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5', 'C6', 'C#6', 'D6', 'D#6', 'E6', 'F6', 'F#6', 'G6', 'G#6', 'A6', 'A#6', 'B6', 'C7', 'C#7',
        'D7', 'D#7', 'E7', 'F7', 'F#7', 'G7', 'G#7', 'A7', 'A#7', 'B7', 'C8'];
    let index
    let note
    let num
    keys.forEach(key => {
        //display the note name and play the note
        key.addEventListener('mousedown', () => {
            index = key.getAttribute('data-index');
            note = pianoNotes[index];
            num = parseInt(index) + 21;
            piano_synth.triggerAttack(note);
            console.log(note, num, 'on', Date.now());
            visual.noteOn(num);
        });

        key.addEventListener('mouseup', () => {
            // get the pitch of the note
            index = key.getAttribute('data-index');
            note = pianoNotes[index];
            num = parseInt(index) + 21;
            piano_synth.triggerRelease(note);
            console.log(note, num, 'off', Date.now());
            visual.noteOff(num);
        });
    });
}

// Function triggered when WEBMIDI.js is ready
function onEnabled() {

    Tone.context.lookAhead = 0.05; // less latency


    if (WebMidi.inputs.length < 1) {
        console.log("No device detected. Using mouse input.");
    } else {
        console.log("MIDI device detected: " + WebMidi.inputs[0].name);
        const mySynth = WebMidi.inputs[0];

        //display the note name and play the note
        mySynth.channels[1].addListener("noteon", e => {
            piano_synth.triggerAttack(e.note.identifier);
            console.log(e.note.identifier, e.note.number, 'on', Date.now());
            visual.noteOn(e.note.number);
        });
        mySynth.channels[1].addListener("noteoff", e => {
            piano_synth.triggerRelease(e.note.identifier);
            console.log(e.note.identifier, e.note.number, 'off', Date.now());
            //document.body.innerHTML += `off ${e.note.identifier} ${Date.now()} <br>`;
            visual.noteOff(e.note.number);
        });
    }

}

function enableMetronome() {
    if (metronome_status) {
        metronome_status = false;
        metronomeBtn.textContent = 'Enable Metronome';
        Tone.Transport.stop();
        Tone.Transport.cancel(); //clear all scheduled events
        visual.stop();
    } else {
        metronome_status = true;
        metronomeBtn.textContent = 'Disable Metronome';
        Tone.Transport.scheduleRepeat(time => {
            metronome.triggerAttackRelease('C1', '8n', time);
            if (CYCLE > 0) {
                visual.painter.clear();
            }
        }, CYCLE_STRING);
        for (let i = 1; i < 8; i++) {
            Tone.Transport.scheduleRepeat(time => {
                metronome.triggerAttackRelease('C0', '8n', time);
            }, CYCLE_STRING, `+0:${i}:0`);
        }
        Tone.Transport.start();
        visual.start();
    }
}

function playMIDI(midiPath) {
    Midi.fromUrl(midiPath).then(midi_file => {
        const midi = JSON.parse(JSON.stringify(midi_file))
        const now = Tone.now();
        Tone.Transport.start(); // Start the transport timeline when playing a MIDI file
        midi.tracks.forEach(track => {
            track.notes.forEach(note => {
                piano_synth.triggerAttackRelease(note.name, note.duration, note.time + now, note.velocity)
                console.log("note time", note.time + now)

                Tone.Transport.schedule(time => {
                    Tone.Draw.schedule(() => {
                        console.log(time)
                        visual.noteOn(note.midi);
                    }, time);
                }, note.time + now)
                Tone.Transport.schedule(time => {
                    Tone.Draw.schedule(() => {
                        console.log(time)
                        visual.noteOff(note.midi);
                    }, time);
                }, note.time + now + note.duration)
            })
        })
    })
}

let CYCLE_NUM_BEAT = CYCLE > 0 ? CYCLE * 4 : 8;
let CYCLE_STRING = `${Math.floor(CYCLE_NUM_BEAT / 4)}m`;
visual.setCycle(CYCLE);

Tone.Transport.bpm.value = 120;

let metronome_status = false;

function loadPiano() {
    return new Promise((resolve) => {
        const piano = SampleLibrary.load({
            instruments: 'piano',
            onload: () => {
                resolve(piano);
            },
        });
    });
}

function loadMetronome() {
    return new Promise((resolve) => {
        const metronome = SampleLibrary.load({
            instruments: 'metronome',
            onload: () => {
                resolve(metronome);
            },
        });
    });
}

async function initialize() {
    piano_synth = await loadPiano();
    piano_synth.toDestination();
    metronome = await loadMetronome();
    metronome.toDestination();

    console.log('ready!');
    playBtn.textContent = 'Play';
    playBtn.removeAttribute('disabled');
    playBtn.classList.remove('loading');
}

initialize();