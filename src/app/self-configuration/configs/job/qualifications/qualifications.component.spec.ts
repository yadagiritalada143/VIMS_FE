import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QualificationsComponent } from './qualifications.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('QualificationsComponent', () => {
  let component: QualificationsComponent;
  let fixture: ComponentFixture<QualificationsComponent>;
  CommonTestingModule.setUpTestBed(QualificationsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(QualificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
