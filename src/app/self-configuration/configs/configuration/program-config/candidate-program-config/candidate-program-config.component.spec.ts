import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CandidateProgramConfigComponent } from './candidate-program-config.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ProgramConfigControlComponent } from '../program-config-control/program-config-control.component';

describe('CandidateProgramConfigComponent', () => {
  let component: CandidateProgramConfigComponent;
  let fixture: ComponentFixture<CandidateProgramConfigComponent>;
  CommonTestingModule.setUpTestBed(CandidateProgramConfigComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CandidateProgramConfigComponent, ProgramConfigControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateProgramConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
