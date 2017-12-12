## ChordData Methods

<dl>
<dt><a href="#init">init</a> ⇒ <code>Promise</code></dt>
<dd><p>Initializes chord data</p>
</dd>
<dt><a href="#getScaleOptions">getScaleOptions</a> ⇒ <code>Array</code></dt>
<dd><p>Returns an array of valid scales options for the &quot;scale&quot; dropdown</p>
</dd>
<dt><a href="#getKeyOptions">getKeyOptions</a> ⇒ <code>Array</code></dt>
<dd><p>Returns an array of valid key options for the &quot;key&quot; dropdown</p>
</dd>
<dt><a href="#getChordDataByScale">getChordDataByScale</a> ⇒ <code>Object</code></dt>
<dd><p>Gets chord data object for a given scale</p>
</dd>
<dt><a href="#getChordsByPath">getChordsByPath</a> ⇒ <code>Array</code></dt>
<dd><p>Retrieves chord objects based on a &quot;path&quot; of chordIDs</p>
</dd>
<dt><a href="#getChordDisplayName">getChordDisplayName</a> ⇒ <code>String</code></dt>
<dd><p>Retrieves the display name of a chord in a key</p>
</dd>
<dt><a href="#getChordDisplayColorIdx">getChordDisplayColorIdx</a> ⇒ <code>Number</code></dt>
<dd><p>Retrieves the display color of a chord in a key</p>
</dd>
<dt><a href="#onPathChange">onPathChange</a></dt>
<dd><p>Call this function anytime the user changes the path</p>
</dd>
</dl>

<a name="init"></a>

## init ⇒ <code>Promise</code>
Initializes chord data

**Kind**: global constant
<a name="getScaleOptions"></a>

## getScaleOptions ⇒ <code>Array</code>
Returns an array of valid scales options for the "scale" dropdown

**Kind**: global constant
**Returns**: <code>Array</code> - array of valid scales
<a name="getKeyOptions"></a>

## getKeyOptions ⇒ <code>Array</code>
Returns an array of valid key options for the "key" dropdown

**Kind**: global constant
**Returns**: <code>Array</code> - array of valid keys

| Param | Type | Description |
| --- | --- | --- |
| scaleName | <code>String</code> | name of scale e.g. "major" |

<a name="getChordDataByScale"></a>

## getChordDataByScale ⇒ <code>Object</code>
Gets chord data object for a given scale

**Kind**: global constant
**Returns**: <code>Object</code> - chord data object used to get node data

| Param | Type | Description |
| --- | --- | --- |
| scaleName | <code>String</code> | name of scale e.g. "major" |

<a name="getChordsByPath"></a>

## getChordsByPath ⇒ <code>Array</code>
Retrieves chord objects based on a "path" of chordIDs

**Kind**: global constant
**Returns**: <code>Array</code> - array of "chord objects" containing the properties: {chordID <String>, percentage <Number>}

| Param | Type | Description |
| --- | --- | --- |
| path | <code>Array</code> | an array of chordIDs |
| scaleChordData | <code>Object</code> | chord data object obtained from getChordDataByScale |

<a name="getChordDisplayName"></a>

## getChordDisplayName ⇒ <code>String</code>
Retrieves the display name of a chord in a key

**Kind**: global constant
**Returns**: <code>String</code> - html-formated string, e.g., "Fmaj<sup>7</sup>"

| Param | Type | Description |
| --- | --- | --- |
| chordID | <code>String</code> | 5-char chord identifier |
| key | <code>String</code> | E.g., "F" |
| scaleName | <code>String</code> | E.g, "major" |

<a name="getChordDisplayColorIdx"></a>

## getChordDisplayColorIdx ⇒ <code>Number</code>
Retrieves the display color of a chord in a key

**Kind**: global constant
**Returns**: <code>Number</code> - Color index from 0 and 11

| Param | Type | Description |
| --- | --- | --- |
| chordID | <code>String</code> | 5-char chord identifier |
| key | <code>String</code> | E.g., "F" |
| scaleName | <code>String</code> | E.g, "major" |

<a name="onPathChange"></a>

## onPathChange
Call this function anytime the user changes the path

| Param | Type | Description |
| --- | --- | --- |
| path | <code>Array</code> | Array of chord ID strings |
| key | <code>String</code> | E.g., "F" |
| scaleName | <code>String</code> | E.g, "major" |

**Kind**: global constant