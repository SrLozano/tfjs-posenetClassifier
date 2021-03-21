import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StretchingsComponent } from './stretchings.component';

describe('StretchingsComponent', () => {
  let component: StretchingsComponent;
  let fixture: ComponentFixture<StretchingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StretchingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StretchingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
