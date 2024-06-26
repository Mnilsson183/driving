const Y_DISTANCE_COEFICENT: number = 1;
const BONUS_POINTS_COEFICENT: number = 1;




class Car{
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    acceleration: number;
    maxSpeed: number;
    friction: number;
    angle: number;
    damage: boolean;
    sensor: Sensor | null;
    brain: NeuralNetwork | null;
    controls: Controls;
    useBrain: boolean;
    polygon: any;
    bonusPoints: number = 0;

    constructor([x, y, width, height]: number[], controlType: string, maxSpeed = 3)
    {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.speed = 0;
        this.acceleration = 0.1;
        this.maxSpeed = maxSpeed;
        this.friction = 0.05;
        this.angle = 0;
        this.damage = false;

        this.useBrain = (controlType == "AI");


        if(controlType != "DUMMY"){
            this.sensor = new Sensor(this);
            const levelNumber = Math.floor(Math.random() * road.laneCount);
            const layout = [this.sensor.rayCount];
            for(let i = 0; i < levelNumber;i++){
                layout.push(Math.floor(Math.random() * 6) + 2);
            }
            layout.push(4);
            this.brain = new NeuralNetwork(layout);
        } else {
            this.sensor = null;
            this.brain = null;
        }
        this.controls = new Controls(controlType);
    }

    update(roadBorders: any, traffic: Car[]){
        if(!this.damage){
            this.#move();
            this.polygon = this.#createPolygon();
            this.damage = this.#assessDamage(roadBorders, traffic);
        }
        if(this.sensor && this.brain){
            this.sensor.update(roadBorders,traffic);
            const offsets = this.sensor.readings.map(
                s=> s == null ? 0 : 1 - s.offset
            );
            const outputs = NeuralNetwork.feedForward(offsets, this.brain);
            
            if(this.useBrain){
                this.controls.forward = outputs[0] != 0;
                this.controls.left = outputs[1] != 0;
                this.controls.right = outputs[2] != 0;
                this.controls.reverse = outputs[3] != 0;
            }
        }
    }

    #assessDamage(roadBorders: any,traffic: Car[]){
        for(let i = 0; i < roadBorders.length; i++){
            if(polysIntersect(this.polygon,roadBorders[i])){
                return true;
            }
        }
        for(let i = 0; i < traffic.length; i++){
            if(polysIntersect(this.polygon,traffic[i].polygon)){
                return true;
            }
        }
        return false;
    }

    #createPolygon() {
        const points = [];
        const rad = Math.hypot(this.width,this.height) / 2;
        const alpha = Math.atan2(this.width,this.height);
        points.push({
            x:this.x - Math.sin(this.angle - alpha) * rad,
            y:this.y - Math.cos(this.angle - alpha) * rad
        });
        points.push({
            x:this.x - Math.sin(this.angle + alpha) * rad,
            y:this.y - Math.cos(this.angle + alpha) * rad
        });
        points.push({
            x:this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
            y:this.y - Math.cos(Math.PI + this.angle - alpha) * rad
        });
        points.push({
            x:this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
            y:this.y - Math.cos(Math.PI + this.angle + alpha) * rad
        });
        return points;
    }

    #move(){
        if(this.controls.forward){
            this.speed += this.acceleration;
        }
        if(this.controls.reverse){
            this.speed -= this.acceleration;
        }

        if(this.speed > this.maxSpeed){
            this.speed = this.maxSpeed;
        }
        if(this.speed <- this.maxSpeed/2){
            this.speed =- this.maxSpeed/2;
        }

        if(this.speed > 0){
            this.speed -= this.friction;
        }
        if(this.speed < 0) {
            this.speed += this.friction;
        }
        if(Math.abs(this.speed) < this.friction){
            this.speed = 0;
        }

        if(this.speed != 0){
            const flip = this.speed > 0 ? 1 : -1;
            if(this.controls.left){
                this.angle += 0.03 * flip;
            }
            if(this.controls.right){
                this.angle -= 0.03 * flip;
            }
        }

        this.x -= Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed
    }
    draw(ctx: any,color: string, drawSensor = false){
        if(this.damage){
            ctx.fillStyle = "Gray"
        }
        else{
            ctx.fillStyle = color;
        }
        ctx.beginPath();
        ctx.moveTo(this.polygon[0].x , this.polygon[0].y)
        for(let i = 1; i < this.polygon.length; i++){
            ctx.lineTo(this.polygon[i].x, this.polygon[i].y)
        }
        ctx.fill();

        if(this.sensor && drawSensor){
            this.sensor.draw(ctx);
        }
    }

    calculateScore(): number{
        return (Y_DISTANCE_COEFICENT * this.y) + (BONUS_POINTS_COEFICENT * this.bonusPoints);
    }
}