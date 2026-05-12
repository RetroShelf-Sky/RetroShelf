// src/App.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

// ─── THEME ────────────────────────────────────────────────────────────────────
// ─── THEME (single default) ───────────────────────────────────────────────────
const T = {
  bg:"linear-gradient(160deg,#100a00,#1c1205,#0a0600)",
  shelfBg:"linear-gradient(180deg,#2e1a08,#1c1006)",
  shelfBorder:"#7a4820",
  plank:"linear-gradient(180deg,#b07838,#8a5222,#522e0c)",
  plankShadow:"inset 0 2px 0 rgba(255,255,255,0.12),0 5px 18px rgba(0,0,0,0.65)",
  cap:"linear-gradient(180deg,#9b6030,#7a4418,#4e2c0c)",
  capBorder:"#3a1e08",
  base:"linear-gradient(180deg,#2e1a08,#180e04)",
  foot:"linear-gradient(180deg,#4a2808,#1a0c04)",
  footBorder:"#2a1408",
  titleColor:"#c8a040",
  titleGlow:"rgba(200,160,60,0.35)",
  titleSub:"rgba(255,255,255,0.15)",
  rowLabel:"rgba(255,255,255,0.14)",
  libraryRow:"rgba(14,8,2,0.7),rgba(6,3,1,0.95)",
  gold:"#c8a040",
  bodyBg:"#0a0600",
};

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
function G(){
  return(
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Boogaloo&family=Nunito:wght@400;500;600;700;800;900&display=swap');
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      body{background:#0a0600;font-family:'Nunito',sans-serif;overflow:hidden}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes popUp{from{opacity:0;transform:scale(0.88) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes rainbowSpin{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
      @keyframes particleDrift{0%{transform:translateY(0) translateX(0);opacity:0}20%{opacity:1}100%{transform:translateY(-110vh) translateX(20px);opacity:0}}
      @keyframes tooltipIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
      ::-webkit-scrollbar{width:5px;height:5px}
      ::-webkit-scrollbar-track{background:rgba(255,255,255,0.02)}
      ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:3px}
      button{outline:none;font-family:'Nunito',sans-serif}
      input,select,textarea{outline:none;font-family:'Nunito',sans-serif}
      .info-btn{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.5);font-size:9px;font-weight:700;cursor:help;flex-shrink:0;margin-left:6px;vertical-align:middle;transition:all 0.15s}
      .info-btn:hover{background:rgba(255,255,255,0.2);color:rgba(255,255,255,0.9)}
      .rs-tooltip{position:fixed;background:#1a1a2e;border:1px solid rgba(255,255,255,0.18);border-radius:8px;padding:9px 13px;font-size:11px;color:rgba(255,255,255,0.85);line-height:1.55;width:230px;z-index:99999;pointer-events:none;animation:tooltipIn 0.15s ease;font-family:'Nunito',sans-serif;font-weight:500;box-shadow:0 12px 32px rgba(0,0,0,0.8)}
    `}</style>
  );
}

// ─── INFO TOOLTIP ─────────────────────────────────────────────────────────────
import { createPortal } from "react-dom";

function Info({tip}){
  const [show,setShow]=useState(false);
  const [pos,setPos]=useState({top:0,left:0});
  const ref=useState(()=>({current:null}))[0];

  const handleEnter=(e)=>{
    const rect=e.currentTarget.getBoundingClientRect();
    setPos({
      top: rect.top - 8,
      left: rect.left + rect.width/2,
    });
    setShow(true);
  };

  return(
    <>
      <span
        className="info-btn"
        onMouseEnter={handleEnter}
        onMouseLeave={()=>setShow(false)}
      >i</span>
      {show&&createPortal(
        <div className="rs-tooltip" style={{
          top: pos.top,
          left: pos.left,
          transform:"translate(-50%, -100%)",
        }}>{tip}</div>,
        document.body
      )}
    </>
  );
}

// ─── LOGOS ────────────────────────────────────────────────────────────────────
function LogoPlaystation({size=80}){return(<svg width={size} height={size} viewBox="0 0 100 100" fill="none"><polygon points="50,5 62,26 38,26" fill="#4CAF50"/><circle cx="82" cy="50" r="14" fill="none" stroke="#E53935" strokeWidth="7"/><line x1="40" y1="74" x2="60" y2="94" stroke="#1565C0" strokeWidth="7" strokeLinecap="round"/><line x1="60" y1="74" x2="40" y2="94" stroke="#1565C0" strokeWidth="7" strokeLinecap="round"/><rect x="4" y="36" width="28" height="28" rx="4" fill="#AD1457"/></svg>);}
function LogoXbox({size=90}){return(<svg width={size} height={size} viewBox="0 0 90 90" fill="none"><circle cx="45" cy="45" r="42" fill="white"/><circle cx="45" cy="45" r="42" fill="none" stroke="#ddd" strokeWidth="1.5"/><text x="45" y="62" textAnchor="middle" fill="#2e7d32" fontSize="58" fontFamily="'Arial Black',sans-serif" fontWeight="900">X</text></svg>);}
function LogoN64({size=80}){return(<svg width={size} height={size} viewBox="0 0 80 80" fill="none"><defs><linearGradient id="n64g" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox"><stop offset="0%" stopColor="#ff0000"/><stop offset="12%" stopColor="#ff4400"/><stop offset="22%" stopColor="#ff8800"/><stop offset="32%" stopColor="#ffcc00"/><stop offset="42%" stopColor="#ffff00"/><stop offset="52%" stopColor="#88ff00"/><stop offset="60%" stopColor="#00cc44"/><stop offset="68%" stopColor="#00bbaa"/><stop offset="76%" stopColor="#0088ff"/><stop offset="84%" stopColor="#4444ff"/><stop offset="92%" stopColor="#aa00ff"/><stop offset="100%" stopColor="#ff00cc"/></linearGradient></defs><text x="2" y="62" fill="url(#n64g)" fontSize="64" fontFamily="'Arial Black',sans-serif" fontWeight="900">64</text></svg>);}
function LogoGameCube({size=80}){return(<svg width={size} height={size} viewBox="0 0 80 80" fill="none"><path d="M14,30 L14,62 L46,62 L46,30 Z" fill="#8E24AA"/><path d="M16,32 L16,60 L44,60 L44,32 Z" fill="#9C27B0"/><path d="M14,30 L30,18 L62,18 L46,30 Z" fill="#AB47BC"/><path d="M16,29 L31,19 L60,19 L45,29 Z" fill="#BA68C8" opacity="0.7"/><path d="M46,30 L62,18 L62,50 L46,62 Z" fill="#6A1B9A"/><path d="M47,31 L61,20 L61,49 L47,61 Z" fill="#7B1FA2" opacity="0.6"/><path d="M14,30 L46,30 L46,62 L14,62 Z" fill="none" stroke="#4A148C" strokeWidth="1.5"/><path d="M14,30 L30,18 L62,18 L46,30 Z" fill="none" stroke="#4A148C" strokeWidth="1.5"/><path d="M46,30 L62,18 L62,50 L46,62 Z" fill="none" stroke="#4A148C" strokeWidth="1.5"/><text x="18" y="55" fill="white" fontSize="28" fontFamily="'Arial Black',sans-serif" fontWeight="900" letterSpacing="-1">G</text></svg>);}
function LogoWii({size=90}){return(<svg width={size} height={size*0.55} viewBox="0 0 90 50" fill="none"><text x="45" y="42" textAnchor="middle" fill="white" fontSize="46" fontFamily="'Arial Black',sans-serif" fontWeight="900" letterSpacing="1">Wii</text></svg>);}
function LogoDS({size=90}){return(<svg width={size} height={size*0.55} viewBox="0 0 90 50" fill="none"><text x="45" y="42" textAnchor="middle" fill="white" fontSize="46" fontFamily="'Times New Roman',serif" fontStyle="italic" fontWeight="400" letterSpacing="-1">DS</text></svg>);}
function LogoDreamcast({size=200}){return(<svg width={size} height={size*0.5} viewBox="0 0 200 100" fill="none"><g opacity="0.55"><path d="M 50 50 m -36 0 a 36 36 0 1 1 36 36" stroke="#FF6D00" strokeWidth="7" fill="none" strokeLinecap="round"/><path d="M 50 50 m -22 0 a 22 22 0 1 1 22 22" stroke="#FF8F00" strokeWidth="5.5" fill="none" strokeLinecap="round"/><path d="M 50 50 m -10 0 a 10 10 0 1 1 10 10" stroke="#FFA726" strokeWidth="4" fill="none" strokeLinecap="round"/><circle cx="50" cy="50" r="4" fill="#FFB74D"/></g><text x="115" y="60" textAnchor="middle" fill="white" fontSize="22" fontFamily="'Arial',sans-serif" fontWeight="300" letterSpacing="3">dreamcast</text></svg>);}

// ─── CONSOLE DATA ─────────────────────────────────────────────────────────────
const CONSOLES={
  ps1:      {label:"PlayStation",    accent:"#93c5fd",color:"#1e3a8a",bg:"#060d1f",emulator:"DuckStation",ext:[".bin",".cue",".iso",".img",".pbp",".chd"]},
  ps2:      {label:"PlayStation 2",  accent:"#3b82f6",color:"#0f172a",bg:"#03060f",emulator:"PCSX2",      ext:[".iso",".bin",".img",".chd"]},
  ps3:      {label:"PlayStation 3",  accent:"#0ea5e9",color:"#020617",bg:"#020408",emulator:"RPCS3",      ext:[".pkg",".iso"]},
  xbox:     {label:"Xbox Original",  accent:"#86efac",color:"#14532d",bg:"#041a0c",emulator:"xemu",       ext:[".iso",".xiso"]},
  xbox360:  {label:"Xbox 360",       accent:"#6ee7b7",color:"#065f46",bg:"#021a10",emulator:"Xenia",      ext:[".iso",".xex"]},
  n64:      {label:"Nintendo 64",    accent:"#ff6b6b",color:"#0a0515",bg:"#060310",emulator:"Project64",  ext:[".z64",".n64",".v64"],rainbow:true},
  gamecube: {label:"GameCube",       accent:"#c084fc",color:"#3b0764",bg:"#0e0318",emulator:"Dolphin",    ext:[".iso",".gcm",".gcz",".rvz"]},
  wii:      {label:"Nintendo Wii",   accent:"#e2e8f0",color:"#334155",bg:"#080c12",emulator:"Dolphin",    ext:[".iso",".wbfs",".wad",".rvz"]},
  wiiu:     {label:"Nintendo Wii U", accent:"#7dd3fc",color:"#0c4a6e",bg:"#030f1a",emulator:"Cemu",       ext:[".wud",".wux",".iso",".rpx"]},
  ds:       {label:"Nintendo DS",    accent:"#f87171",color:"#450a0a",bg:"#1a0404",emulator:"melonDS",    ext:[".nds",".dsi"]},
  "3ds":    {label:"Nintendo 3DS",   accent:"#f87171",color:"#450a0a",bg:"#1a0404",emulator:"Lime3DS",    ext:[".3ds",".cia",".cxi"]},
  dreamcast:{label:"Dreamcast",      accent:"#fed7aa",color:"#7c2d12",bg:"#1a0803",emulator:"Flycast",    ext:[".gdi",".cdi",".chd"]},
};

const GAME_COLORS=[["#1e1b4b","#4338ca"],["#14532d","#16a34a"],["#450a0a","#dc2626"],["#1c1917","#78716c"],["#0c4a6e","#0284c7"],["#3b0764","#9333ea"],["#162032","#1d4ed8"],["#431407","#ea580c"],["#064e3b","#059669"],["#1e3a5f","#3b82f6"],["#4a1942","#a855f7"],["#1a2e05","#65a30d"]];

// ─── CONTROLLER LAYOUTS ───────────────────────────────────────────────────────
// Each button has: id, label (name), and desc (what it does in games)
const CONTROLLER_LAYOUTS={
  ps:[
    {group:"Face Buttons",buttons:[
      {id:"cross",   label:"Cross ✕",      desc:"Confirm, jump, interact — the main action button"},
      {id:"circle",  label:"Circle ○",     desc:"Cancel, run, secondary action"},
      {id:"square",  label:"Square □",     desc:"Attack, reload, or context action"},
      {id:"triangle",label:"Triangle △",   desc:"Menu, weapon switch, or context action"},
    ]},
    {group:"Triggers & Bumpers",buttons:[
      {id:"l1",label:"L1",desc:"Left bumper — often weapon select or block"},
      {id:"r1",label:"R1",desc:"Right bumper — often fire, sprint, or action"},
      {id:"l2",label:"L2",desc:"Left trigger — aim, accelerate (analog pressure)"},
      {id:"r2",label:"R2",desc:"Right trigger — shoot, brake (analog pressure)"},
    ]},
    {group:"System Buttons",buttons:[
      {id:"start", label:"Start",  desc:"Pause menu / confirm"},
      {id:"select",label:"Select", desc:"Map, inventory, or secondary menu"},
      {id:"l3",    label:"L3 (L Stick Click)", desc:"Click the left stick in — often sprint or crouch"},
      {id:"r3",    label:"R3 (R Stick Click)", desc:"Click the right stick in — often melee or zoom"},
    ]},
    {group:"D-Pad",buttons:[
      {id:"up",   label:"D-Pad Up",    desc:"Navigate menus up / quick select"},
      {id:"down", label:"D-Pad Down",  desc:"Navigate menus down / quick select"},
      {id:"left", label:"D-Pad Left",  desc:"Navigate left / weapon switch"},
      {id:"right",label:"D-Pad Right", desc:"Navigate right / weapon switch"},
    ]},
    {group:"Analog Sticks",buttons:[
      {id:"lstick_x",label:"Left Stick X",  desc:"Move left/right — character movement"},
      {id:"lstick_y",label:"Left Stick Y",  desc:"Move forward/back — character movement"},
      {id:"rstick_x",label:"Right Stick X", desc:"Look left/right — camera control"},
      {id:"rstick_y",label:"Right Stick Y", desc:"Look up/down — camera control"},
    ]},
  ],
  gamecube:[
    {group:"Face Buttons",buttons:[
      {id:"a",label:"A (Large Green)",desc:"Main confirm/action button — the biggest button on the controller"},
      {id:"b",label:"B (Red)",        desc:"Cancel, special move, or secondary action"},
      {id:"x",label:"X",              desc:"Secondary action — often jump or attack"},
      {id:"y",label:"Y",              desc:"Secondary action — often grab or special"},
      {id:"z",label:"Z (Top Right)",  desc:"Unique GCN button — often grab, shield, or inventory"},
    ]},
    {group:"Triggers",buttons:[
      {id:"l",label:"L Trigger (Analog)", desc:"Left trigger — analog pressure sensitive. Often shield or brake"},
      {id:"r",label:"R Trigger (Analog)", desc:"Right trigger — analog pressure sensitive. Often shield or drift"},
    ]},
    {group:"System",buttons:[
      {id:"start",label:"Start",desc:"Pause the game"},
    ]},
    {group:"D-Pad",buttons:[
      {id:"up",   label:"D-Pad Up",    desc:"Menu navigation / taunt / quick select"},
      {id:"down", label:"D-Pad Down",  desc:"Menu navigation / taunt / quick select"},
      {id:"left", label:"D-Pad Left",  desc:"Menu navigation / quick select"},
      {id:"right",label:"D-Pad Right", desc:"Menu navigation / quick select"},
    ]},
    {group:"Main Stick",buttons:[
      {id:"stick_x",label:"Main Stick X", desc:"Move character left/right"},
      {id:"stick_y",label:"Main Stick Y", desc:"Move character forward/back"},
    ]},
    {group:"C-Stick",buttons:[
      {id:"cstick_x",label:"C-Stick X", desc:"Camera control left/right — the yellow stick"},
      {id:"cstick_y",label:"C-Stick Y", desc:"Camera control up/down — the yellow stick"},
    ]},
  ],
  wii:[
    {group:"Wii Remote Buttons",buttons:[
      {id:"a",    label:"A (Big Button)",  desc:"Main action button on the face of the remote"},
      {id:"b",    label:"B (Trigger)",     desc:"Trigger on the back of the remote — often grab or fire"},
      {id:"1",    label:"1",               desc:"Secondary button — game specific"},
      {id:"2",    label:"2",               desc:"Secondary button — game specific"},
      {id:"plus", label:"+ (Start/Pause)", desc:"Pause or start"},
      {id:"minus",label:"− (Select)",      desc:"Select or minus function"},
      {id:"home", label:"Home",            desc:"Return to Wii menu / pause overlay"},
    ]},
    {group:"D-Pad",buttons:[
      {id:"up",   label:"D-Pad Up",    desc:"Navigate menus / game specific action"},
      {id:"down", label:"D-Pad Down",  desc:"Navigate menus / game specific action"},
      {id:"left", label:"D-Pad Left",  desc:"Navigate menus / game specific action"},
      {id:"right",label:"D-Pad Right", desc:"Navigate menus / game specific action"},
    ]},
    {group:"Nunchuk",buttons:[
      {id:"nc_c",label:"Nunchuk C",       desc:"C button on the nunchuk — often jump or action"},
      {id:"nc_z",label:"Nunchuk Z",       desc:"Z trigger on the nunchuk — often block or special"},
      {id:"nc_x",label:"Nunchuk Stick X", desc:"Nunchuk analog stick left/right — character movement"},
      {id:"nc_y",label:"Nunchuk Stick Y", desc:"Nunchuk analog stick up/down — character movement"},
    ]},
    {group:"IR Pointer (Aim)",buttons:[
      {id:"ir_x",label:"IR Pointer X", desc:"Where the remote is pointing horizontally — used for aiming at the screen"},
      {id:"ir_y",label:"IR Pointer Y", desc:"Where the remote is pointing vertically — used for aiming at the screen"},
    ]},
    {group:"Wii Remote Motion",buttons:[
      {id:"accel_x",label:"Tilt X (Roll)",    desc:"Tilting the remote left or right — e.g. steering in Mario Kart"},
      {id:"accel_y",label:"Tilt Y (Pitch)",   desc:"Tilting the remote up or down — e.g. aiming up/down"},
      {id:"accel_z",label:"Tilt Z (Yaw)",     desc:"Rotating the remote flat — e.g. turning in some games"},
      {id:"swing_x",label:"Swing Left/Right", desc:"Swinging the remote sideways — e.g. swinging a tennis racket"},
      {id:"swing_y",label:"Swing Up/Down",    desc:"Swinging the remote up or down — e.g. bowling"},
      {id:"swing_z",label:"Swing Forward",    desc:"Thrusting the remote forward — e.g. stabbing in Zelda"},
      {id:"shake_x",label:"Shake X",          desc:"Shaking the remote left/right — e.g. collecting items"},
      {id:"shake_y",label:"Shake Y",          desc:"Shaking the remote up/down — e.g. charging moves"},
      {id:"shake_z",label:"Shake Z",          desc:"Shaking the remote toward screen — e.g. some mini games"},
    ]},
    {group:"Nunchuk Motion",buttons:[
      {id:"nc_accel_x",label:"Nunchuk Tilt X", desc:"Tilting the nunchuk left/right"},
      {id:"nc_accel_y",label:"Nunchuk Tilt Y", desc:"Tilting the nunchuk up/down"},
      {id:"nc_accel_z",label:"Nunchuk Tilt Z", desc:"Rotating the nunchuk — game specific"},
    ]},
  ],
  wiiu:[
    {group:"Face Buttons",buttons:[
      {id:"a",label:"A",desc:"Main confirm/action button"},
      {id:"b",label:"B",desc:"Cancel or jump"},
      {id:"x",label:"X",desc:"Secondary action"},
      {id:"y",label:"Y",desc:"Secondary action"},
    ]},
    {group:"Triggers & Bumpers",buttons:[
      {id:"l", label:"L Bumper",  desc:"Left bumper"},
      {id:"r", label:"R Bumper",  desc:"Right bumper"},
      {id:"zl",label:"ZL Trigger",desc:"Left trigger — analog"},
      {id:"zr",label:"ZR Trigger",desc:"Right trigger — analog"},
    ]},
    {group:"System",buttons:[
      {id:"plus", label:"+ (Start)",  desc:"Pause / start"},
      {id:"minus",label:"− (Select)", desc:"Select / minus"},
      {id:"home", label:"Home",       desc:"Return to Wii U menu"},
      {id:"lclick",label:"L Stick Click",desc:"Press left stick in"},
      {id:"rclick",label:"R Stick Click",desc:"Press right stick in"},
    ]},
    {group:"D-Pad",buttons:[
      {id:"up",   label:"D-Pad Up",    desc:"Navigate menus up"},
      {id:"down", label:"D-Pad Down",  desc:"Navigate menus down"},
      {id:"left", label:"D-Pad Left",  desc:"Navigate menus left"},
      {id:"right",label:"D-Pad Right", desc:"Navigate menus right"},
    ]},
    {group:"Analog Sticks",buttons:[
      {id:"lstick_x",label:"Left Stick X",  desc:"Move character left/right"},
      {id:"lstick_y",label:"Left Stick Y",  desc:"Move character forward/back"},
      {id:"rstick_x",label:"Right Stick X", desc:"Camera left/right"},
      {id:"rstick_y",label:"Right Stick Y", desc:"Camera up/down"},
    ]},
  ],
  n64:[
    {group:"Face Buttons",buttons:[
      {id:"a",    label:"A (Blue)",      desc:"Main action/confirm button"},
      {id:"b",    label:"B (Green)",     desc:"Secondary action — attack, special"},
      {id:"start",label:"Start",         desc:"Pause game / open menu"},
      {id:"z",    label:"Z Trigger",     desc:"Trigger on back of controller — often grab or Z-target"},
    ]},
    {group:"Shoulder Buttons",buttons:[
      {id:"l",label:"L",desc:"Left shoulder — camera or modifier"},
      {id:"r",label:"R",desc:"Right shoulder — camera or modifier"},
    ]},
    {group:"D-Pad",buttons:[
      {id:"up",   label:"D-Pad Up",    desc:"Menu navigation / alternative action"},
      {id:"down", label:"D-Pad Down",  desc:"Menu navigation / alternative action"},
      {id:"left", label:"D-Pad Left",  desc:"Menu navigation / alternative action"},
      {id:"right",label:"D-Pad Right", desc:"Menu navigation / alternative action"},
    ]},
    {group:"C-Buttons",buttons:[
      {id:"cup",   label:"C-Up",    desc:"Camera up / game specific action"},
      {id:"cdown", label:"C-Down",  desc:"Camera down / game specific action"},
      {id:"cleft", label:"C-Left",  desc:"Camera left / game specific action"},
      {id:"cright",label:"C-Right", desc:"Camera right / game specific action"},
    ]},
    {group:"Analog Stick",buttons:[
      {id:"stick_x",label:"Analog Stick X", desc:"Move character left/right — the N64's single analog stick"},
      {id:"stick_y",label:"Analog Stick Y", desc:"Move character forward/back"},
    ]},
  ],
  ds:[
    {group:"Face Buttons",buttons:[
      {id:"a",label:"A",desc:"Confirm, jump, main action"},
      {id:"b",label:"B",desc:"Cancel, attack, or secondary"},
      {id:"x",label:"X",desc:"Context action — game specific"},
      {id:"y",label:"Y",desc:"Context action — game specific"},
    ]},
    {group:"Shoulder Buttons",buttons:[
      {id:"l",label:"L",desc:"Left shoulder — often camera or sprint"},
      {id:"r",label:"R",desc:"Right shoulder — often camera or sprint"},
    ]},
    {group:"System",buttons:[
      {id:"start", label:"Start",  desc:"Pause / start"},
      {id:"select",label:"Select", desc:"Map / inventory / alternate menu"},
      {id:"lid",   label:"Lid / Hinge", desc:"Closing the DS lid — pauses some games"},
    ]},
    {group:"D-Pad",buttons:[
      {id:"up",   label:"D-Pad Up",    desc:"Move or navigate up"},
      {id:"down", label:"D-Pad Down",  desc:"Move or navigate down"},
      {id:"left", label:"D-Pad Left",  desc:"Move or navigate left"},
      {id:"right",label:"D-Pad Right", desc:"Move or navigate right"},
    ]},
    {group:"Touch Screen",buttons:[
      {id:"touch_x",label:"Touch X", desc:"Horizontal position of stylus on bottom touch screen"},
      {id:"touch_y",label:"Touch Y", desc:"Vertical position of stylus on bottom touch screen"},
    ]},
  ],
  "3ds":[
    {group:"Face Buttons",buttons:[
      {id:"a",label:"A",desc:"Confirm, jump, main action"},
      {id:"b",label:"B",desc:"Cancel, attack, or secondary"},
      {id:"x",label:"X",desc:"Context action — game specific"},
      {id:"y",label:"Y",desc:"Context action — game specific"},
    ]},
    {group:"Triggers & Bumpers",buttons:[
      {id:"l", label:"L",  desc:"Left shoulder button"},
      {id:"r", label:"R",  desc:"Right shoulder button"},
      {id:"zl",label:"ZL", desc:"Left trigger — New 3DS only"},
      {id:"zr",label:"ZR", desc:"Right trigger — New 3DS only"},
    ]},
    {group:"System",buttons:[
      {id:"start", label:"Start",  desc:"Pause / start"},
      {id:"select",label:"Select", desc:"Select / secondary menu"},
      {id:"home",  label:"Home",   desc:"Return to 3DS home screen"},
    ]},
    {group:"D-Pad",buttons:[
      {id:"up",   label:"D-Pad Up",    desc:"Navigate up"},
      {id:"down", label:"D-Pad Down",  desc:"Navigate down"},
      {id:"left", label:"D-Pad Left",  desc:"Navigate left"},
      {id:"right",label:"D-Pad Right", desc:"Navigate right"},
    ]},
    {group:"Circle Pad & C-Stick",buttons:[
      {id:"cpad_x",  label:"Circle Pad X", desc:"Main analog stick — move left/right"},
      {id:"cpad_y",  label:"Circle Pad Y", desc:"Main analog stick — move forward/back"},
      {id:"cstick_x",label:"C-Stick X",    desc:"Second analog nub — New 3DS only — camera left/right"},
      {id:"cstick_y",label:"C-Stick Y",    desc:"Second analog nub — New 3DS only — camera up/down"},
    ]},
    {group:"Touch Screen",buttons:[
      {id:"touch_x",label:"Touch X", desc:"Stylus horizontal position on bottom screen"},
      {id:"touch_y",label:"Touch Y", desc:"Stylus vertical position on bottom screen"},
    ]},
    {group:"Gyroscope",buttons:[
      {id:"gyro_x",label:"Gyro X (Tilt)", desc:"Tilt the 3DS left/right — used in some games for aiming"},
      {id:"gyro_y",label:"Gyro Y (Tilt)", desc:"Tilt the 3DS forward/back"},
      {id:"gyro_z",label:"Gyro Z (Twist)",desc:"Rotate the 3DS — used in some mini games"},
    ]},
  ],
  xbox:[
    {group:"Face Buttons",buttons:[
      {id:"a",label:"A (Green)",  desc:"Main confirm/action button"},
      {id:"b",label:"B (Red)",    desc:"Cancel or secondary action"},
      {id:"x",label:"X (Blue)",   desc:"Context action — reload, interact"},
      {id:"y",label:"Y (Yellow)", desc:"Context action — game specific"},
      {id:"white",label:"White Button", desc:"Unique to the original Xbox — extra action button, often inventory or map"},
      {id:"black",label:"Black Button", desc:"Unique to the original Xbox — extra action button, often flashlight or special"},
    ]},
    {group:"Triggers",buttons:[
      {id:"lt",label:"Left Trigger",  desc:"Analog trigger — aim, accelerate, or secondary fire"},
      {id:"rt",label:"Right Trigger", desc:"Analog trigger — shoot, brake, or main fire"},
    ]},
    {group:"System",buttons:[
      {id:"start",label:"Start", desc:"Pause / open menu"},
      {id:"back", label:"Back",  desc:"Back / select / secondary menu"},
      {id:"ls",   label:"L Stick Click", desc:"Press left stick in — often sprint or crouch"},
      {id:"rs",   label:"R Stick Click", desc:"Press right stick in — often melee or zoom"},
    ]},
    {group:"D-Pad",buttons:[
      {id:"up",   label:"D-Pad Up",    desc:"Navigate menus / quick select"},
      {id:"down", label:"D-Pad Down",  desc:"Navigate menus / quick select"},
      {id:"left", label:"D-Pad Left",  desc:"Navigate menus / quick select"},
      {id:"right",label:"D-Pad Right", desc:"Navigate menus / quick select"},
    ]},
    {group:"Analog Sticks",buttons:[
      {id:"lstick_x",label:"Left Stick X",  desc:"Move left/right — character movement"},
      {id:"lstick_y",label:"Left Stick Y",  desc:"Move forward/back — character movement"},
      {id:"rstick_x",label:"Right Stick X", desc:"Look left/right — camera"},
      {id:"rstick_y",label:"Right Stick Y", desc:"Look up/down — camera"},
    ]},
  ],
  xbox360:[
    {group:"Face Buttons",buttons:[
      {id:"a",label:"A (Green)",  desc:"Main confirm/action button"},
      {id:"b",label:"B (Red)",    desc:"Cancel or secondary action"},
      {id:"x",label:"X (Blue)",   desc:"Reload, interact, or context action"},
      {id:"y",label:"Y (Yellow)", desc:"Context action — game specific"},
    ]},
    {group:"Triggers & Bumpers",buttons:[
      {id:"lb",label:"Left Bumper",   desc:"Left bumper — weapon select or block"},
      {id:"rb",label:"Right Bumper",  desc:"Right bumper — melee or alternate fire"},
      {id:"lt",label:"Left Trigger",  desc:"Analog trigger — aim down sights"},
      {id:"rt",label:"Right Trigger", desc:"Analog trigger — shoot / accelerate"},
    ]},
    {group:"System",buttons:[
      {id:"start",label:"Start", desc:"Pause / open menu"},
      {id:"back", label:"Back",  desc:"Back / select / map"},
      {id:"ls",   label:"L Stick Click", desc:"Press left stick in — sprint or crouch"},
      {id:"rs",   label:"R Stick Click", desc:"Press right stick in — melee"},
    ]},
    {group:"D-Pad",buttons:[
      {id:"up",   label:"D-Pad Up",    desc:"Navigate / quick select"},
      {id:"down", label:"D-Pad Down",  desc:"Navigate / quick select"},
      {id:"left", label:"D-Pad Left",  desc:"Navigate / quick select"},
      {id:"right",label:"D-Pad Right", desc:"Navigate / quick select"},
    ]},
    {group:"Analog Sticks",buttons:[
      {id:"lstick_x",label:"Left Stick X",  desc:"Move left/right"},
      {id:"lstick_y",label:"Left Stick Y",  desc:"Move forward/back"},
      {id:"rstick_x",label:"Right Stick X", desc:"Look left/right"},
      {id:"rstick_y",label:"Right Stick Y", desc:"Look up/down"},
    ]},
  ],
  dreamcast:[
    {group:"Face Buttons",buttons:[
      {id:"a",label:"A",desc:"Main action/confirm"},
      {id:"b",label:"B",desc:"Jump, cancel, or secondary"},
      {id:"x",label:"X",desc:"Context action — game specific"},
      {id:"y",label:"Y",desc:"Context action — game specific"},
      {id:"start",label:"Start",desc:"Pause / start"},
    ]},
    {group:"Analog Triggers",buttons:[
      {id:"lt",label:"L Trigger (Analog)", desc:"Analog pressure trigger — often brake or secondary"},
      {id:"rt",label:"R Trigger (Analog)", desc:"Analog pressure trigger — often accelerate or attack"},
    ]},
    {group:"D-Pad",buttons:[
      {id:"up",   label:"D-Pad Up",    desc:"Navigate / move up"},
      {id:"down", label:"D-Pad Down",  desc:"Navigate / move down"},
      {id:"left", label:"D-Pad Left",  desc:"Navigate / move left"},
      {id:"right",label:"D-Pad Right", desc:"Navigate / move right"},
    ]},
    {group:"Analog Stick",buttons:[
      {id:"stick_x",label:"Analog Stick X", desc:"Move character or camera left/right"},
      {id:"stick_y",label:"Analog Stick Y", desc:"Move character or camera up/down"},
    ]},
  ],
};

function getLayoutKey(id){
  if(id==="ps1"||id==="ps2"||id==="ps3") return "ps";
  if(id==="xbox360") return "xbox360";
  if(id==="xbox") return "xbox";
  if(id==="gamecube") return "gamecube";
  if(id==="wii") return "wii";
  if(id==="wiiu") return "wiiu";
  if(id==="n64") return "n64";
  if(id==="ds") return "ds";
  if(id==="3ds") return "3ds";
  if(id==="dreamcast") return "dreamcast";
  return "xbox360";
}

function getDefaultBindings(k){
  const d={
    ps:{cross:"A",circle:"B",square:"X",triangle:"Y",l1:"LB",r1:"RB",l2:"LT",r2:"RT",l3:"LS",r3:"RS",start:"Start",select:"Back",up:"Up",down:"Down",left:"Left",right:"Right",lstick_x:"LX",lstick_y:"LY",rstick_x:"RX",rstick_y:"RY"},
    gamecube:{a:"A",b:"B",x:"X",y:"Y",z:"Z",start:"Start",l:"LT",r:"RT",up:"Up",down:"Down",left:"Left",right:"Right",stick_x:"LX",stick_y:"LY",cstick_x:"RX",cstick_y:"RY"},
    wii:{a:"A",b:"B","1":"1","2":"2",plus:"+",minus:"-",home:"Home",up:"Up",down:"Down",left:"Left",right:"Right",nc_c:"C",nc_z:"Z",nc_x:"LX",nc_y:"LY",ir_x:"MouseX",ir_y:"MouseY",accel_x:"TiltX",accel_y:"TiltY",accel_z:"TiltZ",nc_accel_x:"NTiltX",nc_accel_y:"NTiltY",nc_accel_z:"NTiltZ",swing_x:"SwingX",swing_y:"SwingY",swing_z:"SwingZ",shake_x:"ShakeX",shake_y:"ShakeY",shake_z:"ShakeZ"},
    wiiu:{a:"A",b:"B",x:"X",y:"Y",l:"LB",r:"RB",zl:"LT",zr:"RT",plus:"Start",minus:"Back",home:"Home",lclick:"LS",rclick:"RS",up:"Up",down:"Down",left:"Left",right:"Right",lstick_x:"LX",lstick_y:"LY",rstick_x:"RX",rstick_y:"RY"},
    n64:{a:"A",b:"B",z:"Z",start:"Start",l:"LB",r:"RB",up:"Up",down:"Down",left:"Left",right:"Right",cup:"CUp",cdown:"CDown",cleft:"CLeft",cright:"CRight",stick_x:"LX",stick_y:"LY"},
    ds:{a:"A",b:"B",x:"X",y:"Y",l:"LB",r:"RB",start:"Start",select:"Back",up:"Up",down:"Down",left:"Left",right:"Right",touch_x:"MouseX",touch_y:"MouseY",lid:"F"},
    "3ds":{a:"A",b:"B",x:"X",y:"Y",l:"LB",r:"RB",zl:"LT",zr:"RT",start:"Start",select:"Back",home:"Home",up:"Up",down:"Down",left:"Left",right:"Right",cpad_x:"LX",cpad_y:"LY",cstick_x:"RX",cstick_y:"RY",touch_x:"MouseX",touch_y:"MouseY",gyro_x:"GyroX",gyro_y:"GyroY",gyro_z:"GyroZ"},
    xbox:{a:"A",b:"B",x:"X",y:"Y",white:"Q",black:"E",lt:"LT",rt:"RT",start:"Start",back:"Back",ls:"LS",rs:"RS",up:"Up",down:"Down",left:"Left",right:"Right",lstick_x:"LX",lstick_y:"LY",rstick_x:"RX",rstick_y:"RY"},
    xbox360:{a:"A",b:"B",x:"X",y:"Y",lb:"LB",rb:"RB",lt:"LT",rt:"RT",start:"Start",back:"Back",ls:"LS",rs:"RS",up:"Up",down:"Down",left:"Left",right:"Right",lstick_x:"LX",lstick_y:"LY",rstick_x:"RX",rstick_y:"RY"},
    dreamcast:{a:"A",b:"B",x:"X",y:"Y",start:"Start",lt:"LT",rt:"RT",up:"Up",down:"Down",left:"Left",right:"Right",stick_x:"LX",stick_y:"LY"},
  };
  return d[k]||d.xbox360;
}

// ─── UI HELPERS ───────────────────────────────────────────────────────────────
const Btn=({onClick,children,variant="ghost",accent="#fff",disabled=false,style:s={},...p})=>{
  const base={cursor:disabled?"not-allowed":"pointer",borderRadius:"8px",padding:"8px 16px",fontSize:"13px",fontWeight:700,fontFamily:"'Nunito',sans-serif",transition:"all 0.15s",border:"1px solid transparent",opacity:disabled?0.4:1,...s};
  const vars={
    ghost:{...base,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)"},
    accent:{...base,background:`${accent}22`,border:`1px solid ${accent}45`,color:accent},
    solid:{...base,background:accent,border:`1px solid ${accent}`,color:"#000"},
    danger:{...base,background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",color:"#f87171"},
  };
  return <button onClick={disabled?undefined:onClick} style={vars[variant]||vars.ghost}
    onMouseEnter={e=>{if(!disabled){e.currentTarget.style.opacity="0.8";e.currentTarget.style.transform="translateY(-1px)";}}}
    onMouseLeave={e=>{if(!disabled){e.currentTarget.style.opacity="1";e.currentTarget.style.transform="none";}}}
    {...p}>{children}</button>;
};

const Input=({label,value,onChange,placeholder,mono=false,style:s={},tip})=>(
  <div style={{display:"flex",flexDirection:"column",gap:"6px",...s}}>
    {label&&<span style={{fontSize:"11px",fontWeight:700,color:"rgba(255,255,255,0.4)",letterSpacing:"1.5px",display:"flex",alignItems:"center"}}>
      {label.toUpperCase()}{tip&&<Info tip={tip}/>}
    </span>}
    <input value={value} onChange={onChange} placeholder={placeholder} style={{background:"rgba(0,0,0,0.4)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",padding:"9px 14px",color:"#fff",fontSize:mono?"12px":"13px",fontFamily:mono?"monospace":"'Nunito',sans-serif",width:"100%"}}
      onFocus={e=>e.target.style.borderColor="rgba(255,255,255,0.3)"}
      onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.1)"}/>
  </div>
);

const Toggle=({value,onChange,label,accent="#86efac",hint,tip})=>(
  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
    <div style={{paddingRight:"12px"}}>
      <span style={{fontSize:"13px",color:"rgba(255,255,255,0.72)",fontWeight:600,display:"inline-flex",alignItems:"center",gap:"0"}}>
        {label}{tip&&<Info tip={tip}/>}
      </span>
      {hint&&<div style={{fontSize:"10px",color:"rgba(255,255,255,0.28)",marginTop:"2px",lineHeight:1.4}}>{hint}</div>}
    </div>
    <div onClick={()=>onChange(!value)} style={{width:"42px",height:"24px",borderRadius:"12px",background:value?accent:"rgba(255,255,255,0.12)",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0,marginTop:"2px"}}>
      <div style={{position:"absolute",top:"3px",left:value?"21px":"3px",width:"18px",height:"18px",borderRadius:"50%",background:"white",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.4)"}}/>
    </div>
  </div>
);

const Sel=({label,value,onChange,options,tip})=>(
  <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
    {label&&<span style={{fontSize:"11px",fontWeight:700,color:"rgba(255,255,255,0.4)",letterSpacing:"1.5px",display:"flex",alignItems:"center"}}>
      {label.toUpperCase()}{tip&&<Info tip={tip}/>}
    </span>}
    <select value={value} onChange={e=>onChange(e.target.value)} style={{background:"rgba(0,0,0,0.45)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",padding:"9px 14px",color:"#fff",fontSize:"13px",width:"100%",cursor:"pointer"}}>
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Divider=({label})=>(
  <div style={{display:"flex",alignItems:"center",gap:"12px",margin:"18px 0 12px"}}>
    <span style={{fontSize:"10px",fontWeight:700,color:"rgba(255,255,255,0.25)",letterSpacing:"2.5px",whiteSpace:"nowrap"}}>{label.toUpperCase()}</span>
    <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.06)"}}/>
  </div>
);
const Card=({children,style:s={}})=>(<div style={{background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"12px",padding:"18px",...s}}>{children}</div>);
const Spinner=({size=16,color="#fff"})=>(<div style={{width:size,height:size,border:`2px solid rgba(255,255,255,0.15)`,borderTop:`2px solid ${color}`,borderRadius:"50%",animation:"spin 0.7s linear infinite",flexShrink:0}}/>);
const Toast=({msg,type="info",accent})=>(
  <div style={{padding:"10px 20px",background:type==="error"?"rgba(239,68,68,0.15)":`${accent||"#fff"}15`,borderBottom:`1px solid ${type==="error"?"rgba(239,68,68,0.3)":`${accent||"#fff"}25`}`,fontSize:"12px",color:type==="error"?"#f87171":(accent||"rgba(255,255,255,0.7)"),display:"flex",alignItems:"center",gap:"8px",animation:"slideUp 0.2s ease"}}>
    {type==="loading"&&<Spinner size={12} color={accent||"#fff"}/>}
    {type==="success"&&<span>✓</span>}
    {type==="error"&&<span>✕</span>}
    {type==="info"&&<span style={{animation:"pulse 1.2s infinite"}}>▶</span>}
    <span>{msg}</span>
  </div>
);

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({onClose,children,wide=false}){
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.88)",backdropFilter:"blur(12px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(160deg,#1a1008,#100a04)",border:"2px solid #5c3a18",borderRadius:"20px",padding:"32px 36px",width:wide?"min(960px,96vw)":"min(500px,96vw)",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 50px 120px rgba(0,0,0,0.95)",animation:"popUp 0.22s cubic-bezier(0.34,1.5,0.64,1)"}}>
        {children}
      </div>
    </div>
  );
}

// ─── SUB PICKER ───────────────────────────────────────────────────────────────
function SubPicker({options,onSelect,onClose}){
  return(
    <Modal onClose={onClose}>
      <div style={{fontFamily:"'Boogaloo',cursive",fontSize:"13px",letterSpacing:"5px",color:"#c8a060",opacity:0.55,textAlign:"center",marginBottom:"28px"}}>SELECT SYSTEM</div>
      <div style={{display:"flex",gap:"20px",justifyContent:"center",flexWrap:"wrap"}}>
        {options.map(opt=>{
          const c=CONSOLES[opt.id];
          return(
            <button key={opt.id} onClick={()=>onSelect(opt.id)} style={{background:`linear-gradient(145deg,${c.color},${c.bg})`,border:`2px solid ${c.accent}35`,borderRadius:"16px",padding:"24px 32px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"12px",minWidth:"140px",transition:"all 0.18s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-6px) scale(1.05)";e.currentTarget.style.borderColor=c.accent;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.borderColor=`${c.accent}35`;}}>
              <span style={{fontFamily:"'Boogaloo',cursive",fontSize:"24px",letterSpacing:"2px",color:c.accent}}>{opt.label}</span>
              <span style={{fontFamily:"'Nunito',sans-serif",fontSize:"11px",color:"rgba(255,255,255,0.45)",fontWeight:700}}>{c.label}</span>
            </button>
          );
        })}
      </div>
      <div style={{textAlign:"center",marginTop:"24px"}}><Btn onClick={onClose}>cancel</Btn></div>
    </Modal>
  );
}

// ─── CONTROLLER MAPPING ───────────────────────────────────────────────────────
function ControllerMapping({accent,consoleId,emulatorPath,initialBindings,onClose}){
  const layoutKey=getLayoutKey(consoleId);
  const groups=CONTROLLER_LAYOUTS[layoutKey]||CONTROLLER_LAYOUTS.xbox360;
  const allButtons=groups.flatMap(g=>g.buttons);
  const [bindings,setBindings]=useState(initialBindings||getDefaultBindings(layoutKey));
  const [listening,setListening]=useState(null);
  const [status,setStatus]=useState(null);

  useEffect(()=>{
    if(!listening)return;
    const handler=(e)=>{
      if(e.key!=="Escape")setBindings(p=>({...p,[listening]:e.key}));
      setListening(null);
      e.preventDefault();
    };
    window.addEventListener("keydown",handler,{once:true});
    return()=>window.removeEventListener("keydown",handler);
  },[listening]);

  const saveBindings=async()=>{
    setStatus({msg:"Saving...",type:"loading"});
    try{
      await invoke("write_controller_bindings",{consoleId,emulatorPath:emulatorPath||"",bindings});
      setStatus({msg:"Bindings saved and written to emulator!",type:"success"});
      setTimeout(()=>{setStatus(null);onClose();},1400);
    }catch(e){
      setStatus({msg:`Error: ${e}`,type:"error"});
    }
  };

  return(
    <Modal onClose={onClose} wide>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
        <div>
          <div style={{fontFamily:"'Boogaloo',cursive",fontSize:"20px",letterSpacing:"2px",color:accent}}>CONTROLLER MAPPING</div>
          <div style={{fontSize:"11px",color:"rgba(255,255,255,0.3)",marginTop:"2px"}}>{CONSOLES[consoleId]?.label} · Click any button below, then press a key on your keyboard or controller to bind it</div>
        </div>
        <Btn onClick={onClose}>✕</Btn>
      </div>
      <div style={{maxHeight:"58vh",overflowY:"auto",paddingRight:"4px"}}>
        {groups.map(g=>(
          <div key={g.group} style={{marginBottom:"18px"}}>
            <Divider label={g.group}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>
              {g.buttons.map(b=>(
                <div key={b.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",background:listening===b.id?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.3)",borderRadius:"8px",border:`1px solid ${listening===b.id?accent+"50":"rgba(255,255,255,0.06)"}`,transition:"all 0.15s",gap:"8px"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"12px",color:"rgba(255,255,255,0.75)",fontWeight:700,display:"flex",alignItems:"center"}}>
                      {b.label}<Info tip={b.desc}/>
                    </div>
                  </div>
                  <div onClick={()=>setListening(listening===b.id?null:b.id)} style={{background:listening===b.id?accent:"rgba(255,255,255,0.08)",border:`1px solid ${listening===b.id?accent:"rgba(255,255,255,0.15)"}`,borderRadius:"5px",padding:"4px 10px",cursor:"pointer",fontSize:"11px",fontWeight:700,color:listening===b.id?"#000":"rgba(255,255,255,0.7)",minWidth:"54px",textAlign:"center",transition:"all 0.15s",flexShrink:0}}>
                    {listening===b.id?"press...":bindings[b.id]||"—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {listening&&<div style={{textAlign:"center",marginTop:"10px",fontSize:"12px",color:accent,animation:"pulse 1s infinite",fontWeight:700}}>Listening for "{allButtons.find(b=>b.id===listening)?.label}" — press any key... (ESC to cancel)</div>}
      {status&&<div style={{marginTop:"10px"}}><Toast msg={status.msg} type={status.type} accent={accent}/></div>}
      <div style={{display:"flex",gap:"10px",marginTop:"16px",justifyContent:"flex-end"}}>
        <Btn onClick={()=>setListening(null)}>Cancel Listening</Btn>
        <Btn variant="accent" accent={accent} onClick={saveBindings}>Save Bindings</Btn>
      </div>
    </Modal>
  );
}

// ─── SAVE STATE MODAL ─────────────────────────────────────────────────────────
function SaveStateModal({game,consoleId,accent,onClose}){
  const [saves,setSaves]=useState([]);
  const [loading,setLoading]=useState(true);
  const [launching,setLaunching]=useState(null);

  const reload=useCallback(()=>{
    setLoading(true);
    invoke("get_save_states",{consoleId,gameId:game.id})
      .then(s=>setSaves(s||[])).catch(()=>setSaves([]))
      .finally(()=>setLoading(false));
  },[game.id,consoleId]);

  useEffect(()=>{reload();},[reload]);

  const loadSlot=async(s)=>{
    setLaunching(s.slot);
    try{
      await invoke("load_save_state",{consoleId,gameId:game.id,savePath:s.path,slot:s.slot});
      setTimeout(()=>setLaunching(null),2000);
      onClose();
    }catch(e){
      alert(`Could not load save state: ${e}`);
      setLaunching(null);
    }
  };

  const deleteSlot=async(savePath)=>{
    await invoke("delete_save_state",{path:savePath}).catch(()=>null);
    reload();
  };

  const slots=Array.from({length:8},(_,i)=>
    saves.find(s=>s.slot===i)||{slot:i,label:`Slot ${i+1}`,path:"",screenshot_path:null,screenshot_data:null,created_at:"",has_save:false}
  );

  return(
    <Modal onClose={onClose} wide>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px"}}>
        <div>
          <div style={{fontFamily:"'Boogaloo',cursive",fontSize:"20px",letterSpacing:"2px",color:accent}}>SAVE STATES</div>
          <div style={{fontSize:"12px",color:"rgba(255,255,255,0.35)",marginTop:"2px"}}>{game.title}</div>
        </div>
        <Btn onClick={onClose}>✕</Btn>
      </div>
      {loading
        ?<div style={{display:"flex",justifyContent:"center",padding:"40px"}}><Spinner color={accent}/></div>
        :(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          {slots.map(s=>(
            <div key={s.slot} style={{background:"rgba(0,0,0,0.4)",border:`1px solid ${s.has_save?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.04)"}`,borderRadius:"10px",padding:"14px",display:"flex",flexDirection:"column",gap:"8px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:"11px",fontWeight:700,color:"rgba(255,255,255,0.4)",letterSpacing:"1px"}}>{s.label.toUpperCase()}</span>
                {s.created_at&&<span style={{fontSize:"10px",color:"rgba(255,255,255,0.25)"}}>{s.created_at}</span>}
              </div>
              <div style={{height:"72px",borderRadius:"6px",background:s.has_save?"linear-gradient(135deg,#1a1a2e,#16213e)":"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                {s.screenshot_data
                  ?<img src={s.screenshot_data} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>
                  :s.screenshot_path
                    ?<img src={`asset://localhost/${s.screenshot_path.replace(/\\/g,"/")}`} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="" onError={e=>{e.target.style.display="none";}}/>
                    :<span style={{fontSize:s.has_save?"10px":"18px",color:"rgba(255,255,255,0.2)",fontStyle:"italic"}}>{s.has_save?"no screenshot":"+"}</span>
                }
              </div>
              <div style={{display:"flex",gap:"6px"}}>
                {s.has_save
                  ?(<>
                    <Btn variant="accent" accent={accent} style={{flex:1,padding:"5px 0",fontSize:"11px",display:"flex",alignItems:"center",justifyContent:"center",gap:"4px"}} onClick={()=>loadSlot(s)} disabled={launching===s.slot}>
                      {launching===s.slot?<><Spinner size={10} color={accent}/><span>Launching...</span></>:<span>▶ Load</span>}
                    </Btn>
                    <Btn variant="danger" style={{padding:"5px 10px",fontSize:"11px"}} onClick={()=>deleteSlot(s.path)}>✕</Btn>
                  </>)
                  :(<Btn variant="ghost" style={{flex:1,padding:"5px 0",fontSize:"11px",opacity:0.35}} disabled>Empty</Btn>)
                }
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{marginTop:"14px",fontSize:"11px",color:"rgba(255,255,255,0.2)",textAlign:"center"}}>
        Save states are created in-game · Usually F5 to save · Save &amp; close game, then click Load here
      </div>
    </Modal>
  );
}

