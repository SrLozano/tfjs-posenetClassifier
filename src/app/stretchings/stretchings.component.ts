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
    
    // DATA BINDING VARIABLES
    progress_value_exercise = 0;
    progress_value_session = 0;
    url_image_root = "../../assets/img/stretchings/";
    url_image = "../../assets/img/stretchings/y.svg";
    text = "Forma de Y";

    //VARIBLES DE CONTROL
    poses = ["y", "right_dorsal", "left_dorsal", "left_hip", "right_hip"]; // Array con las poses de la sesion
    //poses = ["y", "right_dorsal"];
    text_poses = ["Forma de Y", "Dorsal derecho", "Dorsal izquierdo", "Cadera izquierda", "Cadera derecha"]; // Array con los textos de la interfaz
    current_pose; // Pose actual que se esta considerando
    current_pose_aux; // Indice de la pose actual en al array de poses
    pose_detected; // Pose detectada por el modelo
    model_started; // Indica si se ha cargado ya el modelo
    mistakes;  // Numero de fallos. El programa tiene tolerancia a fallos. No hace falta mantener la postura perfecta los 10 segundos
    max_mistakes = 10; // Numero maximo de fallos que se permiten

    // VARIABLES GENERALES
    @ViewChild('video') video: ElementRef;
    @ViewChild('canvasEl') canvasEl: ElementRef;
    predictions: Prediction[];
    localstream: any;
    model: any;
    context: CanvasRenderingContext2D;
    idInterval: any; // Id bucle de ejercicios
    idTimerProgress: any; // Id temporizador ejercicio

    constructor(private router: Router) { } 

    // NG_ON_INIT
    async ngOnInit() {

      // El modelo aun no se encuentra cargado
      this.model_started = false;
      this.mistakes = 0;

      // Se comienza por la primera pose
      this.current_pose_aux = 0;
      this.current_pose = this.poses[this.current_pose_aux];

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

        this.pose_detected = this.decodePrediction(prediction);

        // Una vez el modelo ha arrancado se procede a comenzar la cuenta atras
        if(!this.model_started){
          this.startCountdown();
          this.model_started = true;
          console.log("Countdown started");
        }

        // Debug
        if (debug_level >= 2){
          console.log("Max value is:" + Math.max.apply(null, prediction));
          console.log("Index of max value is: " + prediction.indexOf(Math.max.apply(null, prediction)))
          console.log("Pose is: " + this.pose_detected);
        }

        // Se limpia la anterior pose para evitar sobrescribir
        this.context.clearRect(0, 0, width, height); //Esos son los pixeles a limpiar
        
        // Se dibuja de nuevo el esqueleto
        this.drawCanvas(this.predictions, this.canvasEl);

        // Se espera al siguiente frame
        await tf.nextFrame();
      }, 100);
    }

    // FUNCIONES AUXILIARES

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
    decodePrediction = (prediction) => {
      
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

    // Esta funcion comienza la cuenta atras de cada una de las poses
    startCountdown = () => {
      this.idTimerProgress = setInterval(() => {
        this.progress_value_exercise = this.progress_value_exercise + 1;

        // Si la pose detectada se corresponde con la que se debe hacer el numero de fallos vuelve a 0
        if(this.pose_detected == this.current_pose){
          this.mistakes = 0;
        } else { // En caso contrario tenemos un fallo
          this.mistakes = this.mistakes + 1;
        }

        // Si se realiza el numero de fallos maximo, el reloj vuelve al 0
        if(this.mistakes >= this.max_mistakes){
          this.progress_value_exercise = 0;
        }

        if(this.progress_value_exercise == 100) { // Se para el temporizador una vez se completa la pose y se pasa a la siguiente
          console.log("Pose completed");
          this.progress_value_exercise = 0;
          this.mistakes = 0;
          this.current_pose_aux = this.current_pose_aux + 1;
          this.progress_value_session = this.progress_value_session + 20

          if(this.current_pose_aux == this.poses.length){
            setTimeout(() => { this.closeWebcam('end'); }, 100);
          }
          this.text = this.text_poses[this.current_pose_aux];
          this.current_pose = this.poses[this.current_pose_aux];
          this.url_image = this.url_image_root + this.current_pose + '.svg';
          //clearInterval(this.idTimerProgress); 
        }
      }, 100);
    }

    // Se redirige a la página principal apagando antes la webcam 
    closeWebcam(destiny){
      clearInterval(this.idInterval); // Se para la prediccion
      clearInterval(this.idTimerProgress); // Se para el temporizador
      const vid = this.video.nativeElement;
      vid.pause();
      vid.src = "";
      this.localstream.getTracks()[0].stop();
      if(destiny == 'end'){
        this.router.navigate(['/congratulations']);
      } else {
        this.router.navigate(['/menu']);
      }
    }

  }
