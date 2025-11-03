import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkLocationListComponent } from './work-location-list.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('WorkLocationListComponent', () => {
  let component: WorkLocationListComponent;
  let fixture: ComponentFixture<WorkLocationListComponent>;
  CommonTestingModule.setUpTestBed(WorkLocationListComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkLocationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
