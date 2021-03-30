import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StretchingsComponent } from './stretchings/stretchings.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule} from '@angular/material/button';
import { MatCardModule} from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { NgParticlesModule } from "ng-particles";
import { WelcomeComponent } from './welcome/welcome.component';
import { MenuComponent } from './menu/menu.component';
import { HeaderComponent } from './header/header.component';
import { YogaComponent } from './yoga/yoga.component';
import { DialogTutorialComponent } from './dialog-tutorial/dialog-tutorial.component';


@NgModule({
  declarations: [
    AppComponent,
    StretchingsComponent,
    WelcomeComponent,
    MenuComponent,
    HeaderComponent,
    YogaComponent,
    DialogTutorialComponent
  ],
  entryComponents: [DialogTutorialComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    NgParticlesModule,
    MatSliderModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