// ─── SETTINGS TABS ────────────────────────────────────────────────────────────
// ─── READ-ONLY SETTINGS REFERENCE ────────────────────────────────────────────

function EmulatorBanner({emulator,accent}){
  return(
    <div style={{background:`${accent}12`,border:`1px solid ${accent}30`,borderRadius:"8px",padding:"10px 14px",marginBottom:"14px",fontSize:"12px",color:"rgba(255,255,255,0.6)",lineHeight:1.6}}>
      <strong style={{color:accent}}>ℹ️ Reference only</strong> — These are the settings inside <strong style={{color:"rgba(255,255,255,0.8)"}}>{emulator}</strong>. Open {emulator} directly to change them.
    </div>
  );
}

function InfoRow({label,tip}){
  return(
    <div style={{display:"flex",alignItems:"center",padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
      <span style={{fontSize:"12px",color:"rgba(255,255,255,0.65)",fontWeight:600,display:"inline-flex",alignItems:"center",gap:"2px",flex:1}}>
        {label}{tip&&<Info tip={tip}/>}
      </span>
    </div>
  );
}

function InfoSel({label,tip,options,rec}){
  return(
    <div style={{marginBottom:"13px"}}>
      <div style={{fontSize:"10px",fontWeight:700,color:"rgba(255,255,255,0.38)",letterSpacing:"1.5px",display:"flex",alignItems:"center",gap:"2px",marginBottom:"5px"}}>
        {label.toUpperCase()}{tip&&<Info tip={tip}/>}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
        {options.map(o=>(
          <span key={o} style={{background:o===rec?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.04)",border:`1px solid ${o===rec?"rgba(255,255,255,0.28)":"rgba(255,255,255,0.08)"}`,borderRadius:"5px",padding:"3px 9px",fontSize:"11px",color:o===rec?"rgba(255,255,255,0.85)":"rgba(255,255,255,0.35)"}}>
            {o}{o===rec&&<span style={{color:"#86efac",marginLeft:"5px",fontSize:"9px"}}>★</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── DuckStation (PS1) ───────────────────────────────────────────────────────
function VideoTabPS1({c}){return(<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
  <EmulatorBanner emulator="DuckStation" accent={c.accent}/>
  <Card><Divider label="Settings → Display"/>
    <InfoSel label="Renderer" tip="Vulkan is fastest on modern hardware. Software is most accurate but very slow." rec="Vulkan" options={["Vulkan","DirectX 12","DirectX 11","OpenGL","Software"]}/>
    <InfoSel label="Internal Resolution" tip="Multiplies the PS1's low-res output. 4x looks great on most PCs. 1x is the authentic chunky PS1 look." rec="4x" options={["1x Native","2x","4x","8x","16x"]}/>
    <InfoSel label="Texture Filtering" tip="Nearest is the raw PS1 pixel look. Bilinear smooths everything. PGXP-based filtering works best alongside PGXP corrections." rec="Nearest" options={["Nearest","Bilinear","PGXP Bilinear"]}/>
    <InfoRow label="Widescreen Hack" tip="Forces 16:9 output. Works well in many PS1 games, breaks others. Test per-game."/>
    <InfoRow label="VSync" tip="Prevents screen tearing. Toggle in Settings → Display."/>
  </Card>
  <Card><Divider label="Settings → Enhancements"/>
    <InfoRow label="PGXP Geometry Correction" tip="THE best PS1 enhancement. Fixes the wobbly warping polygons PS1 is famous for. Makes games look far more modern. Enable this."/>
    <InfoRow label="PGXP Texture Correction" tip="Stops textures from swimming on polygon edges. Use together with geometry correction."/>
    <InfoRow label="PGXP Depth Buffer" tip="Fixes depth fighting artifacts. Enable alongside the other PGXP options."/>
    <InfoRow label="True Color Rendering" tip="Removes the PS1's color banding by rendering in 24-bit color instead of 15-bit. Smoother gradients."/>
    <InfoRow label="Widescreen Hack" tip="Forces 16:9 widescreen rendering. Found in Settings → Display."/>
  </Card>
  <Card><Divider label="Settings → Controller"/>
    <InfoRow label="Controller Type" tip="DualShock (analog) for games that support it. Digital for older games that predate analog sticks. Set per-port in Settings → Controllers → Port 1."/>
    <InfoRow label="Analog Sticks" tip="Enable analog input. Required for games like Ape Escape. Most PS1 games don't use analog sticks."/>
    <InfoRow label="Rumble" tip="Controller vibration support. Enable in controller settings."/>
  </Card>
</div>);}

// ── PCSX2 (PS2) ─────────────────────────────────────────────────────────────
function VideoTabPS2({c}){return(<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
  <EmulatorBanner emulator="PCSX2" accent={c.accent}/>
  <Card><Divider label="Settings → Graphics → Rendering"/>
    <InfoSel label="Renderer" tip="Vulkan is best. D3D12 also works well on Windows. OpenGL is a fallback. Software is accurate but extremely slow." rec="Vulkan" options={["Vulkan","DirectX 12","DirectX 11","OpenGL","Software"]}/>
    <InfoSel label="Internal Resolution" tip="3x gives clean 1080p-equivalent. Native is the original blocky PS2 look." rec="3x Native" options={["Native PS2","2x Native","3x Native","4x Native","6x Native"]}/>
    <InfoSel label="Anisotropic Filtering" tip="Sharpens textures at angles. 16x looks best with almost no performance cost." rec="16x" options={["Off","2x","4x","8x","16x"]}/>
    <InfoSel label="Dithering" tip="Mimics the PS2's color blending pattern. Unscaled is most accurate to the original hardware look." rec="Unscaled" options={["Off","Scaled","Unscaled"]}/>
    <InfoRow label="VSync" tip="Prevents screen tearing. Settings → Graphics → Rendering."/>
  </Card>
  <Card><Divider label="Settings → Graphics → Hardware Fixes"/>
    <InfoRow label="Align Sprite" tip="THE most useful PS2 upscaling fix. Stops textures from shimmering at above-native resolution. Enable this first if textures look unstable."/>
    <InfoRow label="Half-Pixel Offset" tip="Fixes a shimmering edge or line that appears in many upscaled PS2 games. Try Normal (Vertex) mode first."/>
    <InfoRow label="Round Sprite" tip="Reduces shimmering on 2D sprite elements at higher resolution. Useful for 2D-heavy games."/>
    <InfoRow label="Auto Flush" tip="Forces the GPU to process every draw immediately. Fixes some glitches but makes the game noticeably slower. Last resort."/>
    <InfoRow label="Framebuffer Conversion" tip="Fixes incorrect colors in games that read back the framebuffer."/>
  </Card>
  <Card><Divider label="Settings → Patches"/>
    <InfoRow label="Widescreen Patches" tip="Community patches that force 16:9. Not all games have them. Enable in Settings → Patches → Widescreen."/>
    <InfoRow label="No-Interlace Patches" tip="Removes PS2 interlacing scan lines. Makes cutscenes and menus look cleaner."/>
  </Card>
  <Card><Divider label="Settings → Controllers"/>
    <InfoRow label="Controller Port 1" tip="Add your controller here. Supports DualShock 2, Xbox, DualSense, and more. Settings → Controllers → Port 1."/>
    <InfoRow label="Pressure Sensitivity" tip="Some PS2 games use pressure-sensitive face buttons (e.g. Gran Turismo). DualSense supports this via Pad → Pressure."/>
  </Card>
</div>);}

// ── RPCS3 (PS3) ─────────────────────────────────────────────────────────────
function VideoTabPS3({c}){return(<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
  <EmulatorBanner emulator="RPCS3" accent={c.accent}/>
  <Card><Divider label="Configuration → GPU"/>
    <InfoSel label="Renderer" tip="Vulkan is the only real choice for performance. OpenGL is much slower." rec="Vulkan" options={["Vulkan","OpenGL"]}/>
    <InfoSel label="Resolution" tip="1080p is a good starting point. Higher needs a powerful GPU." rec="1920x1080" options={["1280x720","1920x1080","2560x1440","3840x2160"]}/>
    <InfoSel label="Shader Compilation" tip="Async compiles shaders in background so gameplay doesn't stutter when new scenes load. Always use Async." rec="Async" options={["Async","Sync","Async + Object Cache"]}/>
    <InfoRow label="VSync" tip="Prevents screen tearing. Configuration → GPU."/>
    <InfoRow label="Stretch to Display Area" tip="Stretches the image to fill your monitor. Disable to keep the correct aspect ratio."/>
  </Card>
  <Card><Divider label="Configuration → GPU → GPU Hacks"/>
    <InfoRow label="Write Color Buffers" tip="THE most important RPCS3 setting. Fixes black screens, missing shadows, and wrong colors in the majority of PS3 games. Enable this first if anything looks wrong."/>
    <InfoRow label="Write Depth Buffers" tip="Fixes depth-related glitches — missing shadows or wrong depth effects in specific games."/>
    <InfoRow label="Read Color Buffers" tip="Required by some games for post-processing effects to render correctly."/>
    <InfoRow label="Strict Texture Flushing" tip="Fixes some artifacts at a significant performance cost. Only enable if other options don't help."/>
    <InfoRow label="Disable Vertex Cache" tip="Fixes geometry corruption in a small number of games. Minor performance cost."/>
    <InfoRow label="GPU Texture Scaling" tip="Upscales textures on the GPU for sharper visuals. Uses more VRAM. Enable on high-end GPUs."/>
  </Card>
  <Card><Divider label="Configuration → Audio"/>
    <InfoSel label="Audio Backend" tip="XAudio2 is recommended on Windows. Cubeb works on all platforms." rec="XAudio2" options={["XAudio2","Cubeb","OpenAL","Null"]}/>
    <InfoRow label="Audio Buffer Duration" tip="How far ahead audio is buffered. Increase if audio stutters or crackles."/>
    <InfoRow label="Convert to 16-bit" tip="Some audio devices only support 16-bit audio. Enable if you hear no sound or distorted sound."/>
  </Card>
  <Card><Divider label="Configuration → Pads (Controllers)"/>
    <InfoRow label="Handler" tip="XInput for Xbox controllers. DualShock 4 or DualSense for PlayStation controllers. MMJoystick for older generic controllers."/>
    <InfoRow label="Devices" tip="Select your physical controller from the dropdown after choosing the handler."/>
    <InfoRow label="Rumble" tip="Enable controller vibration. Supported on Xbox and PlayStation controllers."/>
  </Card>
</div>);}

function CPUTabPS3({c}){return(<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
  <EmulatorBanner emulator="RPCS3" accent={c.accent}/>
  <Card><Divider label="Configuration → CPU → PPU (Main CPU)"/>
    <InfoSel label="PPU Decoder" tip="LLVM Recompiler is dramatically faster than anything else. Always use it. Interpreter modes are only for debugging." rec="Recompiler LLVM" options={["Interpreter (precise)","Interpreter (fast)","Recompiler LLVM"]}/>
    <InfoRow label="Accurate xfloat" tip="Fixes floating point precision bugs in some games. Big performance cost. Only enable for games with physics or math glitches."/>
    <InfoRow label="Hook Static Functions" tip="Improves accuracy of some system calls. Can cause crashes in a small number of games."/>
  </Card>
  <Card><Divider label="Configuration → CPU → SPU (Audio Processor)"/>
    <InfoSel label="SPU Decoder" tip="LLVM Recompiler is the fastest by a wide margin. Always use it." rec="Recompiler LLVM" options={["Interpreter","Recompiler ASMJIT","Recompiler LLVM"]}/>
    <InfoSel label="SPU Block Size" tip="Larger blocks are faster but less stable. Safe is recommended." rec="Safe" options={["Safe","Mega","Giga"]}/>
    <InfoRow label="SPU Loop Detection" tip="Skips idle SPU loops. Significantly reduces CPU usage. Always keep this on."/>
    <InfoRow label="RPCS3 Thread Scheduler" tip="RPCS3's own CPU thread management. Recommended on Windows for better performance."/>
    <InfoRow label="Preferred SPU Threads" tip="How many CPU threads are dedicated to audio processing. Auto is best. Try 2 or 3 if you have audio stuttering."/>
  </Card>
</div>);}

function SystemTabPS3({c}){return(<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
  <EmulatorBanner emulator="RPCS3" accent={c.accent}/>
  <Card><Divider label="Configuration → System"/>
    <InfoSel label="Console Language" tip="Language reported to PS3 games. Some games show different content based on this." rec="English" options={["Japanese","English","French","Spanish","German","Italian","Portuguese","Russian","Korean"]}/>
    <InfoSel label="Enter Button" tip="Which button confirms in PS3 menus. Western games use Cross. Japanese games traditionally use Circle." rec="Cross ✕" options={["Cross ✕ (Western)","Circle ○ (Japanese)"]}/>
    <InfoRow label="Enable Game Patches" tip="Community patches including 60fps, widescreen, and bug fixes. Highly recommended. Configuration → Patches."/>
    <InfoRow label="Trophy Notifications" tip="Shows trophy popups while playing, just like the real PS3."/>
    <InfoRow label="Network Status" tip="Set to Offline for safety. RPCN is a fan-made PSN alternative for online play."/>
  </Card>
</div>);}

// ── Dolphin (GameCube / Wii) ─────────────────────────────────────────────────
function VideoTabDolphin({c}){return(<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
  <EmulatorBanner emulator="Dolphin" accent={c.accent}/>
  <Card><Divider label="Graphics → General tab"/>
    <InfoSel label="Backend" tip="Vulkan is fastest on modern hardware. D3D12 is also excellent on Windows. OpenGL as fallback." rec="Vulkan" options={["Vulkan","DirectX 12","DirectX 11","OpenGL","Software Renderer"]}/>
    <InfoSel label="Internal Resolution" tip="3x gives clean 1080p. Higher needs more GPU power." rec="3x Native" options={["Native","1.5x","2x (720p)","3x (1080p)","4x (1440p)","5x","6x (4K)"]}/>
    <InfoSel label="Anisotropic Filtering" tip="Sharpens textures at angles. 4x or 16x costs almost nothing on modern GPUs." rec="4x" options={["Off","2x","4x","8x","16x"]}/>
    <InfoSel label="Shader Compilation" tip="Async compiles shaders in background to prevent hitching when new areas load." rec="Async" options={["Sync (stutters)","Async","Async Skip Drawing"]}/>
    <InfoRow label="VSync" tip="Prevents screen tearing. Graphics → General."/>
  </Card>
  <Card><Divider label="Graphics → Hacks tab"/>
    <InfoRow label="Skip EFB Access from CPU" tip="Big performance boost. CPU skips reading the framebuffer. Disable only if a game has missing effects or black screens."/>
    <InfoRow label="Store EFB Copies to Texture Only" tip="Stores framebuffer copies as textures instead of RAM. Major performance improvement. Disable if rendering looks wrong."/>
    <InfoRow label="Immediately Present XFB" tip="Reduces input lag. Safe to enable. Very rarely causes minor visual glitches."/>
    <InfoRow label="Per-Pixel Lighting" tip="More accurate lighting. Slightly slower. Safe to enable on modern hardware."/>
    <InfoRow label="Widescreen Hack" tip="Forces 16:9 for games that don't support it natively. Works well in most 3D games."/>
  </Card>
  <Card><Divider label="Config → GameCube / Wii Controllers"/>
    <InfoRow label="GameCube Controller" tip="Config → GameCube → Port 1. Standard Controller for a regular gamepad. GBA or keyboard also available."/>
    <InfoRow label="Wii Remote" tip="Config → Wii → Wii Remote 1. Emulated Wiimote for keyboard/gamepad. Or connect a real Wii Remote via Bluetooth."/>
    <InfoRow label="Motion Controls" tip="For Wii games requiring motion, use Emulated Wiimote with a DualSense/Switch Pro (gyro), or a real Wii Remote over Bluetooth."/>
    <InfoRow label="GameCube Adapter" tip="If you have a USB GameCube controller adapter, set Port 1 to GCPad. Dolphin supports official and third-party adapters."/>
  </Card>
  <Card><Divider label="Config → Audio"/>
    <InfoSel label="DSP Emulation" tip="DSP HLE is fast with minor inaccuracies. DSP LLE is cycle-accurate but much slower — only needed for a handful of games with audio bugs." rec="DSP HLE" options={["DSP HLE (fast)","DSP LLE Interpreter","DSP LLE Recompiler"]}/>
    <InfoRow label="Audio Backend" tip="XAudio2 on Windows. Cubeb on all platforms. Both are fine."/>
    <InfoRow label="Volume" tip="Master volume for the game. Adjust in Config → Audio."/>
  </Card>
</div>);}

// ── Project64 (N64) ──────────────────────────────────────────────────────────
function VideoTabN64({c}){return(<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
  <EmulatorBanner emulator="Project64" accent={c.accent}/>
  <Card><Divider label="Options → Settings → Plugins"/>
    <InfoRow label="Video Plugin" tip="Project64 uses plugins for rendering. GLideN64 is the best modern plugin and is usually included. Options → Settings → Plugins → Video Plugin."/>
    <InfoRow label="Audio Plugin" tip="Azimer's Audio or Zilmar's are the standard choices. Options → Settings → Plugins → Audio Plugin."/>
  </Card>
  <Card><Divider label="GLideN64 Settings (inside the video plugin)"/>
    <InfoRow label="Resolution" tip="Set the render resolution multiplier inside GLideN64 settings. 2x or 4x over N64 native looks great."/>
    <InfoRow label="FXAA" tip="Fast anti-aliasing. Smooths jagged edges with almost no performance cost. GLideN64 → Post-processing."/>
    <InfoRow label="Texture Enhancement" tip="Upscales N64's low-res textures. 2xSaI or HQ4x give a smoother look. GLideN64 → Texture enhancement."/>
    <InfoRow label="Framebuffer Effects" tip="Enables special rendering effects some N64 games require (e.g. motion blur, depth of field). Can cause issues in others."/>
    <InfoRow label="Widescreen" tip="Force 16:9 output. GLideN64 → Frame buffer → Aspect ratio."/>
  </Card>
  <Card><Divider label="Options → Settings → Controller"/>
    <InfoRow label="Controller Plugin" tip="N-Rage is the standard controller plugin. Supports XInput and DirectInput controllers."/>
    <InfoRow label="Button Mapping" tip="Configure in the N-Rage plugin settings. Click the input icon in the controller plugin settings panel."/>
    <InfoRow label="Transfer Pak" tip="Required for some games like Pokemon Stadium. Enable in N-Rage settings if needed."/>
  </Card>
</div>);}

// ── xemu (Xbox Original) ─────────────────────────────────────────────────────
function VideoTabXbox({c}){return(<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
  <EmulatorBanner emulator="xemu" accent={c.accent}/>
  <Card><Divider label="View → Display Settings"/>
    <InfoRow label="Surface Scale" tip="Multiplies the render resolution. 2x or 3x gives a much sharper image than the original Xbox's native output. View → Display Settings → Surface Scale."/>
    <InfoRow label="Smoothing" tip="Bilinear filtering on the upscaled output. Makes it softer. Turn off for a sharper pixel look."/>
    <InfoRow label="Widescreen" tip="Forces 16:9. Some original Xbox games support widescreen natively — test per game. View → Display Settings."/>
    <InfoRow label="Fullscreen" tip="Toggle fullscreen. Alt+Enter also works while playing."/>
  </Card>
  <Card><Divider label="Machine → Settings → System"/>
    <InfoRow label="BIOS file" tip="xemu requires an Xbox BIOS file (e.g. mcpx_1.0.bin) and a MCPX boot ROM. Machine → Settings → System → BIOS. Without these no games run."/>
    <InfoRow label="Hard Drive Image" tip="xemu needs an Xbox hard drive image (xbox_hdd.qcow2). A pre-formatted blank one is on the xemu website. Machine → Settings → System → HDD."/>
    <InfoRow label="EEPROM" tip="xemu auto-generates this. It stores Xbox region and settings. Machine → Settings → System → EEPROM."/>
  </Card>
  <Card><Divider label="Machine → Settings → Input"/>
    <InfoRow label="Controller Binding" tip="Xbox controllers connect automatically via XInput. For other controllers go to Machine → Settings → Input and assign ports."/>
  </Card>
</div>);}

// ── Xenia Canary (Xbox 360) ───────────────────────────────────────────────────
function VideoTabXbox360({c}){return(<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
  <EmulatorBanner emulator="Xenia Canary" accent={c.accent}/>
  <Card><Divider label="Edit xenia-canary.config.toml in the Xenia folder"/>
    <InfoRow label="gpu" tip="Graphics backend. Set as:  gpu = 'vulkan'  (recommended). Or 'd3d12'."/>
    <InfoRow label="vsync" tip="Prevents screen tearing. Set as:  vsync = true"/>
    <InfoRow label="internal_display_resolution" tip="Upscaling multiplier for the rendered output. Set as a number, e.g.  internal_display_resolution = 4  for 4x native."/>
    <InfoRow label="show_fps" tip="FPS counter overlay. Set as:  show_fps = true"/>
    <InfoRow label="fullscreen" tip="Start in fullscreen. Set as:  fullscreen = true"/>
  </Card>
  <Card><Divider label="Notes"/>
    <InfoRow label="No BIOS needed" tip="Unlike the original Xbox, Xenia requires no BIOS files. Just the game ISO is enough."/>
    <InfoRow label="Experimental emulator" tip="Xbox 360 emulation is still in active development. Many games work, many don't. Check github.com/xenia-canary/game-compatibility before expecting a specific game to run."/>
    <InfoRow label="Controller" tip="Xbox controllers work automatically via XInput. No configuration needed for most setups."/>
  </Card>
</div>);}

// ── Cemu (Wii U) ─────────────────────────────────────────────────────────────
function VideoTabWiiU({c}){return(<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
  <EmulatorBanner emulator="Cemu" accent={c.accent}/>
  <Card><Divider label="Options → Graphics Settings"/>
    <InfoSel label="Graphics API" tip="Vulkan is fastest. OpenGL is more compatible on older GPUs." rec="Vulkan" options={["Vulkan","OpenGL"]}/>
    <InfoRow label="VSync" tip="Off, Double Buffer, or Triple Buffer. Double Buffer is usually best. Options → Graphics Settings."/>
    <InfoRow label="TV Resolution" tip="The resolution Cemu renders at. Higher = sharper but needs more GPU. Options → Graphics Settings → TV Resolution."/>
    <InfoRow label="Upscale Filter" tip="How the image is scaled to fill your screen. Bilinear is smooth. Bicubic is sharper. Options → Graphics Settings."/>
    <InfoRow label="FPS Overlay" tip="Shows frame rate on screen. Options → Graphics Settings → Overlay."/>
    <InfoRow label="Async Shader Compile" tip="Compiles shaders in background to reduce hitching. Highly recommended. Options → Graphics Settings."/>
  </Card>
  <Card><Divider label="Options → Audio Settings"/>
    <InfoSel label="Audio API" tip="XAudio2 is recommended on Windows. DirectSound is a fallback." rec="XAudio2" options={["XAudio2","DirectSound","Cubeb"]}/>
    <InfoRow label="Channels" tip="Set to match your speaker setup — Stereo, Surround 5.1, or 7.1. Options → Audio Settings."/>
    <InfoRow label="Volume" tip="Master volume slider. Options → Audio Settings."/>
  </Card>
  <Card><Divider label="Options → Input Settings"/>
    <InfoRow label="Controller Profile" tip="Create a controller profile in Options → Input Settings. Cemu supports XInput, DirectInput, DualShock 4, and DualSense."/>
    <InfoRow label="Motion Controls" tip="For Wii U GamePad games requiring gyro input, use a DualSense or a supported controller with gyro. Configure in Options → Input Settings."/>
  </Card>
</div>);}

// ── melonDS (DS) ─────────────────────────────────────────────────────────────
function VideoTabDS({c}){return(<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
  <EmulatorBanner emulator="melonDS" accent={c.accent}/>
  <Card><Divider label="Config → Video Settings"/>
    <InfoSel label="3D Renderer" tip="OpenGL renders the 3D portions at higher resolution — much sharper. Software is more accurate but slower. Config → Video Settings → 3D Renderer." rec="OpenGL" options={["Software","OpenGL"]}/>
    <InfoSel label="Internal Resolution" tip="Multiplies the DS's 3D rendering resolution. Only affects the 3D layer, not 2D sprites." rec="4x" options={["1x Native","2x","4x","8x"]}/>
    <InfoRow label="Better Polygon Splitting" tip="Fixes some polygon rendering issues in 3D games when using OpenGL renderer. Enable if geometry looks wrong."/>
    <InfoRow label="Soft Shadows" tip="Smoother shadow rendering in 3D games. Slight performance cost."/>
  </Card>
  <Card><Divider label="Config → Screen Layout"/>
    <InfoSel label="Screen Layout" tip="How the two DS screens are arranged on your display." rec="Natural" options={["Natural","Vertical","Horizontal","Hybrid"]}/>
    <InfoRow label="Screen Gap" tip="Adds a gap between the screens to mimic the physical DS hinge. Config → Screen Layout → Screen Gap."/>
    <InfoRow label="Screen Rotation" tip="Rotates the screen layout. Useful for certain games that use the DS sideways."/>
  </Card>
  <Card><Divider label="Config → Input and Hotkeys"/>
    <InfoRow label="Controller Mapping" tip="Config → Input and Hotkeys → DS Key Mapping. Map your controller buttons to DS buttons here."/>
    <InfoRow label="Touch Screen" tip="You can use your mouse to tap the bottom DS touch screen. Some DS games require touch for certain actions."/>
  </Card>
</div>);}

// ── Lime3DS (3DS) ─────────────────────────────────────────────────────────────
function VideoTab3DS({c}){return(<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
  <EmulatorBanner emulator="Lime3DS" accent={c.accent}/>
  <Card><Divider label="Emulation → Configure → Graphics"/>
    <InfoSel label="Graphics API" tip="OpenGL is the main option. Vulkan support is experimental. Configure → Graphics." rec="OpenGL" options={["OpenGL","Vulkan (experimental)"]}/>
    <InfoSel label="Resolution Factor" tip="Multiplies the 3DS's output resolution. 3x or 4x looks great." rec="3x" options={["1x Native","2x","3x","4x","5x","6x"]}/>
    <InfoRow label="Hardware Shaders" tip="Speeds up shader rendering significantly. Keep on unless a game has visual glitches. Configure → Graphics."/>
    <InfoRow label="Accurate Shader Mul" tip="More accurate shader math. Fixes visual issues in some games at a performance cost. Only enable if a game looks wrong."/>
    <InfoRow label="Texture Filter" tip="Upscale or sharpen textures. None keeps the original pixel look. xBRZ smooths pixel art." />
  </Card>
  <Card><Divider label="Emulation → Configure → Layout"/>
    <InfoSel label="Screen Layout" tip="How the top and bottom 3DS screens are displayed." rec="Default" options={["Default","Single Screen","Large Screen","Side by Side","Hybrid"]}/>
    <InfoRow label="Swap Screens" tip="Swaps the position of the top and bottom 3DS screens."/>
  </Card>
  <Card><Divider label="Emulation → Configure → Controls"/>
    <InfoRow label="Button Mapping" tip="Configure → Controls. Map your physical controller buttons to 3DS buttons here. Supports XInput and DirectInput."/>
    <InfoRow label="Motion Controls" tip="For games using the 3DS gyroscope. Requires a controller with gyro (DualSense, Switch Pro). Configure → Controls → Motion."/>
  </Card>
</div>);}

// ── Flycast (Dreamcast) ───────────────────────────────────────────────────────
function VideoTabDreamcast({c}){return(<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
  <EmulatorBanner emulator="Flycast" accent={c.accent}/>
  <Card><Divider label="Settings → Video"/>
    <InfoSel label="Renderer" tip="Vulkan or OpenGL for hardware rendering at higher resolution. Software for accurate but slow original output." rec="Vulkan" options={["Vulkan","OpenGL","Software"]}/>
    <InfoSel label="Internal Resolution" tip="Multiplies the Dreamcast's output resolution. 2x or 4x gives a much cleaner image." rec="2x" options={["Native","2x","4x","8x"]}/>
    <InfoRow label="Widescreen" tip="Forces 16:9 output. Works well in most Dreamcast games. Settings → Video → Widescreen."/>
    <InfoRow label="VSync" tip="Prevents screen tearing. Settings → Video."/>
    <InfoRow label="Texture Upscaling" tip="xBRZ upscaling makes Dreamcast textures look smoother, especially on 2D-heavy games."/>
    <InfoRow label="Anisotropic Filtering" tip="Sharpens textures at angles. 4x or 16x with almost no cost on modern hardware."/>
  </Card>
  <Card><Divider label="Settings → Console"/>
    <InfoRow label="Cable Type" tip="VGA gives the sharpest output. Some games behave differently with VGA vs Composite. Settings → Console → Cable Type."/>
    <InfoRow label="Region" tip="North America, Europe, or Japan. Match to your game's region if you have issues. Settings → Console → Region."/>
  </Card>
  <Card><Divider label="Settings → Controls"/>
    <InfoRow label="Controller Mapping" tip="Settings → Controls → Port A (Player 1). Supports XInput (Xbox) and DirectInput controllers."/>
    <InfoRow label="VMU" tip="The Dreamcast memory card. Flycast creates virtual VMUs automatically. Settings → Controls → Devices."/>
    <InfoRow label="Light Gun / Fishing Rod" tip="Some Dreamcast games use special controllers. Configure in Settings → Controls for the relevant port."/>
  </Card>
</div>);}

// ── Audio Reference (generic) ────────────────────────────────────────────────
function AudioTabRef({c}){return(<Card>
  <EmulatorBanner emulator={c.emulator} accent={c.accent}/>
  <Divider label="Audio — Change inside the emulator"/>
  <InfoRow label="Audio Backend / API" tip="The audio system used to output sound. XAudio2 or Cubeb are recommended on Windows. Change in the emulator's audio or settings menu."/>
  <InfoRow label="Volume" tip="Master game volume. Usually a slider in the emulator's audio settings or accessible via a hotkey."/>
  <InfoRow label="Latency / Buffer Size" tip="How far ahead audio is buffered. Increase if you hear audio stuttering or crackling. Decrease for a more responsive feel if your PC can handle it."/>
  <InfoRow label="Output Channels" tip="Stereo for headphones or 2-speaker setups. 5.1 or 7.1 if you have a surround sound system."/>
  <InfoRow label="Mute on Focus Loss" tip="Silences the game when the emulator window loses focus. Useful if you alt-tab frequently."/>
</Card>);}

// ── Controls Reference (generic) ─────────────────────────────────────────────
function ControlsTabRef({c,onMapper}){return(<Card>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px"}}>
    <div>
      <div style={{fontSize:"14px",fontWeight:700,color:"rgba(255,255,255,0.8)"}}>Controller Reference</div>
      <div style={{fontSize:"11px",color:"rgba(255,255,255,0.35)",marginTop:"2px"}}>Button layout for this console's controller</div>
    </div>
    <Btn variant="accent" accent={c.accent} onClick={onMapper}>🎮 View Layout</Btn>
  </div>
  <EmulatorBanner emulator={c.emulator} accent={c.accent}/>
  <InfoRow label="Controller Setup" tip={`Open ${c.emulator} and go to its input or controller settings. Select your controller type, then map your physical buttons to the emulated console's buttons.`}/>
  <InfoRow label="Deadzone" tip="The area around the analog stick centre that is ignored. Increase if your character moves on its own. Decrease if the stick feels unresponsive. Found in the emulator's controller settings."/>
  <InfoRow label="Rumble / Vibration" tip="Controller vibration. Toggle in the emulator's controller settings."/>
  <InfoRow label="Motion Controls" tip="Required for Wii motion games and some 3DS games. Needs a gyro-capable controller (DualSense, Switch Pro, or real Wii Remote). Configure in the emulator."/>
  <InfoRow label="Background Input" tip="Lets the emulator receive controller input even when its window isn't in focus. Usually a toggle in controller settings."/>
</Card>);}

// ─── CONSOLE SETTINGS ─────────────────────────────────────────────────────────
function ConsoleSettings({consoleId,initialConfig,onClose,onSaved}){
  const c=CONSOLES[consoleId];
  const [s,setS]=useState({emulatorPath:initialConfig?.emulator_path||"",romFolders:initialConfig?.rom_folders||[]});
  const set=(k,v)=>setS(p=>({...p,[k]:v}));
  const [status,setStatus]=useState(null);

  const browsePath=async()=>{const r=await invoke("open_file_dialog").catch(()=>null);if(r)set("emulatorPath",r);};
  const testLaunch=async()=>{setStatus({msg:"Testing...",type:"loading"});invoke("test_emulator_launch",{emulatorPath:s.emulatorPath}).then(m=>setStatus({msg:m,type:"success"})).catch(e=>setStatus({msg:e,type:"error"}));};
  const addFolder=async()=>{const r=await invoke("open_folder_dialog").catch(()=>null);if(r)set("romFolders",[...(s.romFolders||[]),r]);};

  const save=async()=>{
    setStatus({msg:"Saving...",type:"loading"});
    try{
      await invoke("save_console_settings",{consoleId,emulatorPath:s.emulatorPath,romFolders:s.romFolders,settings:{}});
      setStatus({msg:"Saved!",type:"success"});
      setTimeout(()=>{setStatus(null);onSaved?.();onClose();},1200);
    }catch(e){setStatus({msg:`Error: ${e}`,type:"error"});}
  };

  return(
    <Modal onClose={onClose} wide>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
        <div>
          <div style={{fontFamily:"'Boogaloo',cursive",fontSize:"20px",letterSpacing:"2px",color:c.accent}}>{c.label.toUpperCase()} — DIRECTORY</div>
          <div style={{fontSize:"11px",color:"rgba(255,255,255,0.3)",marginTop:"2px"}}>Set emulator path and ROM folders</div>
        </div>
        <Btn onClick={onClose}>✕</Btn>
      </div>
      <div style={{minHeight:"280px",maxHeight:"52vh",overflowY:"auto"}}>
        <Card>
          <Divider label="Emulator Executable"/>
          <Input label="Emulator Path" value={s.emulatorPath} onChange={e=>set("emulatorPath",e.target.value)} placeholder={`C:\\Emulators\\${c.emulator}\\${c.emulator}.exe`} mono tip={`Full path to the ${c.emulator} .exe file. Use Browse to find it.`}/>
          <div style={{display:"flex",gap:"8px",marginTop:"10px"}}>
            <Btn variant="accent" accent={c.accent} onClick={browsePath} style={{fontSize:"12px"}}>📂 Browse...</Btn>
            <Btn onClick={testLaunch} style={{fontSize:"12px"}}>✓ Test</Btn>
          </div>
          {consoleId==="wiiu"&&(
            <div style={{marginTop:"12px",background:"rgba(125,211,252,0.08)",border:"1px solid rgba(125,211,252,0.25)",borderRadius:"8px",padding:"12px 14px"}}>
              <div style={{fontSize:"12px",fontWeight:700,color:"#7dd3fc",marginBottom:"6px"}}>⚠️ Wii U — Important</div>
              <div style={{fontSize:"11px",color:"rgba(255,255,255,0.55)",lineHeight:1.7}}>
                <strong style={{color:"rgba(255,255,255,0.75)"}}>Decryption keys:</strong> Wii U games will not launch without a <strong style={{color:"rgba(255,255,255,0.8)"}}>keys.txt</strong> file in the same folder as Cemu.exe.<br/>
                <strong style={{color:"rgba(255,255,255,0.75)"}}>All settings</strong> — video, audio, and controllers — must be changed inside Cemu via its <strong style={{color:"rgba(255,255,255,0.8)"}}>Options</strong> menu.
              </div>
            </div>
          )}
          {consoleId==="xbox"&&(
            <div style={{marginTop:"12px",background:"rgba(251,191,36,0.08)",border:"1px solid rgba(251,191,36,0.25)",borderRadius:"8px",padding:"12px 14px"}}>
              <div style={{fontSize:"12px",fontWeight:700,color:"#fbbf24",marginBottom:"6px"}}>⚠️ Xbox Original — BIOS Required</div>
              <div style={{fontSize:"11px",color:"rgba(255,255,255,0.55)",lineHeight:1.6}}>xemu requires an Xbox BIOS file and MCPX boot ROM before any game will run. Set these paths in xemu's Machine → Settings → System.</div>
            </div>
          )}
          {consoleId==="ps3"&&(
            <div style={{marginTop:"12px",background:"rgba(56,189,248,0.08)",border:"1px solid rgba(56,189,248,0.25)",borderRadius:"8px",padding:"12px 14px"}}>
              <div style={{fontSize:"12px",fontWeight:700,color:"#38bdf8",marginBottom:"6px"}}>⚠️ PS3 — Firmware Required</div>
              <div style={{fontSize:"11px",color:"rgba(255,255,255,0.55)",lineHeight:1.6}}>Before any PS3 game will run, open RPCS3, go to <strong style={{color:"rgba(255,255,255,0.8)"}}>File → Install Firmware</strong>, and install PS3UPDAT.PUP.</div>
            </div>
          )}
          <Divider label="ROM Folders"/>
          {(s.romFolders||[]).length===0&&<p style={{fontSize:"12px",color:"rgba(255,255,255,0.25)",marginBottom:"12px"}}>No folders added yet.</p>}
          <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"12px"}}>
            {(s.romFolders||[]).map((f,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",background:"rgba(0,0,0,0.3)",borderRadius:"8px",padding:"9px 12px",border:"1px solid rgba(255,255,255,0.07)"}}>
                <span style={{flex:1,fontSize:"12px",color:"rgba(255,255,255,0.65)",fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f}</span>
                <Btn variant="danger" style={{padding:"4px 8px",fontSize:"11px",flexShrink:0}} onClick={()=>set("romFolders",(s.romFolders||[]).filter((_,j)=>j!==i))}>✕</Btn>
              </div>
            ))}
          </div>
          <Btn variant="accent" accent={c.accent} onClick={addFolder} style={{width:"100%",justifyContent:"center",display:"flex"}}>📂 Add ROM Folder</Btn>
          <Divider label="Recognised File Extensions"/>
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginTop:"8px"}}>
            {c.ext.map(e=><span key={e} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"5px",padding:"3px 9px",fontSize:"11px",color:"rgba(255,255,255,0.45)",fontFamily:"monospace"}}>{e}</span>)}
          </div>
        </Card>
      </div>
      {status&&<div style={{marginTop:"12px"}}><Toast msg={status.msg} type={status.type} accent={c.accent}/></div>}
      <div style={{display:"flex",gap:"10px",marginTop:"16px",justifyContent:"flex-end"}}>
        <Btn onClick={onClose}>Close</Btn>
        <Btn variant="accent" accent={c.accent} onClick={save}>Save</Btn>
      </div>
    </Modal>
  );
}
// ─── RENAME MODAL ────────────────────────────────────────────────────────────
function RenameModal({game,consoleId,accent,onClose,onRenamed}){
  const [title,setTitle]=useState(game.title||"");
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState(null);

  const save=async()=>{
    if(!title.trim())return;
    setSaving(true);
    setError(null);
    try{
      // Returns the new file path after rename
      const newPath=await invoke("rename_game",{consoleId,gameId:game.id,newTitle:title.trim()});
      onRenamed?.(game.id,title.trim(),newPath);
      onClose();
    }catch(e){
      setError(`Could not rename file: ${e}`);
      setSaving(false);
    }
  };

  const handleKey=(e)=>{if(e.key==="Enter")save();};

  return(
    <Modal onClose={onClose}>
      <div style={{fontFamily:"'Boogaloo',cursive",fontSize:"18px",letterSpacing:"2px",color:accent,marginBottom:"18px"}}>RENAME GAME</div>
      <p style={{fontSize:"12px",color:"rgba(255,255,255,0.4)",marginBottom:"14px",lineHeight:1.5}}>
        This renames both the display name in RetroShelf and the actual file on your computer.
      </p>
      <Input label="Game Title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Enter game title..." onKeyDown={handleKey}/>
      <p style={{fontSize:"11px",color:"rgba(255,255,255,0.25)",marginTop:"10px",lineHeight:1.5}}>
        💡 Use the exact title as it appears on SteamGridDB for best cover art results. Example: "Halo: Combat Evolved" not "Halo CE (USA) [!]"
      </p>
      {error&&<div style={{marginTop:"10px",padding:"10px 14px",background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:"8px",fontSize:"12px",color:"#f87171",lineHeight:1.5}}>{error}</div>}
      <div style={{display:"flex",gap:"10px",marginTop:"18px",justifyContent:"flex-end"}}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" accent={accent} onClick={save} disabled={saving||!title.trim()}>
          {saving?"Renaming...":"Rename & Save"}
        </Btn>
      </div>
    </Modal>
  );
}

// ─── GAME CARD ────────────────────────────────────────────────────────────────
function RainbowBorder(){
  return(
    <div style={{
      position:"absolute",inset:"-2px",borderRadius:"10px",pointerEvents:"none",zIndex:3,
      background:"linear-gradient(135deg,#ff0000,#ff6600,#ffff00,#00ff00,#00ffff,#0066ff,#cc00ff,#ff0066,#ff0000)",
      backgroundSize:"300% 300%",
      animation:"rainbowSpin 2s linear infinite",
      padding:"2px",
      WebkitMask:"linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0)",
      WebkitMaskComposite:"xor",
      maskComposite:"exclude",
    }}/>
  );
}

function GameCard({game,idx,accent,color,consoleId,onPlay,onRemove,onCoverUpdate,onRename,showPath,pinned,onTogglePin,pinnedCount,isRainbow,rating=0,isFav=false,onSetRating,onToggleFav}){
  const [hov,setHov]=useState(false);
  const [showGear,setShowGear]=useState(false);
  const [showRename,setShowRename]=useState(false);
  const [showRating,setShowRating]=useState(false);
  const [coverData,setCoverData]=useState(null);
  const [bg1,bg2]=GAME_COLORS[idx%GAME_COLORS.length];
  const init=(game.title||"?").split(/[\s:]+/).filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();
  const gearRef=useRef(null);

  useEffect(()=>{
    if(game.cover_path){
      invoke("get_cover_base64",{path:game.cover_path})
        .then(data=>setCoverData(data))
        .catch(()=>setCoverData(null));
    }else{setCoverData(null);}
  },[game.cover_path]);

  // Close gear menu when clicking outside
  useEffect(()=>{
    if(!showGear)return;
    const handler=(e)=>{if(gearRef.current&&!gearRef.current.contains(e.target))setShowGear(false);};
    document.addEventListener("mousedown",handler);
    return()=>document.removeEventListener("mousedown",handler);
  },[showGear]);

  const pickCover=async(e)=>{
    e.stopPropagation();
    setShowGear(false);
    const imgPath=await invoke("open_image_dialog").catch(()=>null);
    if(!imgPath)return;
    const newPath=await invoke("set_custom_cover",{gameId:game.id,consoleId,imagePath:imgPath}).catch(()=>null);
    if(newPath)onCoverUpdate?.(game.id,newPath);
  };

  const borderStyle=hov?"2px solid rgba(255,255,255,0.85)":"2px solid rgba(255,255,255,0.08)";

  return(
    <>
      <div style={{display:"flex",flexDirection:"column",gap:"4px",position:"relative"}}>
        <div
          onMouseEnter={()=>setHov(true)}
          onMouseLeave={()=>{setHov(false);}}
          style={{
            aspectRatio:"2/3",borderRadius:"8px",
            background:coverData?"#111":`linear-gradient(145deg,${bg1},${bg2})`,
            border:borderStyle,
            cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",
            padding:"10px 7px 8px",transition:"all 0.18s",
            transform:hov?"translateY(-5px) scale(1.04)":"none",
            boxShadow:hov?"0 14px 30px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.15)":"0 4px 12px rgba(0,0,0,0.4)",
            position:"relative",overflow:"visible",
          }}>
          {/* rainbow animated border for N64 */}
          {isRainbow&&hov&&<RainbowBorder/>}
          {/* pinned indicator */}
          
          {/* cover image */}
          {coverData&&<img src={coverData} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:1,borderRadius:"6px"}}/>}
          {/* placeholder */}
          {!coverData&&<div style={{width:"40px",height:"40px",borderRadius:"50%",background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",fontWeight:900,color:"rgba(255,255,255,0.9)",fontFamily:"'Boogaloo',cursive",border:"1px solid rgba(255,255,255,0.14)",zIndex:1}}>{init}</div>}
          {!coverData&&<div style={{fontSize:"8px",color:"rgba(255,255,255,0.8)",textAlign:"center",lineHeight:1.3,fontFamily:"'Nunito',sans-serif",fontWeight:700,zIndex:1,textShadow:"0 1px 4px rgba(0,0,0,0.9)",padding:"0 2px"}}>{game.title}</div>}
          {!coverData&&<div style={{fontSize:"8px",color:"rgba(255,255,255,0.25)",zIndex:1}}>▶</div>}
          {/* hover: play overlay + gear */}
          {hov&&(
            <>
              <div onClick={e=>{e.stopPropagation();onPlay();}} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:5,borderRadius:"6px"}}>
                <div style={{background:"white",borderRadius:"50%",width:"38px",height:"38px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",fontWeight:900,color:"#111",boxShadow:"0 0 16px rgba(255,255,255,0.6)"}}>▶</div>
              </div>
              <div ref={gearRef} style={{position:"absolute",top:"5px",right:"5px",zIndex:8}}>
                <div onClick={e=>{e.stopPropagation();setShowGear(g=>!g);}}
                  style={{width:"22px",height:"22px",borderRadius:"50%",background:"rgba(0,0,0,0.72)",border:`1.5px solid ${showGear?accent:"rgba(255,255,255,0.55)"}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.15s",backdropFilter:"blur(4px)",boxShadow:showGear?`0 0 8px ${accent}88`:"none"}}
                  title="Options">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="1.9" fill="white" fillOpacity="0.95"/>
                    {[0,45,90,135,180,225,270,315].map(a=>(
                      <rect key={a} x="5.3" y="0.3" width="1.4" height="2.6" rx="0.7" fill="white" fillOpacity="0.95" transform={`rotate(${a} 6 6)`}/>
                    ))}
                  </svg>
                </div>
                {showGear&&(
                  <div style={{position:"absolute",top:"26px",right:0,background:"#1a1008",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"8px",padding:"4px",minWidth:"180px",boxShadow:"0 12px 32px rgba(0,0,0,0.8)",zIndex:20}}>
                    {/* Playtime */}
                    {(game.playtime_seconds||0)>0&&(
                      <div style={{padding:"5px 10px 4px",fontSize:"9px",color:"rgba(255,255,255,0.3)",letterSpacing:"1px",borderBottom:"1px solid rgba(255,255,255,0.06)",marginBottom:"3px"}}>
                        ⏱ {(()=>{const s=game.playtime_seconds||0;const h=Math.floor(s/3600);const m=Math.floor((s%3600)/60);return h>0?`${h}h ${m}m`:`${m}m`;})()}  played
                      </div>
                    )}
                    {/* Favorite */}
                    <GearItem icon={isFav?"❤️":"🤍"} label={isFav?"Remove from Favorites":"Add to Favorites"} color={isFav?"#f87171":undefined} onClick={e=>{e.stopPropagation();onToggleFav?.();setShowGear(false);}}/>
                    {/* Rating */}
                    {!showRating
                      ?<GearItem icon="⭐" label={rating>0?`Rating: ${rating}/10`:"Rate This Game"} onClick={e=>{e.stopPropagation();setShowRating(true);}}/>
                      :<div style={{padding:"6px 10px"}}>
                        <div style={{fontSize:"9px",color:"rgba(255,255,255,0.4)",marginBottom:"5px",letterSpacing:"1px"}}>RATING</div>
                        <div style={{display:"flex",gap:"3px",flexWrap:"wrap"}}>
                          {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                            <div key={n} onClick={e=>{e.stopPropagation();onSetRating?.(n);setShowRating(false);setShowGear(false);}}
                              style={{width:"22px",height:"22px",borderRadius:"4px",background:n<=rating?accent+"44":"rgba(255,255,255,0.06)",border:`1px solid ${n<=rating?accent+"66":"rgba(255,255,255,0.08)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",fontWeight:700,color:n<=rating?accent:"rgba(255,255,255,0.4)",cursor:"pointer"}}>
                              {n}
                            </div>
                          ))}
                          {rating>0&&<div onClick={e=>{e.stopPropagation();onSetRating?.(0);setShowRating(false);setShowGear(false);}}
                            style={{width:"22px",height:"22px",borderRadius:"4px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",cursor:"pointer"}}>✕</div>}
                        </div>
                      </div>
                    }
                    <div style={{height:"1px",background:"rgba(255,255,255,0.06)",margin:"3px 4px"}}/>
                    <GearItem icon={pinned?"📌":"📌"} label={pinned?`Unpin from Main Menu`:`Pin to Main Menu (${pinnedCount}/12)`} color={pinned?"#c8a040":undefined} onClick={e=>{e.stopPropagation();onTogglePin?.();setShowGear(false);}}/>
                    <GearItem icon="🖼" label="Set Cover" onClick={pickCover}/>
                    <GearItem icon="✏️" label="Rename" onClick={e=>{e.stopPropagation();setShowRename(true);setShowGear(false);}}/>
                    <div style={{height:"1px",background:"rgba(255,255,255,0.06)",margin:"3px 4px"}}/>
                    <GearItem icon="🗑" label="Remove Game" color="rgba(239,68,68,0.7)" onClick={e=>{e.stopPropagation();onRemove();setShowGear(false);}}/>
                  </div>
                )}
              </div>
              {/* Heart indicator */}
              {isFav&&!showGear&&<div style={{position:"absolute",top:"5px",left:"5px",fontSize:"10px",zIndex:6,filter:"drop-shadow(0 0 3px rgba(248,113,113,0.8))"}}>❤️</div>}
              {/* Rating indicator */}
              {rating>0&&!showGear&&<div style={{position:"absolute",bottom:"5px",left:"5px",background:"rgba(0,0,0,0.7)",borderRadius:"4px",padding:"1px 4px",fontSize:"8px",fontWeight:700,color:accent,zIndex:6}}>★{rating}</div>}
              {/* Filename overlay — absolutely positioned so it never affects card height */}
              {showPath&&game.path&&(
                <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"14px 4px 4px",background:"linear-gradient(transparent,rgba(0,0,0,0.75))",borderRadius:"0 0 8px 8px",zIndex:5,pointerEvents:"none"}}>
                  <div style={{fontSize:"7px",color:"rgba(255,255,255,0.55)",fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.2}} title={game.path}>
                    {game.path.split(/[/\\]/).pop()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {showRename&&<RenameModal game={game} consoleId={consoleId} accent={accent} onClose={()=>setShowRename(false)} onRenamed={onRename}/>}
    </>
  );
}

function GearItem({icon,label,onClick,color}){
  const [h,setH]=useState(false);
  return(
    <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} onClick={onClick} style={{display:"flex",alignItems:"center",gap:"8px",padding:"7px 10px",borderRadius:"5px",cursor:"pointer",background:h?"rgba(255,255,255,0.06)":"transparent",transition:"background 0.1s"}}>
      <span style={{fontSize:"12px",width:"16px",textAlign:"center"}}>{icon}</span>
      <span style={{fontSize:"11px",fontWeight:600,color:color||"rgba(255,255,255,0.65)",whiteSpace:"nowrap"}}>{label}</span>
    </div>
  );
}

