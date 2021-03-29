import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogTutorialComponent } from '../dialog-tutorial/dialog-tutorial.component';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {

  constructor(public dialog: MatDialog) { }

  ngOnInit(): void {
    this.dialog.open(DialogTutorialComponent);
  }
  
}
