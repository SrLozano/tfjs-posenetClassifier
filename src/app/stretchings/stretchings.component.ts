import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as posenet from '@tensorflow-models/posenet';
import * as tf from '@tensorflow/tfjs';

@Component({
  selector: 'app-stretchings',
  templateUrl: './stretchings.component.html',
  styleUrls: ['./stretchings.component.scss']
})
export class StretchingsComponent implements OnInit {

  @ViewChild('video') video: ElementRef;
  localstream: any;
  model: any;
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

}