function EmptySlot({accent,onAdd}){
  const [h,setH]=useState(false);
  return(<div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} onClick={onAdd} style={{aspectRatio:"2/3",borderRadius:"7px",border:`1.5px dashed ${h?accent+"55":"rgba(255,255,255,0.07)"}`,background:h?"rgba(255,255,255,0.025)":"rgba(255,255,255,0.01)",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",cursor:"pointer"}}>{h&&<span style={{color:`${accent}50`,fontSize:"22px",lineHeight:1,fontWeight:200}}>+</span>}</div>);
}


// ─── GAME LIBRARY ─────────────────────────────────────────────────────────────
function ConsoleGuideModal({step,accent,onClose}){
  return(
    <Modal onClose={onClose} wide>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
        <div style={{fontFamily:"'Boogaloo',cursive",fontSize:"20px",letterSpacing:"3px",color:accent}}>{step.title.toUpperCase()}</div>
        <Btn onClick={onClose}>✕</Btn>
      </div>
      <div style={{maxHeight:"65vh",overflowY:"auto",paddingRight:"6px"}}>
        <p style={{fontSize:"13px",color:"rgba(255,255,255,0.55)",lineHeight:1.7,marginBottom:"12px"}}>{step.body}</p>
        {step.tips&&(
          <div style={{display:"flex",flexDirection:"column",gap:"6px",marginBottom:"12px"}}>
            {step.tips.map((tip,i)=>(
              <div key={i} style={{display:"flex",gap:"12px",background:"rgba(0,0,0,0.25)",borderRadius:"8px",padding:"10px 13px",border:"1px solid rgba(255,255,255,0.05)"}}>
                <div style={{width:"20px",height:"20px",borderRadius:"50%",background:`rgba(200,160,64,0.15)`,border:"1px solid rgba(200,160,64,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:700,color:"#c8a040",flexShrink:0,marginTop:"1px"}}>{i+1}</div>
                <div style={{fontSize:"12px",color:"rgba(255,255,255,0.6)",lineHeight:1.6}}>{tip}</div>
              </div>
            ))}
          </div>
        )}
        {step.extra&&step.extra.map((item,i)=>(
          <ExtraInfoItem key={i} item={item}/>
        ))}
        <div style={{height:"8px"}}/>
      </div>
    </Modal>
  );
}

function GameLibrary({consoleId,appConfig,onBack,onConfigUpdate,tryUnlock,getRating,isFav,onSetRating,onToggleFav}){
  const c=CONSOLES[consoleId];
  const globalCfg=appConfig?.global||{};
  const showPaths=globalCfg.showPaths===true;
  const compactCards=globalCfg.compactCards!==false; // default ON
  const cols=compactCards?7:5;

  const plankGrad=`linear-gradient(180deg,${c.color}cc,${c.color}88,${c.bg})`;
  const shelfRowBg=`${c.bg}cc,${c.color}22`;

  const [games,setGames]=useState([]);
  const [search,setSearch]=useState("");
  const [showFavOnly,setShowFavOnly]=useState(false);
  const [showDirectory,setShowDirectory]=useState(false);
  const [showGuide,setShowGuide]=useState(false);
  const [toast,setToast]=useState(null);
  const [scanning,setScanning]=useState(false);
  const [fetchingCovers,setFetchingCovers]=useState(false);

  const [pinnedGames,setPinnedGames]=useState(()=>{try{return JSON.parse(localStorage.getItem("rs_pinned")||"[]");}catch{return [];}});
  const savePinned=(list)=>{setPinnedGames(list);try{localStorage.setItem("rs_pinned",JSON.stringify(list));}catch{}};
  const togglePin=(game)=>{
    const already=pinnedGames.some(p=>p.gameId===game.id&&p.consoleId===consoleId);
    if(already){savePinned(pinnedGames.filter(p=>!(p.gameId===game.id&&p.consoleId===consoleId)));}
    else{
      if(pinnedGames.length>=12){showToast("Max 12 pinned — unpin one first","info");return;}
      try{localStorage.setItem("rs_last_pin_time",Date.now().toString());}catch{}
      savePinned([...pinnedGames,{gameId:game.id,consoleId,title:game.title,cover_path:game.cover_path||null,path:game.path}]);
    }
  };
  const isPinned=(game)=>pinnedGames.some(p=>p.gameId===game.id&&p.consoleId===consoleId);

  const showToast=(msg,type="info",ms=3000)=>{setToast({msg,type});if(ms)setTimeout(()=>setToast(null),ms);};
  const loadGames=useCallback(()=>{invoke("get_games",{consoleId}).then(setGames).catch(()=>setGames([]));},[consoleId]);
  useEffect(()=>{loadGames();},[loadGames]);

  const filtered=games.filter(g=>{
    if(showFavOnly&&!isFav?.(consoleId,g.id))return false;
    return(g.title||"").toLowerCase().includes(search.toLowerCase());
  }).sort((a,b)=>(a.title||"").localeCompare(b.title||""));
  const rowsToShow=Math.max(1,Math.ceil(filtered.length/cols));

  const removeGame=async(game)=>{
    await invoke("remove_game",{consoleId,gameId:game.id}).catch(()=>null);
    setGames(gs=>gs.filter(g=>g.id!==game.id));
    try{const rc=(parseInt(localStorage.getItem("rs_remove_count")||"0"))+1;localStorage.setItem("rs_remove_count",rc);}catch{}
  };
  const updateCover=(gameId,newPath)=>{
    setGames(gs=>gs.map(g=>g.id===gameId?{...g,cover_path:newPath}:g));
    try{const p=JSON.parse(localStorage.getItem("rs_pinned")||"[]");localStorage.setItem("rs_pinned",JSON.stringify(p.map(x=>x.gameId===gameId&&x.consoleId===consoleId?{...x,cover_path:newPath}:x)));}catch{}
    try{const cc=(parseInt(localStorage.getItem("rs_cover_count")||"0"))+1;localStorage.setItem("rs_cover_count",cc);}catch{}
  };
  const renameGame=(gameId,newTitle,newPath)=>{
    setGames(gs=>gs.map(g=>g.id===gameId?{...g,title:newTitle,path:newPath||g.path}:g));
    try{const rc=(parseInt(localStorage.getItem("rs_rename_count")||"0"))+1;localStorage.setItem("rs_rename_count",rc);}catch{}
  };
  const addFolder=async()=>{
    const folder=await invoke("open_folder_dialog").catch(()=>null);
    if(!folder)return;
    setScanning(true);showToast("Scanning folder...","loading",0);
    try{const n=await invoke("scan_rom_folder",{consoleId,folder});setGames(p=>[...p,...n]);showToast(`Found ${n.length} new games!`,"success");}
    catch(e){showToast(`Scan failed: ${e}`,"error");}
    finally{setScanning(false);}
  };
  const fetchCovers=async()=>{
    setFetchingCovers(true);showToast("Fetching covers from SteamGridDB...","loading",0);
    try{const n=await invoke("fetch_all_covers_for_console",{consoleId});showToast(`Fetched ${n} covers!`,"success");loadGames();}
    catch(e){showToast(`${e}`,"error");}
    finally{setFetchingCovers(false);}
  };
  const openEmulator=async()=>{
    const path=appConfig?.consoles?.[consoleId]?.emulator_path||"";
    try{await invoke("open_emulator",{emulatorPath:path});showToast(`Opened ${c.emulator}!`,"success");}
    catch(e){showToast(`${e}`,"error");}
  };
  const launchGame=async(game)=>{
    // Set session start and check timing-sensitive achievements BEFORE launching
    try{localStorage.setItem("rs_session_start",Date.now().toString());}catch{}
    const h=new Date().getHours();
    if(tryUnlock&&h===3)tryUnlock("secret_3am");
    if(tryUnlock){
      try{
        const openTime=parseInt(localStorage.getItem("rs_app_open_time")||"0");
        if(openTime&&Date.now()-openTime<15000)tryUnlock("secret_fast");
      }catch{}
    }
    try{
      const durationSeconds=await invoke("launch_game",{consoleId,gameId:game.id});
      window._addSession?.(consoleId,game.id,game.title||"Unknown",durationSeconds||0);
      // Track console as played today if session was 10+ minutes
      if(durationSeconds>=600){
        try{
          const today=new Date().toDateString();
          const tc=JSON.parse(localStorage.getItem("rs_today_consoles")||"{}");
          if(tc.date!==today){tc.date=today;tc.consoles=[];}
          if(!tc.consoles.includes(consoleId))tc.consoles.push(consoleId);
          localStorage.setItem("rs_today_consoles",JSON.stringify(tc));
        }catch{}
      }
      // Track games played today (after session so we know it was really played)
      if(tryUnlock){
        try{
          const today=new Date().toDateString();
          const td=JSON.parse(localStorage.getItem("rs_today_games")||"{}");
          if(td.date!==today){td.date=today;td.games=[];}
          if(!td.games.includes(`${consoleId}:${game.id}`))td.games.push(`${consoleId}:${game.id}`);
          localStorage.setItem("rs_today_games",JSON.stringify(td));
          if(td.games.length>=10)tryUnlock("play_10_oneday");
        }catch{}
      }
    }
    catch(e){showToast(`Launch failed: ${e}`,"error");}
  };
  const toggleFullscreen=async()=>{
    try{await invoke("toggle_fullscreen");}catch(e){showToast(`${e}`,"error");}
  };

  const guideStep=TUTORIAL_STEPS.find(s=>s.id===consoleId);

  return(
    <>
      <div style={{height:"100vh",background:`linear-gradient(160deg,${c.bg},#0a0600)`,display:"flex",flexDirection:"column",animation:"fadeIn 0.22s ease"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"10px 18px",background:"rgba(0,0,0,0.5)",borderBottom:"1px solid rgba(255,255,255,0.06)",flexShrink:0,flexWrap:"wrap"}}>
          <Btn onClick={onBack} style={{fontSize:"12px"}}>← Back</Btn>
          <div style={{width:"1px",height:"22px",background:"rgba(255,255,255,0.08)"}}/>
          <div>
            <div style={{fontFamily:"'Boogaloo',cursive",fontSize:"17px",letterSpacing:"3px",color:c.accent,lineHeight:1}}>{c.label.toUpperCase()}</div>
            <div style={{fontSize:"9px",color:"rgba(255,255,255,0.25)",letterSpacing:"1.5px",marginTop:"1px"}}>{games.length} GAMES · {c.emulator}</div>
          </div>
          <div style={{flex:1}}/>
          <div style={{position:"relative"}}>
            <span style={{position:"absolute",left:"8px",top:"50%",transform:"translateY(-50%)",fontSize:"10px",opacity:0.35}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{background:"rgba(0,0,0,0.4)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"7px",padding:"6px 8px 6px 24px",color:"#fff",fontSize:"11px",width:"130px"}}/>
          </div>
          <Btn onClick={()=>setShowFavOnly(v=>!v)} style={{fontSize:"13px",padding:"6px 10px",background:showFavOnly?"rgba(239,68,68,0.15)":"transparent",border:`1px solid ${showFavOnly?"rgba(239,68,68,0.4)":"rgba(255,255,255,0.1)"}`,color:showFavOnly?"#f87171":"rgba(255,255,255,0.4)"}} title={showFavOnly?"Show all games":"Show favorites only"}>
            {showFavOnly?"❤️":"🤍"}
          </Btn>
          <Btn onClick={openEmulator} style={{fontSize:"11px"}}>🚀 Launch {c.emulator}</Btn>
          <Btn onClick={fetchCovers} disabled={fetchingCovers} style={{fontSize:"11px",display:"flex",alignItems:"center",gap:"4px"}}>
            {fetchingCovers?<Spinner size={11}/>:"🖼"} Fetch Covers
          </Btn>
          <Btn onClick={async()=>{setScanning(true);try{
            const folders=(appConfig?.consoles?.[consoleId]?.rom_folders||[]);
            for(const folder of folders){
              try{const n=await invoke("scan_rom_folder",{consoleId,folder});setGames(p=>{const existing=new Set(p.map(g=>g.path));return[...p,...n.filter(g=>!existing.has(g.path))];});}catch{}
            }
            // Remove games from removed folders AND games whose files no longer exist
            await invoke("cleanup_orphaned_games").catch(()=>{});
            await invoke("remove_missing_files",{consoleId}).catch(()=>{});
            const fresh=await invoke("get_games",{consoleId}).catch(()=>null);
            if(fresh)setGames(fresh);
            showToast("Library refreshed","success");
          }finally{setScanning(false);}}} disabled={scanning} style={{fontSize:"11px",display:"flex",alignItems:"center",gap:"4px"}} title="Rescan ROM folders">
            {scanning?<Spinner size={11} color={c.accent}/>:"🔄"} Refresh
          </Btn>
          <Btn onClick={()=>setShowDirectory(true)} style={{fontSize:"11px"}}>📂 Directory</Btn>
          {guideStep&&<Btn onClick={()=>setShowGuide(true)} style={{fontSize:"11px"}}>📖 {c.label} Guide</Btn>}
          <Btn onClick={toggleFullscreen} style={{fontSize:"13px",padding:"6px 10px"}} title="Toggle Fullscreen">⛶</Btn>
        </div>
        {toast&&<Toast msg={toast.msg} type={toast.type} accent={c.accent}/>}
        <div style={{flex:1,padding:"16px 18px 20px",overflowY:"auto"}}>
          <div style={{fontSize:"9px",fontWeight:700,color:"rgba(255,255,255,0.13)",letterSpacing:"3px",marginBottom:"12px"}}>
            LIBRARY{search?` · "${search}"`:""} · {filtered.length} GAMES
          </div>
          {Array.from({length:rowsToShow}).map((_,row)=>{
            const rowStart=row*cols;
            const rowGames=filtered.slice(rowStart,rowStart+cols);
            if(rowGames.length===0&&row>0)return null;
            return(
              <div key={row} style={{marginBottom:"12px"}}>
                <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:compactCards?"7px":"10px",padding:"10px 10px 14px",background:`linear-gradient(180deg,${shelfRowBg})`,borderRadius:"4px 4px 0 0"}}>
                  {Array.from({length:cols}).map((_,si)=>{
                    const game=filtered[rowStart+si];
                    return game
                      ?<GameCard key={game.id} game={game} idx={rowStart+si} accent={c.accent} color={c.color} consoleId={consoleId} onPlay={()=>launchGame(game)} onRemove={()=>removeGame(game)} onCoverUpdate={updateCover} onRename={renameGame} showPath={showPaths} pinned={isPinned(game)} onTogglePin={()=>togglePin(game)} pinnedCount={pinnedGames.length} isRainbow={c.rainbow===true} rating={getRating?.(consoleId,game.id)||0} isFav={isFav?.(consoleId,game.id)||false} onSetRating={(r)=>onSetRating?.(consoleId,game.id,r)} onToggleFav={()=>onToggleFav?.(consoleId,game.id)}/>
                      :null;
                  })}
                </div>
                <div style={{height:"10px",background:plankGrad,boxShadow:`inset 0 2px 0 ${c.accent}20,0 4px 14px rgba(0,0,0,0.7)`,borderRadius:"0 0 3px 3px"}}>
                  <div style={{margin:"2px 14px",height:"2px",background:"rgba(255,255,255,0.05)",borderRadius:"2px"}}/>
                </div>
                <div style={{height:"4px",background:"linear-gradient(180deg,rgba(0,0,0,0.35),transparent)"}}/>
              </div>
            );
          })}
          {filtered.length===0&&games.length===0&&<div style={{textAlign:"center",padding:"36px",color:"rgba(255,255,255,0.15)",fontSize:"13px"}}>No games yet — open <strong style={{color:"rgba(255,255,255,0.3)"}}>📂 Directory</strong> to add a ROM folder</div>}
          {filtered.length===0&&games.length>0&&<div style={{textAlign:"center",padding:"36px",color:"rgba(255,255,255,0.15)",fontSize:"13px"}}>No games match "{search}"</div>}
        </div>
      </div>
      {showDirectory&&<ConsoleSettings consoleId={consoleId} initialConfig={appConfig?.consoles?.[consoleId]} onClose={()=>setShowDirectory(false)} onSaved={onConfigUpdate}/>}
      {showGuide&&guideStep&&<ConsoleGuideModal step={guideStep} accent={c.accent} onClose={()=>setShowGuide(false)}/>}
    </>
  );
}

// ─── GLOBAL SETTINGS ──────────────────────────────────────────────────────────
function GlobalSettings({config,onClose,onSaved}){
  const [s,setS]=useState({steamgriddb_key:config?.steamgriddb_key||"",cover_source:config?.cover_source||"steamgriddb",...(config?.global||{})});
  const set=(k,v)=>setS(p=>({...p,[k]:v}));
  const [status,setStatus]=useState(null);
  const [resetConfirm,setResetConfirm]=useState(false);

  const save=async()=>{
    setStatus({msg:"Saving...",type:"loading"});
    const{steamgriddb_key,cover_source,...global}=s;
    invoke("save_global_settings",{global,steamgriddbKey:steamgriddb_key,coverSource:cover_source})
      .then(()=>{setStatus({msg:"Saved!",type:"success"});setTimeout(()=>{setStatus(null);onSaved?.();onClose();},1000);})
      .catch(e=>setStatus({msg:`Error: ${e}`,type:"error"}));
  };

  const doReset=async()=>{
    setStatus({msg:"Resetting everything...",type:"loading"});
    try{
      await invoke("reset_all_settings");
      // Clear all localStorage data
      const keysToRemove=["rs_tutorial_seen","rs_profile","rs_achievements","rs_pinned","rs_collections","rs_consoles_played","rs_games_played","rs_launch_count","rs_cover_count","rs_rename_count","rs_remove_count","rs_profile_opens","rs_streak","rs_today_games","rs_today_consoles","rs_session_start","rs_app_open_time","rs_last_pin_time","rs_game_meta","rs_session_history","rs_guide_progress"];
      keysToRemove.forEach(k=>{try{localStorage.removeItem(k);}catch{}});
      setStatus({msg:"Done! Restarting...",type:"success"});
      setTimeout(()=>invoke("restart_app").catch(()=>{}),1200);
    }catch(e){
      setStatus({msg:`Error: ${e}`,type:"error"});
    }
    setResetConfirm(false);
  };

  return(
    <Modal onClose={onClose} wide>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px"}}>
        <div>
          <div style={{fontFamily:"'Boogaloo',cursive",fontSize:"22px",letterSpacing:"3px",color:"#c8a040"}}>GLOBAL SETTINGS</div>
          <div style={{fontSize:"11px",color:"rgba(255,255,255,0.3)",marginTop:"2px"}}>Hover the <span style={{background:"rgba(255,255,255,0.1)",borderRadius:"50%",padding:"0 4px",fontSize:"9px"}}>i</span> icons for explanations</div>
        </div>
        <Btn onClick={onClose}>✕</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"18px"}}>
        <Card>
          <Divider label="Appearance"/>
          <Toggle value={s.showBadges??true} onChange={v=>set("showBadges",v)} label="Show game count badges on shelf" tip="Shows a small number on each console logo on the main shelf telling you how many games you have in that library." accent="#c8a040"/>
          <Toggle value={s.compactCards!==false} onChange={v=>set("compactCards",v)} label="Compact game cards" tip="7 columns instead of 5. Default ON." accent="#c8a040"/>
          <Toggle value={s.showPaths??false} onChange={v=>set("showPaths",v)} label="Show file names under games" tip="Shows the ROM file name underneath each game card in the library. Useful for identifying exact files." accent="#c8a040"/>
        </Card>
        <Card>
          <Divider label="Cover Art"/>
          <Sel label="Cover Source" value={s.cover_source||"steamgriddb"} onChange={v=>set("cover_source",v)} tip="SteamGridDB automatically downloads cover art using your API key. Local Files Only means you set covers manually." options={[{value:"steamgriddb",label:"SteamGridDB (recommended)"},{value:"local",label:"Local Files Only"}]}/>
          <Input label="SteamGridDB API Key" value={s.steamgriddb_key} onChange={e=>set("steamgriddb_key",e.target.value)} placeholder="Paste your free API key..." style={{marginTop:"12px"}} tip="Free API key from steamgriddb.com — sign up, go to account preferences, generate a key. Paste it here."/>
        </Card>
        <Card>
          <Divider label="Startup"/>
          <Toggle value={s.scanOnStartup??true} onChange={v=>set("scanOnStartup",v)} label="Rescan ROM folders on startup" tip="Every time RetroShelf opens it automatically scans all your ROM folders for new games." accent="#c8a040"/>
          <div style={{marginTop:"12px"}}>
            <Btn style={{width:"100%",justifyContent:"center",display:"flex"}} onClick={()=>{invoke("rescan_all_folders");onClose();}}>🔄 Rescan All Folders Now</Btn>
          </div>
        </Card>
      </div>

      {/* Reset section */}
      <div style={{marginTop:"18px",background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:"10px",padding:"16px 18px"}}>
        <div style={{fontSize:"13px",fontWeight:700,color:"#f87171",marginBottom:"6px"}}>⚠️ Reset All Settings</div>
        <p style={{fontSize:"11px",color:"rgba(255,255,255,0.4)",lineHeight:1.6,marginBottom:"12px"}}>
          Clears <strong style={{color:"rgba(255,255,255,0.6)"}}>everything</strong> — emulator paths, ROM folders, game library, cover art, settings, your player profile, playtime stats, collections, and pinned posters. This cannot be undone.
        </p>
        {!resetConfirm
          ?<Btn variant="danger" onClick={()=>setResetConfirm(true)} style={{fontSize:"12px"}}>Reset All Settings...</Btn>
          :<div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
            <span style={{fontSize:"12px",color:"#f87171",fontWeight:600}}>Are you sure? This cannot be undone.</span>
            <Btn variant="danger" onClick={doReset} style={{fontSize:"12px"}}>Yes, Reset Everything</Btn>
            <Btn onClick={()=>setResetConfirm(false)} style={{fontSize:"12px"}}>Cancel</Btn>
          </div>
        }
      </div>

      {status&&<div style={{marginTop:"14px"}}><Toast msg={status.msg} type={status.type} accent="#c8a040"/></div>}
      <div style={{display:"flex",gap:"10px",marginTop:"20px",justifyContent:"flex-end"}}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="solid" accent="#c8a040" style={{color:"#000"}} onClick={save}>Save Settings</Btn>
      </div>
    </Modal>
  );
}

// ─── TUTORIAL ─────────────────────────────────────────────────────────────────
// ─── TUTORIAL ─────────────────────────────────────────────────────────────────
const TUTORIAL_STEPS=[
  {
    id:"overview",icon:"🗂",title:"What is RetroShelf?",
    body:"RetroShelf is a game launcher for emulators. Think of it like a nice-looking shelf that holds all your games in one place. It does NOT come with any games or emulators — you download those yourself. RetroShelf just organises and launches everything for you.",
    tips:[
      "RetroShelf does not include any games. You need to have your own ROM files (the game files) on your computer.",
      "RetroShelf does not include any emulators. Each console in the app has its own emulator you download once from the internet. The guides in this menu tell you exactly where.",
      "You only need to set up the consoles you actually want to play. Skip the ones you don't care about.",
      "Once set up, using RetroShelf is simple: click a console → click a game → it launches. That's it.",
      "Hover any (i) icon anywhere in the app for a plain-English explanation of what that thing does.",
    ],
    extra:[
      {icon:"📁",title:"What is a ROM?",points:[
        "A ROM is a copy of a game stored as a file on your computer. For example, a PS2 game might be a .iso file, an N64 game might be a .z64 file.",
        "ROMs must come from your own physical game collection. RetroShelf does not provide ROMs and never will.",
        "Each console recognises specific file types. The Directory section for each console shows what file types it supports.",
      ]},
      {icon:"🖥️",title:"What is an emulator?",points:[
        "An emulator is a free program that pretends to be a game console on your PC. For example, PCSX2 pretends to be a PS2 so you can play PS2 games on your computer.",
        "Each console in RetroShelf uses a specific emulator. This guide tells you which one and where to download it.",
        "Emulators are free and legal to download. The games themselves are a separate matter.",
      ]},
    ],
  },

  {
    id:"gettingstarted",icon:"📂",title:"Step 1 — Organise Your Files FIRST",
    body:"Before you do anything else in RetroShelf, you need to organise your ROM files properly. This is the most important step. If you skip this, your library will be a mess. Do this NOW before setting up any emulators.",
    tips:[
      "CREATE ONE FOLDER PER CONSOLE. Go to your C: drive and create a folder called ROMs. Inside that, create a separate folder for each console you have games for.",
      "Example folder structure: C:\\ROMs\\PS1 · C:\\ROMs\\PS2 · C:\\ROMs\\PS3 · C:\\ROMs\\GameCube · C:\\ROMs\\Wii · C:\\ROMs\\WiiU · C:\\ROMs\\N64 · C:\\ROMs\\DS · C:\\ROMs\\3DS · C:\\ROMs\\Xbox · C:\\ROMs\\Xbox360 · C:\\ROMs\\Dreamcast",
      "Put ONLY that console's games inside each folder. Do not mix consoles. If RetroShelf scans a mixed folder, games will either not appear or appear under the wrong console.",
      "KEEP YOUR FILE NAMES CLEAN. Rename messy ROM files to just the game title. Example: rename 'Halo_Combat_Evolved_(USA)[!].iso' to just 'Halo Combat Evolved.iso'. This helps RetroShelf find cover art automatically.",
      "DO THIS BEFORE adding any folders to RetroShelf. It is much harder to fix later.",
    ],
    extra:[
      {icon:"📦",title:"How to extract .zip and .7z files — use 7-Zip",points:[
        "Many emulator downloads come as .zip or .7z files. You need to EXTRACT them before you can use them.",
        "Download 7-Zip for free from 7-zip.org — it's the best free tool for this. Install it.",
        "To extract: right-click the .zip or .7z file → 7-Zip → Extract Here (or Extract to [folder name]).",
        "After extracting you'll see the actual files inside. Look for the .exe file — that's the emulator.",
        "Do NOT just double-click a .zip and run things from inside it. Always extract first.",
        "Some emulators come as installers (.exe files that say setup or install). For those, just double-click and follow the installer.",
      ]},
      {icon:"🎮",title:"General controller advice",points:[
        "Xbox controllers (and most modern controllers) work automatically — just plug in via USB or pair via Bluetooth and you're done.",
        "PlayStation controllers (DualSense, DualShock 4) work via USB automatically. For Bluetooth: Windows Settings → Bluetooth & devices → Add device.",
        "If a controller isn't detected in an emulator: make sure it was plugged in BEFORE you opened the emulator. Close the emulator, plug in the controller, reopen it.",
        "Stick drift (character moves by itself): open the emulator's controller settings and increase the Deadzone slider.",
        "Wrong buttons: open the emulator's controller/input settings and remap them. Most emulators let you click the button on screen then press the physical button to rebind.",
      ]},
    ],
  },

  {
    id:"generalsetup",icon:"🚀",title:"Step 2 — General Setup Flow",
    body:"Every console in RetroShelf is set up the same way. Learn this once and you can set up any console. Follow these steps in order for each console you want to use.",
    tips:[
      "STEP 1 — Download the emulator. Each console's guide in this menu tells you exactly where. Download it, extract it with 7-Zip if it's a .zip or .7z file, and put it somewhere like C:\\Emulators\\PCSX2.",
      "STEP 2 — Open the emulator ONCE by itself first. In RetroShelf, go to the console's library page and click 🚀 Launch [Emulator] at the top. This lets the emulator do its first-time setup — creating config files, folders, and defaults. If you skip this, things may break later.",
      "STEP 3 — Tell RetroShelf where the emulator is. On the console's library page, click 📂 Directory. Click Browse, find the emulator's .exe file, click Save. You only do this once.",
      "STEP 4 — Add your ROM folder. Still in 📂 Directory, click Add ROM Folder and select the folder where that console's games are stored (e.g. C:\\ROMs\\PS2). RetroShelf scans it and your games appear.",
      "STEP 5 — Configure the emulator's settings. Open the emulator directly using the 🚀 Launch button. Inside the emulator, set your graphics quality, audio, and controller bindings. Each console's guide in this menu has a recommended settings list.",
      "STEP 6 — Play. Click any game card → click the ▶ play button that appears on hover. Done.",
      "STEP 7 — Pin your favourites. Hover any game card → click the ⚙ gear icon → Pin to Main Menu. Pinned games appear as posters on the main shelf for instant access.",
      "STEP 8 — Get cover art. See the Cover Art guide in this menu for how to automatically download box art for all your games.",
    ],
    extra:[
      {icon:"💡",title:"Tips for staying organised",points:[
        "Name your emulator folders clearly: C:\\Emulators\\DuckStation, C:\\Emulators\\PCSX2, C:\\Emulators\\Dolphin etc.",
        "Don't move emulator folders after setting them up in RetroShelf — the paths will break and you'll need to re-browse.",
        "If you add new games to a ROM folder later, go to 📂 Directory → Add ROM Folder → re-select the same folder — RetroShelf scans for new files.",
        "Use Rename (hover a game → ⚙ gear → Rename) to clean up messy game names. Use the exact title as it appears on the game box for best cover art results.",
      ]},
    ],
  },

  {
    id:"ps1",icon:"🎮",title:"PlayStation 1 — DuckStation",
    body:"DuckStation is the best PS1 emulator. Simple to set up and makes old PS1 games look dramatically better with PGXP enhancements, which fix the wobbly polygon look the PS1 was known for.",
    tips:[
      "DOWNLOAD: Go to duckstation.org. Click the latest release. Download the Windows zip file. Extract it with 7-Zip to C:\\Emulators\\DuckStation.",
      "BIOS FILE REQUIRED: PS1 needs a BIOS file (e.g. scph1001.bin) to run games. Place it inside a folder called bios inside your DuckStation folder. DuckStation finds it automatically. Without this, no games will load.",
      "FIRST LAUNCH: In RetroShelf, go to PlayStation 1 library → click 🚀 Launch DuckStation. Let it open and close. This creates its config files.",
      "SET PATH IN RETROSHELF: PlayStation 1 library → 📂 Directory → Browse → find duckstation-qt-x64-ReleaseLTCG.exe → Save.",
      "ADD GAMES: Open 📂 Directory → Add ROM Folder → select your C:\\ROMs\\PS1 folder → Save.",
      "KEY SETTINGS (open DuckStation directly): Settings → Display → Internal Resolution: 4x. Settings → Enhancements → turn ON PGXP Geometry Correction. This fixes the wobbly polygons and makes games look far better.",
    ],
    extra:[
      {icon:"🔧",title:"Full recommended settings list",points:[
        "Settings → Display → Renderer: Vulkan (fastest on modern PCs)",
        "Settings → Display → Internal Resolution: 4x (makes games sharper)",
        "Settings → Enhancements → PGXP Geometry Correction: ON — THE most important PS1 setting, fixes wobbly polygons",
        "Settings → Enhancements → PGXP Texture Correction: ON",
        "Settings → Display → Widescreen Hack: try per-game, turn off if a game looks broken",
      ]},
      {icon:"🎮",title:"Controller setup",points:[
        "Settings → Controllers → Port 1 → Controller Type: DualShock for most games, or Digital Pad for very old games.",
        "Xbox/XInput controllers work automatically — buttons are pre-mapped correctly.",
        "Button mapping: Cross=A, Circle=B, Square=X, Triangle=Y, L1=LB, R1=RB, L2=LT, R2=RT, Start=Start, Select=Back.",
        "To enable rumble: Settings → Controllers → Port 1 → enable Vibration.",
      ]},
    ],
  },

  {
    id:"ps2",icon:"🎮",title:"PlayStation 2 — PCSX2",
    body:"PCSX2 is the definitive PS2 emulator with near-perfect game compatibility. Download the Nightly Qt build — it's newer and better than the stable release.",
    tips:[
      "DOWNLOAD: Go to pcsx2.net → click Nightly builds → download the Qt Windows version. Extract with 7-Zip to C:\\Emulators\\PCSX2.",
      "BIOS FILE REQUIRED: PS2 needs a BIOS from a real PS2. Place the BIOS file in PCSX2's bios folder (PCSX2 creates this on first launch). Open PCSX2 → Settings → BIOS to confirm it's found.",
      "FIRST LAUNCH: PlayStation 2 library → 🚀 Launch PCSX2. Let it open and create its folders, then close.",
      "SET PATH IN RETROSHELF: PlayStation 2 library → 📂 Directory → Browse → find pcsx2-qt.exe → Save.",
      "ADD GAMES: Open 📂 Directory → Add ROM Folder → select C:\\ROMs\\PS2 → Save.",
      "KEY SETTINGS (open PCSX2 directly): Settings → Graphics → Renderer: Vulkan. Internal Resolution: 3x Native. Hardware Fixes → Align Sprite: ON — fixes shimmering textures at high resolutions.",
    ],
    extra:[
      {icon:"🔧",title:"Full recommended settings list",points:[
        "Settings → Graphics → Renderer: Vulkan",
        "Settings → Graphics → Internal Resolution: 3x Native (clean 1080p equivalent)",
        "Settings → Graphics → Anisotropic Filtering: 16x (sharper textures, nearly free performance-wise)",
        "Settings → Graphics → Hardware Fixes → Align Sprite: ON (fixes shimmering — turn on first if textures look unstable)",
        "Settings → Patches → Widescreen: ON if the game supports it",
        "Settings → Patches → No-Interlacing: ON for cleaner image in cutscenes",
      ]},
      {icon:"🎮",title:"Controller setup",points:[
        "Settings → Controllers → Port 1 → click each button on screen → press the matching button on your controller to bind it.",
        "Xbox/XInput controllers are detected automatically with buttons pre-filled.",
        "Button mapping: Cross=A, Circle=B, Square=X, Triangle=Y, L1=LB, R1=RB, L2=LT, R2=RT.",
      ]},
    ],
  },

  {
    id:"ps3",icon:"🎮",title:"PlayStation 3 — RPCS3",
    body:"RPCS3 requires a one-time firmware install before ANY game will run — do not skip this. PS3 emulation is demanding — check rpcs3.net/compatibility to see if your specific games run well.",
    tips:[
      "DOWNLOAD: Go to rpcs3.net → Download. Extract with 7-Zip to C:\\Emulators\\RPCS3. Do NOT use an installer.",
      "FIRMWARE REQUIRED — DO THIS FIRST: Go to Sony's website and download PS3UPDAT.PUP. Open RPCS3 → File → Install Firmware → select PS3UPDAT.PUP. Without this, zero games will work.",
      "FIRST LAUNCH: PlayStation 3 library → 🚀 Launch RPCS3. Install firmware, let it build its folder structure, then close.",
      "SET PATH IN RETROSHELF: PlayStation 3 library → 📂 Directory → Browse → find rpcs3.exe → Save.",
      "ADD GAMES: Open 📂 Directory → Add ROM Folder → select C:\\ROMs\\PS3 → Save.",
      "KEY SETTINGS (open RPCS3 directly): Configuration → GPU → Renderer: Vulkan. Shader Compilation: Async. If a game has a black screen or wrong colours: GPU Hacks → Write Color Buffers: ON.",
      "NOTE: The first time you play any PS3 game it will stutter while shaders compile. This is completely normal and gets much smoother after the first session.",
    ],
    extra:[
      {icon:"🔧",title:"Full recommended settings list",points:[
        "Configuration → CPU → PPU Decoder: Recompiler LLVM (much faster than other options)",
        "Configuration → CPU → SPU Decoder: Recompiler LLVM",
        "Configuration → CPU → SPU Loop Detection: ON (reduces CPU usage)",
        "Configuration → GPU → Renderer: Vulkan",
        "Configuration → GPU → Resolution: 1920x1080",
        "Configuration → GPU → Shader Compilation: Async (prevents stuttering when new areas load)",
        "Configuration → GPU → GPU Hacks → Write Color Buffers: ON (fixes black screens and wrong colours in most PS3 games)",
      ]},
      {icon:"🎮",title:"Controller setup",points:[
        "Configuration → Pads → Handler: XInput for Xbox controllers. DualSense for PS5 controllers.",
        "Select your controller from the Device dropdown after picking the Handler. Click Save.",
        "Button mapping (pre-filled for Xbox): Cross=A, Circle=B, Square=X, Triangle=Y, L1=LB, R1=RB, L2=LT, R2=RT.",
      ]},
    ],
  },

  {
    id:"gamecube",icon:"🎮",title:"GameCube — Dolphin",
    body:"Dolphin handles both GameCube AND Wii in one install — download it once and use it for both consoles. Near-perfect compatibility, no BIOS files required.",
    tips:[
      "DOWNLOAD: Go to dolphin-emu.org → Download → get the latest Beta or Stable build for Windows. Extract with 7-Zip to C:\\Emulators\\Dolphin.",
      "NO BIOS NEEDED: Unlike PlayStation emulators, Dolphin doesn't need any extra files. Just extract and go.",
      "FIRST LAUNCH: GameCube library → 🚀 Launch Dolphin. Let it open and create its config folders, then close.",
      "SET PATH IN RETROSHELF: GameCube library → 📂 Directory → Browse → find Dolphin.exe → Save.",
      "ADD GAMES: Open 📂 Directory → Add ROM Folder → select C:\\ROMs\\GameCube → Save.",
      "KEY SETTINGS (open Dolphin directly): Graphics → Backend: Vulkan. Internal Resolution: 3x. Graphics → Hacks tab → turn ON Skip EFB Access from CPU and Store EFB Copies to Texture Only for a big performance boost.",
    ],
    extra:[
      {icon:"🔧",title:"Full recommended settings list",points:[
        "Graphics → General → Backend: Vulkan",
        "Graphics → General → Internal Resolution: 3x Native (clean 1080p)",
        "Graphics → General → Anisotropic Filtering: 4x",
        "Graphics → General → Shader Compilation: Async",
        "Graphics → Hacks → Skip EFB Access from CPU: ON (big performance boost)",
        "Graphics → Hacks → Store EFB Copies to Texture Only: ON (another big boost)",
        "Graphics → Hacks → Immediately Present XFB: ON (reduces input lag)",
      ]},
      {icon:"🎮",title:"Controller setup",points:[
        "Config → GameCube → Port 1 → Standard Controller → click Configure.",
        "Xbox button mapping: A=A, B=B, X=X, Y=Y, Z=RB, Start=Start, L=LT, R=RT, Left Stick=Left Stick, C-Stick=Right Stick.",
        "Have a USB GameCube controller adapter? Config → GameCube → Port 1 → GameCube Adapter for Wii U.",
      ]},
    ],
  },

  {
    id:"wii",icon:"🎮",title:"Nintendo Wii — Dolphin",
    body:"Wii uses the same Dolphin emulator as GameCube — if you already set that up, just point RetroShelf to the same Dolphin.exe. Wii motion controls need a little extra setup but many games work fine with a regular controller.",
    tips:[
      "DOWNLOAD: Same Dolphin as GameCube — dolphin-emu.org. If you already set up GameCube in RetroShelf, skip to step 4.",
      "NO BIOS NEEDED.",
      "FIRST LAUNCH: Wii library → 🚀 Launch Dolphin.",
      "SET PATH IN RETROSHELF: Wii library → 📂 Directory → Browse → find Dolphin.exe (same one as GameCube) → Save.",
      "ADD GAMES: Open 📂 Directory → Add ROM Folder → select C:\\ROMs\\Wii → Save.",
      "MOTION CONTROLS: For games that need Wiimote motion (like Wii Sports), go to Config → Wii → Wii Remote 1 → Emulated Wiimote → Configure. A DualSense or Switch Pro controller can provide gyro input.",
    ],
    extra:[
      {icon:"🎮",title:"Motion control setup (Emulated Wiimote)",points:[
        "Config → Wii → Wii Remote 1 → Emulated Wiimote → Configure.",
        "Recommended Xbox mapping: A=A, B=B, 1=X, 2=Y, Start=Start, Back=Select, Nunchuk Stick=Left Stick, Nunchuk C=LT, Nunchuk Z=RB, IR Pointer=Right Stick.",
        "For gyro (tilting/motion): Motion Input tab → select your DualSense or Switch Pro as the gyro source.",
        "If you have a real Wii Remote: pair it via Windows Bluetooth settings, then set Wii Remote 1 to Real Wiimote.",
      ]},
    ],
  },

  {
    id:"wiiu",icon:"🎮",title:"Nintendo Wii U — Cemu",
    body:"Cemu is the best Wii U emulator and runs most games very well. It requires a special keys.txt file to decrypt games — without it, nothing will launch. ALL settings must be changed inside Cemu directly.",
    tips:[
      "DOWNLOAD: Go to cemu.info → Download. Extract with 7-Zip to C:\\Emulators\\Cemu.",
      "KEYS FILE REQUIRED: You MUST have a file called keys.txt in the same folder as Cemu.exe — not in a subfolder, right next to it. Without it, every game fails with a decryption error.",
      "FIRST LAUNCH: Wii U library → 🚀 Launch Cemu. Let it do first-time setup, then close.",
      "SET PATH IN RETROSHELF: Wii U library → 📂 Directory → Browse → find Cemu.exe → Save.",
      "ADD GAMES: Open 📂 Directory → Add ROM Folder → select C:\\ROMs\\WiiU → Save.",
      "ALL SETTINGS ARE INSIDE CEMU: Open Cemu directly. Options → Graphics Settings for video, Options → Audio Settings for sound, Options → Input Settings for controllers.",
      "GRAPHICS PACKS: Inside Cemu → Options → Graphic Packs → Download latest community graphic packs. Enables higher resolutions and fixes for many games. Highly recommended for Breath of the Wild.",
    ],
    extra:[
      {icon:"🔑",title:"About the keys.txt file",points:[
        "keys.txt must sit in the exact same folder as Cemu.exe — not in a subfolder.",
        "The file contains the Wii U common key and optionally your console's title key.",
        "If you see 'decryption error' when launching a game, keys.txt is either missing, in the wrong place, or contains wrong keys.",
      ]},
      {icon:"🔧",title:"Recommended Cemu settings (inside Cemu)",points:[
        "Options → Graphics Settings → Graphics API: Vulkan",
        "Options → Graphics Settings → Async Shader Compile: ON (prevents hitching)",
        "Options → Graphics Settings → TV Resolution: 1920x1080",
        "Options → Input Settings → create a controller profile and map your buttons",
      ]},
    ],
  },

  {
    id:"n64",icon:"🎮",title:"Nintendo 64 — Project64",
    body:"Project64 is the most widely used N64 emulator on Windows. No BIOS files needed. It uses a plugin system for graphics — GLideN64 is the best graphics plugin and is usually included.",
    tips:[
      "DOWNLOAD: Go to project64-emu.com → Download. The installer version is the easiest — just run it and follow the steps.",
      "NO BIOS NEEDED: N64 doesn't require any BIOS files. Just install and go.",
      "FIRST LAUNCH: Nintendo 64 library → 🚀 Launch Project64. Let it open once, then close.",
      "SET PATH IN RETROSHELF: Nintendo 64 library → 📂 Directory → Browse → find Project64.exe → Save.",
      "ADD GAMES: Open 📂 Directory → Add ROM Folder → select C:\\ROMs\\N64 → Save.",
      "GRAPHICS PLUGIN: Inside Project64 go to Options → Settings → Plugins tab → Video Plugin: make sure GLideN64 is selected. This gives the sharpest image.",
    ],
    extra:[
      {icon:"🔧",title:"GLideN64 recommended settings",points:[
        "Open GLideN64 settings from the Plugins tab. Set Resolution to 2x or 4x over N64 native.",
        "FXAA: ON — smooths jagged edges with almost no performance cost.",
        "Texture Enhancement: 2xSaI or HQ4x for a smoother look.",
        "Framebuffer Effects: ON — needed for some game effects. Disable per-game if something looks wrong.",
        "Widescreen: try it — works in most 3D N64 games.",
      ]},
      {icon:"🎮",title:"Controller setup",points:[
        "Options → Configure Controller Plugin → N-Rage Input Plugin.",
        "Xbox button mapping: A=A, B=B, Z Trigger=LT or RT, Start=Start, L=LB, R=RB, C-Up/Down/Left/Right=Right Stick, Control Stick=Left Stick.",
        "The N64 C-Buttons control the camera in most 3D games — always map them to your right stick.",
      ]},
    ],
  },

  {
    id:"ds",icon:"🎮",title:"Nintendo DS — melonDS",
    body:"melonDS is the most accurate DS emulator. No BIOS files required — just download, extract, and go. The DS had two screens; melonDS shows both on your monitor.",
    tips:[
      "DOWNLOAD: Go to melonds.kuribo64.net → Download → get the Windows build. Extract with 7-Zip to C:\\Emulators\\melonDS.",
      "NO BIOS NEEDED for most games.",
      "FIRST LAUNCH: Nintendo DS library → 🚀 Launch melonDS. Let it open once, then close.",
      "SET PATH IN RETROSHELF: Nintendo DS library → 📂 Directory → Browse → find melonDS.exe → Save.",
      "ADD GAMES: Open 📂 Directory → Add ROM Folder → select C:\\ROMs\\DS → Save.",
      "SETTINGS (open melonDS directly): Config → Video Settings → 3D Renderer: OpenGL. Internal Resolution: 4x.",
      "TOUCH SCREEN: The bottom DS screen is a touchscreen. Use your mouse to click on it in melonDS.",
    ],
    extra:[
      {icon:"🔧",title:"Full recommended settings",points:[
        "Config → Video Settings → 3D Renderer: OpenGL (sharper 3D graphics)",
        "Config → Video Settings → Internal Resolution: 4x",
        "Config → Screen Layout: Natural (top screen above bottom screen)",
        "Config → Screen Layout → Screen Gap: 0 (removes the gap between screens)",
      ]},
      {icon:"🎮",title:"Controller setup",points:[
        "Config → Input and Hotkeys → DS Key Mapping → click each button and press your controller button to bind.",
        "Xbox mapping: A=A, B=B, X=X, Y=Y, L=LB, R=RB, Start=Start, Select=Back, D-Pad=D-Pad.",
      ]},
    ],
  },

  {
    id:"3ds",icon:"🎮",title:"Nintendo 3DS — Lime3DS",
    body:"Lime3DS is the community-maintained replacement for the discontinued Citra emulator. Do NOT use old Citra — use Lime3DS. No BIOS files needed for most games.",
    tips:[
      "DOWNLOAD: Go to lime3ds.net → Downloads → download the Windows zip. Extract with 7-Zip to C:\\Emulators\\Lime3DS. Do NOT use the old Citra.",
      "NO BIOS NEEDED for most games.",
      "FIRST LAUNCH: Nintendo 3DS library → 🚀 Launch Lime3DS. Let it open once, then close.",
      "SET PATH IN RETROSHELF: Nintendo 3DS library → 📂 Directory → Browse → find lime3ds.exe → Save.",
      "ADD GAMES: Open 📂 Directory → Add ROM Folder → select C:\\ROMs\\3DS → Save.",
      "SETTINGS (open Lime3DS directly): Emulation → Configure → Graphics → Resolution Factor: 3x. Hardware Shaders: ON.",
    ],
    extra:[
      {icon:"🔧",title:"Full recommended settings",points:[
        "Emulation → Configure → Graphics → API: OpenGL",
        "Emulation → Configure → Graphics → Resolution Factor: 3x",
        "Emulation → Configure → Graphics → Hardware Shaders: ON (much faster rendering)",
        "Emulation → Configure → Layout → Large Screen (makes the main screen bigger)",
      ]},
      {icon:"🎮",title:"Controller setup",points:[
        "Emulation → Configure → Controls → click each button on screen → press the matching button on your controller.",
        "Xbox mapping: A=A, B=B, X=X, Y=Y, L=LB, R=RB, ZL=LT, ZR=RT, Start=Start, Select=Back, Circle Pad=Left Stick, C-Stick=Right Stick.",
      ]},
    ],
  },

  {
    id:"xbox",icon:"🎮",title:"Xbox Original — xemu",
    body:"xemu is the best original Xbox emulator. Unlike most emulators, it requires special BIOS and hard drive image files from original Xbox hardware before ANY game will run. Get these sorted first.",
    tips:[
      "DOWNLOAD: Go to xemu.app → Download. Extract with 7-Zip to C:\\Emulators\\xemu.",
      "3 FILES REQUIRED (nothing works without all 3): 1) Xbox BIOS file 2) MCPX boot ROM 3) A blank Xbox hard drive image called xbox_hdd.qcow2. The xemu website (xemu.app) explains exactly where to get these.",
      "FIRST LAUNCH: Xbox library → 🚀 Launch xemu. Go to Machine → Settings → System and point it to your BIOS, MCPX, and HDD files. Close when done.",
      "SET PATH IN RETROSHELF: Xbox library → 📂 Directory → Browse → find xemu.exe → Save.",
      "ADD GAMES: Open 📂 Directory → Add ROM Folder → select C:\\ROMs\\Xbox → Save.",
      "SETTINGS (open xemu directly): View → Display Settings → Surface Scale: 2x or 3x for a sharper image.",
    ],
    extra:[
      {icon:"🔧",title:"Recommended settings",points:[
        "Machine → Settings → System → set all three file paths (BIOS, MCPX, HDD image) — nothing works without these",
        "View → Display Settings → Surface Scale: 2x or 3x",
        "View → Display Settings → Widescreen: try per-game",
      ]},
      {icon:"🎮",title:"Controller setup",points:[
        "Xbox controllers connect automatically via XInput — no setup needed at all.",
        "Machine → Settings → Input → if a controller isn't detected, assign it here.",
        "The original Xbox had Black and White buttons — these usually map to LT/RT by default.",
      ]},
    ],
  },

  {
    id:"xbox360",icon:"🎮",title:"Xbox 360 — Xenia Canary",
    body:"Xenia Canary is the best Xbox 360 emulator. No BIOS needed. Still in active development — many games work great, but some don't. Always check the compatibility list before expecting a specific game to run.",
    tips:[
      "DOWNLOAD: Go to github.com/xenia-canary/xenia-canary → Releases → download the latest .zip. Extract with 7-Zip to C:\\Emulators\\Xenia.",
      "NO BIOS NEEDED.",
      "FIRST LAUNCH: Xbox 360 library → 🚀 Launch Xenia. Let it generate its config file on first launch, then close.",
      "SET PATH IN RETROSHELF: Xbox 360 library → 📂 Directory → Browse → find xenia_canary.exe → Save.",
      "ADD GAMES: Open 📂 Directory → Add ROM Folder → select C:\\ROMs\\Xbox360 → Save.",
      "CONFIG FILE: Inside the Xenia folder, find xenia-canary.config.toml. Open it with Notepad. Change gpu = 'vulkan' and vsync = true. Save the file.",
      "CHECK COMPATIBILITY: Before expecting a game to run, check github.com/xenia-canary/game-compatibility.",
    ],
    extra:[
      {icon:"🔧",title:"Config file settings to change (open with Notepad)",points:[
        "gpu = 'vulkan'",
        "vsync = true",
        "fullscreen = true (optional — starts in fullscreen)",
        "internal_display_resolution = 4 (upscales the image 4x)",
        "Save the file after making changes, then launch a game.",
      ]},
    ],
  },

  {
    id:"dreamcast",icon:"🎮",title:"Dreamcast — Flycast",
    body:"Flycast is the best standalone Dreamcast emulator. Most games work without any extra files at all.",
    tips:[
      "DOWNLOAD: Go to github.com/flyinghead/flycast → Releases → download the Windows .zip. Extract with 7-Zip to C:\\Emulators\\Flycast.",
      "BIOS: Most games work without a BIOS. If a specific game requires it, place the Dreamcast BIOS files in a folder called data inside your Flycast folder.",
      "FIRST LAUNCH: Dreamcast library → 🚀 Launch Flycast. Let it open once, then close.",
      "SET PATH IN RETROSHELF: Dreamcast library → 📂 Directory → Browse → find flycast.exe → Save.",
      "ADD GAMES: Open 📂 Directory → Add ROM Folder → select C:\\ROMs\\Dreamcast → Save.",
      "SETTINGS (open Flycast directly): Settings → Video → Renderer: Vulkan, Internal Resolution: 2x or 4x. Settings → Console → Cable Type: VGA for the sharpest output.",
    ],
    extra:[
      {icon:"🔧",title:"Recommended settings",points:[
        "Settings → Video → Renderer: Vulkan",
        "Settings → Video → Internal Resolution: 2x or 4x",
        "Settings → Video → Widescreen: ON",
        "Settings → Console → Cable Type: VGA (sharpest picture — if a game looks wrong, try Composite instead)",
      ]},
      {icon:"🎮",title:"Controller setup",points:[
        "Settings → Controls → Port A → select your controller. Xbox/XInput controllers work automatically.",
        "Button mapping: A=A, B=B, X=X, Y=Y, Start=Start, Left Trigger=LT, Right Trigger=RT, Left Stick=Left Stick.",
      ]},
    ],
  },

  {
    id:"covers",icon:"🖼",title:"Cover Art — Automatic Box Art",
    body:"RetroShelf can automatically download box art for all your games using a free service called SteamGridDB. You need a free API key. Takes about 2 minutes to set up.",
    tips:[
      "STEP 1 — Get a free API key: Go to steamgriddb.com. Create a free account. Click your profile picture → Preferences → API Keys → Generate a new key. Copy it.",
      "STEP 2 — Add the key to RetroShelf: Click ⚙ Settings (top right of main shelf) → Cover Art section → paste your key into the SteamGridDB API Key box → Save Settings.",
      "STEP 3 — Fetch covers: Go into any console's library. Click the 🖼 Fetch Covers button at the top. RetroShelf downloads cover art for every game it can match.",
      "If a game's cover doesn't download: the title might not match. Hover the game → ⚙ gear icon → Rename → type the EXACT game title as it appears on the box (e.g. 'Halo: Combat Evolved' not 'Halo_USA_v1.iso'). Then Fetch Covers again.",
      "To set a cover manually: hover any game → ⚙ gear icon → Set Cover → pick an image file from your computer.",
      "WARNING: If you manually set a cover and then click Fetch Covers, the manual cover gets overwritten. Only use one method per game.",
    ],
    extra:[
      {icon:"💡",title:"Getting good cover art — title format matters",points:[
        "GOOD: 'God of War', 'Halo: Combat Evolved', 'Crash Bandicoot: Warped', 'The Legend of Zelda: Ocarina of Time'",
        "BAD: 'GoW_USA_v1.2', 'Halo CE (USA) [!]', 'crash3_pal_fixed_rev2', 'OOT_NTSC_1.0'",
        "Use Rename (hover game → ⚙ gear → Rename) to clean up messy ROM file names before fetching covers.",
      ]},
    ],
  },

  {
    id:"pinned",icon:"📌",title:"Pinned Games — Wall Posters",
    body:"You can pin up to 12 of your favourite games. They appear as hanging posters on the left and right sides of the main shelf — click one to launch that game instantly without going into the library. In fullscreen or large windows all 12 are visible; in smaller windows the first 6 are shown.",
    tips:[
      "TO PIN A GAME: Open any console library → hover a game card → click the ⚙ gear icon → Pin to Main Menu. The label shows how many you have pinned (e.g. Pin to Main Menu 2/12).",
      "TO UNPIN: On the main shelf, hover over a poster — a red X appears in the corner. Click it.",
      "Maximum 12 pinned games. In fullscreen/large windows (1100px+) all 12 show. In smaller windows only the first 6 are visible. If you try to add more than 12, you'll be told to unpin one first.",
      "Games alternate sides automatically: game 1 left, game 2 right, game 3 left, and so on — 3 posters per side.",
      "If a pinned game has cover art, the poster shows it. If not, it shows the game initials and title.",
    ],
  },

  {
    id:"settings",icon:"⚙",title:"Settings & Customisation",
    body:"Click ⚙ Settings on the main shelf (top right) to customise RetroShelf. Here is what each option does.",
    tips:[
      "Show game count badges on shelf — shows a small number on each console logo telling you how many games you have. ON by default.",
      "Transparent console logos — removes the coloured background block behind each logo. The logos float directly on the wood. Try it and see which you prefer.",
      "Compact game cards — shows 7 game cards per row instead of 5. ON by default. Turn off for bigger cards.",
      "Show file names under games — shows the actual ROM filename under each game card. Useful for identifying files.",
      "SteamGridDB API Key — paste your cover art key here. See the Cover Art guide for how to get one.",
      "Rescan ROM folders on startup — every time RetroShelf opens, it checks for new games in your ROM folders. ON by default.",
      "Rescan All Folders Now — manually trigger a scan right now.",
      "Reset All Settings — wipes EVERYTHING including all paths, folders, game library, and settings. Cannot be undone.",
    ],
    extra:[
      {icon:"📖",title:"Per-console quick guides",points:[
        "Each console library page has its own guide button at the top: 📖 [Console] Guide.",
        "Click it for a quick-reference setup guide for that specific console, accessible right from the library you're in.",
      ]},
    ],
  },

  {
    id:"extras",icon:"📚",title:"Troubleshooting — Common Issues",
    body:"Something not working? Check here first before anything else.",
    extra:[
      {icon:"🚫",title:"Game won't launch at all",points:[
        "Check that the emulator path is set: library page → 📂 Directory → make sure a valid .exe path is shown. Click Browse to re-select it.",
        "Make sure you clicked Test and it succeeded. If it failed, the path is wrong.",
        "Check your ROM file is a supported format. The Directory page for each console lists the supported file types.",
        "PS1/PS2/PS3: make sure the BIOS file is in the correct location (see that console's guide).",
        "Wii U: make sure keys.txt is in the same folder as Cemu.exe.",
        "Xbox Original: make sure all three required files (BIOS, MCPX, HDD image) are configured inside xemu.",
      ]},
      {icon:"💾",title:"Saves & Save States",points:[
        "IN-GAME SAVES (using the game's own save menu) work exactly like real hardware and are permanent.",
        "SAVE STATES are a separate emulator feature. Press F5 to save your exact position at any moment, F8 to jump back.",
        "Hotkeys by emulator: DuckStation = F2 save / F3 load · PCSX2 = F1 save / F3 load · Dolphin = Shift+F1–8 save / F1–8 load · Project64 = F5 save / F8 load · Cemu = use the File menu.",
        "Save states are NOT a substitute for in-game saves. They can break after emulator updates and can be accidentally overwritten.",
      ]},
      {icon:"⚡",title:"Game runs slowly or stutters",points:[
        "PS3, Wii U, and Xbox 360 require a powerful modern CPU. Older PCs will struggle with these.",
        "Lower the internal resolution in the emulator's graphics settings. Going from 4x to 2x makes a huge difference.",
        "For PS3: make sure PPU Decoder and SPU Decoder are both Recompiler LLVM in RPCS3's CPU settings.",
        "Xbox 360 (Xenia): still experimental — some games run poorly regardless of PC specs. Check the compatibility list.",
        "Shader stutter on first play (especially PS3): completely normal. Gets much smoother after the first session.",
        "Close other heavy programs while playing.",
      ]},
      {icon:"📺",title:"Image looks wrong, stretched, or blurry",points:[
        "Stretched sideways (too wide): set Aspect Ratio to 4:3 in the emulator's graphics settings.",
        "Blurry: increase Internal Resolution to 2x or higher.",
        "PS2 shimmering textures: PCSX2 → Settings → Graphics → Hardware Fixes → Align Sprite: ON.",
        "PS3 black screen or wrong colours: RPCS3 → Configuration → GPU → GPU Hacks → Write Color Buffers: ON.",
        "GameCube/Wii missing effects: Dolphin → Graphics → Hacks → turn OFF Skip EFB Access from CPU and test.",
      ]},
      {icon:"🎮",title:"Controller not working or not detected",points:[
        "Make sure the controller is plugged in or paired BEFORE opening the emulator.",
        "Check it works in Windows first: Windows Settings → Bluetooth & devices → Other devices.",
        "DualSense / DualShock 4: connect via USB for instant detection. For Bluetooth, pair in Windows Settings first.",
        "Want to use DualSense as an Xbox-style controller? Install DS4Windows from ds4-windows.com.",
        "Want to use a Nintendo Switch Pro Controller? Install BetterJoy from github.com/Davidobot/BetterJoy.",
      ]},
      {icon:"🎮",title:"A note about mods",points:[
        "RetroShelf does not support game mods in any way and never will.",
        "If you want to mod a game, search YouTube for the game name + emulator name + mod.",
        "If a modded game doesn't launch or crashes, that is a mod problem, not a RetroShelf problem.",
      ]},
    ],
  },
];

function TutorialPage({onClose,tryUnlock}){
  const [step,setStep]=useState("overview");
  const current=TUTORIAL_STEPS.find(s=>s.id===step)||TUTORIAL_STEPS[0];
  const idx=TUTORIAL_STEPS.findIndex(s=>s.id===step);

  const goToStep=(id)=>{
    setStep(id);
    const newIdx=TUTORIAL_STEPS.findIndex(s=>s.id===id);
    try{
      const prev=parseInt(localStorage.getItem("rs_guide_progress")||"0");
      if(newIdx+1>prev)localStorage.setItem("rs_guide_progress",(newIdx+1).toString());
    }catch{}
  };
  return(
    <div style={{height:"100vh",background:"linear-gradient(160deg,#100a00,#1c1205,#0a0600)",display:"flex",flexDirection:"column",animation:"fadeIn 0.22s ease"}}>
      <div style={{display:"flex",alignItems:"center",gap:"14px",padding:"14px 24px",background:"rgba(0,0,0,0.5)",borderBottom:"1px solid rgba(255,255,255,0.06)",flexShrink:0}}>
        <Btn onClick={onClose} style={{fontSize:"12px"}}>← Back</Btn>
        <div style={{width:"1px",height:"26px",background:"rgba(255,255,255,0.08)"}}/>
        <div style={{fontFamily:"'Boogaloo',cursive",fontSize:"18px",letterSpacing:"3px",color:"#c8a040"}}>SETUP GUIDE</div>
        <div style={{flex:1}}/>
        <div style={{fontSize:"11px",color:"rgba(255,255,255,0.2)",fontWeight:600}}>{idx+1} / {TUTORIAL_STEPS.length}</div>
      </div>
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <div style={{width:"220px",flexShrink:0,background:"rgba(0,0,0,0.3)",borderRight:"1px solid rgba(255,255,255,0.05)",padding:"12px 8px",overflowY:"auto"}}>
          {TUTORIAL_STEPS.map((s,i)=>(
            <div key={s.id} onClick={()=>goToStep(s.id)} style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 10px",borderRadius:"8px",marginBottom:"2px",cursor:"pointer",background:step===s.id?"rgba(200,160,60,0.12)":"transparent",border:`1px solid ${step===s.id?"rgba(200,160,60,0.3)":"transparent"}`,transition:"all 0.15s"}}
              onMouseEnter={e=>{if(step!==s.id)e.currentTarget.style.background="rgba(255,255,255,0.04)";}}
              onMouseLeave={e=>{if(step!==s.id)e.currentTarget.style.background="transparent";}}>
              <span style={{fontSize:"14px",flexShrink:0}}>{s.icon}</span>
              <span style={{fontSize:"11px",fontWeight:700,color:step===s.id?"#c8a040":"rgba(255,255,255,0.5)",lineHeight:1.2}}>{s.title}</span>
            </div>
          ))}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>
          <div style={{maxWidth:"740px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:"18px"}}>
              <div style={{width:"48px",height:"48px",borderRadius:"12px",background:"rgba(200,160,60,0.15)",border:"1px solid rgba(200,160,60,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",flexShrink:0}}>{current.icon}</div>
              <div>
                <div style={{fontFamily:"'Boogaloo',cursive",fontSize:"24px",color:"#c8a040",letterSpacing:"1px",lineHeight:1}}>{current.title}</div>
                <div style={{fontSize:"11px",color:"rgba(255,255,255,0.22)",marginTop:"3px"}}>Step {idx+1} of {TUTORIAL_STEPS.length}</div>
              </div>
            </div>
            <Card style={{marginBottom:"18px"}}><p style={{fontSize:"14px",color:"rgba(255,255,255,0.7)",lineHeight:1.75}}>{current.body}</p></Card>
            {current.tips&&(
              <div style={{marginBottom:"18px"}}>
                <div style={{fontSize:"10px",fontWeight:700,color:"rgba(255,255,255,0.28)",letterSpacing:"2.5px",marginBottom:"10px"}}>STEPS</div>
                {current.tips.map((tip,i)=>(
                  <div key={i} style={{display:"flex",gap:"12px",background:"rgba(0,0,0,0.25)",borderRadius:"8px",padding:"12px 14px",marginBottom:"6px",border:"1px solid rgba(255,255,255,0.05)"}}>
                    <div style={{width:"22px",height:"22px",borderRadius:"50%",background:"rgba(200,160,60,0.2)",border:"1px solid rgba(200,160,60,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:700,color:"#c8a040",flexShrink:0,marginTop:"1px"}}>{i+1}</div>
                    <div style={{fontSize:"13px",color:"rgba(255,255,255,0.68)",lineHeight:1.65}}>{tip}</div>
                  </div>
                ))}
              </div>
            )}
            {current.extra&&(
              <div style={{marginTop:"8px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
                  <div style={{height:"1px",flex:1,background:"rgba(255,255,255,0.06)"}}/>
                  <span style={{fontSize:"10px",fontWeight:700,color:"rgba(255,255,255,0.2)",letterSpacing:"2px"}}>MORE INFO</span>
                  <div style={{height:"1px",flex:1,background:"rgba(255,255,255,0.06)"}}/>
                </div>
                {current.extra.map((item,i)=>(
                  <ExtraInfoItem key={i} item={item}/>
                ))}
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",marginTop:"28px"}}>
              <Btn onClick={()=>idx>0&&goToStep(TUTORIAL_STEPS[idx-1].id)} disabled={idx===0}>← Previous</Btn>
              {idx<TUTORIAL_STEPS.length-1
                ?<Btn variant="accent" accent="#c8a040" onClick={()=>goToStep(TUTORIAL_STEPS[idx+1].id)}>Next →</Btn>
                :<Btn variant="solid" accent="#c8a040" style={{color:"#000"}} onClick={()=>{tryUnlock?.("guide_complete");onClose();}}>Done — Let's Play! 🎮</Btn>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExtraInfoItem({item}){
  const [open,setOpen]=useState(false);
  return(
    <div style={{marginBottom:"8px",background:"rgba(0,0,0,0.2)",borderRadius:"8px",border:"1px solid rgba(255,255,255,0.07)",overflow:"hidden"}}>
      <div onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",cursor:"pointer",userSelect:"none"}}
        onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <span style={{fontSize:"16px"}}>{item.icon}</span>
          <span style={{fontSize:"13px",fontWeight:700,color:"rgba(255,255,255,0.7)"}}>{item.title}</span>
        </div>
        <span style={{fontSize:"11px",color:"rgba(255,255,255,0.3)",transition:"transform 0.2s",transform:open?"rotate(90deg)":"none",flexShrink:0}}>▶</span>
      </div>
      {open&&(
        <div style={{padding:"0 14px 14px",display:"flex",flexDirection:"column",gap:"6px"}}>
          {item.points.map((p,i)=>(
            <div key={i} style={{fontSize:"12px",color:"rgba(255,255,255,0.58)",lineHeight:1.65,paddingLeft:"16px",borderLeft:"2px solid rgba(200,160,60,0.25)",marginLeft:"6px",paddingTop:"3px",paddingBottom:"3px"}}>{p}</div>
          ))}
        </div>
      )}
    </div>
  );
}
// ─── SHELF COMPONENTS ─────────────────────────────────────────────────────────
function ShelfCard({children,bgColor,bgDark,accent,onClick,tall=false,gameCount=0,rainbow=false,transparent=false}){
  const [hov,setHov]=useState(false);
  const rainbowBg=rainbow&&hov&&!transparent;
  const bg=transparent
    ?"transparent"
    :rainbowBg
    ?"linear-gradient(135deg,#ff0000,#ff6600,#ffdd00,#00cc44,#00ccff,#0055ff,#cc00ff,#ff0066,#ff0000)"
    :hov?`radial-gradient(ellipse at 50% 30%,${bgColor}cc 0%,${bgDark} 100%)`
       :`radial-gradient(ellipse at 50% 30%,${bgColor}88 0%,${bgDark} 100%)`;
  return(
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      height:tall?"172px":"108px",borderRadius:"12px",background:bg,
      backgroundSize:rainbowBg?"300% 300%":"100%",
      animation:rainbowBg?"rainbowSpin 1.8s linear infinite":undefined,
      border:transparent?"2px solid transparent":hov?`2px solid ${rainbowBg?"rgba(255,255,255,0.6)":accent+"aa"}`:`2px solid ${accent}20`,
      cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
      transition:"transform 0.22s cubic-bezier(0.34,1.3,0.64,1),box-shadow 0.22s,border 0.15s",
      transform:hov?"translateY(-8px) scale(1.04)":"none",
      boxShadow:hov?rainbowBg?"0 20px 50px rgba(255,100,100,0.5),0 0 60px rgba(100,200,255,0.3),0 0 40px rgba(200,100,255,0.3)":`0 20px 50px ${bgColor}70,0 0 0 1px ${accent}20,inset 0 1px 0 rgba(255,255,255,0.1)`:`0 4px 20px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.03)`,
      position:"relative",overflow:"hidden",flexShrink:0,
    }}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:"35%",background:`linear-gradient(180deg,rgba(255,255,255,${hov?0.12:0.025}),transparent)`,pointerEvents:"none",zIndex:1}}/>
      {gameCount>0&&<div style={{position:"absolute",top:"8px",right:"8px",background:rainbowBg?"rgba(0,0,0,0.55)":`${accent}22`,border:`1px solid ${rainbowBg?"rgba(255,255,255,0.5)":accent+"40"}`,borderRadius:"10px",padding:"2px 7px",fontSize:"9px",fontWeight:700,color:rainbowBg?"#fff":accent,fontFamily:"'Nunito',sans-serif",zIndex:2}}>{gameCount}</div>}
      <div style={{position:"relative",zIndex:2,filter:hov?rainbowBg?"drop-shadow(0 0 22px white) drop-shadow(0 0 8px white)":`drop-shadow(0 0 14px ${accent}80)`:`drop-shadow(0 2px 6px rgba(0,0,0,0.5))`,transition:"filter 0.2s"}}>{children}</div>
    </div>
  );
}

function RowLabel({children,color}){return(<div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"2px"}}><span style={{fontFamily:"'Boogaloo',cursive",fontSize:"9px",letterSpacing:"4px",color:color||"rgba(255,255,255,0.14)",whiteSpace:"nowrap"}}>{children.toUpperCase()}</span><div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.07)"}}/></div>);}

function Plank(){
  return(<div style={{height:"20px",margin:"12px 0 0",background:T.plank,boxShadow:T.plankShadow,position:"relative"}}>
    <div style={{position:"absolute",top:"6px",left:"20px",right:"20px",height:"2px",background:"rgba(255,255,255,0.05)",borderRadius:"2px"}}/>
    {[60,200,340,480,620,760].map(x=><div key={x} style={{position:"absolute",top:"8px",left:x,width:"70px",height:"3px",background:"rgba(0,0,0,0.14)",borderRadius:"2px"}}/>)}
  </div>);
}

const SUB_GROUPS={
  playstation_group:{options:[{id:"ps1",label:"PS1"},{id:"ps2",label:"PS2"},{id:"ps3",label:"PS3"}]},
  xbox_group:{options:[{id:"xbox",label:"Original"},{id:"xbox360",label:"360"}]},
  wii_group:{options:[{id:"wii",label:"Wii"},{id:"wiiu",label:"Wii U"}]},
  ds_group:{options:[{id:"ds",label:"DS"},{id:"3ds",label:"3DS"}]},
};

// ─── PINNED GAMES STRIP ───────────────────────────────────────────────────────
// ─── PINNED POSTERS (wall decoration on left side of main menu) ──────────────
// Default poster positions — spread around left and right edges, avoiding the shelf centre
function getDefaultPosterPos(index,total){
  const isLeft=index%2===0;
  const slot=Math.floor(index/2);
  const slotsOnSide=Math.ceil(total/2);
  const W=window.innerWidth||1280;
  const H=window.innerHeight||800;
  const POSTER_W=130;
  const POSTER_H=195;
  const SHELF_MAX=860;
  const shelfW=Math.min(SHELF_MAX,W);
  const shelfLeft=(W-shelfW)/2;
  const shelfRight=shelfLeft+shelfW;
  const gap=16;
  const x=isLeft?shelfLeft-POSTER_W-gap:shelfRight+gap;
  const usableH=H-120;
  const spacing=slotsOnSide>1?usableH/(slotsOnSide+1):usableH/2;
  const y=60+spacing*(slot+1)-POSTER_H/2;
  return{x,y};
}

function PinnedPosters({pinnedGames,onLaunch,onUnpin}){
  const [,setTick]=useState(0);
  useEffect(()=>{
    const handler=()=>setTick(t=>t+1);
    window.addEventListener("resize",handler);
    return()=>window.removeEventListener("resize",handler);
  },[]);

  if(!pinnedGames||pinnedGames.length===0)return null;
  const isLarge=(window.innerWidth||1280)>=1100;
  const visibleGames=isLarge?pinnedGames:pinnedGames.slice(0,6);
  return(
    <>
      {visibleGames.map((p,i)=>{
        const key=`${p.consoleId}-${p.gameId}`;
        const pos=getDefaultPosterPos(i,visibleGames.length);
        return(
          <Poster
            key={key}
            pinned={p}
            index={i}
            x={pos.x}
            y={pos.y}
            onLaunch={()=>onLaunch(p)}
            onUnpin={()=>onUnpin(p)}
          />
        );
      })}
    </>
  );
}

function Poster({pinned,index,x,y,onLaunch,onUnpin}){
  const [hov,setHov]=useState(false);
  const [coverData,setCoverData]=useState(null);

  const c=CONSOLES[pinned.consoleId]||{accent:"#c8a040",color:"#3a2a10",bg:"#1a0e04"};
  const init=(pinned.title||"?").split(/[\s:]+/).filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();
  const tilts=[-3,2,-1.5,2.5,-2,1.5];
  const tilt=tilts[index%tilts.length];

  useEffect(()=>{
    if(pinned.cover_path){
      invoke("get_cover_base64",{path:pinned.cover_path})
        .then(d=>setCoverData(d)).catch(()=>setCoverData(null));
    }
  },[pinned.cover_path]);

  const POSTER_W=130;

  return(
    <div
      style={{
        position:"absolute",
        left:x,
        top:y,
        zIndex:1,
        pointerEvents:"all",
        userSelect:"none",
        cursor:"default",
      }}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
    >
      {/* Nail */}
      <div style={{position:"absolute",top:"-6px",left:"50%",transform:"translateX(-50%)",width:"7px",height:"7px",borderRadius:"50%",background:"#f0c060",boxShadow:"0 0 6px rgba(240,192,96,0.6),0 1px 5px rgba(0,0,0,0.9)",zIndex:3,transition:"background 0.2s"}}/>
      {/* String */}
      <div style={{position:"absolute",top:"-6px",left:"50%",transform:"translateX(-50%)",width:"1px",height:"6px",background:"rgba(160,120,50,0.6)",zIndex:2}}/>
      {/* Poster */}
      <div
        onClick={e=>{onLaunch(); e.stopPropagation();}}
        style={{
          width:`${POSTER_W}px`,height:"180px",
          borderRadius:"3px",
          background:coverData?"#0a0600":`linear-gradient(160deg,${c.color}dd,${c.bg})`,
          border:hov?"2px solid #f0c060":"1px solid #f0c06055",
          cursor:"pointer",
          position:"relative",overflow:"hidden",
          transform:hov?`rotate(0deg) scale(1.06) translateY(-4px)`:`rotate(${tilt}deg)`,
          transition:"all 0.25s cubic-bezier(0.34,1.3,0.64,1)",
          boxShadow:hov?`0 24px 50px rgba(0,0,0,0.9),0 0 20px ${c.accent}30`:`0 12px 30px rgba(0,0,0,0.85),inset 0 1px 0 rgba(255,255,255,0.04)`,
          opacity:hov?1:0.55,
        }}
      >
        <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,rgba(255,220,150,0.04),transparent 60%)",pointerEvents:"none",zIndex:2}}/>
        {coverData&&<img src={coverData} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:1}}/>}
        {!coverData&&(
          <div style={{height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"8px",padding:"12px",zIndex:1,position:"relative"}}>
            <div style={{width:"48px",height:"48px",borderRadius:"50%",background:"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",fontWeight:900,color:"rgba(255,255,255,0.85)",fontFamily:"'Boogaloo',cursive",border:`1px solid ${c.accent}40`}}>{init}</div>
            <div style={{fontSize:"9px",color:"rgba(255,255,255,0.6)",textAlign:"center",lineHeight:1.4,fontFamily:"'Nunito',sans-serif",fontWeight:700,letterSpacing:"0.5px"}}>{pinned.title}</div>
            <div style={{fontSize:"8px",color:`${c.accent}80`,letterSpacing:"2px",fontFamily:"'Nunito',sans-serif",fontWeight:600,marginTop:"2px"}}>{CONSOLES[pinned.consoleId]?.label||""}</div>
          </div>
        )}
        {hov&&(
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:4}}>
            <div style={{background:"#f0c060",borderRadius:"50%",width:"44px",height:"44px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",fontWeight:900,color:"#000",boxShadow:"0 0 20px rgba(240,192,96,0.7)"}}>▶</div>
          </div>
        )}
        {/* Unpin button — inside poster so it follows the rotation */}
        {hov&&(
          <div
            onClick={e=>{e.stopPropagation();onUnpin();}}
            title="Unpin"
            style={{position:"absolute",top:"5px",right:"5px",width:"18px",height:"18px",borderRadius:"50%",background:"#f0c060",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",color:"rgba(0,0,0,0.85)",fontWeight:900,cursor:"pointer",zIndex:10,boxShadow:"0 2px 8px rgba(0,0,0,0.8),0 0 8px rgba(240,192,96,0.5)"}}
          >✕</div>
        )}
      </div>
    </div>
  );
}


// ─── GLOBAL SEARCH ────────────────────────────────────────────────────────────
// ─── MAIN SHELF ───────────────────────────────────────────────────────────────
function FloatingLogo({children,accent,onClick,tall=false,gameCount=0}){
  const [hov,setHov]=useState(false);
  return(
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      height:tall?"172px":"108px",
      display:"flex",alignItems:"center",justifyContent:"center",
      cursor:"pointer",position:"relative",
      transition:"transform 0.22s cubic-bezier(0.34,1.3,0.64,1)",
      transform:hov?"translateY(-8px) scale(1.08)":"none",
      flexShrink:0,
    }}>
      {gameCount>0&&<div style={{position:"absolute",top:"4px",right:"4px",background:"rgba(200,160,64,0.15)",border:"1px solid rgba(200,160,64,0.35)",borderRadius:"10px",padding:"2px 7px",fontSize:"9px",fontWeight:700,color:"#c8a040",fontFamily:"'Nunito',sans-serif",zIndex:2}}>{gameCount}</div>}
      <div style={{filter:hov?`drop-shadow(0 0 18px ${accent}) drop-shadow(0 0 6px ${accent})`:"drop-shadow(0 2px 8px rgba(0,0,0,0.6))",transition:"filter 0.2s"}}>
        {children}
      </div>
    </div>
  );
}

function PatchNotesModal({onClose}){
  const notes=[
    {version:"0.4.0",changes:[
      "Added Achievement System With 34 Achievements And 5 Rarities",
      "Added Collectibles Case",
      "Added GitHub Button Next To Version Pill",
      "Added Game Ratings, Rate Any Game 1–10 From The Gear Menu",
      "Added Favorites",
      "Added Session History",
      "Added Playtime Display In Game Gear Menu",
      "Added Most Played Console And Game Badges In Profile Stats",
      "Fixed Bug Where Removed ROM Folders Would Leave Ghost Games Behind",
      "Various Bug Fixes And Improvements",
    ]},
    {version:"0.3.0",changes:[
      "Added The Option To Create Collections",
      "Added Startup Animation",
      "Added Player Profile And Stats",
      "Changed Pinned Games To Be Posters",
      "Fully Updated Setup Guide",
      "Added Global Search Bar",
      "Changed Pinned Game Amount To 12",
      "Added Exit Button",
      "Made Many Visual And QOL Updates",
    ]},
    {version:"0.2.0",changes:[
      "Added App Icon",
      "Added Mod Notice in Extra Info",
      "Added Fullscreen toggle on every console page",
      "Moved game options (pin, rename, set cover, remove) into a gear icon on hover",
      "Removed Reference Settings tabs — open the emulator directly to change settings",
      "Compact Cards now ON by default",
      "Changed DS colour scheme to red, N64 to rainbow",
      "Moved emulator-specific setup guides into their respective console pages",
      "Removed game row limit — library grows dynamically with your games",
      "Added app version to top left",
      "Renamed buttons: Add Folder → Add Game Folder, Settings → Directory",
      "Pin label now shows Pin to Main Menu (x/6)",
      "Added note about Cemu Graphics Packs in Wii U setup guide",
    ]},
    {version:"0.1.0",changes:[
      "Initial release",
      "12 consoles, 11 emulators",
      "One-click game launching",
      "SteamGridDB cover art",
      "Pin up to 6 games to main shelf",
      "Built-in per-emulator setup guides",
      "Settings reference tabs",
      "Open Emulator button",
      "Rename games (renames file on disk)",
      "Global settings, Reset All Settings",
    ]},
  ];
  return(
    <Modal onClose={onClose}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"18px"}}>
        <div style={{fontFamily:"'Boogaloo',cursive",fontSize:"20px",letterSpacing:"3px",color:"#c8a040"}}>PATCH NOTES</div>
        <Btn onClick={onClose}>✕</Btn>
      </div>
      <div style={{maxHeight:"60vh",overflowY:"auto",display:"flex",flexDirection:"column",gap:"20px",paddingRight:"4px"}}>
        {notes.map(({version,changes})=>(
          <div key={version} style={{borderLeft:"2px solid rgba(200,160,64,0.25)",paddingLeft:"16px",position:"relative"}}>
            <div style={{position:"absolute",left:"-5px",top:"6px",width:"8px",height:"8px",borderRadius:"50%",background:"#c8a040",boxShadow:"0 0 10px rgba(200,160,64,0.5)"}}/>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
              <span style={{fontFamily:"'Boogaloo',cursive",fontSize:"18px",letterSpacing:"3px",color:"#c8a040"}}>v{version}</span>
              {version==="0.4.0"&&<span style={{fontSize:"9px",background:"rgba(200,160,64,0.12)",border:"1px solid rgba(200,160,64,0.3)",color:"#c8a040",borderRadius:"4px",padding:"2px 7px",fontWeight:700,letterSpacing:"1px"}}>LATEST</span>}
            </div>
            <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:"5px"}}>
              {changes.map((c,i)=>(
                <li key={i} style={{display:"flex",gap:"8px",fontSize:"12px",color:"rgba(255,255,255,0.5)",lineHeight:1.5}}>
                  <span style={{color:"rgba(200,160,64,0.4)",flexShrink:0}}>—</span>{c}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}




function MainShelf({onOpen,onGlobalSettings,onTutorial,gameCounts,globalCfg,tutorialSeen,pinnedGames,onLaunchPinned,onUnpin,allGames,onLaunchGame,onOpenConsole,onOpenCollections,profile,onSaveProfile,achievUnlocked,tryUnlock,gameMeta,onSetRating,onToggleFav,isFav,getRating,sessionHistory}){
  const showBadges=globalCfg?.showBadges!==false;
  const [showPatchNotes,setShowPatchNotes]=useState(false);
  const [showSearch,setShowSearch]=useState(false);
  const [showProfile,setShowProfile]=useState(false);
  const [scale,setScale]=useState(1);
  const [isFullscreen,setIsFullscreen]=useState(false);
  useEffect(()=>{
    const compute=()=>{
      const CONTENT_H=820;
      const CONTENT_W=920;
      const scaleH=(window.innerHeight-120)/CONTENT_H;
      const scaleW=(window.innerWidth-40)/CONTENT_W;
      setScale(Math.min(1,scaleH,scaleW));
      setIsFullscreen(window.innerHeight>=screen.height-10);
    };
    compute();
    window.addEventListener("resize",compute);
    document.addEventListener("fullscreenchange",compute);
    return()=>{
      window.removeEventListener("resize",compute);
      document.removeEventListener("fullscreenchange",compute);
    };
  },[]);
  return(
    <div style={{height:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
      <PinnedPosters pinnedGames={pinnedGames} onLaunch={onLaunchPinned} onUnpin={onUnpin}/>
      {showPatchNotes&&<PatchNotesModal onClose={()=>setShowPatchNotes(false)}/>}
      {showSearch&&<GlobalSearch allGames={allGames} onLaunch={onLaunchGame} onOpenConsole={onOpenConsole} onClose={()=>setShowSearch(false)} onQuery={(q)=>{if(q.toLowerCase().trim()==="im so lonely")tryUnlock?.("secret_lonely");}}/>}
      {/* Version pill + GitHub — top left */}
      <div style={{position:"absolute",top:"16px",left:"20px",zIndex:20,display:"flex",gap:"6px"}}>
        <div onClick={()=>setShowPatchNotes(true)} style={{cursor:"pointer",background:"rgba(200,160,64,0.1)",border:"1px solid rgba(200,160,64,0.25)",borderRadius:"6px",padding:"4px 10px",fontSize:"10px",fontWeight:700,color:"rgba(200,160,64,0.7)",letterSpacing:"1px",fontFamily:"monospace",transition:"all 0.2s"}}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(200,160,64,0.18)";e.currentTarget.style.color="#c8a040";}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(200,160,64,0.1)";e.currentTarget.style.color="rgba(200,160,64,0.7)";}}>
          v0.4.0
        </div>
        <div onClick={()=>invoke("open_url",{url:"https://github.com/RetroShelf-Sky/RetroShelf"}).catch(()=>{})} style={{cursor:"pointer",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"6px",padding:"4px 10px",fontSize:"10px",fontWeight:700,color:"rgba(255,255,255,0.3)",letterSpacing:"0.5px",fontFamily:"monospace",transition:"all 0.2s",display:"flex",alignItems:"center",gap:"5px"}}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.1)";e.currentTarget.style.color="rgba(255,255,255,0.7)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.color="rgba(255,255,255,0.3)";}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          GitHub
        </div>
      </div>
      <div style={{position:"absolute",top:"16px",right:"20px",zIndex:10,display:"flex",gap:"8px"}}>
        <div style={{position:"relative"}}>
          <Btn onClick={()=>onTutorial()} style={{fontSize:"12px",display:"flex",alignItems:"center",gap:"5px"}}>📖 Setup Guide</Btn>
          {!tutorialSeen&&(
            <div style={{position:"absolute",top:"-7px",right:"-7px",width:"18px",height:"18px",borderRadius:"50%",background:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:900,color:"white",boxShadow:"0 0 10px #ef4444, 0 0 20px #ef4444aa",animation:"pulse 1.5s infinite",zIndex:11,pointerEvents:"none"}}>!</div>
          )}
        </div>
        <Btn onClick={onGlobalSettings} style={{fontSize:"12px",display:"flex",alignItems:"center",gap:"5px"}}>⚙ Settings</Btn>
        <Btn onClick={()=>{invoke("toggle_fullscreen").catch(()=>{});setTimeout(()=>setIsFullscreen(window.innerHeight>=screen.height-10),300);}} style={{fontSize:"13px",padding:"6px 10px"}} title="Toggle Fullscreen">⛶</Btn>
      </div>
      {/* Scaled central content */}
      <div style={{transform:`scale(${scale})`,transformOrigin:"center center",display:"flex",flexDirection:"column",alignItems:"center",width:"100%",maxWidth:"960px",paddingTop:isFullscreen?"20px":"46px",paddingBottom:"16px",marginTop:"-40px"}}>
        <div style={{textAlign:"center",marginBottom:"18px"}}>
        <div style={{fontFamily:"'Boogaloo',cursive",fontSize:"clamp(26px,3.5vw,50px)",letterSpacing:"10px",color:T.titleColor,textShadow:`0 0 60px ${T.titleGlow}`,lineHeight:1,marginBottom:"4px"}}>RETROSHELF</div>
        <div style={{fontSize:"11px",letterSpacing:"3px",color:T.titleColor,fontFamily:"'Nunito',sans-serif",fontWeight:300,opacity:0.55,marginBottom:"6px"}}>By Sky</div>
        <div style={{fontSize:"9px",letterSpacing:"5px",color:T.titleSub,fontWeight:600}}>YOUR EMULATOR LIBRARY</div>
      </div>
        <div onClick={()=>setShowSearch(true)} style={{width:"100%",maxWidth:"860px",marginBottom:"14px",position:"relative",cursor:"text"}}>
          <span style={{position:"absolute",left:"14px",top:"50%",transform:"translateY(-50%)",fontSize:"13px",opacity:0.3,pointerEvents:"none"}}>&#128269;</span>
          <div style={{width:"100%",padding:"9px 14px 9px 40px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",color:"rgba(255,255,255,0.3)",fontSize:"12px",fontFamily:"'Nunito',sans-serif",fontWeight:600,letterSpacing:"0.5px",userSelect:"none"}}>Search all games...</div>
        </div>
        <div style={{width:"100%",maxWidth:"860px",background:T.shelfBg,borderRadius:"14px",border:`3px solid ${T.shelfBorder}`,boxShadow:"0 60px 120px rgba(0,0,0,0.9),inset 0 1px 0 rgba(255,255,255,0.07)",overflow:"hidden"}}>
        <div style={{height:"20px",background:T.cap,borderBottom:`2px solid ${T.capBorder}`,position:"relative"}}>
          <div style={{position:"absolute",top:"5px",left:"50px",right:"50px",height:"3px",background:"rgba(255,255,255,0.08)",borderRadius:"2px"}}/>
        </div>
        <div style={{padding:"8px 26px 0"}}><RowLabel color={T.rowLabel}>Sega</RowLabel></div>
        <div style={{padding:"4px 26px 0"}}>
          {<ShelfCard bgColor="#7c2d12" bgDark="#0d0300" accent="#fed7aa" onClick={()=>onOpen("dreamcast")} gameCount={showBadges?gameCounts.dreamcast||0:0}><LogoDreamcast size={230}/></ShelfCard>}
        </div>
        <Plank/>
        <div style={{padding:"8px 26px 0"}}><RowLabel color={T.rowLabel}>Sony · Microsoft</RowLabel></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",padding:"4px 26px 0"}}>
          {<ShelfCard bgColor="#1e3a8a" bgDark="#030918" accent="#93c5fd" onClick={()=>onOpen("playstation_group")} tall gameCount={showBadges?(gameCounts.ps1||0)+(gameCounts.ps2||0)+(gameCounts.ps3||0):0}><LogoPlaystation size={86}/></ShelfCard>}
          {<ShelfCard bgColor="#14532d" bgDark="#020e06" accent="#86efac" onClick={()=>onOpen("xbox_group")} tall gameCount={showBadges?(gameCounts.xbox||0)+(gameCounts.xbox360||0):0}><LogoXbox size={96}/></ShelfCard>}
        </div>
        <Plank/>
        <div style={{padding:"8px 26px 0"}}><RowLabel color={T.rowLabel}>Nintendo</RowLabel></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"12px",padding:"4px 26px 0"}}>
          {<ShelfCard bgColor="#0a0515" bgDark="#060310" accent="#ff6b6b" onClick={()=>onOpen("n64")} tall gameCount={showBadges?gameCounts.n64||0:0} rainbow><LogoN64 size={74}/></ShelfCard>}
          {<ShelfCard bgColor="#3b0764" bgDark="#0a0115" accent="#c084fc" onClick={()=>onOpen("gamecube")} tall gameCount={showBadges?gameCounts.gamecube||0:0}><LogoGameCube size={72}/></ShelfCard>}
          {<ShelfCard bgColor="#334155" bgDark="#060a0f" accent="#e2e8f0" onClick={()=>onOpen("wii_group")} tall gameCount={showBadges?(gameCounts.wii||0)+(gameCounts.wiiu||0):0}><LogoWii size={96}/></ShelfCard>}
          {<ShelfCard bgColor="#450a0a" bgDark="#140202" accent="#f87171" onClick={()=>onOpen("ds_group")} tall gameCount={showBadges?(gameCounts.ds||0)+(gameCounts["3ds"]||0):0}><LogoDS size={96}/></ShelfCard>}
        </div>
        <Plank/>
        <div style={{height:"24px",background:T.base,borderTop:`2px solid ${T.capBorder}`,display:"flex",justifyContent:"space-between",alignItems:"flex-end",padding:"0 60px"}}>
          {[0,1,2,3,4].map(i=><div key={i} style={{width:"28px",height:"16px",background:T.foot,borderRadius:"0 0 10px 10px",border:`1px solid ${T.footBorder}`,borderTop:"none"}}/>)}
        </div>
      </div>
        <div style={{marginTop:"16px",color:T.titleSub,fontSize:"10px",letterSpacing:"2px",fontWeight:600}}>Click any console to open its library</div>
      </div>
      <div style={{position:"absolute",bottom:"22px",left:"24px",zIndex:10}}><ProfileBanner profile={profile} onClick={()=>{setShowProfile(true);try{const c=(parseInt(localStorage.getItem("rs_profile_opens")||"0"))+1;localStorage.setItem("rs_profile_opens",c);}catch{}}}/></div>
      {showProfile&&<ProfileModal profile={profile} allGames={allGames} pinnedGames={pinnedGames} onClose={()=>setShowProfile(false)} onSave={onSaveProfile} achievUnlocked={achievUnlocked} sessionHistory={sessionHistory}/>}
      {isFullscreen&&<div onClick={()=>invoke("exit_app").catch(()=>{})} style={{position:"absolute",bottom:"22px",left:"50%",transform:"translateX(-50%)",zIndex:10,display:"flex",alignItems:"center",gap:"6px",padding:"7px 14px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"8px",cursor:"pointer",userSelect:"none"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,0.12)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.03)"}}><span>&#9211;</span><span style={{fontSize:"10px",fontWeight:600,color:"rgba(255,255,255,0.3)",letterSpacing:"1px"}}>EXIT</span></div>}
      <div onClick={onOpenCollections} style={{position:"absolute",bottom:"22px",right:"24px",zIndex:10,display:"flex",alignItems:"center",gap:"8px",padding:"9px 16px",background:"rgba(200,144,26,0.08)",border:"1px solid rgba(200,144,26,0.22)",borderRadius:"10px",cursor:"pointer",userSelect:"none"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(200,144,26,0.18)";e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(200,144,26,0.08)";e.currentTarget.style.transform="none";}}><span style={{fontSize:"16px"}}>&#128218;</span><div><div style={{fontSize:"11px",fontWeight:700,color:"rgba(200,144,26,0.85)",letterSpacing:"1px"}}>Collections</div><div style={{fontSize:"8px",color:"rgba(200,144,26,0.4)",letterSpacing:"1.5px",fontWeight:600}}>GROUP YOUR GAMES</div></div></div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
function GlobalSearch({allGames,onLaunch,onOpenConsole,onClose,onQuery}){
  const [query,setQuery]=useState("");
  const inputRef=useRef(null);

  useEffect(()=>{
    inputRef.current?.focus();
    const handler=(e)=>{if(e.key==="Escape")onClose();};
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[]);

  const handleQuery=(val)=>{
    setQuery(val);
    if(onQuery)onQuery(val);
  };

  const results=query.trim().length<1?[]:allGames.filter(g=>(g.title||"").toLowerCase().includes(query.toLowerCase())).slice(0,30);

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.82)",backdropFilter:"blur(14px)",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:"80px"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:"620px",display:"flex",flexDirection:"column",gap:"0",animation:"popUp 0.18s ease"}}>
        {/* Search input */}
        <div style={{position:"relative",marginBottom:"16px"}}>
          <span style={{position:"absolute",left:"16px",top:"50%",transform:"translateY(-50%)",fontSize:"16px",opacity:0.4}}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e=>handleQuery(e.target.value)}
            placeholder="Search all games..."
            style={{width:"100%",padding:"14px 16px 14px 46px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.18)",borderRadius:"12px",color:"white",fontSize:"16px",fontFamily:"'Nunito',sans-serif",fontWeight:600,letterSpacing:"0.3px"}}
          />
          {query&&<span onClick={()=>setQuery("")} style={{position:"absolute",right:"14px",top:"50%",transform:"translateY(-50%)",fontSize:"14px",opacity:0.4,cursor:"pointer",color:"white"}}>✕</span>}
        </div>
        {/* Results */}
        {query.trim().length>0&&(
          <div style={{background:"rgba(20,12,4,0.97)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"12px",overflow:"hidden",maxHeight:"calc(100vh - 220px)",overflowY:"auto"}}>
            {results.length===0
              ? <div style={{padding:"32px",textAlign:"center",color:"rgba(255,255,255,0.25)",fontSize:"13px",fontStyle:"italic"}}>No games found</div>
              : results.map((g,i)=><GlobalSearchResult key={`${g.consoleId}-${g.id}`} game={g} isLast={i===results.length-1} onLaunch={()=>{onLaunch(g);onClose();}} onOpenConsole={()=>{onOpenConsole(g.consoleId);onClose();}}/>)
            }
          </div>
        )}
        {query.trim().length===0&&(
          <div style={{textAlign:"center",color:"rgba(255,255,255,0.18)",fontSize:"12px",letterSpacing:"2px",fontWeight:600,marginTop:"8px"}}>TYPE TO SEARCH · ESC TO CLOSE</div>
        )}
      </div>
    </div>
  );
}

function GlobalSearchResult({game,isLast,onLaunch,onOpenConsole}){
  const [hov,setHov]=useState(false);
  const [coverData,setCoverData]=useState(null);
  const c=CONSOLES[game.consoleId]||{accent:"#c8a040",label:"Unknown"};
  const init=(game.title||"?").split(/[\s:]+/).filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();
  const [bg1,bg2]=GAME_COLORS[Math.abs((game.title||"").charCodeAt(0)||0)%GAME_COLORS.length];

  useEffect(()=>{
    if(game.cover_path){
      invoke("get_cover_base64",{path:game.cover_path}).then(d=>setCoverData(d)).catch(()=>{});
    }
  },[game.cover_path]);

  return(
    <div
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px 14px",background:hov?"rgba(255,255,255,0.05)":"transparent",borderBottom:isLast?"none":"1px solid rgba(255,255,255,0.05)",transition:"background 0.1s",cursor:"pointer"}}
      onClick={onLaunch}
    >
      {/* Thumbnail */}
      <div style={{width:"36px",height:"48px",borderRadius:"4px",flexShrink:0,overflow:"hidden",background:coverData?"#111":`linear-gradient(145deg,${bg1},${bg2})`,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${c.accent}30`}}>
        {coverData
          ?<img src={coverData} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          :<span style={{fontSize:"10px",fontWeight:900,color:"rgba(255,255,255,0.7)",fontFamily:"'Boogaloo',cursive"}}>{init}</span>
        }
      </div>
      {/* Title + console */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:"13px",fontWeight:700,color:hov?"white":"rgba(255,255,255,0.85)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{game.title}</div>
        <div style={{fontSize:"10px",color:c.accent,fontWeight:600,letterSpacing:"1px",marginTop:"2px",opacity:0.8}}>{c.label}</div>
      </div>
      {/* Actions */}
      <div style={{display:"flex",gap:"6px",flexShrink:0}}>
        <div onClick={e=>{e.stopPropagation();onOpenConsole();}} title="Open console library" style={{padding:"4px 9px",borderRadius:"5px",border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.05)",fontSize:"10px",color:"rgba(255,255,255,0.45)",cursor:"pointer",fontWeight:600,transition:"all 0.1s"}}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.1)";e.currentTarget.style.color="rgba(255,255,255,0.8)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.color="rgba(255,255,255,0.45)";}}>
          📂
        </div>
        <div style={{padding:"4px 12px",borderRadius:"5px",background:hov?c.accent:"rgba(255,255,255,0.08)",border:`1px solid ${hov?c.accent:"rgba(255,255,255,0.12)"}`,fontSize:"10px",color:hov?"#000":"rgba(255,255,255,0.6)",cursor:"pointer",fontWeight:700,transition:"all 0.15s"}}>▶ Play</div>
      </div>
    </div>
  );
}

// ─── MAIN SHELF ───────────────────────────────────────────────────────────────
const COLL_COLORS=[
  {id:"amber",  bg:"#2a1800",border:"#c8901a",accent:"#f0c060",label:"Amber"},
  {id:"crimson",bg:"#200508",border:"#c02030",accent:"#f06070",label:"Crimson"},
  {id:"emerald",bg:"#021a0a",border:"#1a7a40",accent:"#50d080",label:"Emerald"},
  {id:"cobalt", bg:"#050d20",border:"#2050c0",accent:"#60a0f0",label:"Cobalt"},
  {id:"violet", bg:"#100818",border:"#7030b0",accent:"#c070f0",label:"Violet"},
  {id:"rose",   bg:"#1a0810",border:"#a03060",accent:"#f080b0",label:"Rose"},
  {id:"slate",  bg:"#0a0e14",border:"#304060",accent:"#80a0c0",label:"Slate"},
  {id:"gold",   bg:"#180e00",border:"#a07010",accent:"#e0b040",label:"Gold"},
];

const COLL_ICONS=["🎮","⭐","🔥","🏆","💎","🎯","🎲","🌟","⚡","🎪","👾","🕹️","🎭","🌙","❤️","🔮"];

function useCollections(){
  const [collections,setCollections]=useState(()=>{
    try{return JSON.parse(localStorage.getItem("rs_collections")||"[]");}catch{return [];}
  });
  const save=(next)=>{setCollections(next);try{localStorage.setItem("rs_collections",JSON.stringify(next));}catch{}};
  const createCollection=(name,color,icon)=>{
    const c={id:Date.now().toString(),name,color,icon,games:[],createdAt:Date.now()};
    save([...collections,c]);
    return c;
  };
  const deleteCollection=(id)=>save(collections.filter(c=>c.id!==id));
  const updateCollection=(id,patch)=>save(collections.map(c=>c.id===id?{...c,...patch}:c));
  const addGame=(collId,game)=>{
    save(collections.map(c=>{
      if(c.id!==collId)return c;
      if(c.games.some(g=>g.gameId===game.id&&g.consoleId===game.consoleId))return c;
      return{...c,games:[...c.games,{gameId:game.id,consoleId:game.consoleId,title:game.title,cover_path:game.cover_path||null}]};
    }));
  };
  const removeGame=(collId,gameId,consoleId)=>{
    save(collections.map(c=>c.id!==collId?c:{...c,games:c.games.filter(g=>!(g.gameId===gameId&&g.consoleId===consoleId))}));
  };
  return{collections,createCollection,deleteCollection,updateCollection,addGame,removeGame};
}

function CollectionCard({collection,onClick,onDelete}){
  const [hov,setHov]=useState(false);
  const col=COLL_COLORS.find(c=>c.id===collection.color)||COLL_COLORS[0];
  const previewGames=collection.games.slice(0,4);
  return(
    <div
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{position:"relative",cursor:"pointer",borderRadius:"12px",background:`linear-gradient(145deg,${col.bg},#060300)`,border:`2px solid ${hov?col.border:col.border+"55"}`,transition:"all 0.2s",transform:hov?"translateY(-4px) scale(1.02)":"none",boxShadow:hov?`0 20px 50px rgba(0,0,0,0.8),0 0 20px ${col.accent}20`:"0 8px 24px rgba(0,0,0,0.6)",overflow:"hidden"}}
      onClick={onClick}
    >
      <div style={{height:"110px",display:"grid",gridTemplateColumns:"1fr 1fr",gridTemplateRows:"1fr 1fr",gap:"2px",background:"rgba(0,0,0,0.4)",overflow:"hidden",borderRadius:"10px 10px 0 0"}}>
        {previewGames.length>0
          ?previewGames.map((g,i)=>(<CollCoverThumb key={i} game={g} accent={col.accent}/>))
          :<div style={{gridColumn:"1/-1",gridRow:"1/-1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"36px",opacity:0.2}}>{collection.icon}</div>
        }
        {previewGames.length>0&&previewGames.length<4&&Array.from({length:4-previewGames.length}).map((_,i)=>(<div key={`e${i}`} style={{background:"rgba(0,0,0,0.3)"}}/>))}
      </div>
      <div style={{padding:"12px 14px 14px",display:"flex",alignItems:"center",gap:"10px"}}>
        <div style={{fontSize:"22px",lineHeight:1}}>{collection.icon}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:"13px",fontWeight:700,color:"rgba(255,255,255,0.9)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{collection.name}</div>
          <div style={{fontSize:"10px",color:col.accent,fontWeight:600,letterSpacing:"1px",marginTop:"2px",opacity:0.75}}>{collection.games.length} GAME{collection.games.length!==1?"S":""}</div>
        </div>
      </div>
      {hov&&(
        <div onClick={e=>{e.stopPropagation();onDelete();}} title="Delete collection"
          style={{position:"absolute",top:"6px",right:"6px",width:"20px",height:"20px",borderRadius:"50%",background:col.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",color:"rgba(0,0,0,0.85)",fontWeight:900,cursor:"pointer",zIndex:5,boxShadow:`0 2px 8px rgba(0,0,0,0.8),0 0 6px ${col.accent}66`}}>✕</div>
      )}
    </div>
  );
}

function CollCoverThumb({game,accent}){
  const [coverData,setCoverData]=useState(null);
  const init=(game.title||"?").split(/[\s:]+/).filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();
  useEffect(()=>{
    if(game.cover_path){invoke("get_cover_base64",{path:game.cover_path}).then(d=>setCoverData(d)).catch(()=>{});}
  },[game.cover_path]);
  return(
    <div style={{position:"relative",overflow:"hidden",background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      {coverData
        ?<img src={coverData} alt="" style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0}}/>
        :<span style={{fontSize:"11px",fontWeight:900,color:`${accent}80`,fontFamily:"'Boogaloo',cursive"}}>{init}</span>
      }
    </div>
  );
}

function NewCollectionModal({onClose,onCreate}){
  const [name,setName]=useState("");
  const [color,setColor]=useState("amber");
  const [icon,setIcon]=useState("🎮");
  const inputRef=useRef(null);
  useEffect(()=>inputRef.current?.focus(),[]);
  const col=COLL_COLORS.find(c=>c.id===color)||COLL_COLORS[0];
  const submit=()=>{
    if(!name.trim())return;
    onCreate(name.trim(),color,icon);
    onClose();
  };
  return(
    <Modal onClose={onClose}>
      <div style={{fontFamily:"'Boogaloo',cursive",fontSize:"13px",letterSpacing:"5px",color:"#c8a060",opacity:0.6,marginBottom:"24px"}}>NEW COLLECTION</div>
      {/* Name */}
      <div style={{marginBottom:"20px"}}>
        <div style={{fontSize:"10px",letterSpacing:"2px",color:"rgba(255,255,255,0.3)",fontWeight:700,marginBottom:"8px"}}>NAME</div>
        <input ref={inputRef} value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
          placeholder="My Favourites..."
          style={{width:"100%",padding:"10px 14px",background:"rgba(0,0,0,0.4)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"8px",color:"white",fontSize:"14px",fontFamily:"'Nunito',sans-serif",fontWeight:600}}/>
      </div>
      {/* Icon */}
      <div style={{marginBottom:"20px"}}>
        <div style={{fontSize:"10px",letterSpacing:"2px",color:"rgba(255,255,255,0.3)",fontWeight:700,marginBottom:"8px"}}>ICON</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
          {COLL_ICONS.map(ic=>(
            <div key={ic} onClick={()=>setIcon(ic)}
              style={{width:"36px",height:"36px",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",cursor:"pointer",background:icon===ic?`${col.accent}22`:"rgba(255,255,255,0.04)",border:`1px solid ${icon===ic?col.accent:"rgba(255,255,255,0.08)"}`,transition:"all 0.15s"}}>
              {ic}
            </div>
          ))}
        </div>
      </div>
      {/* Color */}
      <div style={{marginBottom:"28px"}}>
        <div style={{fontSize:"10px",letterSpacing:"2px",color:"rgba(255,255,255,0.3)",fontWeight:700,marginBottom:"8px"}}>COLOR</div>
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
          {COLL_COLORS.map(c=>(
            <div key={c.id} onClick={()=>setColor(c.id)} title={c.label}
              style={{width:"28px",height:"28px",borderRadius:"50%",background:c.accent,cursor:"pointer",border:`2px solid ${color===c.id?"white":"transparent"}`,boxShadow:color===c.id?`0 0 0 2px ${c.accent}`:"none",transition:"all 0.15s"}}/>
          ))}
        </div>
      </div>
      {/* Preview */}
      <div style={{padding:"10px 16px",borderRadius:"8px",background:`linear-gradient(145deg,${col.bg},#060300)`,border:`1px solid ${col.border}55`,marginBottom:"24px",display:"flex",alignItems:"center",gap:"10px"}}>
        <span style={{fontSize:"20px"}}>{icon}</span>
        <span style={{fontSize:"13px",fontWeight:700,color:"rgba(255,255,255,0.8)"}}>{name||"Collection Name"}</span>
        <span style={{marginLeft:"auto",fontSize:"10px",color:col.accent,fontWeight:600,letterSpacing:"1px"}}>0 GAMES</span>
      </div>
      <div style={{display:"flex",gap:"10px",justifyContent:"flex-end"}}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" accent={col.accent} onClick={submit} style={{opacity:name.trim()?1:0.4,pointerEvents:name.trim()?"auto":"none"}}>✓ Create</Btn>
      </div>
    </Modal>
  );
}

function AddGamesModal({collection,allGames,onAdd,onClose}){
  const [query,setQuery]=useState("");
  const inputRef=useRef(null);
  useEffect(()=>inputRef.current?.focus(),[]);
  const col=COLL_COLORS.find(c=>c.id===collection.color)||COLL_COLORS[0];
  const alreadyIn=new Set(collection.games.map(g=>`${g.consoleId}:${g.gameId}`));
  const results=query.trim().length<1
    ?allGames.filter(g=>!alreadyIn.has(`${g.consoleId}:${g.id}`)).slice(0,40)
    :allGames.filter(g=>!alreadyIn.has(`${g.consoleId}:${g.id}`)&&(g.title||"").toLowerCase().includes(query.toLowerCase())).slice(0,40);
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:600,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(14px)",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:"60px"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:"580px",display:"flex",flexDirection:"column",gap:"0",maxHeight:"calc(100vh-120px)"}}>
        <div style={{fontFamily:"'Boogaloo',cursive",fontSize:"13px",letterSpacing:"5px",color:col.accent,opacity:0.7,marginBottom:"14px",textAlign:"center"}}>ADD GAMES TO {collection.name.toUpperCase()}</div>
        {/* Search */}
        <div style={{position:"relative",marginBottom:"12px"}}>
          <span style={{position:"absolute",left:"14px",top:"50%",transform:"translateY(-50%)",fontSize:"13px",opacity:0.3}}>🔍</span>
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="Search games..."
            style={{width:"100%",padding:"12px 14px 12px 42px",background:"rgba(255,255,255,0.06)",border:`1px solid ${col.border}60`,borderRadius:"10px",color:"white",fontSize:"14px",fontFamily:"'Nunito',sans-serif",fontWeight:600}}/>
        </div>
        <div style={{fontSize:"9px",letterSpacing:"2px",color:"rgba(255,255,255,0.2)",fontWeight:700,marginBottom:"8px",textAlign:"center"}}>
          {query.trim()?`${results.length} RESULTS`:"ALL GAMES NOT IN COLLECTION"} · CLICK TO ADD · ESC TO CLOSE
        </div>
        {/* Results */}
        <div style={{background:"rgba(12,7,2,0.97)",border:`1px solid ${col.border}30`,borderRadius:"12px",overflowY:"auto",maxHeight:"calc(100vh - 280px)"}}>
          {results.length===0
            ?<div style={{padding:"32px",textAlign:"center",color:"rgba(255,255,255,0.2)",fontSize:"12px",fontStyle:"italic"}}>No games found</div>
            :results.map((g,i)=>{
              const c=CONSOLES[g.consoleId]||{accent:"#c8a040",label:"Unknown"};
              return(
                <div key={`${g.consoleId}-${g.id}`}
                  onClick={()=>onAdd(g)}
                  style={{display:"flex",alignItems:"center",gap:"12px",padding:"9px 14px",borderBottom:i<results.length-1?"1px solid rgba(255,255,255,0.04)":"none",cursor:"pointer",transition:"background 0.1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=`${col.accent}10`}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{width:"28px",height:"36px",borderRadius:"3px",background:"rgba(255,255,255,0.05)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${c.accent}20`}}>
                    <span style={{fontSize:"8px",fontWeight:900,color:`${c.accent}80`,fontFamily:"'Boogaloo',cursive"}}>{(g.title||"?").slice(0,2).toUpperCase()}</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"12px",fontWeight:700,color:"rgba(255,255,255,0.8)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.title}</div>
                    <div style={{fontSize:"9px",color:c.accent,fontWeight:600,letterSpacing:"1px",opacity:0.7,marginTop:"1px"}}>{c.label}</div>
                  </div>
                  <div style={{fontSize:"10px",color:`${col.accent}60`,fontWeight:700}}>+ Add</div>
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );
}

function CollectionView({collection,allGames,onBack,onAddGame,onRemoveGame,onLaunchGame,onRename,onDeleteCollection}){
  const col=COLL_COLORS.find(c=>c.id===collection.color)||COLL_COLORS[0];
  const [showAdd,setShowAdd]=useState(false);
  const [search,setSearch]=useState("");
  const compactCards=false;
  const cols=5;

  const filtered=collection.games.filter(g=>(g.title||"").toLowerCase().includes(search.toLowerCase()));

  const plankGrad=`linear-gradient(180deg,${T.plankTop},${T.plankMid},${T.plankBot})`;
  const shelfRowBg=`${T.libraryRow}`;

  return(
    <div style={{height:"100vh",background:T.bg,display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:"'Nunito',sans-serif"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 18px",background:"rgba(0,0,0,0.4)",borderBottom:"1px solid rgba(255,255,255,0.06)",flexShrink:0}}>
        <Btn onClick={onBack} style={{fontSize:"12px",display:"flex",alignItems:"center",gap:"5px"}}>← Back</Btn>
        <div style={{fontSize:"22px",lineHeight:1}}>{collection.icon}</div>
        <div>
          <div style={{fontSize:"15px",fontWeight:700,color:"rgba(255,255,255,0.9)",letterSpacing:"0.5px"}}>{collection.name}</div>
          <div style={{fontSize:"9px",color:col.accent,fontWeight:600,letterSpacing:"2px",marginTop:"1px"}}>{collection.games.length} GAME{collection.games.length!==1?"S":""}</div>
        </div>
        <div style={{flex:1}}/>
        {/* Search */}
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:"8px",top:"50%",transform:"translateY(-50%)",fontSize:"10px",opacity:0.35}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..."
            style={{background:"rgba(0,0,0,0.4)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"7px",padding:"6px 8px 6px 24px",color:"#fff",fontSize:"11px",width:"140px"}}/>
        </div>
        <Btn variant="accent" accent={col.accent} onClick={()=>setShowAdd(true)} style={{fontSize:"11px",display:"flex",alignItems:"center",gap:"5px"}}>+ Add Games</Btn>
        <Btn onClick={()=>{if(window.confirm(`Delete "${collection.name}"?`))onDeleteCollection();}} style={{fontSize:"11px",color:"#f87171"}}>🗑 Delete</Btn>
      </div>

      {/* Games grid */}
      <div style={{flex:1,padding:"16px 18px 20px",overflowY:"auto"}}>
        {collection.games.length===0?(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:"16px",opacity:0.4}}>
            <div style={{fontSize:"48px"}}>{collection.icon}</div>
            <div style={{fontSize:"13px",color:"rgba(255,255,255,0.5)",textAlign:"center"}}>No games yet<br/><span style={{fontSize:"11px"}}>Click + Add Games to add some</span></div>
          </div>
        ):(
          <>
            <div style={{fontSize:"9px",fontWeight:700,color:"rgba(255,255,255,0.13)",letterSpacing:"3px",marginBottom:"12px"}}>
              {collection.name.toUpperCase()}{search?` · "${search}"`:""} · {filtered.length} GAMES
            </div>
            {Array.from({length:Math.ceil(filtered.length/cols)}).map((_,row)=>{
              const rowStart=row*cols;
              const rowGames=filtered.slice(rowStart,rowStart+cols);
              return(
                <div key={row} style={{marginBottom:"12px"}}>
                  <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:"10px",padding:"10px 10px 14px",background:`linear-gradient(180deg,${shelfRowBg})`,borderRadius:"4px 4px 0 0"}}>
                    {rowGames.map((g,si)=>(
                      <CollGameCard key={`${g.consoleId}-${g.gameId}`} game={g} accent={col.accent} onPlay={()=>onLaunchGame(g)} onRemove={()=>onRemoveGame(g.gameId,g.consoleId)}/>
                    ))}
                  </div>
                  <div style={{height:"10px",background:plankGrad,boxShadow:`inset 0 2px 0 ${col.accent}20,0 4px 14px rgba(0,0,0,0.7)`,borderRadius:"0 0 3px 3px"}}>
                    <div style={{margin:"2px 14px",height:"2px",background:"rgba(255,255,255,0.05)",borderRadius:"2px"}}/>
                  </div>
                  <div style={{height:"4px",background:"linear-gradient(180deg,rgba(0,0,0,0.35),transparent)"}}/>
                </div>
              );
            })}
            {filtered.length===0&&collection.games.length>0&&(
              <div style={{textAlign:"center",padding:"36px",color:"rgba(255,255,255,0.15)",fontSize:"13px"}}>No games match "{search}"</div>
            )}
          </>
        )}
      </div>

      {showAdd&&<AddGamesModal collection={collection} allGames={allGames} onAdd={(g)=>onAddGame(g)} onClose={()=>setShowAdd(false)}/>}
    </div>
  );
}

function CollGameCard({game,accent,onPlay,onRemove}){
  const [hov,setHov]=useState(false);
  const [coverData,setCoverData]=useState(null);
  const c=CONSOLES[game.consoleId]||{accent:"#c8a040",color:"#3a2a10",bg:"#1a0e04"};
  const init=(game.title||"?").split(/[\s:]+/).filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();
  const [bg1,bg2]=GAME_COLORS[Math.abs((game.title||"").charCodeAt(0)||0)%GAME_COLORS.length];
  useEffect(()=>{
    if(game.cover_path){invoke("get_cover_base64",{path:game.cover_path}).then(d=>setCoverData(d)).catch(()=>{});}
  },[game.cover_path]);
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{position:"relative",borderRadius:"8px",overflow:"hidden",aspectRatio:"3/4",background:coverData?"#0a0600":`linear-gradient(145deg,${bg1},${bg2})`,border:hov?`2px solid ${accent}cc`:`1px solid ${accent}44`,transition:"all 0.18s",transform:hov?"translateY(-3px) scale(1.03)":"none",boxShadow:hov?`0 16px 40px rgba(0,0,0,0.8),0 0 14px ${accent}25`:"0 4px 16px rgba(0,0,0,0.6)",cursor:"pointer"}}>
      {coverData
        ?<img src={coverData} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
        :<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"6px",padding:"8px"}}>
          <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:900,color:"rgba(255,255,255,0.7)",fontFamily:"'Boogaloo',cursive"}}>{init}</div>
          <div style={{fontSize:"7px",color:"rgba(255,255,255,0.5)",textAlign:"center",lineHeight:1.3,fontWeight:700}}>{game.title}</div>
          <div style={{fontSize:"7px",color:`${c.accent}80`,letterSpacing:"1.5px",fontWeight:600}}>{c.label}</div>
        </div>
      }
      {/* Console badge */}
      <div style={{position:"absolute",top:"5px",left:"5px",background:`${c.color}dd`,border:`1px solid ${c.accent}40`,borderRadius:"4px",padding:"2px 5px",fontSize:"7px",fontWeight:700,color:c.accent,letterSpacing:"0.5px",zIndex:2,opacity:hov?1:0.7,transition:"opacity 0.15s"}}>{c.label}</div>
      {hov&&(
        <>
          <div onClick={onPlay} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:3}}>
            <div style={{background:accent,borderRadius:"50%",width:"36px",height:"36px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"15px",fontWeight:900,color:"rgba(0,0,0,0.85)",boxShadow:`0 0 16px ${accent}99`}}>▶</div>
          </div>
          <div onClick={e=>{e.stopPropagation();onRemove();}} title="Remove from collection"
            style={{position:"absolute",top:"5px",right:"5px",width:"18px",height:"18px",borderRadius:"50%",background:accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"8px",color:"rgba(0,0,0,0.85)",fontWeight:900,cursor:"pointer",zIndex:4,boxShadow:`0 2px 6px rgba(0,0,0,0.8),0 0 6px ${accent}66`}}>✕</div>
        </>
      )}
    </div>
  );
}

function CollectionsPage({allGames,onLaunchGame,onBack}){
  const {collections,createCollection,deleteCollection,updateCollection,addGame,removeGame}=useCollections();
  const [activeCollection,setActiveCollection]=useState(null);
  const [showNew,setShowNew]=useState(false);
  const [search,setSearch]=useState("");

  // Sync active collection when collections state updates
  useEffect(()=>{
    if(activeCollection){
      const updated=collections.find(c=>c.id===activeCollection.id);
      if(updated)setActiveCollection(updated);
      else setActiveCollection(null);
    }
  },[collections]);

  if(activeCollection){
    return(
      <CollectionView
        collection={activeCollection}
        allGames={allGames}
        onBack={()=>setActiveCollection(null)}
        onAddGame={(g)=>addGame(activeCollection.id,g)}
        onRemoveGame={(gameId,consoleId)=>removeGame(activeCollection.id,gameId,consoleId)}
        onLaunchGame={onLaunchGame}
        onRename={(name)=>updateCollection(activeCollection.id,{name})}
        onDeleteCollection={()=>{deleteCollection(activeCollection.id);setActiveCollection(null);}}
      />
    );
  }

  const filtered=search.trim()
    ?collections.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()))
    :collections;

  return(
    <div style={{height:"100vh",background:T.bg,display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:"'Nunito',sans-serif"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 18px",background:"rgba(0,0,0,0.4)",borderBottom:"1px solid rgba(255,255,255,0.06)",flexShrink:0}}>
        <Btn onClick={onBack} style={{fontSize:"12px",display:"flex",alignItems:"center",gap:"5px"}}>← Back</Btn>
        <div style={{fontFamily:"'Boogaloo',cursive",fontSize:"20px",letterSpacing:"6px",color:T.titleColor,textShadow:`0 0 20px ${T.titleGlow}`}}>COLLECTIONS</div>
        <div style={{flex:1}}/>
        {/* Search */}
        {collections.length>4&&(
          <div style={{position:"relative"}}>
            <span style={{position:"absolute",left:"8px",top:"50%",transform:"translateY(-50%)",fontSize:"10px",opacity:0.35}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search collections..."
              style={{background:"rgba(0,0,0,0.4)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"7px",padding:"6px 8px 6px 24px",color:"#fff",fontSize:"11px",width:"160px"}}/>
          </div>
        )}
        <Btn variant="accent" accent="#c8901a" onClick={()=>setShowNew(true)} style={{fontSize:"11px",display:"flex",alignItems:"center",gap:"5px"}}>+ New Collection</Btn>
        <Btn onClick={()=>invoke("toggle_fullscreen").catch(()=>{})} style={{fontSize:"13px",padding:"6px 10px"}} title="Toggle Fullscreen">⛶</Btn>
      </div>

      {/* Shelf */}
      <div style={{flex:1,padding:"28px 32px",overflowY:"auto"}}>
        {collections.length===0?(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:"20px",opacity:0.5}}>
            <div style={{fontSize:"56px"}}>📚</div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:"16px",fontWeight:700,color:"rgba(255,255,255,0.6)",marginBottom:"6px"}}>No collections yet</div>
              <div style={{fontSize:"12px",color:"rgba(255,255,255,0.3)"}}>Create a collection to group your favourite games together</div>
            </div>
            <Btn variant="accent" accent="#c8901a" onClick={()=>setShowNew(true)} style={{marginTop:"8px"}}>+ New Collection</Btn>
          </div>
        ):(
          <>
            <div style={{fontSize:"9px",fontWeight:700,color:"rgba(255,255,255,0.13)",letterSpacing:"3px",marginBottom:"20px"}}>
              {filtered.length} COLLECTION{filtered.length!==1?"S":""}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"16px"}}>
              {filtered.map(c=>(
                <CollectionCard key={c.id} collection={c} onClick={()=>setActiveCollection(c)} onDelete={()=>deleteCollection(c.id)}/>
              ))}
            </div>
          </>
        )}
      </div>

      {showNew&&<NewCollectionModal onClose={()=>setShowNew(false)} onCreate={createCollection}/>}
    </div>
  );
}


// ─── PROFILE ──────────────────────────────────────────────────────────────────

async function compressImage(dataUrl,maxW=600){
  return new Promise(res=>{
    const img=new Image();
    img.onload=()=>{
      const scale=Math.min(1,maxW/img.width);
      const c=document.createElement("canvas");
      c.width=img.width*scale; c.height=img.height*scale;
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);
      res(c.toDataURL("image/jpeg",0.7));
    };
    img.onerror=()=>res(dataUrl);
    img.src=dataUrl;
  });
}

function useProfile(){
  const [profile,setProfile]=useState(()=>{
    try{return JSON.parse(localStorage.getItem("rs_profile")||"null");}catch{return null;}
  });
  const save=(p)=>{
    setProfile(p);
    try{localStorage.setItem("rs_profile",JSON.stringify(p));}catch(e){
      // If storage quota exceeded, try saving without banner
      try{localStorage.setItem("rs_profile",JSON.stringify({...p,banner:null}));}catch{}
    }
  };
  const update=(patch)=>save({...profile,...patch});
  return{profile,save,update};
}




// ─── GAME META (ratings, favorites, session history) ─────────────────────────
function useGameMeta(){
  const [meta,setMeta]=useState(()=>{
    try{return JSON.parse(localStorage.getItem("rs_game_meta")||"{}");}catch{return {};}
  });
  const save=(next)=>{setMeta(next);try{localStorage.setItem("rs_game_meta",JSON.stringify(next));}catch{}};
  const key=(consoleId,gameId)=>`${consoleId}:${gameId}`;
  const getMeta=(consoleId,gameId)=>meta[key(consoleId,gameId)]||{};
  const setRating=(consoleId,gameId,r)=>save({...meta,[key(consoleId,gameId)]:{...getMeta(consoleId,gameId),rating:r}});
  const toggleFav=(consoleId,gameId)=>save({...meta,[key(consoleId,gameId)]:{...getMeta(consoleId,gameId),fav:!getMeta(consoleId,gameId).fav}});
  const isFav=(consoleId,gameId)=>!!getMeta(consoleId,gameId).fav;
  const getRating=(consoleId,gameId)=>getMeta(consoleId,gameId).rating||0;
  return{getMeta,setRating,toggleFav,isFav,getRating,meta};
}

function useSessionHistory(){
  const [history,setHistory]=useState(()=>{
    try{return JSON.parse(localStorage.getItem("rs_session_history")||"[]");}catch{return [];}
  });
  const addSession=(consoleId,gameId,title,durationSeconds)=>{
    if(durationSeconds<30)return;
    const entry={consoleId,gameId,title,duration:durationSeconds,date:Date.now(),id:Date.now().toString()};
    const next=[entry,...history].slice(0,200);
    setHistory(next);
    try{localStorage.setItem("rs_session_history",JSON.stringify(next));}catch{}
  };
  return{history,addSession};
}

// ─── ACHIEVEMENT SYSTEM ───────────────────────────────────────────────────────
const RARITY={
  common:  {label:"Common",    color:"#a0a0b0", glow:"rgba(160,160,176,0.4)"},
  uncommon:{label:"Uncommon",  color:"#4ade80", glow:"rgba(74,222,128,0.4)"},
  rare:    {label:"Rare",      color:"#60a5fa", glow:"rgba(96,165,250,0.4)"},
  ultraRare:{label:"Ultra Rare",color:"#e879f9",glow:"rgba(232,121,249,0.5)"},
  hidden:  {label:"Hidden",    color:"#f59e0b", glow:"rgba(245,158,11,0.5)"},
};

const COLLECTIBLES={
  golden_cd:{id:"golden_cd",name:"Golden CD",  icon:"💿",color:"#f0c060",desc:"500 games in your library"},
  skeleton: {id:"skeleton", name:"Skeleton",   icon:"💀",color:"#e0e0f0",desc:"1000 total hours played"},
  heart:    {id:"heart",    name:"Heart",       icon:"❤️", color:"#f87171",desc:"250 hours in one game"},
  desk_fan: {id:"desk_fan", name:"Desk Fan",   icon:"🌀",color:"#67e8f9",desc:"You found the secret"},
  trophy:   {id:"trophy",   name:"The Trophy", icon:"🏆",color:"#ffd700",desc:"Unlock every achievement"},
};

const ALL_ACHIEVEMENTS=[
  // Library
  {id:"lib_5",              rarity:"common",   icon:"📦",name:"Starting Out",              desc:"Add 5 games to your library",                                  cat:"Library"},
  {id:"lib_10",             rarity:"common",   icon:"📚",name:"Growing Collection",        desc:"Add 10 games to your library",                                 cat:"Library"},
  {id:"lib_20",             rarity:"common",   icon:"🗄",name:"Stacking Up",               desc:"Add 20 games to your library",                                 cat:"Library"},
  {id:"lib_50",             rarity:"uncommon", icon:"📀",name:"Serious Collector",         desc:"Add 50 games to your library",                                 cat:"Library"},
  {id:"lib_100",            rarity:"uncommon", icon:"🏛",name:"The Librarian",             desc:"Add 100 games to your library",                                cat:"Library"},
  {id:"lib_250",            rarity:"rare",     icon:"👑",name:"Legendary Vault",           desc:"Add 250 games to your library",                                cat:"Library"},
  {id:"lib_500",            rarity:"ultraRare",icon:"💿",name:"The Archive",               desc:"Add 500 games to your library",                                cat:"Library",   trophy:"golden_cd"},
  {id:"all_consoles_50",    rarity:"rare",     icon:"📦",name:"Fully Loaded",              desc:"Have 15+ games on every console",                              cat:"Library"},
  // Playtime
  {id:"play_10h",           rarity:"common",   icon:"⏱",name:"Just Getting Started",      desc:"Play for 10 total hours",                                      cat:"Playtime"},
  {id:"play_50h",           rarity:"uncommon", icon:"⌛",name:"Dedicated Player",           desc:"Play for 50 total hours",                                      cat:"Playtime"},
  {id:"play_100h",          rarity:"uncommon", icon:"💯",name:"Century Club",              desc:"Play for 100 total hours",                                     cat:"Playtime"},
  {id:"play_250h",          rarity:"rare",     icon:"🔥",name:"No Life",                   desc:"Play for 250 total hours",                                     cat:"Playtime"},
  {id:"play_500h",          rarity:"rare",     icon:"🌟",name:"Veteran",                   desc:"Play for 500 total hours",                                     cat:"Playtime"},
  {id:"play_1000h",         rarity:"ultraRare",icon:"💀",name:"Gone",                      desc:"Play for 1000 total hours",                                    cat:"Playtime",  trophy:"skeleton"},
  {id:"play_1g_100h",       rarity:"rare",     icon:"⭐",name:"Obsessed",                  desc:"Log 100 hours on a single game",                               cat:"Playtime"},
  {id:"play_1g_250h",       rarity:"ultraRare",icon:"❤️", name:"True Fan",                desc:"Log 250 hours on a single game",                               cat:"Playtime",  trophy:"heart"},
  {id:"play_10_oneday",     rarity:"uncommon", icon:"🎲",name:"Variety Day",               desc:"Play 10 different games in one day",                           cat:"Playtime"},
  {id:"session_3h",         rarity:"uncommon", icon:"🎯",name:"In The Zone",               desc:"Play a game for over 3 hours in one session",                  cat:"Playtime"},
  {id:"streak_30",          rarity:"rare",     icon:"📅",name:"Dedicated",                 desc:"Play every day for 30 days straight",                          cat:"Playtime"},
  {id:"play_all_consoles_10m",rarity:"uncommon", icon:"🌐",name:"Console Connoisseur",       desc:"Play 10 minutes on every console in one session",              cat:"Playtime"},
  // Display
  {id:"pin_12",             rarity:"common",   icon:"📌",name:"Full Wall",                 desc:"Pin all 12 game posters",                                      cat:"Display"},
  // Collections
  {id:"coll_5",             rarity:"common",   icon:"📂",name:"Curator",                   desc:"Create 5 collections",                                         cat:"Collections"},
  {id:"coll_all_consoles",  rarity:"uncommon", icon:"🌍",name:"Everything Shelf",          desc:"Have a collection with games from every console",              cat:"Collections"},
  // Profile
  {id:"profile",            rarity:"common",   icon:"👤",name:"Identity",                  desc:"Create your profile",                                          cat:"Profile"},
  {id:"guide_complete",     rarity:"common",   icon:"📖",name:"Did Your Homework",          desc:"View all 19 steps of the setup guide",                         cat:"Profile"},
  // Hidden
  {id:"secret_name",        rarity:"hidden",   icon:"🌀",name:"MMAJRJRS",                  desc:"???",                                                          cat:"Hidden",    trophy:"desk_fan"},
  {id:"secret_3am",         rarity:"hidden",   icon:"🌙",name:"Night Owl",                 desc:"The world is quiet. The shelf glows. Most are asleep.",         cat:"Hidden"},
  {id:"secret_fast",        rarity:"hidden",   icon:"⚡",name:"No Hesitation",             desc:"You knew exactly what you wanted before the dust had settled.",  cat:"Hidden"},
  {id:"secret_unpin",       rarity:"hidden",   icon:"🤔",name:"Changed My Mind",           desc:"You put it up. Then immediately reconsidered.",                 cat:"Hidden"},
  {id:"secret_lonely",      rarity:"hidden",   icon:"🥺",name:"Me Too",                    desc:"Some searches say more about the searcher than the search.",    cat:"Hidden"},
  {id:"secret_bio_long",    rarity:"hidden",   icon:"✍",name:"J.K. Rowling Over Here SMH",desc:"You had a lot to say about yourself. We respect the commitment.",cat:"Hidden"},
  {id:"secret_all_pins",    rarity:"hidden",   icon:"📌",name:"The Whole Collection",      desc:"Every corner of the shelf, represented on the wall.",           cat:"Hidden"},
  {id:"secret_idle",        rarity:"hidden",   icon:"💤",name:"Why Are You Here",          desc:"The shelf waited. And waited. And you never came back.",         cat:"Hidden"},
  {id:"all_achievements",   rarity:"ultraRare",icon:"🏆",name:"Completionist",             desc:"Unlock every other achievement",                                cat:"Hidden",    trophy:"trophy"},
];

function useAchievements(){
  const [unlocked,setUnlocked]=useState(()=>{
    try{return JSON.parse(localStorage.getItem("rs_achievements")||"{}");}catch{return {};}
  });
  const unlock=(id)=>{
    // Always read fresh from localStorage to avoid stale closure overwriting concurrent unlocks
    try{
      const current=JSON.parse(localStorage.getItem("rs_achievements")||"{}");
      if(current[id])return null;
      const next={...current,[id]:{unlockedAt:Date.now()}};
      localStorage.setItem("rs_achievements",JSON.stringify(next));
      setUnlocked(next);
      return ALL_ACHIEVEMENTS.find(a=>a.id===id)||null;
    }catch{return null;}
  };
  return{unlocked,unlock};
}

function AchievementToast({achievement,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,3800);return()=>clearTimeout(t);},[]);
  const r=RARITY[achievement.rarity]||RARITY.common;
  return(
    <div style={{position:"fixed",bottom:"80px",right:"24px",zIndex:9999,animation:"slideUp 0.4s cubic-bezier(0.34,1.5,0.64,1)",display:"flex",alignItems:"center",gap:"12px",padding:"12px 18px",background:"linear-gradient(135deg,#120e06,#1e1608)",border:`1px solid ${r.color}66`,borderRadius:"14px",boxShadow:`0 16px 40px rgba(0,0,0,0.85),0 0 20px ${r.glow}`,maxWidth:"280px",pointerEvents:"none"}}>
      <div style={{fontSize:"28px",lineHeight:1}}>{achievement.rarity==="hidden"?"🎉":achievement.icon}</div>
      <div>
        <div style={{fontSize:"8px",letterSpacing:"2px",color:r.color,fontWeight:700,marginBottom:"2px"}}>ACHIEVEMENT UNLOCKED · {r.label.toUpperCase()}</div>
        <div style={{fontSize:"13px",fontWeight:800,color:"rgba(255,255,255,0.95)",lineHeight:1.2}}>{achievement.rarity==="hidden"?"Hidden Achievement":achievement.name}</div>
        {achievement.trophy&&<div style={{fontSize:"9px",color:COLLECTIBLES[achievement.trophy].color,marginTop:"3px",fontWeight:700}}>🎁 Collectible Unlocked: {COLLECTIBLES[achievement.trophy].name} Trophy</div>}
      </div>
    </div>
  );
}

function CollectiblesCase({unlocked,accentColor,mainColor}){
  const total=Object.keys(COLLECTIBLES).length;
  const earned=ALL_ACHIEVEMENTS.filter(a=>a.trophy&&unlocked[a.id]).map(a=>COLLECTIBLES[a.trophy]);
  const header=(
    <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}>
      <div style={{fontSize:"9px",letterSpacing:"2px",color:accentColor,fontWeight:700,opacity:0.7}}>COLLECTIBLES</div>
      <div style={{fontSize:"9px",fontWeight:700,color:accentColor,opacity:0.5}}>{earned.length}/{total}</div>
    </div>
  );
  if(earned.length===0)return(
    <div style={{marginTop:"4px"}}>
      {header}
      <div style={{fontSize:"10px",color:"rgba(255,255,255,0.2)",fontStyle:"italic"}}>No collectibles earned yet.</div>
    </div>
  );
  return(
    <div style={{marginTop:"4px"}}>
      {header}
      <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
        {earned.map(tr=>(
          <div key={tr.id} title={`${tr.name} — ${tr.desc}`}
            style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 12px",borderRadius:"12px",background:`${mainColor}cc`,border:`1px solid ${tr.color}55`,transition:"all 0.2s",boxShadow:`0 0 16px ${tr.color}33`}}>
            <div style={{fontSize:"28px"}}>{tr.icon}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AchievementsTab({unlocked,accentColor,mainColor,allGames=[]}){
  const rarityOrder=["common","uncommon","rare","ultraRare","hidden"];
  const sorted=[...ALL_ACHIEVEMENTS].sort((a,b)=>rarityOrder.indexOf(a.rarity)-rarityOrder.indexOf(b.rarity));
  const total=ALL_ACHIEVEMENTS.length;
  const count=ALL_ACHIEVEMENTS.filter(a=>unlocked[a.id]).length;

  const getProgress=(id)=>{
    try{
      const n=allGames.length;
      const totalH=allGames.reduce((s,g)=>s+(g.playtime_seconds||0),0)/3600;
      const topH=allGames.length?Math.max(...allGames.map(g=>(g.playtime_seconds||0)/3600)):0;
      const consoleCounts={};
      allGames.forEach(g=>{consoleCounts[g.consoleId]=(consoleCounts[g.consoleId]||0)+1;});
      const numConsoles=Object.keys(CONSOLES).length;
      const minConsole=numConsoles>0?Math.min(...Object.keys(CONSOLES).map(cid=>consoleCounts[cid]||0)):0;
      const colls=JSON.parse(localStorage.getItem("rs_collections")||"[]");
      const streak=JSON.parse(localStorage.getItem("rs_streak")||'{"count":0}');
      const tdg=JSON.parse(localStorage.getItem("rs_today_games")||"{}");
      const tdc=JSON.parse(localStorage.getItem("rs_today_consoles")||"{}");
      const pinned=JSON.parse(localStorage.getItem("rs_pinned")||"[]");
      const map={
        lib_5:             {cur:Math.min(n,5),    max:5},
        lib_10:            {cur:Math.min(n,10),   max:10},
        lib_20:            {cur:Math.min(n,20),   max:20},
        lib_50:            {cur:Math.min(n,50),   max:50},
        lib_100:           {cur:Math.min(n,100),  max:100},
        lib_250:           {cur:Math.min(n,250),  max:250},
        lib_500:           {cur:Math.min(n,500),  max:500},
        all_consoles_50:   {cur:Object.keys(CONSOLES).filter(cid=>(consoleCounts[cid]||0)>=15).length, max:numConsoles, unit:"consoles"},
        play_10h:          {cur:Math.min(Math.floor(totalH),10),   max:10,   unit:"hrs"},
        play_50h:          {cur:Math.min(Math.floor(totalH),50),   max:50,   unit:"hrs"},
        play_100h:         {cur:Math.min(Math.floor(totalH),100),  max:100,  unit:"hrs"},
        play_250h:         {cur:Math.min(Math.floor(totalH),250),  max:250,  unit:"hrs"},
        play_500h:         {cur:Math.min(Math.floor(totalH),500),  max:500,  unit:"hrs"},
        play_1000h:        {cur:Math.min(Math.floor(totalH),1000), max:1000, unit:"hrs"},
        play_1g_100h:      {cur:Math.min(Math.floor(topH),100),    max:100,  unit:"hrs"},
        play_1g_250h:      {cur:Math.min(Math.floor(topH),250),    max:250,  unit:"hrs"},
        play_10_oneday:    {cur:Math.min((tdg.games||[]).length,10), max:10,  unit:"games"},
        session_3h:        (()=>{const ss=parseInt(localStorage.getItem("rs_session_start")||"0");if(!ss)return null;const elapsed=Math.min(Math.floor((Date.now()-ss)/60000),180);return{cur:elapsed,max:180,unit:"min"};})(),
        streak_30:         {cur:Math.min(streak.count||0,30),      max:30},
        play_all_consoles_10m:{cur:Math.min((tdc.consoles||[]).length,numConsoles),max:numConsoles},
        pin_12:            {cur:Math.min(pinned.length,12),         max:12},
        coll_5:            {cur:Math.min(colls.length,5),           max:5},
        coll_all_consoles: {cur:Math.min(Math.max(0,...[0,...colls.map(c=>new Set(c.games.map(g=>g.consoleId)).size)]),numConsoles),max:numConsoles},
        profile:           null,
        guide_complete:    {cur:Math.min(parseInt(localStorage.getItem("rs_guide_progress")||"0"),19), max:19, unit:"steps"},
        all_achievements:  {cur:Math.min(count,total-1),           max:total-1},
      };
      return map[id]||null;
    }catch{return null;}
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
      {/* Progress */}
      <div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}>
          <div style={{fontSize:"9px",color:"rgba(255,255,255,0.3)"}}>{count} / {total} unlocked</div>
          <div style={{fontSize:"9px",fontWeight:700,color:accentColor}}>{Math.round(count/total*100)}%</div>
        </div>
        <div style={{height:"5px",background:"rgba(255,255,255,0.06)",borderRadius:"3px",overflow:"hidden"}}>
          <div style={{height:"100%",width:`${count/total*100}%`,background:`linear-gradient(90deg,${accentColor}88,${accentColor})`,borderRadius:"3px",transition:"width 0.5s"}}/>
        </div>
      </div>
      {/* List — sorted by rarity */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px",maxHeight:"300px",overflowY:"auto"}}>
        {sorted.map(a=>{
          const done=!!unlocked[a.id];
          const r=RARITY[a.rarity]||RARITY.common;
          const isHidden=a.rarity==="hidden"&&!done;
          const date=done?new Date(unlocked[a.id].unlockedAt).toLocaleDateString("en-US",{month:"short",day:"numeric"}):null;
          return(
            <div key={a.id} style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 11px",borderRadius:"10px",background:done?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.25)",border:`1px solid ${done?r.color+"44":"rgba(255,255,255,0.04)"}`,opacity:done?1:0.5,position:"relative",overflow:"hidden"}}>
              {done&&<div style={{position:"absolute",top:0,left:0,right:0,height:"1px",background:`linear-gradient(90deg,transparent,${r.color}66,transparent)`}}/>}
              <div style={{fontSize:"18px",filter:done?"none":"grayscale(1)",flexShrink:0}}>{isHidden?"🔒":a.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:"10px",fontWeight:800,color:done?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.35)",lineHeight:1.2}}>{isHidden?"Hidden Achievement":a.name}</div>
                <div style={{fontSize:"8px",color:r.color,fontWeight:700,letterSpacing:"0.5px",marginTop:"1px"}}>{r.label}</div>
                {done&&<div style={{fontSize:"8px",color:"rgba(255,255,255,0.25)",marginTop:"1px"}}>{a.desc==="???"?"A secret well kept.":a.desc}</div>}
                {!done&&isHidden&&<div style={{fontSize:"8px",color:`${r.color}88`,marginTop:"1px",fontStyle:"italic"}}>{a.desc}</div>}
                {!done&&!isHidden&&<div style={{fontSize:"8px",color:"rgba(255,255,255,0.25)",marginTop:"1px"}}>{a.desc}</div>}
                {date&&<div style={{fontSize:"7px",color:`${r.color}88`,marginTop:"2px",fontWeight:700}}>✓ {date}</div>}
                {(()=>{const prog=(!done&&!isHidden)?getProgress(a.id):null;if(!prog)return null;const pct=Math.min(100,Math.round((prog.cur/prog.max)*100));const lbl=prog.unit?`${prog.cur} / ${prog.max} ${prog.unit}`:`${prog.cur} / ${prog.max}`;return(<div style={{marginTop:"5px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"2px"}}><div style={{fontSize:"7px",color:r.color,fontWeight:700}}>{lbl}</div><div style={{fontSize:"7px",color:`${r.color}88`}}>{pct}%</div></div><div style={{height:"3px",background:"rgba(255,255,255,0.06)",borderRadius:"2px",overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${r.color}66,${r.color})`,borderRadius:"2px",transition:"width 0.4s ease"}}/></div></div>);})()}
              </div>
              {a.trophy&&done&&<div title={COLLECTIBLES[a.trophy].name} style={{fontSize:"14px",flexShrink:0}}>{COLLECTIBLES[a.trophy].icon}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── GAME META (ratings, favorites, session history) ─────────────────────────


function ProfileBanner({profile,onClick}){
  const [hov,setHov]=useState(false);
  const hasProfile=profile&&profile.username;
  const ac=profile?.accentColor||"#c8901a";
  const mc=profile?.mainColor||"#1a0e04";
  return(
    <div
      onClick={onClick}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{position:"absolute",bottom:"22px",left:"24px",zIndex:10,borderRadius:"14px",cursor:"pointer",transition:"all 0.2s",userSelect:"none",transform:hov?"translateY(-2px)":"none",boxShadow:hov?`0 12px 32px rgba(0,0,0,0.7),0 0 0 1px ${ac}44`:"0 4px 16px rgba(0,0,0,0.5)",overflow:"hidden",border:`1px solid ${hov?ac+"66":ac+"28"}`}}
    >
      <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 14px 8px 8px",background:hov?`${mc}ee`:`${mc}dd`}}>
        <div style={{width:"36px",height:"36px",borderRadius:"50%",overflow:"hidden",flexShrink:0,background:mc,border:`2px solid ${ac}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.6)",position:"relative"}}>
          {hasProfile&&profile.avatar
            ?<img src={profile.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            :<span style={{fontSize:"14px",opacity:0.4}}>👤</span>
          }
        </div>
        <div style={{paddingTop:"4px"}}>
          <div style={{fontSize:"12px",fontWeight:700,color:hasProfile?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.3)",letterSpacing:"0.3px",fontFamily:"'Nunito',sans-serif",lineHeight:1.2}}>
            {hasProfile?profile.username:"No Profile"}
          </div>
          <div style={{fontSize:"8px",color:`${ac}99`,fontWeight:600,letterSpacing:"0.5px",marginTop:"2px"}}>
            {hasProfile?"VIEW PROFILE":"CLICK TO SET UP"}
          </div>
        </div>
      </div>
    </div>
  );
}



function ProfileModal({profile,allGames,pinnedGames,onClose,onSave,achievUnlocked={},sessionHistory=[]}){
  const collections=(() => { try{return JSON.parse(localStorage.getItem("rs_collections")||"[]");}catch{return [];} })();
  const [tab,setTab]=useState(profile?.username?"stats":"edit");
  const [expandedDay,setExpandedDay]=useState(null);
  const [username,setUsername]=useState(profile?.username||"");
  const [avatar,setAvatar]=useState(profile?.avatar||null);
  const [accentColor,setAccentColor]=useState(profile?.accentColor||"#c8901a");
  const [mainColor,setMainColor]=useState(profile?.mainColor||"#1a0e04");
  const [bio,setBio]=useState(profile?.bio||"");
  const [avatarHov,setAvatarHov]=useState(false);
  const inputRef=useRef(null);
  const fileRef=useRef(null);

  // Stats
  const totalGames=allGames.length;
  const consoleCount=Object.keys(CONSOLES).filter(id=>allGames.some(g=>g.consoleId===id)).length;
  const collectionCount=collections.length;
  const topConsole=(()=>{
    const counts={};
    allGames.forEach(g=>{counts[g.consoleId]=(counts[g.consoleId]||0)+1;});
    const top=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
    return top?{id:top[0],count:top[1],label:CONSOLES[top[0]]?.label||top[0]}:null;
  })();
  const mostCollected=(()=>{
    if(!collections.length)return null;
    const top=[...collections].sort((a,b)=>b.games.length-a.games.length)[0];
    return top.games.length>0?top:null;
  })();
  const joinDate=profile?.joinDate?new Date(profile.joinDate).toLocaleDateString("en-US",{month:"long",year:"numeric"}):null;

  // Playtime stats
  const totalPlaySeconds=allGames.reduce((s,g)=>s+(g.playtime_seconds||0),0);
  const formatPlaytime=(secs)=>{
    if(!secs||secs<60)return secs>0?`${secs}s`:"0h";
    const h=Math.floor(secs/3600);
    const m=Math.floor((secs%3600)/60);
    return h>0?`${h}h ${m}m`:`${m}m`;
  };
  const top5Games=[...allGames]
    .filter(g=>(g.playtime_seconds||0)>0)
    .sort((a,b)=>(b.playtime_seconds||0)-(a.playtime_seconds||0))
    .slice(0,5);

  const topPlayConsole=(()=>{
    const cCounts={};
    allGames.forEach(g=>{cCounts[g.consoleId]=(cCounts[g.consoleId]||0)+(g.playtime_seconds||0);});
    return Object.entries(cCounts).sort((a,b)=>b[1]-a[1])[0]||null;
  })();
  const topPlayGame=[...allGames].sort((a,b)=>(b.playtime_seconds||0)-(a.playtime_seconds||0))[0]||null;
  const sessionGroups=(()=>{
    const groups={};
    sessionHistory.forEach(s=>{
      const day=new Date(s.date).toDateString();
      if(!groups[day])groups[day]=[];
      groups[day].push(s);
    });
    return groups;
  })();
  const sessionDays=Object.keys(sessionGroups).sort((a,b)=>new Date(b)-new Date(a));
  const todayStr=new Date().toDateString();
  const yesterdayStr=new Date(Date.now()-86400000).toDateString();

  const handleAvatarUpload=(e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=(ev)=>setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave=()=>{
    if(!username.trim())return;
    onSave({username:username.trim(),avatar,accentColor,mainColor,bio:bio.trim(),joinDate:profile?.joinDate||Date.now()});
    onClose();
  };

  const isNew=!profile?.username;

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:700,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(16px)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"min(580px,96vw)",background:`linear-gradient(160deg,${mainColor},${mainColor}ee)`,border:`2px solid ${accentColor}55`,borderRadius:"20px",overflow:"hidden",boxShadow:"0 50px 120px rgba(0,0,0,0.95)",animation:"popUp 0.22s cubic-bezier(0.34,1.5,0.64,1)"}}>

        {/* Header */}
        <div style={{height:"48px",background:`linear-gradient(135deg,${mainColor},${accentColor}30)`,position:"relative",borderBottom:`1px solid ${accentColor}25`,flexShrink:0}}>
          <div onClick={onClose} style={{position:"absolute",top:"8px",right:"10px",width:"32px",height:"32px",borderRadius:"50%",background:"rgba(0,0,0,0.4)",border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:"13px",color:"rgba(255,255,255,0.6)"}}>✕</div>
        </div>
        {/* Avatar — sits below banner, not inside it */}
        <div style={{position:"relative",padding:"0 28px",marginTop:"-28px",marginBottom:"0",display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
          <div style={{width:"56px",height:"56px",borderRadius:"50%",overflow:"hidden",background:mainColor||"#1a0e04",border:`3px solid ${accentColor}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(0,0,0,0.8)"}}>
            {avatar?<img src={avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:"22px",opacity:0.35}}>👤</span>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{display:"none"}}/>
        </div>

        {/* Name area */}
        <div style={{padding:"8px 28px 0 28px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"4px"}}>
          <div>
            <div style={{fontSize:"18px",fontWeight:700,color:"rgba(255,255,255,0.9)",fontFamily:"'Nunito',sans-serif"}}>
              {profile?.username||"New Profile"}
            </div>
            {joinDate&&<div style={{fontSize:"10px",color:`${accentColor}55`,letterSpacing:"1px",fontWeight:600,marginTop:"2px"}}>SINCE {joinDate.toUpperCase()}</div>}
          </div>
          {/* Tabs — only show if profile exists */}
          {!isNew&&(
            <div style={{display:"flex",gap:"4px"}}>
              {["stats","history","achievements","edit"].map(t=>(
                <div key={t} onClick={()=>setTab(t)}
                  style={{padding:"5px 12px",borderRadius:"6px",fontSize:"10px",fontWeight:700,letterSpacing:"1px",cursor:"pointer",background:tab===t?`${accentColor}28`:"transparent",color:tab===t?accentColor:"rgba(255,255,255,0.3)",border:`1px solid ${tab===t?`${accentColor}66`:"transparent"}`,transition:"all 0.15s"}}>
                  {t.toUpperCase()}
                </div>
              ))}
            </div>
          )}
        </div>
        {profile?.bio&&<div style={{padding:"2px 28px 10px",fontSize:"11px",color:"rgba(255,255,255,0.35)",lineHeight:1.5,fontStyle:"italic"}}>{profile.bio}</div>}

        <div style={{padding:"16px 28px 28px"}}>
          {/* STATS TAB */}
          {tab==="stats"&&(
            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              {/* Big stats row */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"4px"}}>
                <StatBox value={totalGames} label="Games" accent={accentColor} mainColor={mainColor}/>
                <StatBox value={consoleCount} label="Consoles" accent={accentColor} mainColor={mainColor}/>
                <StatBox value={collectionCount} label="Collections" accent={accentColor} mainColor={mainColor}/>
              </div>
              {/* Top collection */}
              {/* Playtime */}
              <div style={{padding:"12px 16px",background:`${mainColor}cc`,borderRadius:"10px",border:`1px solid ${accentColor}30`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:"9px",letterSpacing:"2px",color:`${accentColor}88`,fontWeight:700,marginBottom:"3px"}}>TOTAL PLAYTIME</div>
                  <div style={{fontSize:"22px",fontWeight:900,color:accentColor,fontFamily:"'Boogaloo',cursive",lineHeight:1}}>{formatPlaytime(totalPlaySeconds)}</div>
                </div>
                <div style={{fontSize:"24px",opacity:0.2}}>⏱</div>
              </div>
              {/* Most played console + game */}
              {(topPlayConsole||topPlayGame)&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                  {topPlayConsole&&<div style={{padding:"10px 12px",background:`${mainColor}cc`,borderRadius:"10px",border:`1px solid ${accentColor}30`}}>
                    <div style={{fontSize:"8px",letterSpacing:"1.5px",color:`${accentColor}88`,fontWeight:700,marginBottom:"4px"}}>MOST PLAYED CONSOLE</div>
                    <div style={{fontSize:"12px",fontWeight:800,color:accentColor,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{CONSOLES[topPlayConsole[0]]?.label||topPlayConsole[0]}</div>
                    <div style={{fontSize:"9px",color:`${accentColor}66`,marginTop:"2px"}}>{formatPlaytime(topPlayConsole[1])}</div>
                  </div>}
                  {topPlayGame&&(topPlayGame.playtime_seconds||0)>0&&<div style={{padding:"10px 12px",background:`${mainColor}cc`,borderRadius:"10px",border:`1px solid ${accentColor}30`}}>
                    <div style={{fontSize:"8px",letterSpacing:"1.5px",color:`${accentColor}88`,fontWeight:700,marginBottom:"4px"}}>MOST PLAYED GAME</div>
                    <div style={{fontSize:"12px",fontWeight:800,color:accentColor,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{topPlayGame.title}</div>
                    <div style={{fontSize:"9px",color:`${accentColor}66`,marginTop:"2px"}}>{formatPlaytime(topPlayGame.playtime_seconds||0)}</div>
                  </div>}
                </div>
              )}
              {totalGames===0&&(
                <div style={{textAlign:"center",padding:"16px",color:"rgba(255,255,255,0.2)",fontSize:"12px",fontStyle:"italic"}}>Add some games to see your stats!</div>
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {tab==="history"&&(
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              {sessionHistory.length===0
                ?<div style={{textAlign:"center",padding:"24px",color:"rgba(255,255,255,0.2)",fontSize:"12px",fontStyle:"italic"}}>No sessions recorded yet. Launch a game to start your history!</div>
                :<div style={{maxHeight:"340px",overflowY:"auto",display:"flex",flexDirection:"column",gap:"5px"}}>
                  {sessionDays.map(day=>{
                    const sessions=sessionGroups[day];
                    const isOpen=expandedDay===day;
                    const dayTotal=sessions.reduce((s,x)=>s+(x.duration||0),0);
                    const label=day===todayStr?"Today":day===yesterdayStr?"Yesterday":new Date(day).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
                    const dur=dayTotal>=3600?`${Math.floor(dayTotal/3600)}h ${Math.floor((dayTotal%3600)/60)}m`:dayTotal>=60?`${Math.floor(dayTotal/60)}m`:`${dayTotal}s`;
                    return(
                      <div key={day}>
                        <div onClick={()=>setExpandedDay(isOpen?null:day)}
                          style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 12px",borderRadius:"8px",background:isOpen?`${accentColor}14`:"rgba(255,255,255,0.04)",border:`1px solid ${isOpen?accentColor+"33":"rgba(255,255,255,0.06)"}`,cursor:"pointer",transition:"all 0.15s",userSelect:"none"}}>
                          <div style={{fontSize:"11px",fontWeight:800,color:isOpen?accentColor:"rgba(255,255,255,0.7)",flex:1}}>{label}</div>
                          <div style={{fontSize:"9px",color:"rgba(255,255,255,0.3)"}}>{sessions.length} session{sessions.length!==1?"s":""}</div>
                          <div style={{fontSize:"10px",fontWeight:700,color:accentColor}}>{dur}</div>
                          <div style={{fontSize:"9px",color:"rgba(255,255,255,0.3)",transition:"transform 0.2s",transform:isOpen?"rotate(180deg)":"none"}}>▾</div>
                        </div>
                        {isOpen&&(
                          <div style={{display:"flex",flexDirection:"column",gap:"3px",marginTop:"3px",paddingLeft:"8px"}}>
                            {sessions.map((s,i)=>{
                              const timeStr=new Date(s.date).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
                              const sdur=s.duration>=3600?`${Math.floor(s.duration/3600)}h ${Math.floor((s.duration%3600)/60)}m`:s.duration>=60?`${Math.floor(s.duration/60)}m`:`${s.duration}s`;
                              const con=CONSOLES[s.consoleId];
                              return(
                                <div key={s.id||i} style={{display:"flex",alignItems:"center",gap:"10px",padding:"7px 12px",borderRadius:"7px",background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.04)"}}>
                                  <div style={{width:"3px",height:"28px",borderRadius:"2px",background:con?.accent||accentColor,flexShrink:0}}/>
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontSize:"10px",fontWeight:700,color:"rgba(255,255,255,0.8)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.title}</div>
                                    <div style={{fontSize:"8px",color:"rgba(255,255,255,0.25)",marginTop:"1px"}}>{con?.label||s.consoleId} · {timeStr}</div>
                                  </div>
                                  <div style={{fontSize:"10px",fontWeight:700,color:accentColor,flexShrink:0}}>{sdur}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              }
            </div>
          )}

          {/* ACHIEVEMENTS TAB */}
          {tab==="achievements"&&(
            <AchievementsTab unlocked={achievUnlocked} accentColor={accentColor} mainColor={mainColor} allGames={allGames}/>
          )}

          {/* COLLECTIBLES — shown at bottom of stats tab */}
          {tab==="stats"&&(
            <CollectiblesCase unlocked={achievUnlocked} accentColor={accentColor} mainColor={mainColor}/>
          )}

          {/* EDIT TAB */}
          {tab==="edit"&&(
            <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
              {/* Row: avatar + username + status */}
              <div style={{display:"grid",gridTemplateColumns:"72px 1fr",gap:"14px",alignItems:"start"}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"6px"}}>
                  <div onClick={()=>fileRef.current?.click()} style={{width:"56px",height:"56px",borderRadius:"50%",overflow:"hidden",background:"rgba(0,0,0,0.5)",border:"2px dashed rgba(255,255,255,0.15)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"border-color 0.2s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=accentColor}
                    onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.15)"}>
                    {avatar?<img src={avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:"20px",opacity:0.3}}>📷</span>}
                  </div>
                  <div style={{fontSize:"8px",color:"rgba(255,255,255,0.2)",textAlign:"center",cursor:"pointer"}} onClick={()=>fileRef.current?.click()}>Avatar</div>
                  {avatar&&<div style={{fontSize:"8px",color:"#f87171",cursor:"pointer"}} onClick={()=>setAvatar(null)}>Remove</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                  <div>
                    <div style={{fontSize:"9px",letterSpacing:"2px",color:accentColor,fontWeight:700,marginBottom:"5px"}}>USERNAME</div>
                    <input ref={inputRef} value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSave()} placeholder="Enter your username..." maxLength={24}
                      style={{width:"100%",padding:"8px 12px",background:`${mainColor}bb`,border:`1px solid ${accentColor}40`,borderRadius:"7px",color:"white",fontSize:"13px",fontFamily:"'Nunito',sans-serif",fontWeight:600}}/>
                  </div>
                </div>
              </div>
              {/* Bio */}
              <div>
                <div style={{fontSize:"9px",letterSpacing:"2px",color:accentColor,fontWeight:700,marginBottom:"5px"}}>BIO <span style={{opacity:0.5,letterSpacing:0,fontWeight:400,fontSize:"8px"}}>({bio.length}/120)</span></div>
                <textarea value={bio} onChange={e=>setBio(e.target.value.slice(0,120))} placeholder="Write something about yourself..." rows={2}
                  style={{width:"100%",padding:"8px 12px",background:`${mainColor}bb`,border:`1px solid ${accentColor}40`,borderRadius:"7px",color:"white",fontSize:"12px",fontFamily:"'Nunito',sans-serif",fontWeight:500,resize:"none",lineHeight:1.5}}/>
              </div>
              {/* Colors row */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}}>
                <div>
                  <div style={{fontSize:"9px",letterSpacing:"2px",color:accentColor,fontWeight:700,marginBottom:"8px"}}>MAIN COLOR <span style={{opacity:0.5,letterSpacing:0,fontWeight:400}}>(background)</span></div>
                  <div style={{display:"flex",gap:"6px",flexWrap:"wrap",alignItems:"center"}}>
                    {["#1a0e04","#0a0e1a","#0a1a0e","#1a0a0e","#120a1a","#1a160a","#0e0e0e","#1a1a1a"].map(col=>(
                      <div key={col} onClick={()=>setMainColor(col)}
                        style={{width:"22px",height:"22px",borderRadius:"6px",background:col,cursor:"pointer",border:`2px solid ${mainColor===col?"white":"rgba(255,255,255,0.15)"}`,boxShadow:mainColor===col?`0 0 0 2px ${col}`:"none",transition:"all 0.15s",flexShrink:0}}/>
                    ))}
                    <div style={{width:"22px",height:"22px",borderRadius:"6px",background:mainColor,border:"2px solid rgba(255,255,255,0.3)",overflow:"hidden",cursor:"pointer",position:"relative",flexShrink:0}}>
                      <input type="color" value={mainColor} onChange={e=>setMainColor(e.target.value)}
                        style={{position:"absolute",inset:"-4px",width:"calc(100%+8px)",height:"calc(100%+8px)",opacity:0,cursor:"pointer"}}/>
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:"9px",letterSpacing:"2px",color:accentColor,fontWeight:700,marginBottom:"8px"}}>ACCENT COLOR <span style={{opacity:0.5,letterSpacing:0,fontWeight:400}}>(highlights)</span></div>
                  <div style={{display:"flex",gap:"6px",flexWrap:"wrap",alignItems:"center"}}>
                    {["#c8901a","#e05555","#55a8e0","#55c878","#c855c8","#e0a855","#55e0d4","#e0e0e0"].map(col=>(
                      <div key={col} onClick={()=>setAccentColor(col)}
                        style={{width:"22px",height:"22px",borderRadius:"50%",background:col,cursor:"pointer",border:`2px solid ${accentColor===col?"white":"transparent"}`,boxShadow:accentColor===col?`0 0 0 2px ${col}`:"none",transition:"all 0.15s",flexShrink:0}}/>
                    ))}
                    <div style={{width:"22px",height:"22px",borderRadius:"50%",background:accentColor,border:"2px solid rgba(255,255,255,0.3)",overflow:"hidden",cursor:"pointer",position:"relative",flexShrink:0}}>
                      <input type="color" value={accentColor} onChange={e=>setAccentColor(e.target.value)}
                        style={{position:"absolute",inset:"-4px",width:"calc(100%+8px)",height:"calc(100%+8px)",opacity:0,cursor:"pointer"}}/>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:"10px",justifyContent:"flex-end",marginTop:"4px"}}>
                {!isNew&&<Btn onClick={onClose}>Cancel</Btn>}
                <Btn variant="accent" accent={accentColor} onClick={handleSave} style={{opacity:username.trim()?1:0.4,pointerEvents:username.trim()?"auto":"none"}}>
                  {isNew?"Create Profile":"Save Changes"}
                </Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({value,label,accent,mainColor}){
  return(
    <div style={{padding:"14px 12px",background:mainColor?`${mainColor}cc`:"rgba(0,0,0,0.3)",borderRadius:"10px",border:`1px solid ${accent}30`,textAlign:"center"}}>
      <div style={{fontSize:"26px",fontWeight:900,color:accent,fontFamily:"'Boogaloo',cursive",lineHeight:1}}>{value}</div>
      <div style={{fontSize:"8px",color:`${accent}88`,letterSpacing:"1.5px",fontWeight:700,marginTop:"4px"}}>{label.toUpperCase()}</div>
    </div>
  );
}

// ─── STARTUP ANIMATION ────────────────────────────────────────────────────────
function StartupAnimation({onDone}){
  const [phase,setPhase]=useState(0);
  const [progress,setProgress]=useState(0);
  const [loadText,setLoadText]=useState("Initializing...");
  const [glitch,setGlitch]=useState(false);
  const [logoVisible,setLogoVisible]=useState(false);
  const [scanY,setScanY]=useState(-10);

  const loadSteps=[
    {p:8,t:"Loading configuration..."},
    {p:18,t:"Reading ROM directories..."},
    {p:32,t:"Scanning PlayStation library..."},
    {p:44,t:"Scanning Nintendo library..."},
    {p:55,t:"Scanning Xbox library..."},
    {p:63,t:"Scanning Sega library..."},
    {p:72,t:"Loading cover art cache..."},
    {p:81,t:"Reading controller bindings..."},
    {p:90,t:"Finalizing..."},
    {p:100,t:"Ready."},
  ];

  useEffect(()=>{
    // Scanline sweep effect
    let scanFrame;
    let sy=-10;
    const sweep=()=>{
      sy+=1.5;
      if(sy>110)sy=-10;
      setScanY(sy);
      scanFrame=requestAnimationFrame(sweep);
    };
    scanFrame=requestAnimationFrame(sweep);

    // Phase timeline
    const t0=setTimeout(()=>{
      setPhase(1);
      // Glitch flicker on logo reveal
      let g=0;
      const glitchInterval=setInterval(()=>{
        setGlitch(v=>!v);
        g++;
        if(g>6){clearInterval(glitchInterval);setGlitch(false);}
      },80);
      setTimeout(()=>setLogoVisible(true),120);
    },300);

    // Progress bar stepping
    let stepIdx=0;
    const stepProgress=()=>{
      if(stepIdx>=loadSteps.length)return;
      const step=loadSteps[stepIdx];
      setProgress(step.p);
      setLoadText(step.t);
      stepIdx++;
      if(stepIdx<loadSteps.length){
        const delay=stepIdx<5?220:stepIdx<8?180:300;
        setTimeout(stepProgress,delay);
      }
    };
    const t1=setTimeout(stepProgress,500);

    // Fade out
    const t2=setTimeout(()=>setPhase(2),3200);
    const t3=setTimeout(()=>onDone(),3900);

    return()=>{
      cancelAnimationFrame(scanFrame);
      [t0,t1,t2,t3].forEach(clearTimeout);
    };
  },[]);

  const chromaShift=glitch?3:0;

  return(
    <div style={{
      position:"fixed",inset:0,zIndex:9999,
      background:"#080401",
      display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",
      opacity:phase===2?0:1,
      transition:phase===2?"opacity 0.7s ease":"none",
      pointerEvents:phase===2?"none":"all",
      overflow:"hidden",
      fontFamily:"'Nunito',sans-serif",
    }}>

      {/* Film grain texture */}
      <canvas ref={el=>{
        if(!el)return;
        const ctx=el.getContext("2d");
        el.width=el.offsetWidth||400;
        el.height=el.offsetHeight||300;
        const id=ctx.createImageData(el.width,el.height);
        for(let i=0;i<id.data.length;i+=4){
          const v=Math.random()*30;
          id.data[i]=id.data[i+1]=id.data[i+2]=v;
          id.data[i+3]=28;
        }
        ctx.putImageData(id,0,0);
      }} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:1,opacity:0.6}}/>

      {/* Hard scanlines */}
      <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.22) 3px,rgba(0,0,0,0.22) 4px)",pointerEvents:"none",zIndex:2}}/>

      {/* Moving scan sweep line */}
      <div style={{
        position:"absolute",left:0,right:0,
        top:`${scanY}%`,
        height:"4px",
        background:"linear-gradient(90deg,transparent,rgba(200,144,26,0.08),rgba(200,144,26,0.18),rgba(200,144,26,0.08),transparent)",
        pointerEvents:"none",zIndex:3,
        filter:"blur(1px)",
      }}/>

      {/* Vignette */}
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 45%,transparent 30%,rgba(0,0,0,0.55) 70%,rgba(0,0,0,0.85) 100%)",pointerEvents:"none",zIndex:2}}/>

      {/* Center content */}
      <div style={{position:"relative",zIndex:4,display:"flex",flexDirection:"column",alignItems:"center",gap:"0",width:"100%"}}>

        {/* Version tag */}
        <div style={{
          fontSize:"9px",letterSpacing:"5px",color:"rgba(200,144,26,0.3)",
          fontWeight:700,marginBottom:"28px",
          opacity:logoVisible?1:0,transition:"opacity 0.8s ease 0.4s",
        }}>v0.4.0</div>

        {/* RETROSHELF logo with chromatic aberration */}
        <div style={{position:"relative",marginBottom:"10px"}}>
          {/* Red ghost */}
          <div style={{
            position:"absolute",
            fontFamily:"'Boogaloo',cursive",
            fontSize:"clamp(40px,7vw,86px)",
            letterSpacing:"14px",
            color:"rgba(255,60,30,0.35)",
            left:`${chromaShift}px`,top:`-${chromaShift*0.5}px`,
            opacity:logoVisible?1:0,
            whiteSpace:"nowrap",
            transition:"opacity 0.05s",
            userSelect:"none",
          }}>RETROSHELF</div>
          {/* Blue ghost */}
          <div style={{
            position:"absolute",
            fontFamily:"'Boogaloo',cursive",
            fontSize:"clamp(40px,7vw,86px)",
            letterSpacing:"14px",
            color:"rgba(30,120,255,0.3)",
            left:`-${chromaShift}px`,top:`${chromaShift*0.5}px`,
            opacity:logoVisible?1:0,
            whiteSpace:"nowrap",
            transition:"opacity 0.05s",
            userSelect:"none",
          }}>RETROSHELF</div>
          {/* Main logo */}
          <div style={{
            position:"relative",
            fontFamily:"'Boogaloo',cursive",
            fontSize:"clamp(40px,7vw,86px)",
            letterSpacing:"14px",
            color:glitch?"#e8c060":"#c8901a",
            textShadow:logoVisible&&!glitch
              ?"0 0 40px rgba(200,144,26,0.5),0 0 80px rgba(200,144,26,0.2),0 2px 4px rgba(0,0,0,0.9)"
              :"none",
            opacity:logoVisible?1:0,
            transform:logoVisible?(glitch?"translateX(2px)":"translateX(0)"):"translateY(8px)",
            transition:glitch?"none":"opacity 0.4s ease, transform 0.5s ease, text-shadow 0.8s ease 0.3s",
            whiteSpace:"nowrap",
            userSelect:"none",
          }}>RETROSHELF</div>
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize:"10px",letterSpacing:"7px",
          color:"rgba(200,144,26,0.45)",
          fontWeight:300,
          opacity:logoVisible?1:0,
          transform:logoVisible?"translateY(0)":"translateY(4px)",
          transition:"opacity 0.7s ease 0.5s, transform 0.7s ease 0.5s",
          marginBottom:"52px",
        }}>YOUR EMULATOR LIBRARY</div>

        {/* Loading bar block */}
        <div style={{width:"clamp(280px,35vw,480px)",display:"flex",flexDirection:"column",gap:"8px"}}>
          {/* Load text */}
          <div style={{
            display:"flex",justifyContent:"space-between",alignItems:"center",
            opacity:phase>=1?1:0,transition:"opacity 0.3s ease",
          }}>
            <div style={{fontSize:"9px",letterSpacing:"2px",color:"rgba(200,144,26,0.55)",fontWeight:600,fontFamily:"monospace"}}>
              {loadText}
            </div>
            <div style={{fontSize:"9px",color:"rgba(200,144,26,0.35)",fontFamily:"monospace",fontWeight:700}}>
              {progress}%
            </div>
          </div>
          {/* Bar track */}
          <div style={{
            width:"100%",height:"3px",
            background:"rgba(255,255,255,0.06)",
            borderRadius:"2px",
            overflow:"visible",
            position:"relative",
            opacity:phase>=1?1:0,transition:"opacity 0.3s ease",
          }}>
            {/* Filled portion */}
            <div style={{
              height:"100%",
              width:`${progress}%`,
              background:"linear-gradient(90deg,#5a3000,#c8901a,#f0d080)",
              borderRadius:"2px",
              transition:"width 0.35s cubic-bezier(0.4,0,0.2,1)",
              position:"relative",
            }}>
              {/* Leading glow dot */}
              <div style={{
                position:"absolute",right:"-2px",top:"50%",transform:"translateY(-50%)",
                width:"6px",height:"6px",borderRadius:"50%",
                background:"#f0d080",
                boxShadow:"0 0 8px #c8901a,0 0 16px #c8901a88",
                opacity:progress>0&&progress<100?1:0,
                transition:"opacity 0.2s",
              }}/>
            </div>
          </div>
          {/* Tick marks */}
          <div style={{display:"flex",justifyContent:"space-between",opacity:0.15}}>
            {Array.from({length:21}).map((_,i)=>(
              <div key={i} style={{width:"1px",height:i%5===0?"5px":"3px",background:"#c8901a"}}/>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom credit */}
      <div style={{
        position:"absolute",bottom:"20px",zIndex:4,
        fontSize:"8px",letterSpacing:"5px",color:"rgba(200,144,26,0.2)",
        fontWeight:600,
        opacity:logoVisible?1:0,transition:"opacity 1s ease 0.8s",
      }}>BY SKY</div>

    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App(){
  const [booting,setBooting]=useState(true);
  const [view,setView]=useState("shelf");
  const {profile,save:saveProfile}=useProfile();
  const {unlocked:achievUnlocked,unlock:unlockAchiev}=useAchievements();
  const {getMeta,setRating,toggleFav,isFav,getRating,meta:gameMeta}=useGameMeta();
  const {history:sessionHistory,addSession}=useSessionHistory();
  useEffect(()=>{window._addSession=addSession;return()=>{delete window._addSession;};},[addSession]);
  const [toastQueue,setToastQueue]=useState([]);
  const [pendingToast,setPendingToast]=useState(null);
  const tryUnlock=(id)=>{
    const a=unlockAchiev(id);
    if(a)setToastQueue(q=>[...q,a]);
  };
  // Show next toast when current one finishes
  useEffect(()=>{
    if(!pendingToast&&toastQueue.length>0){
      setPendingToast(toastQueue[0]);
      setToastQueue(q=>q.slice(1));
    }
  },[pendingToast,toastQueue]);
  const [activeId,setActiveId]=useState(null);
  const [picker,setPicker]=useState(null);
  const [showCollections,setShowCollections]=useState(false);
  const [showGlobalSettings,setShowGlobalSettings]=useState(false);
  const [appConfig,setAppConfig]=useState(null);
  const [gameCounts,setGameCounts]=useState({});
  const [allGames,setAllGames]=useState([]);
  const [globalCfg,setGlobalCfg]=useState({});
  const [tutorialSeen,setTutorialSeen]=useState(()=>{
    try{ return localStorage.getItem("rs_tutorial_seen")==="1"; }catch{ return false; }
  });
  const [pinnedGames,setPinnedGames]=useState(()=>{
    try{ return JSON.parse(localStorage.getItem("rs_pinned")||"[]"); }catch{ return []; }
  });

  // Keep App-level pinned state in sync with localStorage (GameLibrary also writes it)
  useEffect(()=>{
    const sync=()=>{
      try{ setPinnedGames(JSON.parse(localStorage.getItem("rs_pinned")||"[]")); }catch{}
    };
    window.addEventListener("storage",sync);
    // Poll for changes made by GameLibrary in same tab
    const id=setInterval(()=>{
      try{
        const stored=JSON.parse(localStorage.getItem("rs_pinned")||"[]");
        setPinnedGames(prev=>JSON.stringify(prev)===JSON.stringify(stored)?prev:stored);
      }catch{}
      // Check console connoisseur — fires after GameLibrary updates rs_today_consoles
      try{
        const today=new Date().toDateString();
        const tc=JSON.parse(localStorage.getItem("rs_today_consoles")||"{}");
        if(tc.date===today&&tc.consoles&&Object.keys(CONSOLES).every(cid=>tc.consoles.includes(cid)))tryUnlock("play_all_consoles_10m");
      }catch{}
    },500);
    return()=>{window.removeEventListener("storage",sync);clearInterval(id);};
  },[]);

  const launchPinned=async(pinned)=>{
    try{
      const duration=await invoke("launch_game",{consoleId:pinned.consoleId,gameId:pinned.gameId});
      window._addSession?.(pinned.consoleId,pinned.gameId,pinned.title||"Unknown",duration||0);
    }catch{}
  };

  const unpinGame=(pinned)=>{
    const updated=pinnedGames.filter(p=>!(p.gameId===pinned.gameId&&p.consoleId===pinned.consoleId));
    setPinnedGames(updated);
    try{ localStorage.setItem("rs_pinned",JSON.stringify(updated)); }catch{}
    // Check if pinned very recently (within 10s)
    try{
      const lastPin=parseInt(localStorage.getItem("rs_last_pin_time")||"0");
      if(lastPin&&Date.now()-lastPin<10000)tryUnlock("secret_unpin");
    }catch{}
  };

  useEffect(()=>{
    if(pinnedGames.length>=12)tryUnlock("pin_12");
    const pinnedConsoles=new Set(pinnedGames.map(p=>p.consoleId));
    if(Object.keys(CONSOLES).every(cid=>pinnedConsoles.has(cid)))tryUnlock("secret_all_pins");
  },[pinnedGames.length]);

  const openTutorial=()=>{
    setView("tutorial");
    setTutorialSeen(true);
    try{ localStorage.setItem("rs_tutorial_seen","1"); }catch{}
  };

  const loadCounts=()=>{
    const ids=Object.keys(CONSOLES);
    const all=[];
    let done=0;
    const finish=()=>{done++;if(done===ids.length)setAllGames([...all].sort((a,b)=>(a.title||"").localeCompare(b.title||"")))};
    ids.forEach(id=>{
      invoke("get_games",{consoleId:id})
        .then(games=>{setGameCounts(prev=>({...prev,[id]:games.length}));games.forEach(g=>all.push({...g,consoleId:id}));finish();})
        .catch(()=>finish());
    });
  };

  useEffect(()=>{
    invoke("get_config").then(cfg=>{
      setAppConfig(cfg);
      setGlobalCfg(cfg?.global||{});
    }).catch(()=>{});
    loadCounts();
    setTimeout(()=>{
      invoke("startup_scan").then(()=>loadCounts()).catch(()=>{});
    },1500);
    // Check streak on every app open (not just when game count changes)
    try{
      const today=new Date().toDateString();
      const yesterday=new Date(Date.now()-86400000).toDateString();
      const streak=JSON.parse(localStorage.getItem("rs_streak")||'{"last":"","count":0}');
      if(streak.last!==today){
        const newCount=streak.last===yesterday?streak.count+1:1;
        localStorage.setItem("rs_streak",JSON.stringify({last:today,count:newCount}));
        if(newCount>=30)setTimeout(()=>tryUnlock("streak_30"),2000);
      }
    }catch{}
  },[]);

  // Check library/playtime achievements whenever games change
  useEffect(()=>{
    const n=allGames.length;
    if(n>=5)tryUnlock("lib_5");
    if(n>=10)tryUnlock("lib_10");
    if(n>=20)tryUnlock("lib_20");
    if(n>=50)tryUnlock("lib_50");
    if(n>=100)tryUnlock("lib_100");
    if(n>=250)tryUnlock("lib_250");
    if(n>=500)tryUnlock("lib_500");
    const totalH=allGames.reduce((s,g)=>s+(g.playtime_seconds||0),0)/3600;
    if(totalH>=10)tryUnlock("play_10h");
    if(totalH>=50)tryUnlock("play_50h");
    if(totalH>=100)tryUnlock("play_100h");
    if(totalH>=250)tryUnlock("play_250h");
    if(totalH>=500)tryUnlock("play_500h");
    if(totalH>=1000)tryUnlock("play_1000h");
    // 3h single session — only fire if session was actively started and 3h has elapsed
    try{
      const ss=parseInt(localStorage.getItem("rs_session_start")||"0");
      if(ss&&(Date.now()-ss)>=10800000){
        tryUnlock("session_3h");
        localStorage.removeItem("rs_session_start"); // clear so it doesn't retrigger
      }
    }catch{}
    // 3h single session — check top game's playtime (rough proxy via total playtime change)
    const topH=Math.max(0,...allGames.map(g=>(g.playtime_seconds||0)/3600));
    if(topH>=100)tryUnlock("play_1g_100h");
    if(topH>=250)tryUnlock("play_1g_250h");
    // Fully Loaded: 15+ games on every console
    const consoleCounts={};
    allGames.forEach(g=>{consoleCounts[g.consoleId]=(consoleCounts[g.consoleId]||0)+1;});
    if(Object.keys(CONSOLES).every(cid=>(consoleCounts[cid]||0)>=15))tryUnlock("all_consoles_50");
    // Collection checks
    try{
      const colls=JSON.parse(localStorage.getItem("rs_collections")||"[]");
      if(colls.length>=5)tryUnlock("coll_5");
      const allConsoleIds=Object.keys(CONSOLES);
      const hasAll=colls.some(c=>allConsoleIds.every(cid=>c.games.some(g=>g.consoleId===cid)));
      if(hasAll)tryUnlock("coll_all_consoles");
    }catch{}
    // Completionist: all other achievements unlocked
    try{
      const ul=JSON.parse(localStorage.getItem("rs_achievements")||"{}");
      const others=ALL_ACHIEVEMENTS.filter(a=>a.id!=="all_achievements");
      if(others.every(a=>ul[a.id]))tryUnlock("all_achievements");
    }catch{}
  },[allGames.length]);

  const refreshConfig=()=>{
    invoke("get_config").then(cfg=>{
      setAppConfig(cfg);
      setGlobalCfg(cfg?.global||{});
    }).catch(()=>{});
    loadCounts();
  };

  const handleOpen=(id)=>{
    if(SUB_GROUPS[id])setPicker(SUB_GROUPS[id]);
    else{setActiveId(id);setView("library");}
  };
  const handleSubSelect=(id)=>{setPicker(null);setActiveId(id);setView("library");};

  const launchGame=async(g)=>{
    // Set session start BEFORE launching (for 3h timer)
    try{localStorage.setItem("rs_session_start",Date.now().toString());localStorage.setItem("rs_session_game",`${g.consoleId}:${g.id}`);}catch{}
    // Timing-sensitive checks BEFORE launching
    const h=new Date().getHours();
    if(h===3)tryUnlock("secret_3am");
    try{
      const openTime=parseInt(localStorage.getItem("rs_app_open_time")||"0");
      if(openTime&&Date.now()-openTime<15000)tryUnlock("secret_fast");
    }catch{}
    try{
      const duration=await invoke("launch_game",{consoleId:g.consoleId,gameId:g.id});
      window._addSession?.(g.consoleId,g.id,g.title||"Unknown",duration||0);
      // Track games played today AFTER successful session
      try{
        const today=new Date().toDateString();
        const td=JSON.parse(localStorage.getItem("rs_today_games")||"{}");
        if(td.date!==today){td.date=today;td.games=[];}
        if(!td.games.includes(`${g.consoleId}:${g.id}`))td.games.push(`${g.consoleId}:${g.id}`);
        localStorage.setItem("rs_today_games",JSON.stringify(td));
        if(td.games.length>=10)tryUnlock("play_10_oneday");
      }catch{}
    }catch{}
  };
  const handleSaveProfile=(p)=>{
    saveProfile(p);
    tryUnlock("profile");
    if(p.username==="MMAJRJRS")tryUnlock("secret_name");
    if(p.bio&&p.bio.length>100)tryUnlock("secret_bio_long");
  };
  const backFromLibrary=()=>{setView("shelf");setActiveId(null);refreshConfig();};

  const openGlobalSettings=()=>{setShowGlobalSettings(true)};
  const closeGlobalSettings=()=>setShowGlobalSettings(false);
  const openCollections=()=>{setShowCollections(true)};
  const closeCollections=()=>setShowCollections(false);
  const closePicker=()=>setPicker(null);
  const closeBooting=()=>{
    setBooting(false);
    try{localStorage.setItem("rs_app_open_time",Date.now().toString());}catch{}
  };

  // Idle detection — fire 'Why Are You Here' after 1h of no activity
  useEffect(()=>{
    let lastActivity=Date.now();
    const onActivity=()=>{lastActivity=Date.now();};
    window.addEventListener("mousemove",onActivity);
    window.addEventListener("keydown",onActivity);
    window.addEventListener("mousedown",onActivity);
    const check=setInterval(()=>{
      if(Date.now()-lastActivity>=3600000)tryUnlock("secret_idle");
    },60000);
    return()=>{
      window.removeEventListener("mousemove",onActivity);
      window.removeEventListener("keydown",onActivity);
      window.removeEventListener("mousedown",onActivity);
      clearInterval(check);
    };
  },[]);
  const closeTutorial=()=>setView("shelf");

  return(
    <>
      <G/>
      {booting&&<StartupAnimation onDone={closeBooting}/>}
      {view==="shelf"&&!showCollections&&<MainShelf onOpen={handleOpen} onGlobalSettings={openGlobalSettings} onTutorial={openTutorial} gameCounts={gameCounts} globalCfg={globalCfg} tutorialSeen={tutorialSeen} pinnedGames={pinnedGames} onLaunchPinned={launchPinned} onUnpin={unpinGame} allGames={allGames} onLaunchGame={launchGame} onOpenConsole={handleOpen} onOpenCollections={openCollections} profile={profile} onSaveProfile={handleSaveProfile} achievUnlocked={achievUnlocked} tryUnlock={tryUnlock} gameMeta={gameMeta} onSetRating={setRating} onToggleFav={toggleFav} isFav={isFav} getRating={getRating} sessionHistory={sessionHistory}/>}
      {showCollections&&<CollectionsPage allGames={allGames} onLaunchGame={launchGame} onBack={closeCollections}/>}
      {view==="library"&&activeId&&<GameLibrary consoleId={activeId} appConfig={appConfig} onBack={backFromLibrary} onConfigUpdate={refreshConfig} tryUnlock={tryUnlock} getRating={getRating} isFav={isFav} onSetRating={setRating} onToggleFav={toggleFav}/>}
      {view==="tutorial"&&<TutorialPage onClose={closeTutorial} tryUnlock={tryUnlock}/>}
      {picker&&<SubPicker options={picker.options} onSelect={handleSubSelect} onClose={closePicker}/>}
      {showGlobalSettings&&<GlobalSettings config={appConfig} onClose={closeGlobalSettings} onSaved={refreshConfig}/>}
      {pendingToast&&<AchievementToast achievement={pendingToast} onDone={()=>setPendingToast(null)}/>}
    </>
  );
}

