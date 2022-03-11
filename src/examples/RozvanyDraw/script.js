// Import libraries
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/OrbitControls.js'
import rhino3dm from 'https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/rhino3dm.module.js'
import { Rhino3dmLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/loaders/3DMLoader.js'

//set up new loader for converting the results to THREEjs
const loader = new Rhino3dmLoader()
loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/')

//Define Variables
const definition = 'RozvanyDraw01.gh'
const mouse = new THREE.Vector3()
const canvasContainer = document.querySelector('#canvasContainer')

//spinner
showSpinner(false);

//Define Materials
const material = new THREE.LineBasicMaterial({
  color: 0xcfcfcf
});

// set up download button click handlers
const downloadButton = document.getElementById("downloadButton")
downloadButton.onclick = download

// event listeners
const spacing_slider = document.getElementById('spacing')
spacing_slider.addEventListener('mouseup', onSliderChange, false)
spacing_slider.addEventListener('touchend', onSliderChange, false)

const addBoundary = document.getElementById('border')
addBoundary.addEventListener('click', AddBoundary)

const addPoints = document.getElementById('column')
addPoints.addEventListener('click', AddPoints)

const addLine = document.getElementById('line')
addLine.addEventListener('click', AddLine)

const computeButton = document.getElementById('compute')
computeButton.addEventListener('click', compute)

window.addEventListener('keyup', Close)

//Intialize data objects
let data = {}
data.definition = definition
data.inputs = {
  'spacing': spacing_slider.valueAsNumber,
  'boundaryPoints': [],
  'colPoints': [],
  'lnPoints': [],
  'arcPoints': []
}

//load the rhino3dm library
let rhino, doc
rhino3dm().then(async m => {
  console.log('Loaded rhino3dm.')
  rhino = m // global

  init()
})

//slider change
function onSliderChange() {
  showSpinner(false)
  compute()
}

//Enables element addition
function AddBoundary() {
  canvasContainer.addEventListener('click', onClickBound, false);
}

function Close() {
  //check that atleast 4 points have been added
  if(numBoundPoints < 4){
    document.getElementById('errorMessage').innerText = 'need atleast 4 points to close boundary'
  }
  else{
    //remove add boundary point event listener
    canvasContainer.removeEventListener('click', onClickBound, false) 
    
    //draw closing boundary line
    const points = [boundVectors[boundVectors.length-1], boundVectors[0]]
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    const line = new THREE.Line( geometry, material );
    scene.add(line);
  }
}

function AddPoints() {
  //remove event listeners
  canvasContainer.removeEventListener('click', onClickLine, false)
  
  //add event listener for column poibnts
  canvasContainer.addEventListener('click', onClickCol, false);
}

function AddLine() {
  canvasContainer.removeEventListener('click', onClickCol, false)
  //canvasContainer.removeEventListener('click', onClickArc, false)

  //add event listener for column poibnts
  canvasContainer.addEventListener('click', onClickLine, false);
}

//Click Events
var numBoundPoints = 0;
var numLinePoints = 0;
const boundVectors = [];
const lineVectors = [];

function onClickBound(event){
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1
  mouse.z = 0
  mouse.unproject(camera)

  boundVectors.push(new THREE.Vector3(mouse.x, mouse.y, 0))

  // add json-encoded Point3d to list, e.g. '{ "X": 1.0, "Y": 2.0, "Z": 0.0 }'
  let pt = "{\"X\":"+mouse.x+",\"Y\":"+mouse.y+",\"Z\":"+mouse.z+"}"
  data.inputs['boundaryPoints'].push(pt)
  
  //create Three.js Line and material and add to scene
  numBoundPoints = numBoundPoints+1; //count number of times a point is clicked so that we know we have at least two points to make a line

  const points = [];
  if (numBoundPoints > 1){
    points.push(boundVectors[boundVectors.length-2])
    points.push(boundVectors[boundVectors.length-1])
  }

  const circGeometry = new THREE.CircleGeometry( 2, 32 );
  const circle = new THREE.Mesh( circGeometry, material );
  circle.position.set(mouse.x, mouse.y, mouse.z)
  scene.add( circle );

  const geometry = new THREE.BufferGeometry().setFromPoints( points );
  const line = new THREE.Line( geometry, material );
  scene.add(line);
}

function onClickCol(event){
  // calculate mouse position in normalized device coordinates, (-1 to +1) for both components
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1
  mouse.z = 0
  mouse.unproject(camera)

  // add json-encoded Point3d to list, e.g. '{ "X": 1.0, "Y": 2.0, "Z": 0.0 }'
  let pt = "{\"X\":"+mouse.x+",\"Y\":"+mouse.y+",\"Z\":"+mouse.z+"}"
  data.inputs['colPoints'].push(pt)
  
  const geometry = new THREE.CircleGeometry( 5, 32 );
  const circle = new THREE.Mesh( geometry, material );
  circle.position.set(mouse.x, mouse.y, mouse.z)
  scene.add( circle );
}

function onClickLine(event){
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1
  mouse.z = 0
  mouse.unproject(camera)

  lineVectors.push(new THREE.Vector3(mouse.x, mouse.y, 0))

  // add json-encoded Point3d to list, e.g. '{ "X": 1.0, "Y": 2.0, "Z": 0.0 }'
  let pt = "{\"X\":"+mouse.x+",\"Y\":"+mouse.y+",\"Z\":"+mouse.z+"}"
  data.inputs['lnPoints'].push(pt)
  
  //create Three.js Line and material and add to scene
  numLinePoints = numLinePoints+1; //count number of times a point is clicked so that we know we have at least two points to make a line

  const points = [];
  if (numLinePoints > 1){
    points.push(lineVectors[lineVectors.length-2])
    points.push(lineVectors[lineVectors.length-1])
  }

  const circGeometry = new THREE.CircleGeometry( 5, 32 );
  const circle = new THREE.Mesh( circGeometry, material );
  circle.position.set(mouse.x, mouse.y, mouse.z)
  scene.add( circle );

  const geometry = new THREE.BufferGeometry().setFromPoints( points );
  const line = new THREE.Line( geometry, material );
  scene.add(line);
}

//Call appserver
async function compute() {
  //start spinner
  showSpinner(true);

  let t0 = performance.now()
  const timeComputeStart = t0

  console.log(data.inputs)

  const request = {
    'method': 'POST',
    'body': JSON.stringify(data),
    'headers': { 'Content-Type': 'application/json' }
  }

  try {
    const response = await fetch('/solve', request)

    if (!response.ok) {
      throw new Error(response.statusText)
    }

    const responseJson = await response.json()

    collectResults(responseJson)

  } catch (error) {
    console.error(error)
  }
}

function decodeItem(item) {
  const data = JSON.parse(item.data)
  if (item.type === 'System.String') {
    // hack for draco meshes
    try {
      return rhino.DracoCompression.decompressBase64String(data)
    } catch { } // ignore errors (maybe the string was just a string...)
  } else if (typeof data === 'object') {
    return rhino.CommonObject.decode(data)
  }
  return null
}

function collectResults(responseJson) {

  const values = responseJson.values
  console.log(values) //logs gh outputs

  // clear doc
  try {
    if (doc !== undefined)
      doc.delete()
  } catch { }

  //console.log(values)
  doc = new rhino.File3dm()

  // for each output (RH_OUT:*)...
  for (let i = 0; i < values.length; i++) {
    // ...iterate through data tree structure...
    for (const path in values[i].InnerTree) {
      const branch = values[i].InnerTree[path]
      // ...and for each branch...
      for (let j = 0; j < branch.length; j++) {
        // ...load rhino geometry into doc
        const rhinoObject = decodeItem(branch[j])
        if (rhinoObject !== null) {
          // console.log(rhinoObject)
          doc.objects().add(rhinoObject, null)
        }
      }
    }
  }

  if (doc.objects().count < 1) {
    console.error('No rhino objects to load!')
    showSpinner(false)
    return
  }

  // go through the objects in the Rhino document
  let objects = doc.objects();
  for (let i = 0; i < objects.count; i++) {
    const rhinoObject = objects.get(i);

    // asign geometry userstrings to object attributes
    if (rhinoObject.geometry().userStringCount > 0) {
      const g_userStrings = rhinoObject.geometry().getUserStrings()
      rhinoObject.attributes().setUserString(g_userStrings[0][0], g_userStrings[0][1])
    }
  }

  // load rhino doc into three.js scene
  const buffer = new Uint8Array(doc.toByteArray()).buffer
  loader.parse(buffer, function (object) {

    
    // clear objects from scene
    scene.traverse(child => {
      if (child.Line) {
        scene.remove(child)
      }
    })

    // add object graph from rhino model to three.js scene
    scene.add(object)

    // hide spinner and enable download button
    showSpinner(false)
    //downloadButton.disabled = false

  })
}

// BOILERPLATE //

let scene, camera, renderer, controls

function init() {

  // Rhino models are z-up, so set this as the default
  THREE.Object3D.DefaultUp = new THREE.Vector3( 0, 0, 1 );

  // create a scene and a camera
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x3d3e40);
  const frustumSize = 1000
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1, 1 );


  // create the renderer and add it to the html
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: document.querySelector('canvas') //adds renderer to HTML canvas element
  });
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize(window.innerWidth, window.innerHeight);
  //document.body.appendChild(renderer.domElement);

  // add some controls to orbit the camera
  controls = new OrbitControls(camera, renderer.domElement)

  // add a directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff)
  directionalLight.intensity = 2
  scene.add(directionalLight)

  const ambientLight = new THREE.AmbientLight()
  scene.add(ambientLight)

  window.addEventListener('resize', onWindowResize, false);

  animate()
}

function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}

// download button handler
function download() {
  let buffer = doc.toByteArray()
  let blob = new Blob([buffer], { type: "application/octect-stream" })
  let link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = 'RozvanyLayout.3dm'
  link.click()
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

}

function showSpinner(enable) {
  if (enable)
    document.getElementById('loader').style.display = 'block'
  else
    document.getElementById('loader').style.display = 'none'
}