import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { CreateQualificationComponent } from './create-qualification.component';

describe('CreateQualificationComponent', () => {
  let component: CreateQualificationComponent;
  let fixture: ComponentFixture<CreateQualificationComponent>;
  CommonTestingModule.setUpTestBed(CreateQualificationComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateQualificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateQualificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
