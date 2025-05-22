let fontSize = 10;
let video, breatheSound;
let particles = [];
let chars = "silence.-·^";
let centerX, centerY;
let mouseSpeed = 0, lastMouse;
let explodeTimer = -10000, exploding = false;
let silenceAlpha = 255, fadeDirection = 0;

function preload() {
  video = createVideo("heart.mp4");  // load video
  video.hide();                      // hide video display
  breatheSound = loadSound("breathe.mp3");  // load sound
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Helvetica");            // use a modern clean font
  textSize(fontSize);
  textAlign(CENTER, CENTER);
  
  video.size(160, 90);              // resize video for faster use
  video.loop(); video.volume(1);
  pixelDensity(1); frameRate(24);
  
  centerX = width / 2;              // set screen center
  centerY = height / 2;
  lastMouse = createVector(mouseX, mouseY); // track mouse
}

function draw() {
  background(0);
  updateMouseSpeed();               // get how fast mouse is moving
  video.loadPixels();               // update video pixels

  let cols = floor(width / fontSize);
  let rows = floor(height / fontSize);
  let w = video.width, h = video.height;
  let ratio = w / h, scale = 0.4;

  // position video display area on screen
  let dispW = min(width, height * ratio) * scale;
  let dispH = dispW / ratio;
  let offsetX = centerX - dispW / 2 - 250;
  let offsetY = centerY - dispH / 2 - 250;

  // create breathing (pulse) effect based on mouse speed
  let pulse = 1 + 0.06 * sin(frameCount * map(mouseSpeed, 0, 20, 0.07, 0.3, true));
  let newParticles = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // map screen (x,y) to video pixel (i)
      let i = (floor(map(x, 0, cols, 0, w)) + floor(map(y, 0, rows, 0, h)) * w) * 4;
      let r = video.pixels[i];
      if (r === undefined) continue;

      // choose character based on brightness
      let char = chars.charAt(floor(map(r, 0, 255, chars.length - 1, 0)));
      let px = x * fontSize + offsetX;
      let py = y * fontSize + offsetY;

      // reuse or create particle at position
      let p = particles.find(p => p.homeX === px && p.homeY === py) || new Particle(px, py, char);
      p.char = char;
      p.scaleFactor = pulse;
      newParticles.push(p);
    }
  }

  particles = newParticles;
  particles.forEach(p => {
    p.update();      // update position
    p.display();     // draw character
  });

  // control fade in/out for “SILENCE” text
  let time = millis() - explodeTimer;
  if (time > 5000) fadeDirection = 1;
  else if (time >= 1000 && time <= 1200) fadeDirection = -1;

  if (fadeDirection === 1) silenceAlpha = min(255, silenceAlpha + 5);
  else if (fadeDirection === -1) silenceAlpha = max(0, silenceAlpha - 5);

  // draw breathing "SILENCE" text on right
  if (silenceAlpha > 0) {
    let scale = 1 + 0.15 * sin(frameCount * map(mouseSpeed, 0, 20, 0.05, 0.3, true));
    let alpha = 100 + 155 * abs(sin(frameCount * 0.1));

    push();
    textSize(fontSize * 9 * scale); // breathing size
    fill(255, silenceAlpha * (alpha / 255)); // breathing alpha
    let baseX = width - 60;
    let baseY = height / 2 - 240;

    // print letters vertically
    "SILENCE".split("").forEach((c, i) => text(c, baseX, baseY + i * fontSize * 8.5));
    pop();
  }

  // if in explosion state, bring particles back
  if (exploding && time > 1000) {
    particles.forEach(p => p.startReturn());
    exploding = false;
  }
}

function mousePressed() {
  // apply velocity to each particle (explosion)
  particles.forEach(p => {
    let d = dist(mouseX, mouseY, p.x, p.y);
    let s = map(d, 0, 50, 1, 0, true);
    let a = atan2(p.y - mouseY, p.x - mouseX);
    p.vx = cos(a) * s * random(10, 30);
    p.vy = sin(a) * s * random(10, 30);
    p.exploding = true;
  });

  explodeTimer = millis();     // record time of explosion
  exploding = true;

  if (breatheSound.isLoaded()) breatheSound.play();  // play breathing sound
}

function updateMouseSpeed() {
  // measure how fast mouse is moving
  let now = createVector(mouseX, mouseY);
  mouseSpeed = p5.Vector.dist(now, lastMouse);
  lastMouse = now;
  video.speed(constrain(1 + mouseSpeed * 0.1, 1, 4)); // control video speed
}

class Particle {
  constructor(x, y, char) {
    this.homeX = this.x = x;
    this.homeY = this.y = y;
    this.char = char;
    this.vx = this.vy = 0;
    this.exploding = false;
    this.scaleFactor = 1;
  }

  update() {
    if (this.exploding) {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.98; this.vy *= 0.98;
    } else {
      // move back to home position smoothly
      this.x = lerp(this.x, this.homeX, 0.08);
      this.y = lerp(this.y, this.homeY, 0.08);
    }
  }

  display() {
    push();
    translate(this.x, this.y);
    scale(this.scaleFactor);
    fill(0, 150, 255);
    text(this.char, 0, 0);
    pop();
  }

  startReturn() { this.exploding = false; }
}