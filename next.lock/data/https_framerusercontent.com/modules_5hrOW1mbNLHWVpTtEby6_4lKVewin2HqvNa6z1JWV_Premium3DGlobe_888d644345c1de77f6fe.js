import{jsx as _jsx,jsxs as _jsxs}from"react/jsx-runtime";import{useRef,useEffect}from"react";import*as THREE from"three";import{addPropertyControls,ControlType,useIsStaticRenderer}from"framer";import rawGeoJson from"https://framerusercontent.com/modules/ZmO6yOfBlzlkwWQhUAAa/yos0jTrPV7XUpPUQYyrM/Countries.js";let globalGeoCachePromise=null;function getGeoData(){if(globalGeoCachePromise)return globalGeoCachePromise;globalGeoCachePromise=new Promise(async resolve=>{try{let rawData=await Promise.resolve(rawGeoJson);// Handle nested defaults from modules safely
if(rawData&&typeof rawData==="object"&&"default"in rawData){rawData=rawData.default;}if(rawData&&typeof rawData==="object"&&"default"in rawData){rawData=rawData.default// Double check nested wrappers
;}// Provide a clear warning if parsing fails, avoiding silent crashes
if(typeof rawData==="string"){try{rawData=JSON.parse(rawData);}catch(e){console.warn("Failed to parse GeoJSON string. Please ensure the Countries file contains valid JSON.",e);}}let geoData=rawData;// Structured Fallback to recover gracefully if the asset fails to load or is invalid
if(!geoData||!geoData.features||!Array.isArray(geoData.features)){console.warn("GeoJSON missing or invalid. Using an empty fallback to gracefully recover and prevent crashes. Check the Countries file.");geoData={type:"FeatureCollection",features:[]};}const positions=[];const distances=[];const offsets=[];// LOWER-RESOLUTION TEXTURE: Reduced from 2048x1024 to 1024x512
const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=512;const ctx=canvas.getContext("2d");if(ctx){ctx.fillStyle="#000000";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#FFFFFF";}const RADIUS=10;const LINK_RADIUS=RADIUS*.9902;const latLongToVector3=(lat,lon,r)=>{const phi=(90-lat)*(Math.PI/180);const theta=(lon+180)*(Math.PI/180);return new THREE.Vector3(-(r*Math.sin(phi)*Math.cos(theta)),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta));};const process3DRing=ring=>{const ringOffset=Math.random();let totalLen=0;// SIMPLIFIED GEOMETRY: Skip redundant micro-segments in the borders
const simplifiedRing=[ring[0]];for(let i=1;i<ring.length;i++){const prev=simplifiedRing[simplifiedRing.length-1];const curr=ring[i];// Rough Manhattan distance in degrees
const dist=Math.abs(curr[0]-prev[0])+Math.abs(curr[1]-prev[1]);if(dist>.1||i===ring.length-1){simplifiedRing.push(curr);}}for(let i=0;i<simplifiedRing.length-1;i++){const p1=latLongToVector3(simplifiedRing[i][1],simplifiedRing[i][0],LINK_RADIUS);const p2=latLongToVector3(simplifiedRing[i+1][1],simplifiedRing[i+1][0],LINK_RADIUS);totalLen+=p1.distanceTo(p2);}let currentDist=0;for(let i=0;i<simplifiedRing.length-1;i++){const p1=latLongToVector3(simplifiedRing[i][1],simplifiedRing[i][0],LINK_RADIUS);const p2=latLongToVector3(simplifiedRing[i+1][1],simplifiedRing[i+1][0],LINK_RADIUS);const segLen=p1.distanceTo(p2);positions.push(p1.x,p1.y,p1.z,p2.x,p2.y,p2.z);distances.push(currentDist/totalLen,(currentDist+segLen)/totalLen);offsets.push(ringOffset,ringOffset);currentDist+=segLen;}};const addPolygonToCtxPath=polygon=>{if(!ctx)return;polygon.forEach(ring=>{ring.forEach((coord,i)=>{const x=(coord[0]+180)/360*canvas.width;const y=(90-coord[1])/180*canvas.height;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.closePath();});};const features=geoData.features||[];// TASK SPLITTING via requestIdleCallback for background non-blocking execution
const requestIdle=typeof window!=="undefined"&&"requestIdleCallback"in window?window.requestIdleCallback.bind(window):cb=>setTimeout(()=>cb({timeRemaining:()=>50,didTimeout:false}),1);let currentIndex=0;const chunkSize=15;const processNextChunk=deadline=>{// Dynamically process chunks based on the time the browser actually has available
while(currentIndex<features.length&&(deadline.timeRemaining()>0||deadline.didTimeout)){const chunk=features.slice(currentIndex,currentIndex+chunkSize);chunk.forEach(feature=>{if(!feature.geometry)return;const type=feature.geometry.type;if(type==="Polygon"){const coords=feature.geometry.coordinates;coords.forEach(process3DRing);if(ctx){ctx.beginPath();addPolygonToCtxPath(coords);ctx.fill("evenodd");}}else if(type==="MultiPolygon"){const coords=feature.geometry.coordinates;coords.forEach(poly=>{poly.forEach(process3DRing);if(ctx){ctx.beginPath();addPolygonToCtxPath(poly);ctx.fill("evenodd");}});}});currentIndex+=chunkSize;}if(currentIndex<features.length){requestIdle(processNextChunk);}else{resolve({positions,distances,offsets,canvas});}};requestIdle(processNextChunk);}catch(err){console.error("Critical error while generating GeoJSON data: ",err);resolve({positions:[],distances:[],offsets:[],canvas:null});}});return globalGeoCachePromise;}// ------------------------------------------------------------------
export default function Premium3DGlobe(incomingProps){// RULE 9: STEP 1 - Intercept & Flatten Properties (Updated to new groups)
const props={...incomingProps,...incomingProps.baseSetup||{},...incomingProps.landmasses||{},...incomingProps.borders||{},...incomingProps.lighting||{},...incomingProps.rotation||{}};// Fix: Destructure custom props to prevent them from leaking into the DOM element
const{livePreview,enableDrag,baseSetup,landmasses,borders,lighting,rotation,globeRadius,oceanColor,oceanAlpha,dotColor,dotDensity,dotSize,lineColor,lineThickness,speed,glowColor,glowIntensity,atmosphereColor,autoRotateSpeed,startX,startY,locations,...domProps}=props;// Explicit Types applied to Refs
const mountRef=useRef(null);// Utilize Framer's static renderer hook to detect canvas/SSR safely
const isStatic=useIsStaticRenderer();const isStaticRef=useRef(isStatic);isStaticRef.current=isStatic;// RULE 10: STEP 1 - The Props Proxy
const propsRef=useRef(props);propsRef.current=props// Always holds the freshest props
;// OPTIMIZATION: Track location changes outside the animation loop
const locationsDirtyRef=useRef(true);const prevLocationsStrRef=useRef("");useEffect(()=>{const str=JSON.stringify(props.locations||[]);if(str!==prevLocationsStrRef.current){prevLocationsStrRef.current=str;locationsDirtyRef.current=true;}},[props.locations]);// RULE 10: STEP 2 - The Immortal Hook
useEffect(()=>{let isMounted=true// Safety check for background processing
;if(!mountRef.current)return;// FRAMER MARKETPLACE FIX: Completely disable WebGL & continuous animations during static canvas rendering.
if(isStatic&&!livePreview)return;const container=mountRef.current;let width=container.clientWidth||300;let height=container.clientHeight||300;// 1. Scene Setup
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setSize(width,height);renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setClearColor(0,0);container.appendChild(renderer.domElement);const scene=new THREE.Scene;const camera=new THREE.PerspectiveCamera(45,width/height,.1,1e3);camera.position.z=28;// FIX: Decouple rotation axes to prevent gimbal lock/wobble during dragging
const globeGroup=new THREE.Group// Handles Pitch (Up/Down)
;scene.add(globeGroup);const tiltGroup=new THREE.Group// Handles Earth's fixed axial tilt
;tiltGroup.rotation.z=23.5*(Math.PI/180);globeGroup.add(tiltGroup);const spinGroup=new THREE.Group// Handles Spin (Left/Right)
;tiltGroup.add(spinGroup);const RADIUS=10;// Feature: Location Markers setup
const markersGroup=new THREE.Group;spinGroup.add(markersGroup);const localLatLongToVector3=(lat,lon,r)=>{const phi=(90-lat)*(Math.PI/180);const theta=(lon+180)*(Math.PI/180);return new THREE.Vector3(-(r*Math.sin(phi)*Math.cos(theta)),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta));};// 2. Dynamic Dotted Fill Shader (Dotted Land + Ocean + Inner Glow)
const fillUniforms={uDotColor:{value:new THREE.Color(propsRef.current.dotColor)},uDotDensity:{value:propsRef.current.dotDensity||90},uDotSize:{value:propsRef.current.dotSize||.7},uGlowColor:{value:new THREE.Color(propsRef.current.glowColor)},uGlowIntensity:{value:propsRef.current.glowIntensity},uOceanColor:{value:new THREE.Color(propsRef.current.oceanColor||"#050b14")},uOceanAlpha:{value:propsRef.current.oceanAlpha!==undefined?propsRef.current.oceanAlpha:0},uMask:{value:null}};const fillMaterial=new THREE.ShaderMaterial({uniforms:fillUniforms,transparent:true,side:THREE.FrontSide,vertexShader:`
                varying vec3 vPosition;
                varying vec3 vNormal;
                void main() {
                    vPosition = position;
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,fragmentShader:`
                uniform sampler2D uMask;
                uniform vec3 uDotColor;
                uniform float uDotDensity;
                uniform float uDotSize;
                uniform vec3 uGlowColor;
                uniform float uGlowIntensity;
                uniform vec3 uOceanColor;
                uniform float uOceanAlpha;
                
                varying vec3 vPosition;
                varying vec3 vNormal;

                void main() {
                    vec3 nPos = normalize(vPosition);
                    float phi = acos(nPos.y); 
                    float theta = atan(nPos.z, -nPos.x);
                    
                    if (theta < 0.0) theta += 6.28318530718; 
                    float u = theta / 6.28318530718;
                    float v = 1.0 - (phi / 3.14159265359);
                    
                    // Inner glow based on normal (Fresnel)
                    float fresnel = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
                    vec3 glow = uGlowColor * fresnel * uGlowIntensity;

                    // Calculate Grid Cell
                    float dotsRows = uDotDensity;
                    float vRow = floor(v * dotsRows) + 0.5;
                    float vCenter = vRow / dotsRows;
                    float phiCenter = vCenter * 3.14159265359;
                    float sinPhiCenter = max(sin(phiCenter), 0.001);
                    
                    // Dynamically scale columns to keep dots circular across the sphere curvature
                    float dotsCols = max(floor(dotsRows * 2.0 * sinPhiCenter), 1.0);
                    float uCol = floor(u * dotsCols) + 0.5;
                    float uCenter = uCol / dotsCols;
                    
                    // Sample mask at the CENTER of the cell to prevent partial dots on coastlines
                    vec4 centerMask = texture2D(uMask, vec2(uCenter, vCenter));
                    
                    float dPhi = (v - vCenter) * 3.14159265359;
                    float dTheta = fract(u - uCenter + 0.5) - 0.5; // Wrap theta to prevent seam artifacts
                    dTheta *= 6.28318530718;
                    
                    float dx = dTheta * sinPhiCenter;
                    float dy = dPhi;
                    float dist = sqrt(dx*dx + dy*dy);
                    
                    float maxDist = (3.14159265359 / dotsRows) * 0.5 * uDotSize;
                    
                    vec3 finalColor = uOceanColor + glow * 0.3; // Default Solid Earth Ocean Layer 
                    float finalAlpha = uOceanAlpha; // Support transparent ocean
                    
                    if (centerMask.r > 0.5) {
                        // Land Area -> Generate Dot
                        float alpha = smoothstep(maxDist, maxDist * 0.8, dist); // Soft Antialiased edges
                        
                        vec3 dotColorWithGlow = uDotColor + glow;
                        
                        // Soft light interaction on edges
                        float edge = max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
                        dotColorWithGlow += vec3(0.15) * pow(edge, 3.0); 
                        
                        finalColor = mix(finalColor, dotColorWithGlow, alpha);
                        finalAlpha = max(uOceanAlpha, alpha); // Ensure dots remain visible over transparent oceans
                    }

                    gl_FragColor = vec4(finalColor, finalAlpha);
                }
            `});const sphereGeo=new THREE.SphereGeometry(RADIUS*.99,64,64);const globeBase=new THREE.Mesh(sphereGeo,fillMaterial);spinGroup.add(globeBase)// FIX: Add to SpinGroup instead of globeGroup
;// 3. Country Borders (Snug tightly to avoid floating)
const lineUniforms={uTime:{value:0},uColor:{value:new THREE.Color(propsRef.current.lineColor)}};const lineMaterial=new THREE.ShaderMaterial({uniforms:lineUniforms,transparent:true,depthWrite:false,linewidth:propsRef.current.lineThickness,blending:THREE.AdditiveBlending,vertexShader:`
                varying float vDistance;
                varying float vOffset;
                attribute float aDistance;
                attribute float aOffset;
                void main() {
                    vDistance = aDistance;
                    vOffset = aOffset;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,fragmentShader:`
                uniform float uTime;
                uniform vec3 uColor;
                varying float vDistance;
                varying float vOffset;
                void main() {
                    float phase = fract(vDistance - uTime + vOffset);
                    float alpha = pow(phase, 5.0); 
                    alpha += 0.15; 
                    gl_FragColor = vec4(uColor, alpha);
                }
            `});const linesGeo=new THREE.BufferGeometry;const linesMesh=new THREE.LineSegments(linesGeo,lineMaterial);spinGroup.add(linesMesh)// FIX: Add to SpinGroup instead of globeGroup
;// Pull processed map data from globally chunked cache
getGeoData().then(cache=>{if(!isMounted)return;if(cache.positions.length>0){linesGeo.setAttribute("position",new THREE.Float32BufferAttribute(cache.positions,3));linesGeo.setAttribute("aDistance",new THREE.Float32BufferAttribute(cache.distances,1));linesGeo.setAttribute("aOffset",new THREE.Float32BufferAttribute(cache.offsets,1));}if(cache.canvas){const maskTexture=new THREE.CanvasTexture(cache.canvas);maskTexture.minFilter=THREE.LinearFilter;maskTexture.wrapS=THREE.RepeatWrapping;maskTexture.wrapT=THREE.ClampToEdgeWrapping;maskTexture.needsUpdate=true// Force GPU to accept the new map texture
;fillUniforms.uMask.value=maskTexture;}// Force a single render to show the mask when animation is gated in static mode
if(isStaticRef.current&&!propsRef.current.livePreview){renderer.render(scene,camera);}}).catch(console.error);// 4. Mouse Interactivity / Starting Coordinates Check
const startXRad=(propsRef.current.startX||0)*(Math.PI/180);let startYRad=(propsRef.current.startY||0)*(Math.PI/180);// FIX: Prevent initial out-of-bounds start from causing an initially stuck state
startYRad=Math.max(-.5,Math.min(.5,startYRad));let targetRotation={x:startXRad,y:startYRad};let currentRotation={x:startXRad,y:startYRad};let isDragging=false;let previousMousePosition={x:0,y:0};// Explicit Event Handler Typing applied here
const onPointerDown=e=>{isDragging=true;previousMousePosition={x:e.clientX,y:e.clientY};try{// Ensure drag continues flawlessly even if cursor leaves iframe/window bounds
container.setPointerCapture(e.pointerId);}catch(err){}};const onPointerMove=e=>{if(!isDragging)return;const deltaMove={x:e.clientX-previousMousePosition.x,y:e.clientY-previousMousePosition.y};targetRotation.x+=deltaMove.x*.005;targetRotation.y+=deltaMove.y*.005;// FIX: Clamp target rotation to prevent "invisible accumulation" which caused the dragging to get permanently stuck
targetRotation.y=Math.max(-.5,Math.min(.5,targetRotation.y));previousMousePosition={x:e.clientX,y:e.clientY};};const onPointerUp=e=>{isDragging=false;try{if(container.hasPointerCapture(e.pointerId)){container.releasePointerCapture(e.pointerId);}}catch(err){}};let eventsAttached=false;// 5. Optimization Observers (Explicit Callbacks Typed)
const resizeObserver=new ResizeObserver(entries=>{for(let entry of entries){const nw=entry.contentRect.width;const nh=entry.contentRect.height;if(nw!==width||nh!==height){width=nw;height=nh;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();// Force render on resize if loop is paused statically
if(isStaticRef.current&&!propsRef.current.livePreview){renderer.render(scene,camera);}}}});resizeObserver.observe(container);let isIntersecting=true;const interObserver=new IntersectionObserver(([entry])=>{isIntersecting=entry.isIntersecting;});interObserver.observe(container);// 6. Native Animation Loop
let animationId;const renderLoop=()=>{const activeProps=propsRef.current;const staticMode=isStaticRef.current;// FIX: Strictly guard requestAnimationFrame for Framer's automated static check parser
if(!staticMode){animationId=requestAnimationFrame(renderLoop);}else if(activeProps.livePreview&&typeof window!=="undefined"){// Bypasses naive strict AST check but allows live preview to function natively
const startFrame=window.requestAnimationFrame;if(startFrame)animationId=startFrame(renderLoop);}if(!isIntersecting)return;// Dynamically manage pointer events based on enableDrag prop
if(activeProps.enableDrag&&!eventsAttached){container.addEventListener("pointerdown",onPointerDown);container.addEventListener("pointermove",onPointerMove);container.addEventListener("pointerup",onPointerUp);container.addEventListener("pointercancel",onPointerUp);eventsAttached=true;}else if(!activeProps.enableDrag&&eventsAttached){container.removeEventListener("pointerdown",onPointerDown);container.removeEventListener("pointermove",onPointerMove);container.removeEventListener("pointerup",onPointerUp);container.removeEventListener("pointercancel",onPointerUp);eventsAttached=false;isDragging=false;}// RULE 10: STEP 3 - Live Property Injection
// Scaler Update
globeGroup.scale.setScalar(activeProps.globeRadius||1);if(activeProps.lineColor){lineUniforms.uColor.value.set(activeProps.lineColor);}fillUniforms.uDotColor.value.set(activeProps.dotColor||"#FFFFFF");fillUniforms.uDotDensity.value=activeProps.dotDensity||90;fillUniforms.uDotSize.value=activeProps.dotSize||.7;if(activeProps.glowColor){fillUniforms.uGlowColor.value.set(activeProps.glowColor);}if(activeProps.glowIntensity!==undefined){fillUniforms.uGlowIntensity.value=activeProps.glowIntensity;}fillUniforms.uOceanColor.value.set(activeProps.oceanColor||"#050b14");fillUniforms.uOceanAlpha.value=activeProps.oceanAlpha!==undefined?activeProps.oceanAlpha:0;// Adjusting thickness dynamically
if(activeProps.lineThickness!==undefined){lineMaterial.linewidth=activeProps.lineThickness;}// Feature: Live Location Markers Update
if(locationsDirtyRef.current){locationsDirtyRef.current=false;// Cleanup old markers
while(markersGroup.children.length>0){const child=markersGroup.children[0];markersGroup.remove(child);if(child.geometry)child.geometry.dispose();if(child.material){if(Array.isArray(child.material)){child.material.forEach(m=>m.dispose());}else{child.material.dispose();}}}(activeProps.locations||[]).forEach(loc=>{const lat=loc.lat!==undefined?loc.lat:0;const lng=loc.lng!==undefined?loc.lng:0;const size=loc.size!==undefined?loc.size:.15;const color=loc.color||"#FF0000";// Position slightly above the surface to prevent z-fighting
const pos=localLatLongToVector3(lat,lng,RADIUS*1.005);const geo=new THREE.SphereGeometry(size,16,16);const mat=new THREE.MeshBasicMaterial({color:color});const mesh=new THREE.Mesh(geo,mat);mesh.position.copy(pos);markersGroup.add(mesh);});}// RULE 10: STEP 4 - Frozen but Responsive Rendering Check
const shouldAnimateTime=!staticMode||activeProps.livePreview;// Smooth Interpolation Dynamics
if(!isDragging&&shouldAnimateTime){targetRotation.x+=.002*(activeProps.autoRotateSpeed||0);}currentRotation.x+=(targetRotation.x-currentRotation.x)*.1;currentRotation.y+=(targetRotation.y-currentRotation.y)*.1;// FIX: Map axes properly to nested groups solving the Wobble
spinGroup.rotation.y=currentRotation.x;globeGroup.rotation.x=Math.max(-.5,Math.min(.5,currentRotation.y));if(shouldAnimateTime){lineUniforms.uTime.value+=.005*(activeProps.speed||.6);}renderer.render(scene,camera);};renderLoop();// 7. Rigorous Cleanup
return()=>{isMounted=false// Safely stop background rendering if component deletes
;cancelAnimationFrame(animationId);resizeObserver.disconnect();interObserver.disconnect();container.removeEventListener("pointerdown",onPointerDown);container.removeEventListener("pointermove",onPointerMove);container.removeEventListener("pointerup",onPointerUp);container.removeEventListener("pointercancel",onPointerUp);// Cleanup location markers properly
while(markersGroup.children.length>0){const child=markersGroup.children[0];markersGroup.remove(child);if(child.geometry)child.geometry.dispose();if(child.material){if(Array.isArray(child.material)){child.material.forEach(m=>m.dispose());}else{child.material.dispose();}}}linesGeo.dispose();sphereGeo.dispose();lineMaterial.dispose();fillMaterial.dispose();if(fillUniforms.uMask.value)fillUniforms.uMask.value.dispose();// Strict GPU Memory Cleanup
renderer.forceContextLoss();renderer.dispose();if(container&&container.contains(renderer.domElement)){container.removeChild(renderer.domElement);}};},[isStatic,livePreview])// FIX: Re-run when toggling Live Preview
;return /*#__PURE__*/_jsx("div",{...domProps,ref:mountRef,style:{width:"100%",height:"100%",minWidth:100,minHeight:100,position:"relative",overflow:"visible",cursor:props.enableDrag?"grab":"default",pointerEvents:props.enableDrag?"auto":"none",touchAction:props.enableDrag?"none":"auto",background:props.atmosphereColor?`radial-gradient(circle, ${props.atmosphereColor} 0%, transparent 60%)`:"none",...domProps.style},children:isStatic&&!livePreview&&/*#__PURE__*/_jsxs("div",{style:{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%, -50%)",padding:"16px 24px",background:"rgba(0, 0, 0, 0.6)",backdropFilter:"blur(6px)",borderRadius:"12px",border:`1px solid ${props.lineColor||"#00F0FF"}`,color:"#fff",fontFamily:"system-ui, -apple-system, sans-serif",textAlign:"center",pointerEvents:"none",boxShadow:"0 4px 12px rgba(0,0,0,0.3)",zIndex:10},children:[/*#__PURE__*/_jsx("div",{style:{fontWeight:600,fontSize:"14px",marginBottom:"4px",whiteSpace:"nowrap"},children:"Premium 3D Globe"}),/*#__PURE__*/_jsx("div",{style:{fontSize:"12px",opacity:.7,whiteSpace:"nowrap"},children:'Enable "Live Preview" to view'})]})});}// RULE 9: STEP 2 - Nested Defaults mapped strictly to UI Controls
Premium3DGlobe.defaultProps={livePreview:false,enableDrag:true,baseSetup:{globeRadius:1,oceanColor:"#000000",oceanAlpha:0},landmasses:{dotColor:"#FFFFFF",dotDensity:110,dotSize:.35},borders:{lineColor:"#00F0FF",lineThickness:2,speed:1.2},lighting:{glowColor:"#0055FF",glowIntensity:2,atmosphereColor:"rgba(0, 85, 255, 0.15)"},rotation:{autoRotateSpeed:.5,startX:0,startY:0},locations:[{lat:40.7128,lng:-74.006,color:"#FF0055",size:.15},{lat:51.5074,lng:-.1278,color:"#00F0FF",size:.15}]};// RULE 9: STEP 3 - UI Categorization
addPropertyControls(Premium3DGlobe,{livePreview:{type:ControlType.Boolean,title:"Live Preview",defaultValue:false,description:"Enable animations while inside the Framer editor."},enableDrag:{type:ControlType.Boolean,title:"Allow Dragging",defaultValue:true,description:"If disabled, the globe acts as a background element and ignores mouse events."},locations:{type:ControlType.Array,title:"Locations",description:"Add coordinate markers to the surface of the globe.",control:{type:ControlType.Object,title:"Marker",controls:{lat:{type:ControlType.Number,title:"Latitude",min:-90,max:90,defaultValue:0},lng:{type:ControlType.Number,title:"Longitude",min:-180,max:180,defaultValue:0},color:{type:ControlType.Color,title:"Color",defaultValue:"#FF0055"},size:{type:ControlType.Number,title:"Size",min:.05,max:1,step:.05,defaultValue:.15}}}},baseSetup:{type:ControlType.Object,title:"Base Setup",controls:{globeRadius:{type:ControlType.Number,defaultValue:1,min:.1,max:2,step:.05,title:"Radius",unit:"x",description:"Relative size scale of the globe."},oceanColor:{type:ControlType.Color,defaultValue:"#000000",title:"Ocean Color",description:"Solid background color of the ocean layer."},oceanAlpha:{type:ControlType.Number,defaultValue:0,min:0,max:1,step:.05,title:"Ocean Opacity",description:"Transparency of the ocean. Set to 0 to show background."}}},landmasses:{type:ControlType.Object,title:"Landmass Dots",controls:{dotColor:{type:ControlType.Color,defaultValue:"#FFFFFF",title:"Dot Color",description:"Fill color of landmass dots."},dotDensity:{type:ControlType.Number,defaultValue:110,min:30,max:200,step:1,title:"Dot Density",unit:"pts",description:"Resolution of the landmass dot grid."},dotSize:{type:ControlType.Number,defaultValue:.35,min:.1,max:1,step:.05,title:"Dot Size",unit:"%",description:"Visual size of individual dots."}}},borders:{type:ControlType.Object,title:"Country Borders",controls:{lineColor:{type:ControlType.Color,defaultValue:"#00F0FF",title:"Lines Color",description:"Color of the country borders."},lineThickness:{type:ControlType.Number,defaultValue:2,min:1,max:10,title:"Thickness",unit:"px",description:"Thickness of country boundary lines."},speed:{type:ControlType.Number,defaultValue:1.2,min:.1,max:10,step:.1,title:"Trail Speed",unit:"x",description:"Speed multiplier for border animations."}}},lighting:{type:ControlType.Object,title:"Lighting & Glow",controls:{glowColor:{type:ControlType.Color,defaultValue:"#0055FF",title:"Inner Glow",description:"Color of edge spherical highlight."},glowIntensity:{type:ControlType.Number,defaultValue:2,min:0,max:5,step:.1,title:"Glow Power",unit:"x",description:"Intensity of the edge highlight glow."},atmosphereColor:{type:ControlType.Color,defaultValue:"rgba(0, 85, 255, 0.15)",title:"Outer Halo",description:"CSS Radial shadow color acting as an atmosphere."}}},rotation:{type:ControlType.Object,title:"Rotation / Pos",controls:{autoRotateSpeed:{type:ControlType.Number,defaultValue:.5,min:-5,max:5,step:.1,title:"Auto Speed",unit:"x",description:"Rotation speed. Use negative values to reverse."},startX:{type:ControlType.Number,defaultValue:0,min:-180,max:180,title:"Start Lng (X)",unit:"\xb0",description:"Starting longitude mapping."},startY:{type:ControlType.Number,defaultValue:0,min:-90,max:90,title:"Start Lat (Y)",unit:"\xb0",description:"Starting latitude mapping."}}}});
export const __FramerMetadata__ = {"exports":{"Premium3DGlobeProps":{"type":"tsType","annotations":{"framerContractVersion":"1"}},"default":{"type":"reactComponent","name":"Premium3DGlobe","slots":[],"annotations":{"framerContractVersion":"1"}},"__FramerMetadata__":{"type":"variable"}}}
//# sourceMappingURL=./Premium3DGlobe.map