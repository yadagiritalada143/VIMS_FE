import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { TaskChecklistComponent } from './task-checklist.component';

describe('TaskChecklistComponent', () => {
  let component: TaskChecklistComponent;
  let fixture: ComponentFixture<TaskChecklistComponent>;
  CommonTestingModule.setUpTestBed(TaskChecklistComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TaskChecklistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskChecklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
