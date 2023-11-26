
let leaderFollowingMode = "queueLeuLeu"; // Default is queueLeuLeu
let leader;
let separationSlider;
let target;
let obstacles = [];
let vehicles = [];

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Create a leader
  leader = new Vehicle(width / 2, height / 2 ,color('white'));
  vehicles.push(leader);
  leader.maxSpeed = 5;
  leader.maxfore=4;
  obstacle = new Obstacle(width/2, height/2, 100);
  obstacles.push(obstacle);
}

function draw() {
  background(32,42,68);

  // Draw leader glow
 
  // Set the target for the leader
  if (leaderFollowingMode === "queueLeuLeu") {
    leader.target = createVector(mouseX, mouseY); // Leader follows the mouse
  } else {
    leader.target = createVector(mouseX, mouseY); // All vehicles follow the same point
  }

  // Draw the target
  fill(0,0,255);
  noStroke();
  circle(leader.target.x, leader.target.y, 32);

  // Draw the separation zone for the leader
  if (leaderFollowingMode === "Troupeau") {
    let leaderAhead = leader.vel.copy();
    leaderAhead.setMag(40);
    leaderAhead.add(leader.pos);

   
  }

  // Draw the obstacles
  obstacles.forEach(o => {
    o.show();
  });

 

  // Update and draw the vehicles
  for (let i = vehicles.length - 1; i >= 0; i--) {
    let targetPosition;
    if (leaderFollowingMode === "queueLeuLeu") {
      if (i === 0) {
        targetPosition = createVector(mouseX, mouseY); // First vehicle follows the mouse
      } else {
        targetPosition = vehicles[i - 1].pos.copy().sub(
          vehicles[i - 1].vel.copy().normalize().mult(30)
        );
      }
    } else {
      targetPosition = leader.target.copy(); // All vehicles follow the leader's target
    }

    if (i === 0) {
      vehicles[i].applyBehaviors(targetPosition, obstacles, vehicles);
    } else {
      let leaderAhead = leader.vel.copy();
      leaderAhead.setMag(40);
      leaderAhead.add(leader.pos);

      let evadePoint = findProjection(leaderAhead, leader.pos, targetPosition);

      if (leaderFollowingMode === "Troupeau") {
        // Draw the evade zone for each following vehicle
      }

      let distanceToEvadePoint = vehicles[i].pos.dist(evadePoint);
      if (distanceToEvadePoint < 40) {
        let evadeForce = vehicles[i].evade(leaderAhead);
        vehicles[i].applyForce(evadeForce);
      } else {
        vehicles[i].weightEvade = 0;
      }

      vehicles[i].applyBehaviors(targetPosition, obstacles, vehicles);
    }

    vehicles[i].update();
    vehicles[i].show();
  }
}

function keyPressed() {
  if (key == "v") {
    // Create a new vehicle on 'v' key press
    vehicles.push(new Vehicle(random(width), random(height)));
    for (let vehicle of vehicles) {
      vehicle.maxSpeed = 2.5;
      vehicle.maxfore=3;
      
    }
    leader.maxSpeed = 5;
    leader.maxfore=4;
  } else if (key == "f") {
    // Toggle between leaderFollowingModes on 'f' key press
    if (leaderFollowingMode === "queueLeuLeu") {
      leaderFollowingMode = "Troupeau";
    } else {
      leaderFollowingMode = "queueLeuLeu";
    }
    console.log("Leader Following Mode: " + leaderFollowingMode);
  }
}


function mousePressed() {
  obstacle = new Obstacle(mouseX, mouseY, random(5, 60));
  print("00")
  obstacles.push(obstacle);
}
