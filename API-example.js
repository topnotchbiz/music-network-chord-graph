// Initialize chord data
ChordData.init()
.catch(function(){
    console.error('chord data initialization failed')
})
.then(function(){
    console.log('Chord data is initialized');

    exampleUses();

})


function exampleUses(){
    const CHORD_THRESHOLD = 0.1;
    const OTHER_CHORDS_THRESHOLD = 1;

    // Get possible scales:
    var possibleScales = ChordData.getScaleOptions();
    console.log('These are the supported scales: ' + possibleScales);


    // Get possible keys for the 'major' scale:
    var possibleMajorKeys = ChordData.getKeyOptions('major');
    console.log('These are the supported major keys: ' + possibleMajorKeys);


    // Get chord data object for major scale.  Can use any valid scale as defined above, but 'major' and 'minor' have the most data
    var chordDataMajor = ChordData.getChordDataByScale('major');

    // Get starting chords nodes (depth-1) for major scale.  Keep only those above a threshold
    var initialChords = ChordData.getChordsByPath([], chordDataMajor)
                            .filter(function(chord){return chord.percentage > CHORD_THRESHOLD});

    var initialChordIDs = initialChords.map(function(chord){return chord.chordID});
    var initialChordPercentages = initialChords.map(function(chord){return chord.percentage});

    // Get the chord node display names for C major:
    var initialChordDisplayNames = initialChords.map(function(chord){return ChordData.getChordDisplayName(chord.chordID, 'C', 'major')}); 
    console.log('Here are the display names of the initial chords nodes in C major: ' + initialChordDisplayNames)

    // Get the chord node display colors for C major:
    var initialChordDisplayColorIndices = initialChords.map(function(chord){return ChordData.getChordDisplayColorIdx(chord.chordID, 'C', 'major')}); 
    console.log('Here are the colors of the initial chords nodes in C major: ' + initialChordDisplayColorIndices)


    // Get chord depth-2 chord nodes assuming user clicked on highest percentage depth-1 chord
    var depth2Chords = ChordData.getChordsByPath([initialChords[0].chordID], chordDataMajor)
                            .filter(function(chord){return chord.percentage > CHORD_THRESHOLD});

    // Get chord depth-3 chord nodes assuming user clicked on highest percentage depth-1 chord and highest percentage depth-2 chord
    var depth3Chords = ChordData.getChordsByPath([initialChords[0].chordID, depth2Chords[0].chordID], chordDataMajor)
                            .filter(function(chord){return chord.percentage > CHORD_THRESHOLD});

    // Please call this function anytime a user clicks on a chord node to expand it:
    ChordData.onPathChange([initialChords[0].chordID, depth2Chords[0].chordID], 'C', 'major');




}