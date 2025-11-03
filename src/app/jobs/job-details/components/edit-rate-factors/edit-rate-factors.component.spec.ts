import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { EditRateFactorsComponent } from './edit-rate-factors.component';

describe('EditRateFactorsComponent', () => {
  let component: EditRateFactorsComponent;
  let fixture: ComponentFixture<EditRateFactorsComponent>;
  CommonTestingModule.setUpTestBed(EditRateFactorsComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditRateFactorsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditRateFactorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
