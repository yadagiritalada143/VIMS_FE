import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { SystemQualificationListComponent } from './system-qualification-list.component';

describe('SystemQualificationListComponent', () => {
  let component: SystemQualificationListComponent;
  let fixture: ComponentFixture<SystemQualificationListComponent>;
  CommonTestingModule.setUpTestBed(SystemQualificationListComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SystemQualificationListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SystemQualificationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
