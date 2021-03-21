import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { drawKeypoints, drawSkeleton } from  "../utilities";
import { Prediction } from '../prediction';
import * as posenet from '@tensorflow-models/posenet';
import * as tf from '@tensorflow/tfjs';

@Component({
  selector: 'app-stretchings',
  templateUrl: './stretchings.component.html',
  styleUrls: ['./stretchings.component.scss']
})
export class StretchingsComponent implements OnInit {

  @ViewChild('video') video: ElementRef;
  @ViewChild('canvasEl') canvasEl: ElementRef;
  predictions: Prediction[];
  localstream: any;
  model: any;
  context: CanvasRenderingContext2D;
  idInterval: any;
  constructor() { } 

  async ngOnInit() {
    // Variables del codigo
    let debug_level = 2; // Nivel de debuggeo necesario

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

      // Se limpia la anterior pose para evitar sobrescribir
      this.context.clearRect(0, 0, width, height); //Esos son los pixeles a limpiar
      
      // Se dibuja de nuevo el esqueleto
      this.drawCanvas(this.predictions, this.canvasEl);

      // Se espera al siguiente frame
      await tf.nextFrame();
    }, 150);
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

}
