import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { drawKeypoints, drawSkeleton } from  "../utilities";
import { Prediction } from '../prediction';
import { Router } from '@angular/router';
import * as posenet from '@tensorflow-models/posenet';
import * as tf from '@tensorflow/tfjs';

@Component({
  selector: 'app-stretchings',
  templateUrl: './stretchings.component.html',
  styleUrls: ['./stretchings.component.scss']
})

export class StretchingsComponent implements OnInit {
  progress_value = 0;

  @ViewChild('video') video: ElementRef;
  @ViewChild('canvasEl') canvasEl: ElementRef;
  predictions: Prediction[];
  localstream: any;
  model: any;
  context: CanvasRenderingContext2D;
  idInterval: any;
  timer_progress: any;

  constructor(private router: Router) { } 

  async ngOnInit() {

    this.timer_progress = setInterval(() => {
      this.progress_value = this.progress_value + 1;
      if(this.progress_value == 100) { // Se para el temporizador una vez se completa
        clearInterval(this.timer_progress); 
      }
    }, 100);

    // Variables del codigo
    let debug_level = 2; // Nivel de debuggeo necesario
    
    // Variables del modelo propio para normalizar
    let max_python = 637.5225709626529;
    let min_python = 1.3238226404056377;
    
    // Se carga el modelo posenet
    console.log('Loading posenet model...');
    this.model = await posenet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: { width: 640, height: 480 },
      multiplier: 0.75
    });
    console.log('Posenet. Sucessfully loaded model');
    console.log('Using TensorFlow backend: ', tf.getBackend());
    
    // Se carga el modelo de deteccion de poses desde un repositorio remoto de github                                                                       
    const myModel = await tf.loadLayersModel('https://raw.githubusercontent.com/SrLozano/posenetClassifier-kerasModel/main/model.json', {weightPathPrefix: 'https://raw.githubusercontent.com/SrLozano/posenetClassifier-kerasModel/main/'});
    console.log('My model sucessfully loaded');

    // Codigo bucle que se ejecuta en cada frame de la webcam
    this.idInterval = setInterval(async () => {
      // Se realiza la prediccion basada en posenet
      this.predictions = await this.model.estimateSinglePose(this.video.nativeElement, {
        flipHorizontal: true
      });
      
      var canvas = document.getElementById('mycanvas');
      var width = canvas.getBoundingClientRect().width;
      var height = canvas.getBoundingClientRect().height;

      this.context = (this.canvasEl.nativeElement as HTMLCanvasElement).getContext('2d');

      // Se transforman los datos en un formato adecuado para el segundo modelo
      var data_to_predict = this.transformData (this.predictions, max_python, min_python);
      
      // Se realiza la prediccion
      let output3 = await myModel.predict(data_to_predict) as tf.Tensor;
      const prediction = output3.dataSync(); // Aqui se obtiene el resultado

      let pose = this.decodePrediction(prediction);

      // Debug
      if (debug_level >= 2){
        console.log("Max value is:" + Math.max.apply(null, prediction));
        console.log("Index of max value is: " + prediction.indexOf(Math.max.apply(null, prediction)))
        console.log("Pose is: " + pose);
      }

      // Se limpia la anterior pose para evitar sobrescribir
      this.context.clearRect(0, 0, width, height); //Esos son los pixeles a limpiar
      
      // Se dibuja de nuevo el esqueleto
      this.drawCanvas(this.predictions, this.canvasEl);

      // Se espera al siguiente frame
      await tf.nextFrame();
    }, 10000);
  }

  // Se solicita permiso para acceder a la webcam cuando se ha cargado el componente
  async ngAfterViewInit() {
    const vid = this.video.nativeElement;

    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          this.localstream = stream;
          vid.srcObject = stream;
        })
        .catch((err0r) => {
          console.log('Something went wrong!');
        });
    }
  }

  // Se dibujan los puntos claves y el esqueleto sobre el canvas
  drawCanvas = (pose, canvas) => {
    this.context = (canvas.nativeElement as HTMLCanvasElement).getContext('2d');
    drawKeypoints(pose["keypoints"], 0.6, this.context);
    drawSkeleton(pose["keypoints"], 0.7, this.context);
  };

  // Esta funcion trasnforma las predicciones en un formato adecuado al segundo clasificador
  transformData = (predictions, max_python, min_python) => {
    var inputs = [];
    
    // Almacenamos las predicciones en un array plano
    for (let i = 0; i < predictions.keypoints.length; i++){
      let x = predictions.keypoints[i].position.x;
      let y = predictions.keypoints[i].position.y;
      inputs.push(x);
      inputs.push(y);
    }

    // Normalizamos los valores
    var max = max_python;
    var min = min_python;

    for (let i = 0; i < inputs.length; i++){
      inputs[i] = (inputs[i] - min)/(max - min);
    }

    var data_transformed = tf.tensor([inputs]);

    return data_transformed;
  };

  // Esta funcion decodifica las predicciones del modelo en un string
  decodePrediction = (prediction) =>{
    
    let index = prediction.indexOf(Math.max.apply(null, prediction));
    let var_return = "Null";

    if (index == 0){
      var_return = "left_dorsal" 
    } else if (index == 1){
      var_return = "left_hip" 
    } else if (index == 2){
      var_return = "lotus" 
    } else if (index == 3){
      var_return = "mountain" 
    } else if (index == 4){
      var_return = "right_dorsal" 
    } else if (index == 5){
      var_return = "right_hip" 
    } else if (index == 6){
      var_return = "sun" 
    } else if (index == 7){
      var_return = "tree" 
    } else if (index == 8){
      var_return = "triangle" 
    } else if (index == 9){
      var_return = "y" 
    } 

    return var_return
  };

  // Se redirige a la página principal apagando antes la webcam 
  closeWebcam(){
    clearInterval(this.idInterval); // Se para la prediccion
    clearInterval(this.timer_progress); // Se para el temporizador
    const vid = this.video.nativeElement;
    vid.pause();
    vid.src = "";
    this.localstream.getTracks()[0].stop();
    this.router.navigate(['/menu']);
  }

}
