import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { QuillModule } from 'ngx-quill';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { BasicJobTemplateComponent } from './basic-job-template.component';

describe('BasicJobTemplateComponent', () => {
  let component: BasicJobTemplateComponent;
  let fixture: ComponentFixture<BasicJobTemplateComponent>;
  CommonTestingModule.setUpTestBed(BasicJobTemplateComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BasicJobTemplateComponent],
      imports:[QuillModule.forRoot(),]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BasicJobTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
