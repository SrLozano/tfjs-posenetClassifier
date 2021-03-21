import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-stretchings',
  templateUrl: './stretchings.component.html',
  styleUrls: ['./stretchings.component.scss']
})
export class StretchingsComponent implements OnInit {

  @ViewChild('video') video: ElementRef;
  localstream: any;
  constructor() { }

  ngOnInit(): void {
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
