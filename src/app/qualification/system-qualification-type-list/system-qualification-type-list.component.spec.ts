import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { SystemQualificationTypeListComponent } from './system-qualification-type-list.component';

describe('SystemQualificationTypeListComponent', () => {
  let component: SystemQualificationTypeListComponent;
  let fixture: ComponentFixture<SystemQualificationTypeListComponent>;
  CommonTestingModule.setUpTestBed(SystemQualificationTypeListComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SystemQualificationTypeListComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SystemQualificationTypeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
