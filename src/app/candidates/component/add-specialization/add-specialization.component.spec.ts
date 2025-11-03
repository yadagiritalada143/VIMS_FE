import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AddSpecializationComponent } from './add-specialization.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('AddSpecializationComponent', () => {
  let component: AddSpecializationComponent;
  let fixture: ComponentFixture<AddSpecializationComponent>;
  CommonTestingModule.setUpTestBed(AddSpecializationComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddSpecializationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSpecializationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
