import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ViewJobTemplateComponent } from './view-job-template.component';

describe('ViewJobTemplateComponent', () => {
  let component: ViewJobTemplateComponent;
  let fixture: ComponentFixture<ViewJobTemplateComponent>;
  CommonTestingModule.setUpTestBed(ViewJobTemplateComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewJobTemplateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewJobTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
