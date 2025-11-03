import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { QualificationTypeDetailsComponent } from './qualification-type-details.component';

describe('QualificationTypeDetailsComponent', () => {
  let component: QualificationTypeDetailsComponent;
  let fixture: ComponentFixture<QualificationTypeDetailsComponent>;
  CommonTestingModule.setUpTestBed(QualificationTypeDetailsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ QualificationTypeDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QualificationTypeDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
