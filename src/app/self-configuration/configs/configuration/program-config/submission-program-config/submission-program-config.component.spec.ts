import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubmissionProgramConfigComponent } from './submission-program-config.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ProgramConfigControlComponent } from '../program-config-control/program-config-control.component';

describe('SubmissionProgramConfigComponent', () => {
  let component: SubmissionProgramConfigComponent;
  let fixture: ComponentFixture<SubmissionProgramConfigComponent>;
  CommonTestingModule.setUpTestBed(SubmissionProgramConfigComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubmissionProgramConfigComponent, ProgramConfigControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmissionProgramConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
