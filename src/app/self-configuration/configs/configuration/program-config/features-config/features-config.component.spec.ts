import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeaturesConfigComponent } from './features-config.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ProgramConfigControlComponent } from '../program-config-control/program-config-control.component';

describe('FeaturesConfigComponent', () => {
  let component: FeaturesConfigComponent;
  let fixture: ComponentFixture<FeaturesConfigComponent>;
  CommonTestingModule.setUpTestBed(FeaturesConfigComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FeaturesConfigComponent, ProgramConfigControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeaturesConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
