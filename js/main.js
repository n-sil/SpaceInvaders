(function() {
// ==== GLOBAL VARIABLES ====  

var gameLives = 3,
    gameScore = 0,
    startLevel = 1,

    invaders = [],
    bombs = [],
    missiles = [],
    explosions = [],
    
    fireCooldown = false,
    lastLaunchTime = null, 
    lastBombTime = null,
    lastHitTime = null,
    
    invaderSpeed = 2,
    defenderSpeed = 3;
   
function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    this.play = function(){
        this.sound.play();
    }
    this.stop = function(){
        this.sound.pause();
    }
}

var currentMusic = new sound("sound/mainmenu.mp3");

// ==== START ====


    
// ==== INITIALIZE GAME LEVEL ====  

function startGame(state){

  gameCanvas.start(state);
  
  // == Define starting menu state ==
  if (state == 'welcomeState') {
    titleUI = new Component("120px", "DaiAtlas", "white", gameCanvas.canvas.width/2, gameCanvas.canvas.height/2, "text");  
    pressToBeginUI = new Component("42px", "DaiAtlas", "white", gameCanvas.canvas.width/2, gameCanvas.canvas.height/2+65, "text");
    
    defenderShip = new Unit(102, 170, "img/defender_big.png", 0, gameCanvas.canvas.height/2 - 350, "image");
    alienShip = new Unit(232, 182, "img/invader_big.png", gameCanvas.canvas.width, gameCanvas.canvas.height/2 + 150, "image");
    
    currentMusic.stop();
    currentMusic = new sound("sound/mainmenu.mp3");
    currentMusic.play();
    
  // == Define in-game state ==
  } else if (state == 'playState') {
    // create UI
    currentLevelUI = new Component("22px", "DaiAtlas", "white", gameCanvas.canvas.width - 100, 40, "text");  
    currentScoreUI = new Component("22px", "DaiAtlas", "white", gameCanvas.canvas.width - 100, 65, "text");
    currentLivesUI = new Component("22px", "DaiAtlas", "white", gameCanvas.canvas.width - 100, 90, "text");  
      
    // create defender ship
    defenseShip = new Unit(60, 36, "img/defender_ship.png", gameCanvas.canvas.width/2-15, gameCanvas.canvas.height - 130, "image");

    // create enemy squadron
    for (var j=0; j < 11; j++) {  
      for (var i=0; i < 3; i++) {
        invaders.push(new Unit(60, 60, "img/invader_attk.png", 30+70*j, 30+70*i, "image"));
      }
      for (var i=3; i < 6; i++) {
        invaders.push(new Unit(40, 60, "img/invader_scout.png", 30+72*j, 30+70*i, "image"));
      }
    }
    changeVector('right');
    currentMusic.stop();
    currentMusic = new sound("sound/mainmenu.mp3");
    currentMusic.play();
    
  // == Define game over state ==
  } else if (state == 'endState') {
    gameOverUI = new Component("120px", "DaiAtlas", "red", gameCanvas.canvas.width/2, gameCanvas.canvas.height/2, "text");  
    clickToContUI = new Component("42px", "DaiAtlas", "red", gameCanvas.canvas.width/2, gameCanvas.canvas.height/2+65, "text");
    scoreUI = new Component("42px", "DaiAtlas", "red", gameCanvas.canvas.width/2, gameCanvas.canvas.height/2+165, "text");
    alienShips = [];
    
    for (var j=0; j < 4; j++) {  
      for (var i=0; i < 3; i++) {
        alienShips.push(new Unit(232, 182, "img/invader_big.png", gameCanvas.canvas.width+300*j, 250*i, "image"));
      }
    }
    currentMusic.stop();
    currentMusic = new sound("sound/gameover.mp3");
    currentMusic.play();
  }  
}

// ==== CANVAS ====  

var gameCanvas = {
  canvas : document.createElement("canvas"), 
  
  // Initilization method
  start : function(state) {
    this.canvas.width = 1024;
    this.canvas.height = 768;
    this.context = this.canvas.getContext("2d");
    this.keys = [];
    document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    
    
    // in-game refresh interval
    if (state == 'welcomeState') {
      this.interval = setInterval(updateMenu, 16); 
    } else if (state == 'playState') {
      this.interval = setInterval(updateGameArea, 16); 
    } else if (state == 'endState') {
      this.interval = setInterval(updateGameOver, 16); 
    }                          
    
    //listen to key press events    
    window.addEventListener('keydown', function (e) {
      gameCanvas.keys = (gameCanvas.keys || []);
      gameCanvas.keys[e.keyCode] = (e.type == "keydown");
    })
    window.addEventListener('keyup', function (e) {
      gameCanvas.keys[e.keyCode] = (e.type == "keydown");            
    })
  },
  
  // Clear canvas method
  clear : function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },
  
  // Game Over method: stopping refresh interval
  stop : function() {
    clearInterval(this.interval);
  }
}

