import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ListQualificationsComponent } from './list-qualifications.component';

describe('ListQualificationsComponent', () => {
  let component: ListQualificationsComponent;
  let fixture: ComponentFixture<ListQualificationsComponent>;
  CommonTestingModule.setUpTestBed(ListQualificationsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListQualificationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListQualificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
