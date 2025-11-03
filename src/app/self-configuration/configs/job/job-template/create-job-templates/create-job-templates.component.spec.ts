import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateJobTemplatesComponent } from './create-job-templates.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CreateJobTemplatesComponent', () => {
  let component: CreateJobTemplatesComponent;
  let fixture: ComponentFixture<CreateJobTemplatesComponent>;
  CommonTestingModule.setUpTestBed(CreateJobTemplatesComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateJobTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
