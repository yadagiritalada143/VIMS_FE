import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobProgramConfigComponent } from './job-program-config.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ProgramConfigControlComponent } from '../program-config-control/program-config-control.component';

describe('JobProgramConfigComponent', () => {
  let component: JobProgramConfigComponent;
  let fixture: ComponentFixture<JobProgramConfigComponent>;
  CommonTestingModule.setUpTestBed(JobProgramConfigComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JobProgramConfigComponent, ProgramConfigControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JobProgramConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
