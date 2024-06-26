const carCanvas: HTMLCanvasElement = document.getElementById("carcanvas") as HTMLCanvasElement;
if(!carCanvas){
    throw new Error("No canvas found");
}

carCanvas.width = 200;
const networkCanvas: HTMLCanvasElement = document.getElementById("networkcanvas") as HTMLCanvasElement;
networkCanvas.width = 300;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

const road: Road = new Road(carCanvas.width/2,carCanvas.width * 0.9);

//const N = 500;
const N = 1;
const cars = generateCars(N);
const laneDev = 10;
const networkDev = 0.1;
const regenDev = 0.4;
let purged = 0;
let bestCar = cars[0];
if(localStorage.getItem("bestBrain")){
    for(let i = 0; i < cars.length;i++){
        const bestBrain: string|null = localStorage.getItem("bestBrain");
        if(bestBrain != null){
            cars[i].brain = JSON.parse(bestBrain);
        }
        if(i != 0 && cars[i].brain != null){
            NeuralNetwork.mutate(cars[i].brain, networkDev);
        }
    }
}


const traffic: Car[] = []

function updateTraffic(){
    bestCar = getBestCar();
    for(let i = 0; i < traffic.length;i++){
        if(traffic[i].y - bestCar.y > carCanvas.height/2){
            traffic.splice(i,1);
        }
    }
    const maxTraffic = 8;
    for(let i = traffic.length; i < maxTraffic;i++){
        const lane = road.getLaneCenter(Math.floor(Math.random()*3));
        const y = bestCar.y - carCanvas.height/2 - Math.random() * 1000 - 100;
        const width = 30;
        const height = 50;
        traffic.push(new Car([lane, y, width, height], "DUMMY", Math.random() * 2 + 1))
    }
}

animate(0);

function save(){
    localStorage.setItem("bestBrain",
    JSON.stringify(bestCar.brain));
}

function discard(){
    localStorage.removeItem("bestBrain")
}

function generateCars(N: number): Car[] {
    const cars = [];
    for(let i = 0;i<=N;i++){
        cars.push(new Car([road.getLaneCenter(1),100,30,50],"AI"))
    }
    return cars
}
function purge(bestCar: Car){
    // clean up the cars
    const purgeDist: number = 300
    for(let i = 0; i < cars.length;i++){
        if(cars[i].y - bestCar.y > purgeDist){
            cars[i].damage = true;
        }
    }
    for(let i = 0; i < cars.length; i++){
        if(cars[i].damage === true){
            purged++;
            cars.splice(i,1);
            i--;
        }
    }
}

function getBestCar(): Car{
    let bestCarOrNull = cars.find(
        c=>c.calculateScore() == Math.min(
            ...cars.map(c=>c.calculateScore())
        ));
    if(bestCarOrNull){
        bestCar = bestCarOrNull;
    }
    return bestCar;
}

function getFastestCar(): Car{
    let fastestCarOrNull = cars.find(
        c=>c.speed == Math.max(
            ...cars.map(c=>c.speed)
        ));
    if(fastestCarOrNull){
        bestCar = fastestCarOrNull;
    }
    return bestCar;
}

function getFarthestCar(): Car{
    let farthestCarOrNull = cars.find(
        c=>c.y == Math.min(
            ...cars.map(c=>c.y)
        ));
    if(farthestCarOrNull){
        bestCar = farthestCarOrNull;
    }
    return bestCar;
}

function getWorstCar(): Car{
    let worstCarOrNull = cars.find(
        c=>c.calculateScore() == Math.max(
            ...cars.map(c=>c.calculateScore())
        ));
    if(worstCarOrNull){
        bestCar = worstCarOrNull;
    }
    return bestCar;
}

function rewardCars(){
    //bestCar = getBestCar();
    //let fastestCat = getFastestCar();
    //let farthestCar = getFarthestCar();
    //bestCar.bonusPoints += 1;
    //fastestCat.bonusPoints += 1;
    //farthestCar.bonusPoints += 1;

    //for(let i = 0; i < cars.length;i++){
    //    cars[i].bonusPoints += 1;
    //}

    //console.log("best car", bestCar.bonusPoints)
    //console.log("fastest car", fastestCat.bonusPoints)
    //console.log("farthest car", farthestCar.bonusPoints)

    //console.log("best car rewarded")
    
    //for(let i = 0; i < cars.length;i++){
    //    cars[i].bonusPoints += 2;
    //    if(cars[i].speed < 2*(cars[i].maxSpeed) / 3){
    //        cars[i].bonusPoints -= 10;
    //    }
    //    
    //}

    //for(let i = 0; i < cars.length;i++){
    //    road.laneLocations.forEach((laneLocation)=>{
    //        if(cars[i].x < laneLocation + laneDev || cars[i].x > laneLocation - laneDev){
    //            cars[i].bonusPoints += 1;
    //            console.log("lane point rewarded")
    //        }
    //    })
    //}
}

function punishCars(){
    //getWorstCar().damage = true;
    
}

function regenerateCars(){
    bestCar = getBestCar();
    for(let i = cars.length; i < N;i++){
        cars.push(new Car([bestCar.x, bestCar.y+12, 30, 50],"AI"))
        if(bestCar.brain === null){
            console.log("too lazy to do right")
            return;
        }
        //cars[i].brain = bestCar.brain.copy();
        NeuralNetwork.mutate(cars[i].brain, regenDev);
        cars[i].speed = bestCar.speed;
    }
}

function rebase(){
    for(let i = 0; i < cars.length;i++){
        NeuralNetwork.mutate(cars[i].brain, networkDev);
    }
}

function animate(time: number): void{
    purge(getBestCar());
    updateTraffic();
    regenerateCars();
    rewardCars();
    if(purged % 200 == 0){
        regenerateCars()
        console.log("saved")
        save();
    }
    for(let i = 0; i < traffic.length;i++){
        traffic[i].update(road.borders,[]);
    }
    for(let i = 0;i < cars.length;i++){
        cars[i].update(road.borders,traffic);
    }

    bestCar = getBestCar();

    networkCanvas.height = window.innerHeight;
    carCanvas.height = window.innerHeight;

    if(carCtx == null || networkCtx == null){
        throw new Error("No context found");
    }
    carCtx.save();
    carCtx.translate(0, -bestCar.y + carCanvas.height * 0.5)

    road.draw(carCtx);
    for(let i = 0;i < traffic.length;i++){
        traffic[i].draw(carCtx, "red");
    }
    carCtx.globalAlpha = 0.2;
    for(let i = 0; i < cars.length;i++){
        cars[i].draw(carCtx, "blue");
    }
    carCtx.globalAlpha = 1;
    bestCar.draw(carCtx,"blue",true)

    networkCtx.lineDashOffset = -time/50
    // Visualizer.drawNetwork(networkCtx,bestCar.brain);
    carCtx.restore();
    requestAnimationFrame(animate);
}