import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { QualificationsDetailsComponent } from './qualifications-details.component';

describe('QualificationsDetailsComponent', () => {
  let component: QualificationsDetailsComponent;
  let fixture: ComponentFixture<QualificationsDetailsComponent>;
  CommonTestingModule.setUpTestBed(QualificationsDetailsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ QualificationsDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QualificationsDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
