import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TasksListingComponent } from './tasks-listing.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('TasksListingComponent', () => {
  let component: TasksListingComponent;
  let fixture: ComponentFixture<TasksListingComponent>;
  CommonTestingModule.setUpTestBed(TasksListingComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(TasksListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
