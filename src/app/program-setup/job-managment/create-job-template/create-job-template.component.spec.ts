import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { CreateJobTemplateComponent } from './create-job-template.component';

describe('CreateJobTemplateComponent', () => {
  let component: CreateJobTemplateComponent;
  let fixture: ComponentFixture<CreateJobTemplateComponent>;
  CommonTestingModule.setUpTestBed(CreateJobTemplateComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateJobTemplateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateJobTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
