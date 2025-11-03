import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AddRefrenceComponent } from './add-refrence.component';

describe('AddRefrenceComponent', () => {
  let component: AddRefrenceComponent;
  let fixture: ComponentFixture<AddRefrenceComponent>;
  CommonTestingModule.setUpTestBed(AddRefrenceComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddRefrenceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddRefrenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
