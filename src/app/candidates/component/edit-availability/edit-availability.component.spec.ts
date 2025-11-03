import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { EditAvailabilityComponent } from './edit-availability.component';

describe('EditAvailabilityComponent', () => {
  let component: EditAvailabilityComponent;
  let fixture: ComponentFixture<EditAvailabilityComponent>;
  CommonTestingModule.setUpTestBed(EditAvailabilityComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditAvailabilityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditAvailabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
