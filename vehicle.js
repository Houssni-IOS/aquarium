/*let v1 = p5.Vector.sub(a, pos); soit v1 = pos -> a
  let v2 = p5.Vector.sub(b, pos); soit v2 = pos -> b
  */
  function findProjection(pos, a, b) {
    let v1 = p5.Vector.sub(a, pos);
    let v2 = p5.Vector.sub(b, pos);
    v2.normalize();
    let sp = v1.dot(v2);
    v2.mult(sp);
    v2.add(pos);
    return v2;
  }
  
  class Vehicle {
    static debug = false;
  
    constructor(x, y , colorParam) {
      // position du véhicule
      this.pos = createVector(x, y);
      // vitesse du véhicule
      this.vel = createVector(0, 0);
      // accélération du véhicule
      this.acc = createVector(0, 0);
      // vitesse maximale du véhicule
      this.maxSpeed = 1;
      // force maximale appliquée au véhicule
      this.maxForce = 0.9;
      // à peu près en secondes
      this.dureeDeVie = 5;
      this.weightArrive = 0.3;
      this.weightObstacle = 0.9;
      this.r_pourDessin = 8;
      // rayon du véhicule pour l'évitement
      this.r = this.r_pourDessin * 2;
      //couleur random 
      this.color = colorParam ? colorParam : color('Black');  // Use the provided color or default to black

  
      // Pour évitement d'obstacle
      this.largeurZoneEvitementDevantVaisseau = this.r / 2;
  
      // chemin derrière vaisseaux
      this.path = [];
      this.pathMaxLength = 30;
      
    }
    wander() {
      // point devant le véhicule
      let wanderPoint = this.vel.copy();
      wanderPoint.setMag(100);
      wanderPoint.add(this.pos);
      
      // on le dessine sous la forme d'une petit cercle rouge
       //fill(255, 0, 0);
       //noStroke();
       //circle(wanderPoint.x, wanderPoint.y, 8);
  
      // Cercle autour du point
      let wanderRadius = 50;
       //noFill();
       //stroke(255);
       //circle(wanderPoint.x, wanderPoint.y, wanderRadius * 2);
  
       // on dessine une lign qui relie le vaisseau à ce point
       // c'est la ligne blanche en face du vaisseau
       //line(this.pos.x, this.pos.y, wanderPoint.x, wanderPoint.y);
  
       // On va s'occuper de calculer le point vert SUR LE CERCLE
       // il fait un angle wanderTheta avec le centre du cercle
       // l'angle final par rapport à l'axe des X c'est l'angle du vaisseau
       // + cet angle
      let theta = this.wanderTheta + this.vel.heading();
  
      let x = wanderRadius * cos(theta);
      let y = wanderRadius * sin(theta);
  
      // maintenant wanderPoint c'est un point sur le cercle
      wanderPoint.add(x, y);
  
      // on le dessine sous la forme d'un cercle vert
       //fill(0, 255, 0);
       //noStroke();
       //circle(wanderPoint.x, wanderPoint.y, 16);
  
       // on dessine le vecteur desiredSpeed qui va du vaisseau au poibnt vert
       //stroke(255);
       //line(this.pos.x, this.pos.y, wanderPoint.x, wanderPoint.y);
  
       // On a donc la vitesse désirée que l'on cherche qui est le vecteur
       // allant du vaisseau au cercle vert. On le calcule :
       // ci-dessous, steer c'est la desiredSpeed directement !
      let steer = wanderPoint.sub(this.pos);
  
      steer.setMag(this.maxForce);
      this.applyForce(steer);
  
      // On déplace le point vert sur le cerlcle (en radians)
      this.displaceRange = 0.3;
      this.wanderTheta += random(-this.displaceRange, this.displaceRange);
    }
    // on fait une méthode applyBehaviors qui applique les comportements
    // seek et avoid
    applyBehaviors(target, obstacles, vehicles) {
      let arriveForce = this.arrive(target);
      let avoidForce = this.avoidAmeliore(obstacles, vehicles, false);
      let stayWithLeaderForce = this.stayWithLeader(vehicles[0]);
    
      // Increase the weight for the stayWithLeader behavior
      stayWithLeaderForce.mult(this.weightArrive * 2); // You can adjust the multiplier as needed
    
      let avoidLeaderForce = this.avoidLeader(vehicles[0], 40);
      let separateForce = this.separateFromOthers(vehicles, 60);
    
      arriveForce.mult(this.weightArrive);
      avoidForce.mult(this.weightObstacle);
      stayWithLeaderForce.mult(this.weightArrive);
      avoidLeaderForce.mult(this.weightObstacle);
      separateForce.mult(this.weightObstacle);
    
      this.applyForce(arriveForce);
      this.applyForce(avoidForce);
      this.applyForce(stayWithLeaderForce);
      this.applyForce(avoidLeaderForce);
      this.applyForce(separateForce);
    }
    
  
    avoid(obstacles) {
      // calcul d'un vecteur ahead devant le véhicule
      // il regarde par exemple 50 frames devant lui
      let ahead = this.vel.copy();
      ahead.normalize();
      ahead.mult(100);
  
  
      // on le dessine
      this.drawVector(this.pos, ahead, "lightblue");
  
      // Detection de l'obstacle le plus proche
      let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);
  
      // On calcule la distance entre le cercle et le bout du vecteur ahead
      let pointAuBoutDeAhead = p5.Vector.add(this.pos, ahead);
      // On dessine ce point pour debugger
      fill("red");
      noStroke();
      circle(pointAuBoutDeAhead.x, pointAuBoutDeAhead.y, 10);
  
      // On dessine la zone d'évitement
      // On trace une ligne large qui va de la position du vaisseau
      // jusqu'au point au bout de ahead
      stroke(color(255, 200, 0, 90)); // gros, semi transparent
      strokeWeight(this.largeurZoneEvitementDevantVaisseau);
      line(this.pos.x, this.pos.y, pointAuBoutDeAhead.x, pointAuBoutDeAhead.y);
  
      let distance = pointAuBoutDeAhead.dist(obstacleLePlusProche.pos);
      //console.log("distance = " + distance)
  
      // si la distance est < rayon de l'obstacle
      // il y a collision possible et on dessine l'obstacle en rouge
      if (distance < obstacleLePlusProche.r + this.largeurZoneEvitementDevantVaisseau + this.r) {
        // collision possible
        obstacleLePlusProche.color = "black";
        // calcul de la force d'évitement. C'est un vecteur qui va
        // du centre de l'obstacle vers le point au bout du vecteur ahead
        let force = p5.Vector.sub(pointAuBoutDeAhead, obstacleLePlusProche.pos);
        // on le dessine pour vérifier qu'il est ok (dans le bon sens etc)
        this.drawVector(obstacleLePlusProche.pos, force, "yellow");
  
        // Dessous c'est l'ETAPE 2 : le pilotage (comment on se dirige vers la cible)
        // on limite ce vecteur à la longueur maxSpeed
        force.setMag(this.maxSpeed);
        // on calcule la force à appliquer pour atteindre la cible
        force.sub(this.vel);
        // on limite cette force à la longueur maxForce
        force.limit(this.maxForce);
        return force;
      } else {
        // pas de collision possible
        obstacleLePlusProche.color = "black";
        return createVector(0, 0);
      }
    }
  
    /* 
      Version avec deux vecteurs ahead et ahead2 (deux fois plus court) et 
      donc deux zones d'évitement. On adapte aussi en plus ces vecteurs à la vitesse du véhicule
      Plus le véhicule va vite plus il regarde loin...
    */
    avoidAmeliore(obstacles, vehicules, vehiculesAsObstacles = false) {
      // calcul d'un vecteur ahead devant le véhicule
      // il regarde par exemple 50 frames devant lui
      let ahead = this.vel.copy();
      ahead.normalize();
      ahead.mult(20 * this.vel.mag() * 0.8);
  
      // Deuxième vecteur deux fois plus petit
      let ahead2 = ahead.copy();
      ahead2.mult(0.5);
  
      // on les dessine
      if (Vehicle.debug) {
        this.drawVector(this.pos, ahead, "lightblue");
        this.drawVector(this.pos, ahead2, "red");
      }
  
      // Detection de l'obstacle le plus proche
      let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);
      let vehiculeLePlusProche = this.getVehiculeLePlusProche(vehicules);
  
      // On calcule la distance entre le cercle et le bout du vecteur ahead
      let pointAuBoutDeAhead = p5.Vector.add(this.pos, ahead);
      let pointAuBoutDeAhead2 = p5.Vector.add(this.pos, ahead2);
  
      // On dessine ce point pour debugger
      if (Vehicle.debug) {
        fill("red");
        noStroke();
        circle(pointAuBoutDeAhead.x, pointAuBoutDeAhead.y, 10);
  
        // On dessine la zone d'évitement
        // On trace une ligne large qui va de la position du vaisseau
        // jusqu'au point au bout de ahead
        stroke(color(255, 200, 0, 90)); // gros, semi transparent
        strokeWeight(this.largeurZoneEvitementDevantVaisseau);
        line(this.pos.x, this.pos.y, pointAuBoutDeAhead.x, pointAuBoutDeAhead.y);
      }
      let distance1 = pointAuBoutDeAhead.dist(obstacleLePlusProche.pos);
      let distance2 = pointAuBoutDeAhead2.dist(obstacleLePlusProche.pos);
      // on tient compte aussi de la position du vaisseau
      let distance3 = this.pos.dist(obstacleLePlusProche.pos);
      let distance4 = Infinity;
      if(vehiculeLePlusProche) {
        distance4 = this.pos.dist(vehiculeLePlusProche.pos);
      } 
  
      let plusPetiteDistance = min(distance1, distance2);
      plusPetiteDistance = min(plusPetiteDistance, distance3)
  
      // la plus petite distance est bien celle par rapport à l'obstacle
      // le plus proche
  
      // point de référence = point au bout de ahead, de ahead2 ou pos
      let pointDeReference;
      if (distance1 < distance2) {
        pointDeReference = pointAuBoutDeAhead;
      } else {
        pointDeReference = pointAuBoutDeAhead2;
      }
      if ((distance3 < distance1) && (distance3 < distance2)) {
        pointDeReference = this.pos;
      }
      // alerte rouge que si vaisseau dans obstacle
      let alerteRougeVaisseauEnCollisionAvecObstacleLePlusProche = (distance3 < obstacleLePlusProche.r);
  
      // Si le vaisseau n'est pas dans l'obstacle
      // on peut éventuellement considérer le vehicule le plus proche
      // comme l'obstacle à éviter, seulement s'il est plus proche
      // que l'obstacle le plus proche
      if(vehiculesAsObstacles) {
        if (!alerteRougeVaisseauEnCollisionAvecObstacleLePlusProche) {
          let distanceAvecVehiculeLePlusProche = distance4;
          let distanceAvecObstacleLePlusProche = distance3;
    
          if (distanceAvecVehiculeLePlusProche < distanceAvecObstacleLePlusProche) {
            obstacleLePlusProche = vehiculeLePlusProche;
            plusPetiteDistance = distanceAvecVehiculeLePlusProche;
          }
        }
      }
      
  
      // si la distance est < rayon de l'obstacle le plus proche
      // il y a collision possible et on dessine l'obstacle en rouge
      if (plusPetiteDistance < obstacleLePlusProche.r + this.largeurZoneEvitementDevantVaisseau) {
        // collision possible
        obstacleLePlusProche.color = "red";
        // calcul de la force d'évitement. C'est un vecteur qui va
        // du centre de l'obstacle vers le point au bout du vecteur ahead
        let force = p5.Vector.sub(pointDeReference, obstacleLePlusProche.pos);
  
        if (Vehicle.debug) {
          // on le dessine pour vérifier qu'il est ok (dans le bon sens etc)
          this.drawVector(obstacleLePlusProche.pos, force, "yellow");
        }
  
        // Dessous c'est l'ETAPE 2 : le pilotage (comment on se dirige vers la cible)
        // on limite ce vecteur à la longueur maxSpeed
        force.setMag(this.maxSpeed);
        // on calcule la force à appliquer pour atteindre la cible
        force.sub(this.vel);
        // on limite cette force à la longueur maxForce
        force.limit(this.maxForce);
  
        if (alerteRougeVaisseauEnCollisionAvecObstacleLePlusProche) {
          force.setMag(this.maxForce * 2);
        }
        return force;
      } else {
        // pas de collision possible
        obstacleLePlusProche.color = "black";
        return createVector(0, 0);
      }
    }
    getObstacleLePlusProche(obstacles) {
      let plusPetiteDistance = 100000000;
      let obstacleLePlusProche;
  
      obstacles.forEach(o => {
        // Je calcule la distance entre le vaisseau et l'obstacle
        const distance = this.pos.dist(o.pos);
        if (distance < plusPetiteDistance) {
          plusPetiteDistance = distance;
          obstacleLePlusProche = o;
        }
      });
  
      return obstacleLePlusProche;
    }
  
    getVehiculeLePlusProche(vehicules) {
      let plusPetiteDistance = Infinity;
      let vehiculeLePlusProche;
  
      vehicules.forEach(v => {
        if (v != this) {
          // Je calcule la distance entre le vaisseau et le vehicule
          const distance = this.pos.dist(v.pos);
          if (distance < plusPetiteDistance) {
            plusPetiteDistance = distance;
            vehiculeLePlusProche = v;
          }
        }
      });
  
      return vehiculeLePlusProche;
    }
  
  
    getClosestObstacle(pos, obstacles) {
      // on parcourt les obstacles et on renvoie celui qui est le plus près du véhicule
      let closestObstacle = null;
      let closestDistance = 1000000000;
      for (let obstacle of obstacles) {
        let distance = pos.dist(obstacle.pos);
        if (closestObstacle == null || distance < closestDistance) {
          closestObstacle = obstacle;
          closestDistance = distance;
        }
      }
      return closestObstacle;
    }
  
    arrive(target) {
      // 2nd argument true enables the arrival behavior
      return this.seek(target, true);
    }
  
    seek(target, arrival = false) {
      let force = p5.Vector.sub(target, this.pos);
      let desiredSpeed = this.maxSpeed;
      if (arrival) {
        let slowRadius = 100;
        let distance = force.mag();
        if (distance < slowRadius) {
          desiredSpeed = map(distance, 0, slowRadius, 0, this.maxSpeed);
        }
      }
      force.setMag(desiredSpeed);
      force.sub(this.vel);
      return force;
    }
  
    // inverse de seek !
    flee(target) {
      return this.seek(target).mult(-1);
    }
  
    /* Poursuite d'un point devant la target !
       cette methode renvoie la force à appliquer au véhicule
    */
       pursue(target) {
        let desired = p5.Vector.sub(target, this.pos); // Calculate the vector to the target
        desired.setMag(this.maxspeed); // Set the magnitude to the maximum speed
        let steer = p5.Vector.sub(desired, this.vel); // Calculate the steering force
        steer.limit(this.maxforce); // Limit the steering force
        return steer;
      }
  
    evade(vehicle) {
      let pursuit = this.pursue(vehicle);
      pursuit.mult(-1);
      return pursuit;
    }
  
    // applyForce est une méthode qui permet d'appliquer une force au véhicule
    // en fait on additionne le vecteurr force au vecteur accélération
    applyForce(force) {
      this.acc.add(force);
    }
  
    update() {
      // on ajoute l'accélération à la vitesse. L'accélération est un incrément de vitesse
      // (accélératiion = dérivée de la vitesse)
      this.vel.add(this.acc);
      // on contraint la vitesse à la valeur maxSpeed
      // on ajoute la vitesse à la position. La vitesse est un incrément de position, 
      // (la vitesse est la dérivée de la position)
      this.pos.add(this.vel);
  
      // on remet l'accélération à zéro
      this.acc.set(0, 0);
  
      // mise à jour du path (la trainée derrière)
      this.ajoutePosAuPath();
  
      // durée de vie
      this.dureeDeVie -= 0.01;
    }
  
    ajoutePosAuPath() {
      // on rajoute la position courante dans le tableau
      this.path.push(this.pos.copy());
  
      // si le tableau a plus de 50 éléments, on vire le plus ancien
      if (this.path.length > this.pathMaxLength) {
        this.path.shift();
      }
    }
  
    // On dessine le véhicule, le chemin etc.
    show() {
      // dessin du chemin
      // dessin du vehicule
      this.drawVehicle();
    }
  
    drawVehicle() {
      // formes fil de fer en blanc
      stroke('Black');
      // épaisseur du trait = 2
      strokeWeight(2);
    
      // formes pleines
      fill(this.color);
    
      // sauvegarde du contexte graphique (couleur pleine, fil de fer, épaisseur du trait, 
      // position et rotation du repère de référence)
      push();
      // on déplace le repère de référence.
      translate(this.pos.x, this.pos.y);
      // et on le tourne. heading() renvoie l'angle du vecteur vitesse (c'est l'angle du véhicule)
      rotate(this.vel.heading());
    
      // Dessin d'un petit pilchard
      beginShape();
      vertex(0, 0); // tête du pilchard
      bezierVertex(10, -5, 12, 0, 10, 5); // première nageoire
      bezierVertex(0, 8, -10, 5, -10, 0); // queue
      bezierVertex(-10, -5, 0, -8, 10, -5); // deuxième nageoire
      endShape(CLOSE);
    
      // draw velocity vector
      pop();
      this.drawVector(this.pos, this.vel, color(0, 0, 0));
    
      // Cercle pour évitement entre vehicules et obstacles
      if(Vehicle.debug) {
        stroke(0);
        noFill();
        circle(this.pos.x, this.pos.y, this.r);
      }
    }
  
   
    drawVector(pos, v, color) {
      push();
      // Dessin du vecteur vitesse
      // Il part du centre du véhicule et va dans la direction du vecteur vitesse
      strokeWeight(3);
      stroke(color);
      line(pos.x, pos.y, pos.x + v.x, pos.y + v.y);
      // dessine une petite fleche au bout du vecteur vitesse
      let arrowSize = 5;
      translate(pos.x + v.x, pos.y + v.y);
      rotate(v.heading());
      translate(-arrowSize / 2, 0);
      triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
      pop();
    }
  
    // que fait cette méthode ?
    edges() {
      if (this.pos.x > width + this.r) {
        this.pos.x = -this.r;
      } else if (this.pos.x < -this.r) {
        this.pos.x = width + this.r;
      }
      if (this.pos.y > height + this.r) {
        this.pos.y = -this.r;
      } else if (this.pos.y < -this.r) {
        this.pos.y = height + this.r;
      }
    }
    stayWithLeader(leader) {
      // Calculate the desired position behind the leader
      let desired = p5.Vector.sub(leader.pos, this.pos);
      desired.setMag(this.maxSpeed*25);
      let behindLeader = p5.Vector.add(leader.pos, p5.Vector.mult(desired, -10)); // Adjust the distance
    
      // Calculate the force to reach the desired position
      let force = p5.Vector.sub(behindLeader, this.pos);
      force.limit(this.maxForce);
      return force;
    }
    
    avoidLeader(leader, avoidanceRadius) {
      let distance = p5.Vector.dist(this.pos, leader.pos);
      if (distance < avoidanceRadius) {
        let desired = p5.Vector.sub(this.pos, leader.pos);
        desired.setMag(this.maxSpeed);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
      } else {
        return createVector(0, 0);
      }
    }

    separateFromOthers(vehicles, separationRadius) {
      let sum = createVector();
      let count = 0;
      for (let other of vehicles) {
        if (other !== this) {
          let distance = p5.Vector.dist(this.pos, other.pos);
          if (distance < separationRadius) {
            let diff = p5.Vector.sub(this.pos, other.pos);
            diff.normalize();
            diff.div(distance);
            sum.add(diff);
            count++;
          }
        }
      }
      if (count > 0) {
        sum.div(count);
        sum.setMag(this.maxSpeed);
        let steer = p5.Vector.sub(sum, this.vel);
        steer.limit(this.maxForce);
        return steer;
      } else {
        return createVector(0, 0);
      }
    }
  }