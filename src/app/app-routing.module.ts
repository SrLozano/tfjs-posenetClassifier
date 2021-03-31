import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WelcomeComponent } from './welcome/welcome.component';
import { MenuComponent } from './menu/menu.component';
import { StretchingsComponent } from './stretchings/stretchings.component';
import { YogaComponent } from './yoga/yoga.component'
import { CongratulationsComponent } from './congratulations/congratulations.component'

const routes: Routes = [  
  { path: 'welcome', component: WelcomeComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'stretchings', component: StretchingsComponent },
  { path: 'yoga', component: YogaComponent },
  { path: 'congratulations', component: CongratulationsComponent},
  { path:'**', pathMatch: 'full', redirectTo: 'welcome'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
