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

const N = 2000;
const cars = generateCars(N);
let bestCar = cars[0];
if(localStorage.getItem("bestBrain")){
    for(let i = 0; i < cars.length;i++){
        const bestBrain: string|null = localStorage.getItem("bestBrain");
        if(bestBrain != null){
            cars[i].brain = JSON.parse(bestBrain);
        }
        if(i != 0 && cars[i].brain != null){
            NeuralNetwork.mutate(cars[i].brain, 0.1);
        }
    }
}


const traffic = [
    new Car(road.getLaneCenter(1),-100,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(0),-300,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(2),-300,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(0),-500,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(1),-500,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(2),-700,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(1),-900,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(2),-1100,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(0),-1100,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(2),-1300,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(1),-1300,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(0),-1500,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(0),-1700,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(1),-1900,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(2),-2100,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(0),-2100,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(1),-2300,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(2),-2300,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(2),-2500,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(2),-2700,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(0),-2700,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(0),-2800,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(2),-2800,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(2),-3000,30,50,"DUMMY",2),

    new Car(road.getLaneCenter(0),-3300,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(1),-3300,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(1),-3600,30,50,"DUMMY",2),
    new Car(road.getLaneCenter(2),-3600,30,50,"DUMMY",2),


];

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
        cars.push(new Car(road.getLaneCenter(1),100,30,50,"AI"))
    }
    return cars
}
function animate(time: number): void{
    for(let i = 0; i < cars.length;i++){
        if(cars[i].damage === true){
            cars.splice(i, 1);
        }
    }
    for(let i = 0; i < traffic.length;i++){
        traffic[i].update(road.borders,[]);
    }
    for(let i = 0;i < cars.length;i++){
        cars[i].update(road.borders,traffic);
    }
    let bestCarOrNull = cars.find(
        c=>c.y == Math.min(
            ...cars.map(c=>c.y)
        ));
    if(bestCarOrNull){
        bestCar = bestCarOrNull;
    }

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