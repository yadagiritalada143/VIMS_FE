import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { OnbaordSetupComponent } from './onbaord-setup.component';

describe('OnbaordSetupComponent', () => {
  let component: OnbaordSetupComponent;
  let fixture: ComponentFixture<OnbaordSetupComponent>;
  CommonTestingModule.setUpTestBed(OnbaordSetupComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OnbaordSetupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnbaordSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
