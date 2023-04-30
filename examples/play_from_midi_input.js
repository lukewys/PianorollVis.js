SampleLibrary.baseUrl = "https://lukewys.github.io/files/tonejs-samples/"; // "../samples/"
let piano_synth
let metronome

function showMainScreen() {
    document.querySelector('.splash').hidden = true;
    document.querySelector('.loaded').hidden = false;

    Tone.start();

    // Enable WEBMIDI.js and trigger the onEnabled() function when ready
    WebMidi
        .enable()
        .then(onEnabled)
        .catch(err => alert(err));


}


// Function triggered when WEBMIDI.js is ready
function onEnabled() {

    Tone.context.lookAhead = 0.05; // less latency

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

function enableMetronome() {
    if (metronome_status) {
        metronome_status = false;
        metronomeBtn.textContent = 'Enable Metronome';
        Tone.Transport.stop();
        Tone.Transport.cancel(); //clear all scheduled events
        visual.painter.stop();
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
        visual.painter.start();
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