import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TasksDetailComponent } from './tasks-detail.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('TasksDetailComponent', () => {
  let component: TasksDetailComponent;
  let fixture: ComponentFixture<TasksDetailComponent>;
  CommonTestingModule.setUpTestBed(TasksDetailComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(TasksDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