// ==== CLASSES ====  
// General class of in-game object

function Component(width, height, color, x, y, type) {
  this.type = type;
  if (type == "image") {
    this.image = new Image();
    this.image.src = color;
  }  
  this.width = width;
  this.height = height;  
  this.x = x;
  this.y = y;
  this.update = function() {
    ctx = gameCanvas.context;
    if (this.type == "text") {
      ctx.font = this.width + " " + this.height;
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.fillText(this.text, this.x, this.y);
    } else if (type == "image") {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }  
}

// Movable unit class (ship or rocket)

function Unit(width, height, color, x, y, type){
  Component.apply(this, arguments);  
  this.speedX = 0;
  this.speedY = 0;  
  this.newPos = function() {
    this.x += this.speedX;
    this.y += this.speedY;        
  }    
}

function timedUnit(width, height, color, x, y, type, created, lifespan){
  Unit.apply(this, arguments);
  
  this.created = created;
  this.lifespan = lifespan;
}


// ==== MENU LOOP ====

function updateMenu() { 
gameCanvas.clear(); 
// == ui ==
  titleUI.text="SPACE INVADERS";
  pressToBeginUI.text="press space to begin";
  defenderShip.speedX = 2;
  alienShip.speedX = -2;
  
  titleUI.update();
  pressToBeginUI.update();    
  defenderShip.newPos();
  alienShip.newPos();
  defenderShip.update();
  alienShip.update();
  
  
  if (defenderShip.x > gameCanvas.canvas.width) {
    defenderShip.x = 0;
  }
  
  if (alienShip.x < -200) {
    alienShip.x = gameCanvas.canvas.width;
  }
  
  if (gameCanvas.keys && gameCanvas.keys[32]) {
    gameCanvas.stop();
    gameLives = 3;
    startLevel = 1;
    gameScore = 0;    
    startGame('playState');
  }
  
}

// ==== GAME OVER LOOP ====

function updateGameOver() { 

gameCanvas.clear(); 
// == ui ==
  gameOverUI.text="GAME OVER";
  scoreUI.text="your score: " + gameScore;
  clickToContUI.text="press space to continue";
  
  for (var i=0; i<alienShips.length; i++) {
    alienShips[i].speedX = -2;
    alienShips[i].newPos();
    alienShips[i].update();
  } 
  if (alienShips[alienShips.length-1].x < -300) {
    for (var i=0; i<alienShips.length; i++) {
      alienShips[i].x += gameCanvas.canvas.width + 1200;
    }
  }  
  
  scoreUI.update(); 
  clickToContUI.update(); 
  gameOverUI.update();
  
  if (gameCanvas.keys && gameCanvas.keys[32]) {
    gameCanvas.stop();
    startGame('welcomeState');    
  }
}

// ==== GAME LOOP ====  

function updateGameArea() {
  gameCanvas.clear(); 
    
// == ship ==  
  defenseShip.speedX = 0;
  defenseShip.speedY = 0;          
  
  // move ship left
  if (gameCanvas.keys && gameCanvas.keys[37]) {
    if (defenseShip.x > 10) {
    defenseShip.speedX = -defenderSpeed;
    } else {
      defenseShip.speedX = 0;
    }
  }  
  // move ship right
  if (gameCanvas.keys && gameCanvas.keys[39]) {
    if (defenseShip.x < gameCanvas.canvas.width - 40) {
    defenseShip.speedX = defenderSpeed;
    } else {
      defenseShip.speedX = 0;
    }
  }

  // refresh ship position
  defenseShip.newPos();
  defenseShip.update();
  
  if ((lastLaunchTime === null) || ((new Date()).valueOf() - lastLaunchTime) > (1000 / defenderSpeed*2)) { fireCooldown = false; }
  
  // launch missile
  if (gameCanvas.keys && gameCanvas.keys[32]) {
    fireWeapon(defenseShip);
  }
   
  
// == invaders ==
  // Move invaders
  
    // Check collisions with invaders 
  for (var i=0; i<invaders.length; i++) {  
    if (getCollision(invaders[i],defenseShip)) {
      invaders.splice(i--, 1);
      makeExplosion(defenseShip);
      makeExplosion(invaders[i]);
      killDefender();
    } else if (invaders[i].y >= defenseShip.y-defenseShip.height) {
      gameLives = 0;
    }  
    // Move invaders
    invaders[i].newPos();
    invaders[i].update();
  }

  if ((invaders.length > 0) && (invaders[invaders.length-1].x > gameCanvas.canvas.width - 40)) { 
    shiftInvaders();
    changeVector('left');
  } else if ((invaders.length > 0) && (invaders[0].x < 10)) {
    shiftInvaders();
    changeVector('right');
  }

  // drop photon bomb
  if ((lastBombTime === null) || ((new Date()).valueOf() - lastBombTime) > (2000 / invaderSpeed)) { 
    dropBomb(invaders[Math.floor(Math.random() * invaders.length)]);
  }
  
// == ordinance ==  
  
  // Move rockets and check their hits
  if (missiles.length > 0) {
    for (var i=0; i<missiles.length; i++) {
      missiles[i].speedY = -defenderSpeed*2;
      missiles[i].newPos();
      missiles[i].update();    
      if (missiles[i].y < 0) {
        missiles.splice(i--, 1);
      }
    }
    
    for (var i=0; i<invaders.length; i++) {
      for (var j=0; j<missiles.length; j++) {
        if((missiles[j] && invaders[i])) {
          if (getCollision(missiles[j],invaders[i])) { 
          makeExplosion(invaders[i]);          
          invaders.splice(i--, 1);
          missiles.splice(j--, 1);
          gameScore += 1;
          }
        } 
      }
    }
  } 
  
  // Move bombs and check their hits
  if (bombs.length > 0) {
    for (var i=0; i<bombs.length; i++) {
      var bomb = bombs[i]
      bomb.speedY = invaderSpeed*2;
      bomb.newPos();
      bomb.update();    
      if (bomb.y > gameCanvas.canvas.height) {
        bombs.splice(i--, 1);
      }
    }
    
    for (var i=0; i<bombs.length; i++) {
      var bomb = bombs[i]
      if(bomb) {
        if (getCollision(bomb,defenseShip)) {
          bombs.splice(j--, 1);
          if ((lastHitTime === null) || ((new Date()).valueOf() - lastHitTime) > (500)) {
            makeExplosion(defenseShip);
            killDefender();
          }
        }
      }
    }
  }
  
// == explosions ==

  for (var i=0; i<explosions.length; i++) {
    if (((new Date()).valueOf() - explosions[i].created) > explosions[i].lifespan) {
      explosions.splice(i--,1);
    } else {
      explosions[i].newPos();
      explosions[i].update();
    }
  }

// == ui ==
  currentLevelUI.text="LEVEL: " + startLevel;
  currentScoreUI.text="SCORE: " + gameScore;
  currentLivesUI.text="LIVES: " + gameLives;
  
  currentLevelUI.update();
  currentScoreUI.update();
  currentLivesUI.update();
  
// == endgame condition == 
  
  if (invaders.length < 1) {
    gameCanvas.stop();
    gameLives += 1;
    startLevel += 1;
    invaderSpeed = 2+0.25*startLevel,
    defenderSpeed = invaderSpeed*1.5,
    
    bombs = [];
    missiles = [];
    
    startGame('playState');
  }
  
  if (gameLives <= 0) {
    invaders = [];
    gameCanvas.stop();
    startGame('endState');
  }
    
}


// ==== ACTION FUNCTIONS ====

function fireWeapon(attacker) {  
  if (fireCooldown == false) {
    missiles.push(new Unit(10, 20, "img/defender_rocket.png", attacker.x + attacker.width/2-5 , attacker.y, "image"));
    fireCooldown = true;
    lastLaunchTime = (new Date()).valueOf();
    missileSfx = new sound("sound/missile_launch.mp3");
    missileSfx.play();
    delete missileSfx;
  }
}

function dropBomb(attacker) {
  bombs.push(new Unit(20, 20, "img/invader_bomb.png", attacker.x + attacker.width/2-5 , attacker.y + attacker.height, "image"));
  lastBombTime = (new Date()).valueOf();
  bombSfx = new sound("sound/photon_bomb.mp3"),
  bombSfx.play();
  delete bombSfx;
}

function getCollision(attacker, defender) {
  if (
  (defender.x) < (attacker.x + attacker.width) &&
  (defender.x + defender.width) > (attacker.x) &&
  (defender.y) < (attacker.y + attacker.height) &&
  (defender.y + defender.height) > (attacker.y)
  )  
  {return 1;} else {return 0;}
  
}

function changeVector(vector) {
  for (var i=0; i<invaders.length; i++) {
    if (vector == 'right') {
      invaders[i].speedX = invaderSpeed;
      invaders[i].speedY = 0;
    } else if (vector == 'left') {
      invaders[i].speedX = -invaderSpeed;
      invaders[i].speedY = 0;
    } else {
      invaders[i].speedX = 0;
      invaders[i].speedY = 0;
    }
  }
}

function shiftInvaders() {
  for (var i=0; i<invaders.length; i++) {
    invaders[i].y += 10;
  }
}

function killDefender() {
  gameLives -= 1;
  lastHitTime = (new Date()).valueOf();
}


function makeExplosion(ship) {
  explosions.push(new timedUnit(ship.width*2, ship.width*2, "img/explosion.png", ship.x-ship.width/2, ship.y-ship.width/2, "image", (new Date()).valueOf(), 200));
  explosionSfx = new sound("sound/explosion.mp3"),
  explosionSfx.play();
  delete explosionSfx;
}

startGame('welcomeState');

}());




