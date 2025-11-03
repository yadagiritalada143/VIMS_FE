import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewJobTemplateComponent } from './view-job-template.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ViewJobTemplateComponent', () => {
  let component: ViewJobTemplateComponent;
  let fixture: ComponentFixture<ViewJobTemplateComponent>;
  CommonTestingModule.setUpTestBed(ViewJobTemplateComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewJobTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
