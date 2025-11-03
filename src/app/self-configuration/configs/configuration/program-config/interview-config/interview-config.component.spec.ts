import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InterviewConfigComponent } from './interview-config.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ProgramConfigControlComponent } from '../program-config-control/program-config-control.component';

describe('InterviewConfigComponent', () => {
  let component: InterviewConfigComponent;
  let fixture: ComponentFixture<InterviewConfigComponent>;
  CommonTestingModule.setUpTestBed(InterviewConfigComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InterviewConfigComponent, ProgramConfigControlComponent ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InterviewConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
