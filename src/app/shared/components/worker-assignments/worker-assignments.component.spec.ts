import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { WorkerAssignmentsComponent } from './worker-assignments.component';

describe('WorkerAssignmentsComponent', () => {
  let component: WorkerAssignmentsComponent;
  let fixture: ComponentFixture<WorkerAssignmentsComponent>;
  CommonTestingModule.setUpTestBed(WorkerAssignmentsComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkerAssignmentsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkerAssignmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
