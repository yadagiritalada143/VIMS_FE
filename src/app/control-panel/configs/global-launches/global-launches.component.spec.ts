import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { GlobalLaunchesComponent } from './global-launches.component';

describe('GlobalLaunchesComponent', () => {
  let component: GlobalLaunchesComponent;
  let fixture: ComponentFixture<GlobalLaunchesComponent>;
  CommonTestingModule.setUpTestBed(GlobalLaunchesComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GlobalLaunchesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GlobalLaunchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
